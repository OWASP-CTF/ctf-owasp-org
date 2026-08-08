import "server-only";
import {
  ConditionalCheckFailedException,
  PutItemCommand,
  QueryCommand,
  type AttributeValue,
} from "@aws-sdk/client-dynamodb";
import { CTF_DYNAMO_TABLE, getDynamoClient } from "@/lib/dynamo";
import { CONTESTANTS_PK, contestantItem, contestantSk, getS } from "@/lib/dynamo-shapes";

/**
 * Contestant registry: one item per GitHub login that has completed sign-in,
 * written from the auth callback hook (lib/auth.ts) and merged into the
 * leaderboard as zero-point rows (lib/leaderboard/registered.ts), so a new
 * contestant sees their name on /leaderboard before the scorer has seen a PR
 * from them.
 *
 * Like the gate store, this uses DynamoDB in every CTF_DATA_BACKEND mode —
 * credentials are ambient (Vercel OIDC / the SDK default chain) and the
 * Upstash token stays read-only.
 *
 * recordContestant is BEST-EFFORT BY CONTRACT: it must never throw, because
 * it runs inside the OAuth callback. A DynamoDB outage degrades to "name
 * appears after the first scored PR", never to "sign-in fails".
 */

export async function recordContestant(login: string): Promise<void> {
  if (!login) return;
  try {
    await getDynamoClient().send(
      new PutItemCommand({
        TableName: CTF_DYNAMO_TABLE,
        Item: contestantItem(login, new Date().toISOString()),
        // First sign-in wins: re-auth must not move registeredAt forward.
        // pk is the partition key, so it exists iff the item does.
        ConditionExpression: "attribute_not_exists(pk)",
      }),
    );
  } catch (err) {
    if (err instanceof ConditionalCheckFailedException) return; // already registered
    console.error(`[registration] failed to record contestant: ${(err as Error).message}`);
  }
}

/** All registered logins, in sk order (alphabetical). Unlike recordContestant
 *  this THROWS on transport errors — the leaderboard overlay catches and
 *  degrades to the scorer-only view. */
export async function listContestants(): Promise<string[]> {
  const logins: string[] = [];
  let lastKey: Record<string, AttributeValue> | undefined;
  do {
    const res = await getDynamoClient().send(
      new QueryCommand({
        TableName: CTF_DYNAMO_TABLE,
        KeyConditionExpression: "pk = :pk",
        ExpressionAttributeValues: { ":pk": { S: CONTESTANTS_PK } },
        ExclusiveStartKey: lastKey,
      }),
    );
    for (const item of res.Items ?? []) {
      // The sk suffix is the fallback so a hand-written item without the
      // `login` attribute still shows up rather than silently vanishing.
      const login = getS(item, "login") ?? getS(item, "sk")?.slice(contestantSk("").length);
      if (login) logins.push(login);
    }
    lastKey = res.LastEvaluatedKey;
  } while (lastKey);
  return logins;
}
