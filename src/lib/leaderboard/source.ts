import "server-only";
import type { LeaderboardData, UserProfile } from "./types";
import { mockSource } from "./mock";
import { lambdaSource } from "./lambda";
import { upstashSource } from "./upstash";

export interface LeaderboardSource {
  getLeaderboard(): Promise<LeaderboardData>;
  getUser(login: string): Promise<UserProfile | null>;
}

/**
 * `LEADERBOARD_SOURCE` switches the backend without touching any UI code:
 *  - "mock"    (default) — local fixture shaped like the proposed v2 API.
 *  - "lambda"  — the deployed Lambda's `GET /leaderboard?breakdown=1` (current
 *                mock data; aggregate points per app, no per-challenge detail).
 *  - "upstash" — direct read of the CURRENT real Upstash schema (read-only
 *                token) — aggregates only, no teams, no per-app breakdown.
 */
export function getLeaderboardSource(): LeaderboardSource {
  const mode = process.env.LEADERBOARD_SOURCE ?? "mock";
  switch (mode) {
    case "lambda":
      return lambdaSource;
    case "upstash":
      return upstashSource;
    case "mock":
    default:
      return mockSource;
  }
}
