"use client";

// Accordion: client state tracks which question is open. Each item is a real
// <button> so it's keyboard-operable, with aria-expanded/aria-controls driving
// assistive tech. Question and answer live inside ONE card so an open answer
// reads as part of its question instead of floating on the page background.

import { useId, useState } from "react";

export type QA = { q: string; a: React.ReactNode };

export default function FaqAccordion({ items }: { items: QA[] }) {
  const [open, setOpen] = useState<number | null>(0);
  const base = useId();

  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((item, i) => {
        const isOpen = open === i;
        const buttonId = `${base}-q${i}`;
        const panelId = `${base}-a${i}`;
        return (
          <li
            key={i}
            className={`ds-card overflow-hidden rounded-lg border bg-[#16162a] transition-colors ${
              isOpen ? "border-[#2563eb]/40" : "border-white/[0.06] hover:border-[#2563eb]/40"
            }`}
          >
            <button
              type="button"
              id={buttonId}
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              aria-controls={panelId}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]"
            >
              <span className="font-medium text-white">{item.q}</span>
              <svg
                className={`flex-none transition-transform ${isOpen ? "rotate-45 text-[#2563eb]" : "text-zinc-400"}`}
                width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
            {/* grid-rows 0fr -> 1fr animates height without measuring content.
                `inert` keeps the collapsed answer out of tab order and the
                accessibility tree while it stays in the DOM for the transition. */}
            <div
              className={`grid transition-[grid-template-rows] duration-200 ease-out ${
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="overflow-hidden">
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  inert={!isOpen}
                  className="max-w-[68ch] px-5 pb-5 text-[0.9375rem] leading-relaxed text-zinc-300"
                >
                  {item.a}
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
