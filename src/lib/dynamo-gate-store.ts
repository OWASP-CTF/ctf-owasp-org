import "server-only";
import { DeleteItemCommand, GetItemCommand, PutItemCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { CTF_DYNAMO_TABLE, getDynamoClient } from "@/lib/dynamo";
import { GATE_PK, gateSk, getN } from "@/lib/dynamo-shapes";

/**
 * Brute-force throttle for the challenges gate, one item per client IP under
 * pk=GATE. Five failed password attempts lock the IP for 24 hours. Used in
 * every CTF_DATA_BACKEND mode — DynamoDB credentials are ambient (Vercel OIDC
 * / the SDK default chain).
 *
 * These items hold a client IP address, which is personal data, so they carry
 * a 30-day `ttl` for DynamoDB to reap. Two things to understand about that:
 *
 *  1. The TTL is a RETENTION bound, not the lock mechanism. DynamoDB deletes
 *     expired items on a best-effort basis (typically within 48h of expiry),
 *     which is far too loose to enforce a 24h lock. The lock window is still
 *     enforced on read — an expired window is treated as a fresh start — so
 *     the throttle is correct regardless of when the reaper actually runs.
 *  2. The `ttl` attribute does nothing unless TTL is ENABLED on the table with
 *     AttributeName "ttl". That is table-level infra config, not something
 *     this code can assert. If it is off, these items simply persist, which is
 *     the behaviour we had before. See README for the enable step.
 *
 * getGateThrottle deliberately THROWS on transport errors: the caller fails
 * closed (500), so a DynamoDB outage can never disable the throttle.
 */

export const GATE_MAX_FAILURES = 5;
export const GATE_LOCK_MS = 24 * 60 * 60 * 1000;
/** Retention bound for the IP address held in a throttle item. */
export const GATE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export type GateThrottle = { failures: number; lastFailAt: number } | null;

/** DynamoDB TTL wants epoch SECONDS, not milliseconds. Exported so the
 *  retention window is directly testable. */
export function gateTtlSeconds(now: number): number {
  return Math.floor((now + GATE_TTL_MS) / 1000);
}

export async function getGateThrottle(ip: string): Promise<GateThrottle> {
  const res = await getDynamoClient().send(
    new GetItemCommand({
      TableName: CTF_DYNAMO_TABLE,
      Key: { pk: { S: GATE_PK }, sk: { S: gateSk(ip) } },
    }),
  );
  if (!res.Item) return null;
  return { failures: getN(res.Item, "failures"), lastFailAt: getN(res.Item, "lastFailAt") };
}

/** Seconds until the lock lifts; 0 = not locked. Pure so the lock math is
 *  directly testable. */
export function gateLockRemainingSeconds(throttle: GateThrottle, now: number): number {
  if (!throttle || throttle.failures < GATE_MAX_FAILURES) return 0;
  const liftAt = throttle.lastFailAt + GATE_LOCK_MS;
  return now < liftAt ? Math.ceil((liftAt - now) / 1000) : 0;
}

/** Record one failed attempt. A fresh IP or an expired lock window starts the
 *  counter over at 1; otherwise the counter increments. The read-then-write
 *  race between two concurrent failures can undercount by one — tolerable for
 *  a brute-force throttle. */
export async function recordGateFailure(ip: string, prior: GateThrottle, now: number): Promise<void> {
  const key = { pk: { S: GATE_PK }, sk: { S: gateSk(ip) } };
  if (!prior || now >= prior.lastFailAt + GATE_LOCK_MS) {
    await getDynamoClient().send(
      new PutItemCommand({
        TableName: CTF_DYNAMO_TABLE,
        Item: {
          ...key,
          failures: { N: "1" },
          lastFailAt: { N: String(now) },
          ttl: { N: String(gateTtlSeconds(now)) },
        },
      }),
    );
    return;
  }
  // The TTL is refreshed on every failure so an actively-attacked IP keeps its
  // counter for the full window rather than being reaped mid-attack.
  await getDynamoClient().send(
    new UpdateItemCommand({
      TableName: CTF_DYNAMO_TABLE,
      Key: key,
      UpdateExpression: "ADD #failures :one SET #lastFailAt = :now, #ttl = :ttl",
      ExpressionAttributeNames: {
        "#failures": "failures",
        "#lastFailAt": "lastFailAt",
        "#ttl": "ttl",
      },
      ExpressionAttributeValues: {
        ":one": { N: "1" },
        ":now": { N: String(now) },
        ":ttl": { N: String(gateTtlSeconds(now)) },
      },
    }),
  );
}

/** Reset after a successful unlock. Best-effort by contract — a failed delete
 *  must never block the 200. */
export async function clearGateThrottle(ip: string): Promise<void> {
  try {
    await getDynamoClient().send(
      new DeleteItemCommand({
        TableName: CTF_DYNAMO_TABLE,
        Key: { pk: { S: GATE_PK }, sk: { S: gateSk(ip) } },
      }),
    );
  } catch (err) {
    console.error(`[gate] throttle clear failed: ${(err as Error).message}`);
  }
}
