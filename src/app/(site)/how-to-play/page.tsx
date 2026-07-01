import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/page-header";
import { event } from "@/lib/site";

export const metadata: Metadata = {
  title: "How to Play · OWASP CTF @ DEF CON 34",
  description: "Step-by-step guide to competing in the OWASP CTF: register, join the scoreboard, find flags, and submit.",
};

const steps = [
  {
    title: "Get your DEF CON badge",
    body: "This is an in-person competition at the Las Vegas Convention Center. A valid DEF CON 34 badge gets you into the OWASP CTF area.",
  },
  {
    title: "Register on the scoreboard",
    body: "Create an account on the CTFd scoreboard platform. You'll register your team there and submit every flag through it.",
  },
  {
    title: "Form your team (1–4 players)",
    body: "Compete solo or with up to three teammates. One person creates the team and shares the invite; everyone submits under the same team.",
  },
  {
    title: "Pick a challenge",
    body: "Browse challenges by category and difficulty. Beginner challenges are worth fewer points but are the fastest way onto the board — start there if you're new.",
  },
  {
    title: "Find the flag",
    body: "Each challenge hides a flag. Solve the puzzle — exploit the web app, reverse the binary, break the cipher — until you recover it.",
  },
  {
    title: "Submit it",
    body: "Paste the flag into the challenge on the scoreboard. A correct flag locks in the points instantly and updates your rank.",
  },
];

export default function HowToPlayPage() {
  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        eyebrow="Getting Started"
        title="How to Play"
        description="New to capture the flag? Here's everything you need to go from a DEF CON badge to your first solve on the board."
      />

      {/* Flag format callout */}
      <div className="rounded-lg border border-[#2563eb]/30 bg-[#2563eb]/[0.06] p-5">
        <p className="text-xs font-medium uppercase tracking-wider text-[#2563eb]">Flag format</p>
        <p className="mt-2 font-mono text-sm text-zinc-300">
          Every flag looks like{" "}
          <span className="rounded bg-[#12121e] px-2 py-1 text-[#22c55e]">OWASP&#123;y0u_found_me&#125;</span>
        </p>
        <p className="mt-2 text-sm text-zinc-400">
          Submit it exactly as found, including the <code className="font-mono text-zinc-300">OWASP&#123;&#125;</code> wrapper. Flags are case-sensitive.
        </p>
      </div>

      {/* Numbered steps */}
      <ol className="flex flex-col gap-4">
        {steps.map((step, i) => (
          <li
            key={step.title}
            className="flex gap-4 rounded-lg border border-white/[0.06] bg-[#16162a] p-5"
          >
            <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full border border-[#2563eb]/40 bg-[#2563eb]/10 font-mono text-sm font-bold tabular-nums text-[#2563eb]">
              {i + 1}
            </span>
            <div>
              <h3 className="font-semibold text-white">{step.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-zinc-400">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>

      {/* Scoring note */}
      <div className="flex flex-col gap-3 rounded-lg border border-white/[0.06] bg-[#16162a] p-5">
        <h3 className="font-semibold text-white">How scoring works</h3>
        <p className="text-sm leading-relaxed text-zinc-400">
          Challenges use <span className="text-zinc-200">dynamic scoring</span>: every challenge starts at its maximum value, and the points drop as more teams solve it. The earliest solves of the hardest challenges are worth the most. Ties are broken by who reached the score first, so a fast solve beats a late one.
        </p>
        <div className="flex flex-wrap gap-3 pt-1">
          <Link
            href="/challenges"
            className="rounded-md border border-[#2563eb] bg-[#2563eb]/10 px-4 py-2 text-sm font-medium text-[#2563eb] transition-colors hover:bg-[#2563eb]/20"
          >
            Browse challenges
          </Link>
          <Link
            href="/rules"
            className="rounded-md border border-white/10 px-4 py-2 text-sm text-zinc-300 transition-colors hover:border-white/20 hover:text-white"
          >
            Read the rules
          </Link>
          <a
            href={event.ctfdUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-white/10 px-4 py-2 text-sm text-zinc-300 transition-colors hover:border-white/20 hover:text-white"
          >
            Open the scoreboard ↗
          </a>
        </div>
      </div>
    </div>
  );
}
