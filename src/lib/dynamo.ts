import "server-only";
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { awsCredentialsProvider } from "@vercel/oidc-aws-credentials-provider";

/**
 * DynamoDB access for the leaderboard migration (dc34 scorer writes to Upstash AND
 * DynamoDB; the web app is moving with it).
 *
 * The app authenticates to AWS with NO stored keys: Vercel mints an OIDC token per
 * deployment, and `awsCredentialsProvider` exchanges it for the `ctf-web-dynamodb` role
 * (trust + table access are defined in the dc34 repo's terraform/vercel-aws.tf). Nothing
 * here holds a secret.
 *
 * Config is HARDCODED for now so it works with zero Vercel setup; each value still reads
 * an env var first, so the author can move any of them to Vercel-managed env vars
 * (Project → Settings → Environment Variables) without touching this file.
 *
 *   AWS_REGION       must be pinned — Vercel overwrites the ambient AWS_REGION with the
 *                    function's own execution region, which is not where the table lives.
 *   AWS_ROLE_ARN     the role Vercel's OIDC token may assume.
 *   CTF_DYNAMO_TABLE the single leaderboard table.
 */
export const AWS_REGION = process.env.AWS_REGION ?? "us-west-2";
export const AWS_ROLE_ARN = process.env.AWS_ROLE_ARN ?? "arn:aws:iam::942548380662:role/ctf-web-dynamodb";
export const CTF_DYNAMO_TABLE = process.env.CTF_DYNAMO_TABLE ?? "ctf-leaderboard";

let client: DynamoDBClient | undefined;

/** Lazily-built client. The credential provider is lazy too — it resolves the OIDC token
 *  per request, not at module load, so importing this file never reaches for AWS. */
function dynamo(): DynamoDBClient {
  if (!client) {
    client = new DynamoDBClient({
      region: AWS_REGION,
      credentials: awsCredentialsProvider({ roleArn: AWS_ROLE_ARN }),
    });
  }
  return client;
}

/**
 * STUB — dual-write to DynamoDB.
 *
 * The real thing (mirror teams/hints into DynamoDB item shapes, atomically) is TODO for
 * the author. For now this only PROVES the Vercel → AWS OIDC path end to end: a best-
 * effort "test put" of a heartbeat item at a fixed key, overwritten each call. If it
 * lands, the app can assume the role and write the table.
 *
 * Best-effort by contract: it never throws and never blocks the real Upstash write —
 * a team/hint action must not fail because this stub couldn't reach DynamoDB. Replace the
 * body with the actual dual-write when the item model is designed; keep the swallow.
 *
 * @param op    the mutation that triggered it, e.g. "team:create" (for the heartbeat sk)
 * @param actor the acting user's GitHub login
 */
export async function dualWriteStub(op: string, actor: string): Promise<void> {
  try {
    await dynamo().send(
      new PutItemCommand({
        TableName: CTF_DYNAMO_TABLE,
        Item: {
          // Fixed partition, one row per op — the heartbeat never accumulates.
          pk: { S: "WEBAPP#DUALWRITE_STUB" },
          sk: { S: op },
          lastActor: { S: actor },
          writtenAt: { S: new Date().toISOString() },
          note: { S: "OIDC write-path heartbeat — replace with the real teams/hints dual-write" },
        },
      }),
    );
    console.log(`[dynamo] dual-write stub ok (${op})`);
  } catch (err) {
    // Swallowed on purpose: the Upstash write already succeeded; this is only telemetry.
    console.error(`[dynamo] dual-write stub failed (${op}): ${(err as Error).message}`);
  }
}
