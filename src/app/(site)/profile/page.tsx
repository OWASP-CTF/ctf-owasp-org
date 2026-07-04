// Gated Server Component: real gate (proxy.ts only does an optimistic cookie
// check — this getSession call is what actually matters). Loads the
// contestant's progress from the active leaderboard source and renders their
// dossier: identity, overall progress, per-app breakdown, and team control.

import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import PageHeader from "@/components/page-header";
import AppChallengeList from "@/components/app-challenge-list";
import TeamCard from "@/components/team-card";
import { appsById } from "@/lib/apps";
import { auth } from "@/lib/auth";
import { getLeaderboardSource } from "@/lib/leaderboard/source";
import { getMockTeamOverride, TEAM_WRITES_ENABLED } from "@/lib/team-store";

export const metadata: Metadata = {
  title: "Profile · OWASP CTF @ DEF CON 34",
  description: "Your personal progress across the DEF CON 34 OWASP CTF challenges.",
};

export default async function ProfilePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/");

  const login = (session.user as { login?: string }).login;
  if (!login) redirect("/");

  const [profile, mockTeamOverride] = await Promise.all([
    getLeaderboardSource().getUser(login),
    getMockTeamOverride(),
  ]);

  const effectiveTeam = mockTeamOverride ?? profile?.team ?? null;
  const remaining = profile ? Math.max(0, profile.total - profile.patched - profile.failed) : 0;
  const progressPct = profile && profile.maxPoints > 0 ? (profile.points / profile.maxPoints) * 100 : 0;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader eyebrow="Agent dossier" title={login} description="Your progress across every target this event." />

      <div className="ds-card flex flex-col gap-4 rounded-lg border border-white/[0.06] bg-[#16162a] p-5 sm:flex-row sm:items-center">
        <Image
          src={session.user.image ?? `https://avatars.githubusercontent.com/${login}`}
          alt=""
          width={64}
          height={64}
          className="flex-none rounded-full border border-white/10"
          unoptimized
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-2">
            <p className="font-mono text-lg text-white">{login}</p>
            {effectiveTeam && (
              <span className="rounded border border-white/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-zinc-400">
                {effectiveTeam}
              </span>
            )}
          </div>
          <div className="mt-3 h-1.5 w-full max-w-md overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#2563eb] to-[#14b8a6]"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
        <div className="flex flex-none gap-6 text-right">
          <div>
            <p className="font-mono text-xl font-bold tabular-nums text-white">{profile?.points ?? 0}</p>
            <p className="text-[11px] uppercase tracking-wide text-zinc-500">points</p>
          </div>
          <div>
            <p className="font-mono text-xl tabular-nums text-[#22c55e]">{profile?.patched ?? 0}</p>
            <p className="text-[11px] uppercase tracking-wide text-zinc-500">patched</p>
          </div>
          <div>
            <p className="font-mono text-xl tabular-nums text-[#e53e3e]">{profile?.failed ?? 0}</p>
            <p className="text-[11px] uppercase tracking-wide text-zinc-500">failed</p>
          </div>
          <div>
            <p className="font-mono text-xl tabular-nums text-zinc-400">{remaining}</p>
            <p className="text-[11px] uppercase tracking-wide text-zinc-500">remaining</p>
          </div>
        </div>
      </div>

      <TeamCard team={effectiveTeam} writesEnabled={TEAM_WRITES_ENABLED} />

      {!profile || profile.apps.length === 0 ? (
        <div className="ds-card rounded-lg border border-white/[0.06] bg-[#16162a] px-5 py-10 text-center">
          <p className="text-sm text-zinc-400">No scored PRs yet — submit a patch to start earning points.</p>
          <Link href="/how-to-play" className="mt-3 inline-block text-sm text-[#2563eb] hover:underline">
            How to play →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {profile.apps.map((app) => {
            const meta = appsById[app.app];
            return (
              <div key={app.app} className="ds-card rounded-lg border border-white/[0.06] bg-[#16162a] p-4" style={{ ["--accent" as string]: meta.accent }}>
                <div className="flex items-center justify-between">
                  <p className="font-medium" style={{ color: meta.accent }}>
                    {meta.name}
                  </p>
                  <p className="font-mono text-sm text-zinc-400">
                    {app.points}
                    <span className="text-zinc-600"> / {app.maxPoints} pts</span>
                  </p>
                </div>
                <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${app.total > 0 ? (app.patched / app.total) * 100 : 0}%`, background: meta.accent }}
                  />
                </div>
                <p className="mt-1.5 text-xs text-zinc-500">
                  {app.patched} / {app.total} patched
                </p>
                {app.challenges && app.challenges.length > 0 && <AppChallengeList challenges={app.challenges} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
