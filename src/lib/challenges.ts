// Challenge category metadata for the /challenges overview.
// Counts/points are illustrative until the real challenge set is locked.

export type Difficulty = "Beginner" | "Intermediate" | "Advanced";

export type Category = {
  slug: string;
  name: string;
  blurb: string;
  /** Accent token used for the icon ring and hover glow. */
  accent: string;
  count: number;
  points: [min: number, max: number];
  difficulty: Difficulty[];
  /** Single-path SVG (24x24, stroke) rendered in the category chip. */
  icon: string;
};

export const categories: Category[] = [
  {
    slug: "web",
    name: "Web",
    blurb: "Exploit application logic, auth flaws, injection, and broken access control.",
    accent: "#2563eb",
    count: 14,
    points: [50, 500],
    difficulty: ["Beginner", "Intermediate", "Advanced"],
    icon: "M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18M3 12a9 9 0 0 1 18 0 9 9 0 0 1-18 0Z",
  },
  {
    slug: "pwn",
    name: "Pwn / Binary",
    blurb: "Memory corruption, ROP, and getting a shell on hardened targets.",
    accent: "#e53e3e",
    count: 10,
    points: [100, 600],
    difficulty: ["Intermediate", "Advanced"],
    icon: "M4 17l6-6-6-6M12 19h8",
  },
  {
    slug: "crypto",
    name: "Crypto",
    blurb: "Break weak ciphers, flawed protocols, and homegrown key schemes.",
    accent: "#14b8a6",
    count: 12,
    points: [50, 500],
    difficulty: ["Beginner", "Intermediate", "Advanced"],
    icon: "M7 11V7a5 5 0 0 1 10 0v4M5 11h14v10H5z",
  },
  {
    slug: "forensics",
    name: "Forensics",
    blurb: "Carve disk images, follow packet captures, and recover hidden artifacts.",
    accent: "#d4a017",
    count: 15,
    points: [50, 450],
    difficulty: ["Beginner", "Intermediate", "Advanced"],
    icon: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14ZM21 21l-5-5",
  },
  {
    slug: "reverse",
    name: "Reverse Engineering",
    blurb: "Static and dynamic analysis of unknown binaries to recover the logic.",
    accent: "#2563eb",
    count: 9,
    points: [150, 600],
    difficulty: ["Intermediate", "Advanced"],
    icon: "M3 12a9 9 0 1 0 9-9M3 12l3-3M3 12l3 3",
  },
  {
    slug: "osint",
    name: "OSINT",
    blurb: "Pivot across public data to track people, places, and infrastructure.",
    accent: "#14b8a6",
    count: 8,
    points: [50, 400],
    difficulty: ["Beginner", "Intermediate"],
    icon: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20ZM2 12h20M12 2a15 15 0 0 1 0 20",
  },
];
