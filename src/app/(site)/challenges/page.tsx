import type { Metadata } from "next";
import PageHeader from "@/components/page-header";
import ChallengeGrid from "@/components/challenge-grid";
import { apps, totalChallenges, totalMaxPoints } from "@/lib/apps";
import { getChallengeCatalog } from "@/lib/challenges";
import { getHintAvailability } from "@/lib/hint-store";

export const metadata: Metadata = {
  title: "Challenges · OWASP CTF @ DEF CON 34",
  description: "Six vulnerable OWASP apps to patch: Juice Shop, DVWA, WebGoat, Security Shepherd, VulnerableApp, and VAmPI.",
};

export default async function ChallengesPage() {
  // Both fetches are ISR-cached (revalidate 300) so this page stays static;
  // hint availability is public (ids only, no hint text).
  const [catalog, hintAvailability] = await Promise.all([
    getChallengeCatalog(),
    getHintAvailability(),
  ]);
  const sortedApps = [...apps].sort((a, b) => a.name.localeCompare(b.name));

  const description = catalog
    ? `${catalog.total} challenges across six vulnerable apps, each tagged with its OWASP Top 10 category. Points scale with difficulty — patch the regression test tied to each challenge to score it.`
    : `${totalChallenges} challenges across six vulnerable apps, worth ${totalMaxPoints} points total. Points scale with difficulty — patch the regression test tied to each challenge to score it.`;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader eyebrow="Targets" title="Challenges" description={description} />
      <ChallengeGrid apps={sortedApps} catalog={catalog?.byApp ?? null} hints={hintAvailability} />
    </div>
  );
}
