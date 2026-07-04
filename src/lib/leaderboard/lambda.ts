import "server-only";
import type { AppId } from "@/lib/apps";
import type { LeaderboardSource } from "./source";
import type { LeaderboardData, LeaderboardEntry, UserProfile } from "./types";

// Shape returned by the currently-deployed Lambda's mock endpoint:
// { leaderboard: [{ rank, author, points, apps: { "juice-shop": 6, ... } }] }
// "apps" here is a pass-count per target, not points — there is no per-app
// point/max/patched/total breakdown and no team concept in this source.
type LambdaEntry = { rank: number; author: string; points: number; apps: Partial<Record<AppId, number>> };
type LambdaResponse = { leaderboard: LambdaEntry[] };

function toEntry(raw: LambdaEntry): LeaderboardEntry {
  const apps: LeaderboardEntry["apps"] = {};
  let total = 0;
  for (const [app, passed] of Object.entries(raw.apps) as [AppId, number][]) {
    total += passed;
    apps[app] = { app, points: 0, maxPoints: 0, patched: passed, total: passed };
  }
  return {
    rank: raw.rank,
    login: raw.author,
    team: null,
    points: raw.points,
    patched: total,
    failed: 0,
    total,
    apps,
    updatedAt: null,
  };
}

export const lambdaSource: LeaderboardSource = {
  async getLeaderboard(): Promise<LeaderboardData> {
    const base = process.env.LEADERBOARD_API_URL;
    if (!base) throw new Error("LEADERBOARD_API_URL is not set");
    // The deployed Lambda's real scoring path isn't implemented yet — without
    // `mock=1` it returns `{ leaderboard: [] }`. Drop this param once the
    // backend (see PR-B) actually populates data from Upstash.
    const res = await fetch(`${base.replace(/\/$/, "")}/leaderboard?mock=1&breakdown=1`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) throw new Error(`Lambda leaderboard fetch failed: HTTP ${res.status}`);
    const data = (await res.json()) as LambdaResponse;
    return {
      entries: data.leaderboard.map(toEntry),
      teams: [],
      generatedAt: new Date().toISOString(),
      capabilities: { apps: true, teams: false, challenges: false },
    };
  },

  async getUser(login: string): Promise<UserProfile | null> {
    const data = await this.getLeaderboard();
    const entry = data.entries.find((e) => e.login === login);
    if (!entry) return null;
    return {
      login: entry.login,
      team: null,
      teamName: null,
      points: entry.points,
      maxPoints: 0,
      patched: entry.patched,
      failed: entry.failed,
      total: entry.total,
      apps: Object.values(entry.apps).filter(Boolean) as UserProfile["apps"],
      updatedAt: null,
    };
  },
};
