"use client";

// Interactive category grid: a difficulty filter (client state) drives which
// cards show. Each card is a hover-reactive surface built from the design
// tokens — the accent ring and glow come from the category's own color.

import { useState } from "react";
import type { Category, Difficulty } from "@/lib/challenges";

const FILTERS: (Difficulty | "All")[] = ["All", "Beginner", "Intermediate", "Advanced"];

export default function ChallengeGrid({ categories }: { categories: Category[] }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");

  const visible =
    filter === "All"
      ? categories
      : categories.filter((c) => c.difficulty.includes(filter));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb] ${
              filter === f
                ? "border-[#2563eb] bg-[#2563eb]/10 text-[#2563eb]"
                : "border-white/10 text-zinc-400 hover:text-white"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((cat) => (
          <li key={cat.slug}>
            <article
              className="ds-card group flex h-full flex-col gap-3 rounded-lg border border-white/[0.06] bg-[#16162a] p-5 transition-all hover:-translate-y-0.5"
              style={{ ["--accent" as string]: cat.accent }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-full border-2 transition-shadow"
                  style={{
                    color: cat.accent,
                    borderColor: cat.accent,
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d={cat.icon} />
                  </svg>
                </span>
                <span className="font-mono text-xs tabular-nums text-zinc-500">
                  {cat.count} challenges
                </span>
              </div>

              <h3 className="text-lg font-semibold text-white">{cat.name}</h3>
              <p className="flex-1 text-sm leading-relaxed text-zinc-400">{cat.blurb}</p>

              <div className="flex items-center justify-between border-t border-white/[0.06] pt-3 text-xs">
                <span className="font-mono tabular-nums text-zinc-500">
                  {cat.points[0]}–{cat.points[1]} pts
                </span>
                <span className="flex gap-1">
                  {cat.difficulty.map((d) => (
                    <span
                      key={d}
                      className="rounded border border-white/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-zinc-400"
                    >
                      {d.slice(0, 3)}
                    </span>
                  ))}
                </span>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </div>
  );
}
