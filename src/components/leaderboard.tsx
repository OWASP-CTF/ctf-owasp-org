"use client";

// Interactive leaderboard.
//
// This is a Client Component (note the "use client" directive above) because
// everything here needs the browser: useState for the query/filter/sort, and
// onClick to expand a row. The server page loads the data and hands it down as
// the `teams` prop — data fetching stays on the server, interactivity on the
// client.

import { useMemo, useState } from "react";
import type { Division, Team } from "@/lib/leaderboard";

type RankedTeam = Team & { rank: number };
type SortKey = "rank" | "score" | "solves";

const DIVISIONS: (Division | "All")[] = ["All", "Open", "Pro", "Students"];

// Podium accents for the top three, drawn from the design tokens.
const PODIUM: Record<number, string> = {
  1: "#d4a017", // gold
  2: "#a1a1aa", // silver
  3: "#14b8a6", // teal-bronze
};

export default function Leaderboard({ teams }: { teams: RankedTeam[] }) {
  const [query, setQuery] = useState("");
  const [division, setDivision] = useState<(typeof DIVISIONS)[number]>("All");
  const [sort, setSort] = useState<SortKey>("rank");
  const [expanded, setExpanded] = useState<string | null>(null);

  // Leader score drives the relative width of each team's score bar.
  const topScore = useMemo(
    () => teams.reduce((max, t) => Math.max(max, t.score), 0),
    [teams],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return teams
      .filter((t) => (division === "All" ? true : t.division === division))
      .filter((t) => (q === "" ? true : t.name.toLowerCase().includes(q)))
      .sort((a, b) => {
        if (sort === "rank") return a.rank - b.rank;
        if (sort === "score") return b.score - a.score;
        return b.solves - a.solves;
      });
  }, [teams, query, division, sort]);

  return (
    <div className="flex flex-col gap-5">
      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4-4" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search teams…"
            aria-label="Search teams"
            className="w-full rounded-md border border-white/10 bg-white/[0.03] py-2 pl-9 pr-3 text-sm text-white placeholder:text-zinc-500 focus-visible:border-[#2563eb]/60 focus-visible:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {DIVISIONS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDivision(d)}
              aria-pressed={division === d}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb] ${
                division === d
                  ? "border-[#2563eb] bg-[#2563eb]/10 text-[#2563eb]"
                  : "border-white/10 text-zinc-400 hover:text-white"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Sort header */}
      <div className="flex items-center gap-4 px-1 text-xs uppercase tracking-wider text-zinc-500">
        <span>Sort:</span>
        {(["rank", "score", "solves"] as SortKey[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setSort(key)}
            className={`transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb] ${
              sort === key ? "text-[#14b8a6]" : "hover:text-zinc-300"
            }`}
          >
            {key}
          </button>
        ))}
      </div>

      {/* Cards */}
      {visible.length === 0 ? (
        <p className="rounded-lg border border-white/[0.06] bg-[#16162a] px-5 py-8 text-center text-sm text-zinc-500">
          No teams match <span className="text-zinc-300">&ldquo;{query}&rdquo;</span>.
        </p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {visible.map((team) => {
            const isOpen = expanded === team.name;
            const podium = PODIUM[team.rank];
            return (
              <li key={team.name}>
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : team.name)}
                  aria-expanded={isOpen}
                  className="ds-card group w-full rounded-lg border border-white/[0.06] bg-[#16162a] p-4 text-left transition-all hover:border-[#2563eb]/40 hover:bg-[#1a1a30] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]"
                >
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <span
                      className="flex h-9 w-9 flex-none items-center justify-center rounded-md font-mono text-sm font-bold tabular-nums"
                      style={{
                        color: podium ?? "#71717a",
                        borderWidth: 1,
                        borderStyle: "solid",
                        borderColor: podium ? `${podium}66` : "rgba(255,255,255,0.08)",
                        background: podium ? `${podium}14` : "transparent",
                      }}
                    >
                      {team.rank}
                    </span>

                    {/* Name + division + bar */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium text-white">{team.name}</span>
                        <span className="flex-none rounded border border-white/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-zinc-400">
                          {team.division}
                        </span>
                      </div>
                      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#2563eb] to-[#14b8a6]"
                          style={{ width: `${(team.score / topScore) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex flex-none items-center gap-5 text-right">
                      <div>
                        <p className="font-mono text-base font-bold tabular-nums text-white">
                          {team.score.toLocaleString()}
                        </p>
                        <p className="text-[11px] uppercase tracking-wide text-zinc-500">pts</p>
                      </div>
                      <div className="hidden sm:block">
                        <p className="font-mono text-base tabular-nums text-zinc-300">{team.solves}</p>
                        <p className="text-[11px] uppercase tracking-wide text-zinc-500">solves</p>
                      </div>
                      <svg
                        className={`text-zinc-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
                        width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                        aria-hidden="true"
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isOpen && (
                    <div className="mt-4 border-t border-white/[0.06] pt-4">
                      <div className="mb-3 flex items-center justify-between text-xs text-zinc-500">
                        <span className="uppercase tracking-wider">Category breakdown</span>
                        <span>Last solve {team.lastSolve}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {team.breakdown.map((cat) => (
                          <div
                            key={cat.category}
                            className="rounded-md border border-white/[0.06] bg-[#12121e] px-3 py-2"
                          >
                            <p className="text-xs text-zinc-400">{cat.category}</p>
                            <p className="font-mono text-sm tabular-nums text-white">
                              {cat.points.toLocaleString()}
                              <span className="ml-1 text-xs text-zinc-500">/ {cat.solves} solved</span>
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <p className="px-1 text-xs text-zinc-600">
        Showing {visible.length} of {teams.length} teams · click a row for the category breakdown
      </p>
    </div>
  );
}
