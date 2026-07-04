// Central site config: event facts and primary navigation.
// Keep route copy in one place so the header, footer, and metadata stay in sync.

export const event = {
  name: "OWASP CTF @ DEF CON 34",
  theme: "Agency",
  dates: "August 7–9, 2026",
  location: "Las Vegas Convention Center",
  // Friday, August 7, 2026, 10:00 AM Pacific Daylight Time (Las Vegas).
  // ISO with explicit offset so it resolves to the same instant everywhere.
  ctfStartsAt: "2026-08-07T10:00:00-07:00",
  // Full DEF CON schedule (talks, villages, timing) lives in HackerTracker,
  // not on this site — we only own CTF-specific content.
  hackerTrackerUrl: "https://hackertracker.app",
} as const;

export type NavLink = { href: string; label: string };

// Order here drives the header nav left-to-right.
export const navLinks: NavLink[] = [
  { href: "/how-to-play", label: "How to Play" },
  { href: "/challenges", label: "Challenges" },
  { href: "/rules", label: "Rules" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/faq", label: "FAQ" },
];
