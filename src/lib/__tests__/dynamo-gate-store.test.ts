// Unit tests for the challenges-gate throttle — most importantly the lock
// math (5 failures lock for 24h, an expired window starts over) and that the
// bookkeeping writes take the right shape. The client is mocked at
// getDynamoClient.

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  send: vi.fn<(command: { input: Record<string, unknown> }) => Promise<unknown>>(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/dynamo", () => ({
  CTF_DYNAMO_TABLE: "ctf-leaderboard",
  DATA_BACKEND: "dual",
  getDynamoClient: () => ({ send: mocks.send }),
}));

import {
  GATE_LOCK_MS,
  GATE_MAX_FAILURES,
  GATE_TTL_MS,
  clearGateThrottle,
  gateLockRemainingSeconds,
  gateTtlSeconds,
  getGateThrottle,
  recordGateFailure,
} from "@/lib/dynamo-gate-store";

const NOW = 1_800_000_000_000;
// 30 days at NOW, in epoch SECONDS. Hard-coded rather than derived from the
// constants so that changing either the window or the unit fails this suite
// instead of silently agreeing with itself.
const EXPECTED_TTL = "1802592000";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getGateThrottle", () => {
  it("reads the IP's throttle item", async () => {
    mocks.send.mockResolvedValueOnce({ Item: { failures: { N: "3" }, lastFailAt: { N: String(NOW) } } });
    expect(await getGateThrottle("203.0.113.9")).toEqual({ failures: 3, lastFailAt: NOW });
    expect(mocks.send.mock.calls[0][0].input).toMatchObject({
      Key: { pk: { S: "GATE" }, sk: { S: "IP#203.0.113.9" } },
    });
  });

  it("returns null for an unseen IP and throws on transport errors (caller fails closed)", async () => {
    mocks.send.mockResolvedValueOnce({});
    expect(await getGateThrottle("203.0.113.9")).toBeNull();
    mocks.send.mockRejectedValueOnce(new Error("dynamo down"));
    await expect(getGateThrottle("203.0.113.9")).rejects.toThrow("dynamo down");
  });
});

describe("gateLockRemainingSeconds", () => {
  it("locks only at the failure cap", () => {
    expect(gateLockRemainingSeconds(null, NOW)).toBe(0);
    expect(gateLockRemainingSeconds({ failures: GATE_MAX_FAILURES - 1, lastFailAt: NOW }, NOW)).toBe(0);
    expect(gateLockRemainingSeconds({ failures: GATE_MAX_FAILURES, lastFailAt: NOW }, NOW)).toBe(GATE_LOCK_MS / 1000);
  });

  it("lifts after the 24h window passes", () => {
    const stale = { failures: GATE_MAX_FAILURES, lastFailAt: NOW - GATE_LOCK_MS };
    expect(gateLockRemainingSeconds(stale, NOW)).toBe(0);
    const nearlyOver = { failures: GATE_MAX_FAILURES, lastFailAt: NOW - GATE_LOCK_MS + 1000 };
    expect(gateLockRemainingSeconds(nearlyOver, NOW)).toBe(1);
  });
});

describe("gateTtlSeconds", () => {
  it("is 30 days out, in epoch seconds", () => {
    expect(gateTtlSeconds(NOW)).toBe(Number(EXPECTED_TTL));
    // Guards the unit: an epoch-millis TTL would be ~1000x larger and DynamoDB
    // would treat the item as expired ~57000 years hence, i.e. never reaped.
    expect(gateTtlSeconds(NOW)).toBeLessThan(NOW);
    expect(GATE_TTL_MS).toBe(30 * 24 * 60 * 60 * 1000);
  });

  it("is strictly longer than the lock window, so a lock can never outlive its item", () => {
    expect(GATE_TTL_MS).toBeGreaterThan(GATE_LOCK_MS);
  });
});

describe("recordGateFailure", () => {
  it("starts a fresh counter for an unseen IP, with a 30-day retention bound", async () => {
    mocks.send.mockResolvedValueOnce({});
    await recordGateFailure("203.0.113.9", null, NOW);
    expect(mocks.send.mock.calls[0][0].input).toMatchObject({
      Item: {
        pk: { S: "GATE" },
        sk: { S: "IP#203.0.113.9" },
        failures: { N: "1" },
        lastFailAt: { N: String(NOW) },
        ttl: { N: EXPECTED_TTL },
      },
    });
  });

  it("resets the counter once the lock window has expired", async () => {
    mocks.send.mockResolvedValueOnce({});
    await recordGateFailure("203.0.113.9", { failures: GATE_MAX_FAILURES, lastFailAt: NOW - GATE_LOCK_MS }, NOW);
    expect(mocks.send.mock.calls[0][0].input).toMatchObject({ Item: { failures: { N: "1" } } });
  });

  it("increments inside an active window and refreshes the retention bound", async () => {
    mocks.send.mockResolvedValueOnce({});
    await recordGateFailure("203.0.113.9", { failures: 2, lastFailAt: NOW - 60_000 }, NOW);
    const input = mocks.send.mock.calls[0][0].input;
    expect(input).toMatchObject({
      Key: { pk: { S: "GATE" }, sk: { S: "IP#203.0.113.9" } },
      UpdateExpression: "ADD #failures :one SET #lastFailAt = :now, #ttl = :ttl",
      ExpressionAttributeValues: {
        ":one": { N: "1" },
        ":now": { N: String(NOW) },
        ":ttl": { N: EXPECTED_TTL },
      },
    });
    // `ttl` is a DynamoDB reserved word, so it must go through an expression
    // attribute name — a literal `ttl` in the UpdateExpression is a 400.
    expect(input.ExpressionAttributeNames).toMatchObject({ "#ttl": "ttl" });
    // `#ttl` (name) and `:ttl` (value) are fine; a bare `ttl` is not.
    expect(input.UpdateExpression).not.toMatch(/(?<![#:])\bttl\b/);
  });
});

describe("clearGateThrottle", () => {
  it("deletes the throttle item and never throws", async () => {
    mocks.send.mockResolvedValueOnce({});
    await clearGateThrottle("203.0.113.9");
    expect(mocks.send.mock.calls[0][0].input).toMatchObject({
      Key: { pk: { S: "GATE" }, sk: { S: "IP#203.0.113.9" } },
    });

    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.send.mockRejectedValueOnce(new Error("boom"));
    await expect(clearGateThrottle("203.0.113.9")).resolves.toBeUndefined();
    consoleError.mockRestore();
  });
});
