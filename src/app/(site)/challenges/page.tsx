import type { Metadata } from "next";
import PageHeader from "@/components/page-header";
import ChallengeGrid from "@/components/challenge-grid";
import { categories } from "@/lib/challenges";

export const metadata: Metadata = {
  title: "Challenges · OWASP CTF @ DEF CON 34",
  description: "Challenge categories for the OWASP CTF: web, pwn, crypto, forensics, reverse engineering, and OSINT.",
};

export default function ChallengesPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Categories"
        title="Challenges"
        description="Challenges span six categories and three difficulty tiers. Points scale with difficulty, and harder solves are worth more as fewer teams crack them. Filter by tier to find a starting point."
      />
      <ChallengeGrid categories={categories} />
    </div>
  );
}
