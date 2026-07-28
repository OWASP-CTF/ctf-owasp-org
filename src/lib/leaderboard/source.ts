import "server-only";
import type { LeaderboardData, UserProfile } from "./types";
import { mockSource } from "./mock";
import { lambdaSource } from "./lambda";
import { upstashSource } from "./upstash";
import { dynamoSource } from "./dynamo";

export interface LeaderboardSource {
  getLeaderboard(): Promise<LeaderboardData>;
  getUser(login: string): Promise<UserProfile | null>;
}

/**
 * `LEADERBOARD_SOURCE` switches the backend without touching any UI code:
 *  - "mock"    (default) — local fixture shaped like the proposed v2 API.
 *  - "lambda"  — the deployed Lambda's `GET /leaderboard` (live scoring;
 *                per-app solved/total, no per-challenge or point breakdown).
 *                NOTE: that endpoint reads UPSTASH, not DynamoDB.
 *  - "dynamo"  — direct read of the scorer's DynamoDB items (same per-app
 *                solved/total contract as "lambda", no Lambda round-trip).
 *  - "upstash" — direct read of the CURRENT real Upstash schema (read-only
 *                token) — aggregates only, no teams, no per-app breakdown.
 */
export type LeaderboardSourceMode = "mock" | "lambda" | "dynamo" | "upstash";

export function getLeaderboardSourceMode(): LeaderboardSourceMode {
  const mode = process.env.LEADERBOARD_SOURCE;
  return mode === "lambda" || mode === "dynamo" || mode === "upstash" ? mode : "mock";
}

export function getLeaderboardSource(): LeaderboardSource {
  switch (getLeaderboardSourceMode()) {
    case "lambda":
      return lambdaSource;
    case "dynamo":
      return dynamoSource;
    case "upstash":
      return upstashSource;
    case "mock":
      return mockSource;
  }
}
