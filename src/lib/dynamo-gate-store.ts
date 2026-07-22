import "server-only";
import { DeleteItemCommand, GetItemCommand, PutItemCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { CTF_DYNAMO_TABLE, getDynamoClient } from "@/lib/dynamo";
import { GATE_PK, gateSk, getN } from "@/lib/dynamo-shapes";

/**
 * Brute-force throttle for the challenges gate, one item per client IP under
 * pk=GATE. Five failed password attempts lock the IP for 24 hours; the table
 * has no TTL, so the lock window is enforced on read (an expired window is
 * treated as a fresh start). Used in every CTF_DATA_BACKEND mode — DynamoDB
 * credentials are ambient (Vercel OIDC / the SDK default chain).
 *
 * getGateThrottle deliberately THROWS on transport errors: the caller fails
 * closed (500), so a DynamoDB outage can never disable the throttle.
 */

export const GATE_MAX_FAILURES = 5;
export const GATE_LOCK_MS = 24 * 60 * 60 * 1000;

export type GateThrottle = { failures: number; lastFailAt: number } | null;

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
        Item: { ...key, failures: { N: "1" }, lastFailAt: { N: String(now) } },
      }),
    );
    return;
  }
  await getDynamoClient().send(
    new UpdateItemCommand({
      TableName: CTF_DYNAMO_TABLE,
      Key: key,
      UpdateExpression: "ADD #failures :one SET #lastFailAt = :now",
      ExpressionAttributeNames: { "#failures": "failures", "#lastFailAt": "lastFailAt" },
      ExpressionAttributeValues: { ":one": { N: "1" }, ":now": { N: String(now) } },
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
