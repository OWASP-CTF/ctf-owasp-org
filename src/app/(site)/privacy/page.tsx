// Privacy notice for this site specifically. The OWASP Foundation privacy
// policy is the governing document; this page exists because it can't describe
// what a one-off CTF site does with GitHub logins, hint purchases, and gate
// rate-limiting data.
//
// IMPORTANT: every factual claim here is meant to match the code. If you change
// what is stored, what a cookie holds, or how long anything is kept, change this
// page in the same PR. The relevant sources are src/lib/auth.ts (sessions),
// src/lib/gate.ts + src/lib/dynamo-gate-store.ts (gate + IP throttle),
// src/lib/hint-store.ts, src/lib/team-store.ts, and src/lib/dynamo-shapes.ts.

import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/page-header";
import { event } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy · OWASP CTF @ DEF CON 34",
  description:
    "What the OWASP CTF site at DEF CON 34 collects, where it's stored, who can see it, and how to ask for it to be deleted.",
};

const ExternalLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="ds-link"
  >
    {children}
  </a>
);

const Card = ({ heading, children }: { heading: string; children: React.ReactNode }) => (
  <section className="rounded-lg border border-white/[0.06] bg-[#16162a] p-6">
    <h2 className="mb-4 text-lg font-semibold text-white">{heading}</h2>
    {children}
  </section>
);

