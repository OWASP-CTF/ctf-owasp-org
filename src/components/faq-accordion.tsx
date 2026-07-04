"use client";

// Accordion: client state tracks which question is open. Each item is a real
// <button> so it's keyboard-operable, with aria-expanded driving assistive tech.

import { useState } from "react";

export type QA = { q: string; a: React.ReactNode };

export default function FaqAccordion({ items }: { items: QA[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <li key={i}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="ds-card flex w-full items-center justify-between gap-4 rounded-lg border border-white/[0.06] bg-[#16162a] px-5 py-4 text-left transition-colors hover:border-[#2563eb]/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]"
            >
              <span className="font-medium text-white">{item.q}</span>
              <svg
                className={`flex-none text-zinc-500 transition-transform ${isOpen ? "rotate-45" : ""}`}
                width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
            {isOpen && (
              <div className="px-5 pb-4 pt-3 text-sm leading-relaxed text-zinc-400">
                {item.a}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
