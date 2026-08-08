// One-time backfill: copy the existing Upstash team/hint state into DynamoDB so
// the dual-write mirror never has to create items it expects to already exist
// (a mirrored join, for example, is conditioned on its team item being there).
//
// Read-only against Upstash; writes DynamoDB only with --apply (default is a
// dry run that prints what would be written). Idempotent — items are plain
// PutItems keyed the same way every run, so re-running just overwrites them.
//
// Exception: pk=CONTESTANTS items (every login seen on a team or in hint
// activity — proof they signed in before the sign-in hook existed) are
// written with attribute_not_exists(pk) and skipped when present, because
// the auth callback hook owns that partition and first-sign-in-wins means a
// backfill re-run must never move a real registeredAt. Those logins are
// collected from BOTH stores: in CTF_DATA_BACKEND=dynamo mode the traces
// only exist in the table, so contestant collection also READS DynamoDB —
// meaning even a dry run needs AWS credentials now.
//
//   pnpm backfill:dynamo                              # dry run
//   pnpm backfill:dynamo --apply                      # write everything
//   pnpm backfill:dynamo --contestants-only --apply   # write ONLY pk=CONTESTANTS
//
// --contestants-only is the mid-contest-safe mode: it drops every overwrite
// item and keeps only the conditional contestant rows, which are additive by
// construction — they cannot change team, hint, spend, or scorer state, and
// cannot touch a registration the auth hook already wrote.
//
// Credentials: Upstash from .env.local (or the environment); AWS from the SDK
// default chain — run `aws sso login --profile <your-admin-sso-profile>`
// and set AWS_PROFILE first. Run this BEFORE enabling dual/dynamo in prod.

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  ConditionalCheckFailedException,
  DynamoDBClient,
  PutItemCommand,
  QueryCommand,
  ScanCommand,
  type AttributeValue,
} from "@aws-sdk/client-dynamodb";
import {
  CONTESTANTS_PK,
  HINTSPEND_PK,
  PROFILE_SK,
  TEAMS_PK,
  contestantItem,
  getS,
  getSS,
  hintPurchaseItem,
  hintTextItem,
  profileItem,
  spendItem,
  teamItem,
  type DynamoItem,
} from "../src/lib/dynamo-shapes";

// ---- env ------------------------------------------------------------------
// .env.local fallback, same idiom as the live Upstash test suites.
for (const file of [path.resolve(process.cwd(), ".env.local")]) {
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const eq = line.indexOf("=");
    if (eq === -1 || line.trimStart().startsWith("#")) continue;
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (key.startsWith("UPSTASH_REDIS_REST_") && !process.env[key]) process.env[key] = value;
  }
}

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
// CTF_AWS_REGION, not AWS_REGION — the ambient var lies on Vercel and can lie
// locally too (profiles/default region); the table lives in us-west-2.
const AWS_REGION = process.env.CTF_AWS_REGION ?? "us-west-2";
const TABLE = process.env.CTF_DYNAMO_TABLE ?? "ctf-leaderboard";
const HINT_COST = 10; // purchase items get the current price; the spend total below is the authoritative number
const APPLY = process.argv.includes("--apply");
const CONTESTANTS_ONLY = process.argv.includes("--contestants-only");

if (!UPSTASH_URL || !UPSTASH_TOKEN) {
  console.error("UPSTASH_REDIS_REST_URL/TOKEN are not set (env or .env.local)");
  process.exit(1);
}

// ---- upstash (read-only) ----------------------------------------------------
type UpstashResult = { result?: unknown; error?: string };

