import "server-only";
import { listContestants } from "@/lib/registration-store";
import { rankByStanding } from "./rank";
import type { LeaderboardData, LeaderboardEntry } from "./types";

/**
 * Appends signed-in contestants who have no scored PR yet as zero-point rows,
 * so a new player sees their name on /leaderboard right after GitHub sign-in
 * (the callback hook in lib/auth.ts writes the registry item this reads).
 *
 * Ordering contract: apply this FIRST, before withHintPenalties and
 * withTeamStandings, so penalties and team sums see the full roster.
 *
 * Zero rows can never displace the scorer's entries: compareStanding orders
 * on solves, then points, then solve time, and entries without a solve time
 * sort last — so newcomers land below every scored entry, alphabetically
 * (the registry lists in sk order and rankByStanding is stable).
 *
 * Matching is case-insensitive so a casing mismatch between the registry and
 * the scorer's author login can never duplicate a scored contestant.
 * Registry trouble degrades to the scorer-only view rather than failing the
 * whole leaderboard.
 */
export async function withRegisteredContestants(data: LeaderboardData): Promise<LeaderboardData> {
  let logins: string[];
  try {
    logins = await listContestants();
  } catch (err) {
    console.error("registered contestants unavailable:", err);
    return data;
  }

  const seen = new Set(data.entries.map((entry) => entry.login.toLowerCase()));
  const newcomers: LeaderboardEntry[] = [];
  for (const login of logins) {
    const key = login.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    newcomers.push({
      rank: 0, // restamped by rankByStanding below
      login,
      team: null,
      points: 0,
      patched: 0,
      failed: 0,
      total: 0,
      apps: {},
      updatedAt: null,
      lastSolveAt: null,
    });
  }
  if (newcomers.length === 0) return data;

  return { ...data, entries: rankByStanding([...data.entries, ...newcomers]) };
}
