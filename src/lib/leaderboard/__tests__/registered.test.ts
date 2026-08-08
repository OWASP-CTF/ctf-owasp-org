// Unit tests for the registered-contestants overlay: signed-in players with
// no scored PR yet appear as zero-point rows below every scored entry, and
// the registry can never displace or duplicate the scorer's data.

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  listContestants: vi.fn<() => Promise<string[]>>(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/registration-store", () => ({ listContestants: mocks.listContestants }));

import { withRegisteredContestants } from "../registered";
import type { LeaderboardData, LeaderboardEntry } from "../types";

const entry = (login: string, points: number, patched: number, rank: number): LeaderboardEntry => ({
  rank,
  login,
  team: null,
  points,
  patched,
  failed: 0,
  total: patched,
  apps: {},
  updatedAt: "2026-08-07T12:00:00.000Z",
  lastSolveAt: "2026-08-07T12:00:00.000Z",
});

const board = (entries: LeaderboardEntry[]): LeaderboardData => ({
  entries,
  teams: [],
  generatedAt: "2026-08-08T00:00:00.000Z",
  capabilities: { apps: true, teams: false, challenges: false },
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("withRegisteredContestants", () => {
  it("appends zero-point rows below every scored entry and restamps ranks", async () => {
    mocks.listContestants.mockResolvedValue(["newbie"]);
    const data = board([entry("alice", 12, 3, 1), entry("bob", 5, 1, 2)]);

    const result = await withRegisteredContestants(data);

    expect(result.entries.map((e) => [e.rank, e.login, e.points])).toEqual([
      [1, "alice", 12],
      [2, "bob", 5],
      [3, "newbie", 0],
    ]);
    const newbie = result.entries[2];
    expect(newbie).toMatchObject({ team: null, patched: 0, failed: 0, total: 0, apps: {}, updatedAt: null });
  });

  it("keeps a scored zero-point entry ahead of registry newcomers", async () => {
    mocks.listContestants.mockResolvedValue(["aaa-newbie"]);
    const scoredZero: LeaderboardEntry = { ...entry("zed", 0, 0, 1), updatedAt: null, lastSolveAt: null };

    const result = await withRegisteredContestants(board([scoredZero]));

    expect(result.entries.map((e) => e.login)).toEqual(["zed", "aaa-newbie"]);
  });

  it("dedupes case-insensitively against scored entries and within the registry", async () => {
    mocks.listContestants.mockResolvedValue(["Alice", "newbie", "NEWBIE"]);
    const data = board([entry("alice", 12, 3, 1)]);

    const result = await withRegisteredContestants(data);

    expect(result.entries.map((e) => e.login)).toEqual(["alice", "newbie"]);
  });

  it("returns the input untouched when everyone registered is already scored", async () => {
    mocks.listContestants.mockResolvedValue(["alice"]);
    const data = board([entry("alice", 12, 3, 1)]);

    await expect(withRegisteredContestants(data)).resolves.toBe(data);
  });

  it("returns the input untouched when the registry is empty", async () => {
    mocks.listContestants.mockResolvedValue([]);
    const data = board([entry("alice", 12, 3, 1)]);

    await expect(withRegisteredContestants(data)).resolves.toBe(data);
  });

  it("degrades to the scorer-only view when the registry is unavailable", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.listContestants.mockRejectedValue(new Error("socket hang up"));
    const data = board([entry("alice", 12, 3, 1)]);

    await expect(withRegisteredContestants(data)).resolves.toBe(data);

    expect(error).toHaveBeenCalledTimes(1);
    error.mockRestore();
  });
});
