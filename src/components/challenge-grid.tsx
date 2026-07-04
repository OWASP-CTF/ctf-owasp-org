"use client";

// Grid of the six vulnerable-app targets. A Client Component only for the
// search filter (client state); the cards themselves are static per app.

import { useState } from "react";
import type { AppMeta } from "@/lib/apps";

export default function ChallengeGrid({ apps }: { apps: AppMeta[] }) {
  const [query, setQuery] = useState("");

  const visible = apps.filter((app) =>
    query.trim() === "" ? true : app.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-6">
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
          placeholder="Search targets…"
          aria-label="Search challenge targets"
          className="w-full rounded-md border border-white/10 bg-white/[0.03] py-2 pl-9 pr-3 text-sm text-white placeholder:text-zinc-500 focus-visible:border-[#2563eb]/60 focus-visible:outline-none"
        />
      </div>

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((app) => (
          <li key={app.id}>
            <article
              className="ds-card group flex h-full flex-col gap-3 rounded-lg border border-white/[0.06] bg-[#16162a] p-5 transition-all hover:-translate-y-0.5"
              style={{ ["--accent" as string]: app.accent }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-full border-2 transition-shadow"
                  style={{ color: app.accent, borderColor: app.accent }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d={app.icon} />
                  </svg>
                </span>
                <span className="font-mono text-xs tabular-nums text-zinc-500">
                  {app.challengeCount} challenges
                </span>
              </div>

              <h3 className="text-lg font-semibold text-white">{app.name}</h3>
              <p className="flex-1 text-sm leading-relaxed text-zinc-400">{app.blurb}</p>

              <div className="flex items-center justify-between border-t border-white/[0.06] pt-3 text-xs">
                <span className="font-mono tabular-nums text-zinc-500">
                  {app.stars[0]}–{app.stars[1]} pts / challenge
                </span>
                <span className="rounded border border-white/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-zinc-400">
                  {app.maxPoints} max
                </span>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </div>
  );
}
