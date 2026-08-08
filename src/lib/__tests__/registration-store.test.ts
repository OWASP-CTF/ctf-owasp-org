// Unit tests for the contestant registry. The client is mocked at
// getDynamoClient (same idiom as leaderboard/__tests__/dynamo.test.ts).
//
// The contract under test is asymmetric on purpose: recordContestant runs
// inside the OAuth callback and must NEVER throw, while listContestants runs
// under the leaderboard overlay's try/catch and must propagate failures so
// the overlay can degrade.

import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConditionalCheckFailedException } from "@aws-sdk/client-dynamodb";

const mocks = vi.hoisted(() => ({
  send: vi.fn<(command: { input: Record<string, unknown> }) => Promise<unknown>>(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/dynamo", () => ({
  CTF_DYNAMO_TABLE: "ctf-leaderboard",
  getDynamoClient: () => ({ send: mocks.send }),
}));

import { listContestants, recordContestant } from "@/lib/registration-store";

const conditionFailed = () =>
  new ConditionalCheckFailedException({ message: "The conditional request failed", $metadata: {} });

beforeEach(() => {
  vi.clearAllMocks();
});

describe("recordContestant", () => {
  it("writes a first-sign-in-wins conditional put under pk=CONTESTANTS", async () => {
    mocks.send.mockResolvedValueOnce({});

    await recordContestant("octocat");

    expect(mocks.send).toHaveBeenCalledTimes(1);
    const input = mocks.send.mock.calls[0][0].input as Record<string, unknown>;
    expect(input.ConditionExpression).toBe("attribute_not_exists(pk)");
    const item = input.Item as Record<string, { S: string }>;
    expect(item.pk).toEqual({ S: "CONTESTANTS" });
    expect(item.sk).toEqual({ S: "AUTHOR#octocat" });
    expect(item.login).toEqual({ S: "octocat" });
    expect(item.registeredAt.S).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("treats an already-registered login as success", async () => {
    mocks.send.mockRejectedValueOnce(conditionFailed());

    await expect(recordContestant("octocat")).resolves.toBeUndefined();
  });

  it("swallows transport errors so a DynamoDB outage cannot fail sign-in", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.send.mockRejectedValueOnce(new Error("socket hang up"));

    await expect(recordContestant("octocat")).resolves.toBeUndefined();

    expect(error).toHaveBeenCalledTimes(1);
    error.mockRestore();
  });

  it("does nothing for an empty login", async () => {
    await recordContestant("");

    expect(mocks.send).not.toHaveBeenCalled();
  });
});

describe("listContestants", () => {
  it("collects logins across pagination pages", async () => {
    mocks.send
      .mockResolvedValueOnce({
        Items: [
          { pk: { S: "CONTESTANTS" }, sk: { S: "AUTHOR#alice" }, login: { S: "alice" } },
          // No `login` attribute: the sk suffix is the fallback.
          { pk: { S: "CONTESTANTS" }, sk: { S: "AUTHOR#bob" } },
        ],
        LastEvaluatedKey: { pk: { S: "CONTESTANTS" }, sk: { S: "AUTHOR#bob" } },
      })
      .mockResolvedValueOnce({
        Items: [{ pk: { S: "CONTESTANTS" }, sk: { S: "AUTHOR#carol" }, login: { S: "carol" } }],
      });

    await expect(listContestants()).resolves.toEqual(["alice", "bob", "carol"]);

    expect(mocks.send).toHaveBeenCalledTimes(2);
    const second = mocks.send.mock.calls[1][0].input as Record<string, unknown>;
    expect(second.ExclusiveStartKey).toEqual({ pk: { S: "CONTESTANTS" }, sk: { S: "AUTHOR#bob" } });
  });

  it("propagates transport errors so the overlay can degrade", async () => {
    mocks.send.mockRejectedValueOnce(new Error("socket hang up"));

    await expect(listContestants()).rejects.toThrow("socket hang up");
  });
});
