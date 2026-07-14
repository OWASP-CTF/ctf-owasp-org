// Unit tests for the standing comparator: points rule, lastSolveAt breaks
// point ties (earlier last solve = reached the score first = higher rank),
// and entries without a solve time sort after those with one.

import { describe, expect, it } from "vitest";
import { rankByStanding } from "../rank";
import type { LeaderboardEntry } from "../types";

function entry(login: string, points: number, lastSolveAt?: string | null): LeaderboardEntry {
  return { rank: 0, login, team: null, points, patched: 0, failed: 0, total: 0, apps: {}, updatedAt: null, lastSolveAt };
}

describe("rankByStanding", () => {
  it("orders by points first", () => {
    const ranked = rankByStanding([entry("low", 10), entry("high", 99)]);
    expect(ranked.map((e) => [e.login, e.rank])).toEqual([
      ["high", 1],
      ["low", 2],
    ]);
  });

  it("breaks point ties by earlier lastSolveAt", () => {
    const ranked = rankByStanding([
      entry("later", 50, "2026-08-07T15:00:00Z"),
      entry("earlier", 50, "2026-08-07T12:00:00Z"),
    ]);
    expect(ranked.map((e) => e.login)).toEqual(["earlier", "later"]);
  });

  it("sorts a tied entry without a solve time after one with it", () => {
    const ranked = rankByStanding([entry("no-time", 50, null), entry("timed", 50, "2026-08-07T12:00:00Z")]);
    expect(ranked.map((e) => e.login)).toEqual(["timed", "no-time"]);
  });

  it("treats an unparseable timestamp like a missing one", () => {
    const ranked = rankByStanding([entry("garbage", 50, "not-a-date"), entry("timed", 50, "2026-08-07T12:00:00Z")]);
    expect(ranked.map((e) => e.login)).toEqual(["timed", "garbage"]);
  });

  it("keeps the source order when nothing breaks the tie", () => {
    const ranked = rankByStanding([entry("first", 50), entry("second", 50)]);
    expect(ranked.map((e) => [e.login, e.rank])).toEqual([
      ["first", 1],
      ["second", 2],
    ]);
  });
});
