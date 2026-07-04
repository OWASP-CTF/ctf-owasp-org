import type { Metadata } from "next";
import PageHeader from "@/components/page-header";
import FaqAccordion, { type QA } from "@/components/faq-accordion";
import { event } from "@/lib/site";

export const metadata: Metadata = {
  title: "FAQ · OWASP CTF @ DEF CON 34",
  description: "Frequently asked questions about the OWASP secure development CTF at DEF CON 34.",
};

const faqs: QA[] = [
  {
    q: "Do I need experience to compete?",
    a: "No. Every target has challenges across a range of difficulty, from 1-star warmups to multi-star deep dives. Start with a 1-star challenge on any app and work up.",
  },
  {
    q: "Can I compete solo?",
    a: "Yes, and it's the default. Teams are optional — you can join or create one from your profile after signing in, up to four people.",
  },
  {
    q: "Do I need to be at DEF CON in person?",
    a: "Yes. This is an in-person competition at the Las Vegas Convention Center and requires a valid DEF CON 34 badge.",
  },
  {
    q: "What do I need to bring?",
    a: "Your own laptop with the dev tools you like to work in, a GitHub account, and a charger — outlets go fast. You'll run the target apps and your fixes locally, then push a PR.",
  },
  {
    q: "How do I submit a solution?",
    a: "There's no flag to type in. Fork the target's repo, patch the vulnerability in your fork, and open a pull request against that challenge's branch. A GitHub Action runs the regression test automatically and scores it within minutes.",
  },
  {
    q: "Can I use AI tools to help?",
    a: "Yes — using AI to assist with vulnerability analysis and remediation is part of the intended skillset this event is built around, not something to hide.",
  },
  {
    q: "How is my progress tracked?",
    a: "Sign in with GitHub to claim your row on the live leaderboard and see a full per-app, per-challenge breakdown on your profile.",
  },
  {
    q: "Is there a prize?",
    a: "Yes — prizes go to the top individuals and top teams overall. You must be present at the closing ceremony to claim.",
  },
  {
    q: "Where's the full event schedule?",
    a: (
      <>
        This page only covers the CTF itself. For the full DEF CON 34 schedule — talks, villages,
        and timing — check{" "}
        <a
          href={event.hackerTrackerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#2563eb] hover:underline"
        >
          HackerTracker
        </a>
        .
      </>
    ),
  },
];

export default function FaqPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Questions"
        title="FAQ"
        description="Quick answers to the things contestants ask most. Still stuck? Find an organizer at the OWASP CTF area."
      />
      <FaqAccordion items={faqs} />
    </div>
  );
}
