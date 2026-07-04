import type { Metadata } from "next";
import PageHeader from "@/components/page-header";
import ChallengeGrid from "@/components/challenge-grid";
import { apps, totalChallenges, totalMaxPoints } from "@/lib/apps";

export const metadata: Metadata = {
  title: "Challenges · OWASP CTF @ DEF CON 34",
  description: "Six vulnerable OWASP apps to patch: Juice Shop, DVWA, WebGoat, Security Shepherd, VulnerableApp, and VAmPI.",
};

export default function ChallengesPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Targets"
        title="Challenges"
        description={`${totalChallenges} challenges across six vulnerable apps, worth ${totalMaxPoints} points total. Points scale with difficulty — patch the regression test tied to each challenge to score it.`}
      />
      <ChallengeGrid apps={apps} />
    </div>
  );
}