async function pipeline(commands: (string | number)[][]): Promise<UpstashResult[]> {
  const res = await fetch(`${UPSTASH_URL!.replace(/\/$/, "")}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${UPSTASH_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(commands),
  });
  if (!res.ok) throw new Error(`Upstash pipeline failed: HTTP ${res.status}`);
  return (await res.json()) as UpstashResult[];
}

async function scanKeys(match: string): Promise<string[]> {
  const keys: string[] = [];
  let cursor = "0";
  do {
    const [scan] = await pipeline([["SCAN", cursor, "MATCH", match, "COUNT", "1000"]]);
    const [next, page] = Array.isArray(scan.result) ? (scan.result as [string, string[]]) : ["0", []];
    cursor = next;
    keys.push(...page);
  } while (cursor !== "0");
  return keys;
}

function hgetallToObject(flat: unknown): Record<string, string> {
  const arr = Array.isArray(flat) ? (flat as string[]) : [];
  const obj: Record<string, string> = {};
  for (let i = 0; i < arr.length; i += 2) obj[arr[i]] = arr[i + 1];
  return obj;
}

// ---- collect ----------------------------------------------------------------
async function collect(): Promise<DynamoItem[]> {
  const now = new Date().toISOString();
  const items: DynamoItem[] = [];
  // Every login that shows up below signed in at some point (team actions and
  // hint purchases both authenticate), so each one also becomes a contestant
  // registry item — that's what puts pre-hook players on /leaderboard.
  const contestants = new Set<string>();

  // Teams: ctf:team:<slug> hash + ctf:team:<slug>:members set → team + profiles.
  const memberKeys = await scanKeys("ctf:team:*:members");
  const slugs = memberKeys.map((k) => k.slice("ctf:team:".length, -":members".length));
  for (const slug of slugs) {
    const [metaRes, membersRes] = await pipeline([
      ["HGETALL", `ctf:team:${slug}`],
      ["SMEMBERS", `ctf:team:${slug}:members`],
    ]);
    const meta = hgetallToObject(metaRes.result);
    const members = Array.isArray(membersRes.result) ? (membersRes.result as string[]) : [];
    if (members.length === 0) continue; // the DynamoDB model never stores an empty team
    items.push(
      teamItem({
        slug,
        name: meta.name || slug,
        captain: meta.captain || members[0],
        createdAt: meta.createdAt || now,
        members,
      }),
    );
    for (const login of members) {
      items.push(profileItem(login, slug, now));
      contestants.add(login);
    }
  }
  console.log(`teams: ${slugs.length} (${items.length} items incl. member profiles)`);

  // Hint spend totals: the authoritative penalty numbers.
  const [spentRes] = await pipeline([["HGETALL", "ctf:hints:spent"]]);
  const spent = hgetallToObject(spentRes.result);
  let spendCount = 0;
  for (const [login, points] of Object.entries(spent)) {
    const value = Number(points);
    if (!Number.isFinite(value) || value <= 0) continue;
    items.push(spendItem(login, value, now));
    contestants.add(login);
    spendCount++;
  }
  console.log(`hint spend rows: ${spendCount}`);

  // Hint purchases: ctf:user:<login>:hints sets of "<app>/<id>". purchasedAt is
  // approximate (Upstash never stored it); cost is today's price — the spend
  // rows above carry the real totals.
  const hintKeys = await scanKeys("ctf:user:*:hints");
  let purchaseCount = 0;
  for (const key of hintKeys) {
    const login = key.slice("ctf:user:".length, -":hints".length);
    contestants.add(login);
    const [membersRes] = await pipeline([["SMEMBERS", key]]);
    for (const member of Array.isArray(membersRes.result) ? (membersRes.result as string[]) : []) {
      const slash = member.indexOf("/");
      if (slash === -1) continue;
      items.push(
        hintPurchaseItem({ login, app: member.slice(0, slash), id: member.slice(slash + 1), cost: HINT_COST, purchasedAt: now }),
      );
      purchaseCount++;
    }
  }
  console.log(`hint purchases: ${purchaseCount} across ${hintKeys.length} buyers`);

  // Hint text: the scorer-seeded hashes hints:<app> (field = challenge id,
  // value = text — note NO ctf: prefix, so this scan can't catch the site's own
  // keys). Upstash stays the authority for hint text; re-run the backfill
  // whenever the scorer re-seeds hints so pk=HINTS doesn't go stale.
  const textHashKeys = await scanKeys("hints:*");
  let textCount = 0;
  for (const key of textHashKeys) {
    const app = key.slice("hints:".length);
    const [hashRes] = await pipeline([["HGETALL", key]]);
    for (const [id, text] of Object.entries(hgetallToObject(hashRes.result))) {
      if (!text) continue;
      items.push(hintTextItem({ app, id, text, updatedAt: now }));
      textCount++;
    }
  }
  console.log(`hint texts: ${textCount} across ${textHashKeys.length} apps`);

  // In CTF_DATA_BACKEND=dynamo mode, team and hint activity never touched
  // Upstash — the traces live only in the table. Merge logins from there too
  // (read-only), so contestant collection works whichever store was live.
  const fromDynamo = await collectDynamoLogins();
  for (const login of fromDynamo) contestants.add(login);

  // Contestant registry rows come last so the counts above stay comparable to
  // earlier runs. registeredAt = backfill time: the real first-sign-in moment
  // was never recorded, and the conditional write below keeps any row the
  // auth hook already created (with its truthful timestamp) untouched.
  for (const login of [...contestants].sort()) items.push(contestantItem(login, now));
  console.log(`contestants: ${contestants.size} (${fromDynamo.size} seen in DynamoDB traces)`);

  return items;
}

// ---- dynamo (read-only) -------------------------------------------------------
async function collectDynamoLogins(): Promise<Set<string>> {
  const dynamo = new DynamoDBClient({ region: AWS_REGION });
  const logins = new Set<string>();

  const paginate = async (
    command: (startKey?: Record<string, AttributeValue>) => QueryCommand | ScanCommand,
    onItem: (item: DynamoItem) => void,
  ) => {
    let startKey: Record<string, AttributeValue> | undefined;
    do {
      const res = await dynamo.send(command(startKey) as QueryCommand);
      for (const item of res.Items ?? []) onItem(item as DynamoItem);
      startKey = res.LastEvaluatedKey;
    } while (startKey);
  };

  // Team members (pk=TEAMS holds the member String Sets).
  await paginate(
    (startKey) =>
      new QueryCommand({
        TableName: TABLE,
        KeyConditionExpression: "pk = :pk",
        ExpressionAttributeValues: { ":pk": { S: TEAMS_PK } },
        ExclusiveStartKey: startKey,
      }),
    (item) => {
      for (const member of getSS(item, "members")) logins.add(member);
    },
  );

  // Hint spenders.
  await paginate(
    (startKey) =>
      new QueryCommand({
        TableName: TABLE,
        KeyConditionExpression: "pk = :pk",
        ExpressionAttributeValues: { ":pk": { S: HINTSPEND_PK } },
        ExclusiveStartKey: startKey,
      }),
    (item) => {
      const login = getS(item, "login");
      if (login) logins.add(login);
    },
  );

  // USER#<login> profiles (covers members whose team was since deleted).
  await paginate(
    (startKey) =>
      new ScanCommand({
        TableName: TABLE,
        FilterExpression: "begins_with(pk, :u) AND sk = :profile",
        ExpressionAttributeValues: { ":u": { S: "USER#" }, ":profile": { S: PROFILE_SK } },
        ExclusiveStartKey: startKey,
      }),
    (item) => {
      const login = getS(item, "login") ?? getS(item, "pk")?.slice("USER#".length);
      if (login) logins.add(login);
    },
  );

  return logins;
}

// ---- write ------------------------------------------------------------------
async function main() {
  let items = await collect();
  if (CONTESTANTS_ONLY) {
    items = items.filter((item) => item.pk.S === CONTESTANTS_PK);
    console.log(`\n--contestants-only: keeping ${items.length} conditional contestant rows, dropping every overwrite item`);
  }
  console.log(`\n${items.length} DynamoDB items total → table "${TABLE}" (${AWS_REGION})`);

  if (!APPLY) {
    for (const item of items) console.log(JSON.stringify(item));
    console.log("\nDry run — nothing written. Re-run with --apply to write.");
    return;
  }

  const dynamo = new DynamoDBClient({ region: AWS_REGION });
  let skipped = 0;
  for (const item of items) {
    // First-sign-in-wins for the contestant registry: the auth hook owns that
    // partition, so the backfill only fills gaps and never overwrites.
    const guarded = item.pk.S === CONTESTANTS_PK;
    try {
      await dynamo.send(
        new PutItemCommand({
          TableName: TABLE,
          Item: item,
          ...(guarded ? { ConditionExpression: "attribute_not_exists(pk)" } : {}),
        }),
      );
    } catch (err) {
      if (guarded && err instanceof ConditionalCheckFailedException) {
        console.log(`skip ${item.pk.S} / ${item.sk.S} (already registered)`);
        skipped++;
        continue;
      }
      throw err;
    }
    console.log(`put ${item.pk.S} / ${item.sk.S}`);
  }
  console.log(`\nDone — ${items.length - skipped} items written, ${skipped} already-registered contestants kept.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
