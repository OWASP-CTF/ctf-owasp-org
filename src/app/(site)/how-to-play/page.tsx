import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/page-header";

export const metadata: Metadata = {
  title: "How to Play · OWASP CTF @ DEF CON 34",
  description: "Step-by-step guide to the OWASP secure development CTF: fork a target, patch a real vulnerability, open a PR, and get scored automatically.",
};

const steps = [
  {
    title: "Get your DEF CON badge",
    body: "This is an in-person competition at the Las Vegas Convention Center. A valid DEF CON 34 badge gets you into the OWASP CTF area.",
  },
  {
    title: "Sign in with GitHub",
    body: "Use the sign-in button in the header. Your GitHub login is how the leaderboard and your profile track your progress — it's the same identity you'll submit pull requests from.",
  },
  {
    title: "Pick a target and a challenge",
    body: "Browse the six vulnerable apps on the Challenges page — Juice Shop, DVWA, WebGoat, Security Shepherd, VulnerableApp, and VAmPI. Each has dozens of independent challenges at different difficulty levels; pick any one to start.",
  },
  {
    title: "Find the vulnerability",
    body: "Work the target like a real audit: read the source, exercise the app, and identify the OWASP Top 10 flaw behind the challenge. Using AI tools to help analyze and remediate is part of the intended workflow — use them if it helps.",
  },
  {
    title: "Patch it and open a pull request",
    body: "Fork the target's repo, fix the vulnerability in your fork, and open a PR against that challenge's branch. This is secure development practice, not flag hunting — the fix itself is the deliverable.",
  },
  {
    title: "Get scored automatically",
    body: "A GitHub Action runs the challenge's regression test against your patched app. A passing test scores the challenge's points immediately — no manual grading, no waiting on an organizer.",
  },
];

export default function HowToPlayPage() {
  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        eyebrow="Getting Started"
        title="How to Play"
        description="New to the competition? Here's everything you need to go from a DEF CON badge to your first patched challenge."
      />

      {/* Workflow callout */}
      <div className="rounded-lg border border-[#2563eb]/30 bg-[#2563eb]/[0.06] p-5">
        <p className="text-xs font-medium uppercase tracking-wider text-[#2563eb]">The loop</p>
        <p className="mt-2 font-mono text-sm text-zinc-300">
          find the flaw <span className="text-zinc-600">→</span> patch it{" "}
          <span className="text-zinc-600">→</span> open a PR{" "}
          <span className="text-zinc-600">→</span> CI scores it
        </p>
        <p className="mt-2 text-sm text-zinc-400">
          There are no flags to submit. Every challenge is scored by an automated regression test
          that only passes once the vulnerability is actually fixed.
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
          Every challenge is worth a fixed number of points based on difficulty — harder
          vulnerabilities pay out more. Points are awarded the moment your PR&rsquo;s regression
          test passes, and your best-ever result for each challenge is what counts, so a later
          fix always replaces an earlier miss. Your live total, per-app breakdown, and
          patched and non-patched counts are visible on your profile once you&rsquo;re signed in.
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
          <Link
            href="/leaderboard"
            className="rounded-md border border-white/10 px-4 py-2 text-sm text-zinc-300 transition-colors hover:border-white/20 hover:text-white"
          >
            View the leaderboard
          </Link>
        </div>
      </div>
    </div>
  );
}
