// Central site config: event facts and primary navigation.
// Keep route copy in one place so the header, footer, and metadata stay in sync.

export const event = {
  name: "OWASP CTF @ DEF CON 34",
  theme: "Agency",
  dates: "August 6–9, 2026",
  location: "Las Vegas Convention Center",
  // Live scoreboard platform contestants submit flags on.
  ctfdUrl: "https://ctfd.io",
} as const;

export type NavLink = { href: string; label: string };

// Order here drives the header nav left-to-right.
export const navLinks: NavLink[] = [
  { href: "/how-to-play", label: "How to Play" },
  { href: "/challenges", label: "Challenges" },
  { href: "/rules", label: "Rules" },
  { href: "/schedule", label: "Schedule" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/faq", label: "FAQ" },
];