const Bullets = ({ items }: { items: React.ReactNode[] }) => (
  <ul className="flex flex-col gap-3">
    {items.map((item, i) => (
      <li key={i} className="flex gap-3 text-sm leading-relaxed text-zinc-400">
        <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-[#2563eb]" />
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

const cookies: { name: string; what: string; life: string }[] = [
  {
    name: "Sign-in session",
    what: "Set when you sign in with GitHub. Encrypted, and readable only by the server — your browser can't read it and neither can any script on the page.",
    life: "7 days",
  },
  {
    name: "Sign-in handshake",
    what: "A short-lived cookie that protects the GitHub sign-in redirect against tampering. Discarded as soon as sign-in finishes.",
    life: "10 minutes",
  },
  {
    name: "ctf-challenges-gate",
    what: "Records that the challenge-board password was entered correctly. Holds an expiry timestamp and a signature — no information about you.",
    life: "30 days",
  },
  {
    name: "ctf-mock-team",
    what: "Only set in the pre-event demo mode, to remember a team choice locally when nothing is being written server-side.",
    life: "30 days",
  },
];

export default function PrivacyPage() {
  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        eyebrow="Privacy"
        title="Privacy notice"
        description="What this site collects, where it goes, and who can see it. Written to match what the code actually does — not a template."
      />

      <section className="rounded-lg border border-white/[0.06] bg-[#16162a] p-6">
        <p className="text-sm leading-relaxed text-zinc-400">
          The OWASP Foundation&apos;s{" "}
          <ExternalLink href={event.owaspPrivacyUrl}>Privacy Policy</ExternalLink> is the
          governing document and covers OWASP as a whole. This page is narrower: it describes
          what <span className="text-white">this competition site</span>{" "}
          does, because a general policy can&apos;t tell you what happens to a hint purchase or
          a GitHub login on a leaderboard.
        </p>
      </section>

      <Card heading="You can use most of this site without signing in">
        <Bullets
          items={[
            "Browsing the challenges, the leaderboard, the rules, and these policy pages requires no account and no sign-in.",
            "Signing in is only needed to claim your row on the leaderboard, see your own per-challenge breakdown, join a team, or reveal a hint.",
          ]}
        />
      </Card>

      <Card heading="What we get when you sign in with GitHub">
        <p className="mb-4 text-sm leading-relaxed text-zinc-400">
          Sign-in uses GitHub OAuth. We request read-only access to your profile and email
          address — we never request write access to your repositories, and we cannot push code,
          open pull requests, or change anything in your account.
        </p>
        <Bullets
          items={[
            <>
              GitHub gives us your <span className="text-white">login</span>, numeric account
              id, display name, avatar URL, and email address.
            </>,
            <>
              Of those, only your <span className="text-white">GitHub login</span> is ever
              stored on our side or shown to anyone. Your email address and display name are
              never written to our databases and are never displayed anywhere on this site.
            </>,
            "Sessions are held entirely in an encrypted cookie — there is no account database, so signing out and letting the cookie expire leaves nothing behind from the sign-in itself.",
          ]}
        />
      </Card>

      <Card heading="What we store while you compete">
        <Bullets
          items={[
            <>
              <span className="text-white">Team membership</span> — the team&apos;s name, who
              created it, and the GitHub logins of its members.
            </>,
            <>
              <span className="text-white">Hint purchases</span> — which hints you revealed,
              when, and the running point penalty against your login.
            </>,
            <>
              <span className="text-white">Your scores</span>{" "}
              are produced by the scoring pipeline from the pull requests you open, and are
              keyed to the GitHub login that authored the PR. This site reads them; it
              doesn&apos;t create them.
            </>,
          ]}
        />
        <p className="mt-4 text-sm leading-relaxed text-zinc-400">
          This is held in an AWS DynamoDB table and an Upstash Redis instance run for the event.
          Being straight with you: none of it is on an automatic expiry timer today, so treat it
          as kept until the organizers clear it down after the event. See below if you want it
          removed sooner.
        </p>
      </Card>

      <Card heading="Rate-limiting the challenge gate">
        <p className="text-sm leading-relaxed text-zinc-400">
          Before the challenge board opens it sits behind a password. To stop it being brute
          forced, five wrong attempts from one IP address lock that address out for 24 hours,
          which means we record the{" "}
          <span className="text-white">IP address of failed attempts</span>{" "}
          along with a counter and a timestamp. The record is deleted as soon as a correct
          password is entered from that address. Note that if you&apos;re on shared or conference Wi-Fi, an
          IP address can cover a lot of people — a lockout may not have been caused by you.
        </p>
      </Card>

      <Card heading="Cookies">
        <p className="mb-4 text-sm leading-relaxed text-zinc-400">
          No advertising cookies, no tracking cookies, no third-party cookies, and no consent
          banner because there is nothing to consent to. Every cookie below is strictly
          functional and marked <span className="font-mono text-zinc-200">httpOnly</span>, so
          page scripts cannot read any of them.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[34rem] text-left text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="pb-2 pr-4 font-semibold text-white">Cookie</th>
                <th className="pb-2 pr-4 font-semibold text-white">What it&apos;s for</th>
                <th className="pb-2 font-semibold text-white">Lifetime</th>
              </tr>
            </thead>
            <tbody>
              {cookies.map((c) => (
                <tr key={c.name} className="border-b border-white/[0.06] last:border-0">
                  <td className="py-3 pr-4 align-top font-mono text-xs text-zinc-200">
                    {c.name}
                  </td>
                  <td className="py-3 pr-4 align-top leading-relaxed text-zinc-400">{c.what}</td>
                  <td className="py-3 align-top whitespace-nowrap text-muted">{c.life}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card heading="What other people can see">
        <p className="mb-4 text-sm leading-relaxed text-zinc-400">
          The leaderboard is public — anyone can read it without signing in. It shows, for each
          contestant:
        </p>
        <Bullets
          items={[
            "Your GitHub login and avatar, your rank, your points, and how many challenges you have patched and not patched.",
            "Your team, if you're on one — and expanding a team shows every member's login and avatar.",
            "The point penalty from any hints you've revealed, as a total. Which specific hints you bought is not public.",
            "For some scoring modes, the number of your most recent pull request and a short commit hash.",
          ]}
        />
        <p className="mt-4 text-sm leading-relaxed text-zinc-400">
          Your email address, your real name, and the contents of hints you&apos;ve revealed are
          not public — those appear only on your own profile page, which requires your session.
        </p>
      </Card>

      <Card heading="Who else is involved">
        <Bullets
          items={[
            <>
              <span className="text-white">GitHub</span> — handles sign-in, hosts the challenge
              repositories, and serves avatar images. Because avatars load straight from
              GitHub, GitHub sees the IP address of anyone viewing a page with avatars on it,
              including the leaderboard.
            </>,
            <>
              <span className="text-white">Vercel</span> — hosts this site, so it processes all
              requests and keeps standard server logs. We also use Vercel Web Analytics, which
              records which page was viewed. It sets no cookie, and this site sends it no
              identifiers, so it cannot tell who you are.
            </>,
            <>
              <span className="text-white">AWS and Upstash</span> — store the competition data
              described above.
            </>,
            <>
              <span className="text-white">Discord</span> — only ever a link from this site. If
              you join, Discord&apos;s own privacy policy applies to what happens there.
            </>,
          ]}
        />
        <p className="mt-4 text-sm leading-relaxed text-zinc-400">
          Nothing here is sold, and none of it is used for advertising.
        </p>
      </Card>

      <Card heading="Your choices">
        <Bullets
          items={[
            "Don't sign in. Everything except your own profile, teams, and hints works signed out.",
            "Leave your team at any time from your profile — that removes your login from the team record.",
            "Clear your cookies, or wait for them to expire, to end the session.",
          ]}
        />
        <p className="mt-4 text-sm leading-relaxed text-zinc-400">
          There is no self-serve delete button for competition data, so requests go to a human.
          For access, correction, or deletion, contact OWASP at{" "}
          <a
            href={`mailto:${event.privacyContactEmail}`}
            className="font-mono ds-link"
          >
            {event.privacyContactEmail}
          </a>
          , which is the address published in the{" "}
          <ExternalLink href={event.owaspPrivacyUrl}>OWASP Privacy Policy</ExternalLink> — that
          policy also sets out the rights available to you, including the additional rights of
          EEA and California residents. For CTF-specific data such as team membership or hint
          purchases, an organizer in the{" "}
          <ExternalLink href={event.discordUrl}>CTF Discord</ExternalLink> can usually sort it
          out faster. Note that removing your scores from the leaderboard means withdrawing from
          the competition.
        </p>
      </Card>

      <p className="text-sm leading-relaxed text-muted">
        See also the{" "}
        <Link href="/terms" className="ds-link">
          terms
        </Link>{" "}
        and the{" "}
        <Link
          href="/code-of-conduct"
          className="ds-link"
        >
          code of conduct
        </Link>
        .
      </p>
    </div>
  );
}
