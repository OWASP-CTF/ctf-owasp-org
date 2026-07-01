// Server Component: loads scoreboard data on the server, then renders the
// interactive <Leaderboard> client component with it. Data in, interactivity
// down — the split the App Router is built around.

import type { Metadata } from "next";
import PageHeader from "@/components/page-header";
import Leaderboard from "@/components/leaderboard";
import { getLeaderboard } from "@/lib/leaderboard";

export const metadata: Metadata = {
  title: "Leaderboard · OWASP CTF @ DEF CON 34",
  description: "Live team standings for the OWASP Capture The Flag at DEF CON 34.",
};

export default async function LeaderboardPage() {
  const teams = await getLeaderboard();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Standings"
        title="Leaderboard"
        description="Live team rankings. Filter by division, sort by score or solves, and expand any team to see how their points break down by category."
      />
      <Leaderboard teams={teams} />
    </div>
  );
}
