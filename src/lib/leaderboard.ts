// Mock leaderboard data.
//
// This is the ONLY place the leaderboard's shape and source live. To go live
// later, replace the body of `getLeaderboard()` with a fetch to the real
// scoreboard (e.g. the CTFd `/api/v1/scoreboard` endpoint) and map the
// response into `Team[]`. Nothing in the UI needs to change.

export type Division = "Open" | "Pro" | "Students";

export type CategorySolves = {
  category: string;
  solves: number;
  points: number;
};

export type Team = {
  name: string;
  division: Division;
  score: number;
  solves: number;
  /** Pre-formatted relative time, e.g. "4m ago". Stored as a string so the
   *  server and client render identical markup (no Date() hydration drift). */
  lastSolve: string;
  /** Per-category breakdown, revealed when a row is expanded. */
  breakdown: CategorySolves[];
};

const TEAMS: Team[] = [
  {
    name: "null_terminators",
    division: "Pro",
    score: 8450,
    solves: 41,
    lastSolve: "2m ago",
    breakdown: [
      { category: "Web", solves: 11, points: 2300 },
      { category: "Pwn", solves: 9, points: 2600 },
      { category: "Crypto", solves: 8, points: 1850 },
      { category: "Forensics", solves: 13, points: 1700 },
    ],
  },
  {
    name: "Segfault Syndicate",
    division: "Pro",
    score: 8120,
    solves: 39,
    lastSolve: "6m ago",
    breakdown: [
      { category: "Web", solves: 10, points: 2100 },
      { category: "Pwn", solves: 10, points: 2900 },
      { category: "Crypto", solves: 6, points: 1420 },
      { category: "Forensics", solves: 13, points: 1700 },
    ],
  },
  {
    name: "0xCafeBabe",
    division: "Open",
    score: 7690,
    solves: 36,
    lastSolve: "1m ago",
    breakdown: [
      { category: "Web", solves: 12, points: 2550 },
      { category: "Pwn", solves: 6, points: 1740 },
      { category: "Crypto", solves: 9, points: 2050 },
      { category: "OSINT", solves: 9, points: 1350 },
    ],
  },
  {
    name: "Blue Phoenix",
    division: "Open",
    score: 6980,
    solves: 33,
    lastSolve: "12m ago",
    breakdown: [
      { category: "Forensics", solves: 14, points: 2100 },
      { category: "Web", solves: 8, points: 1680 },
      { category: "Crypto", solves: 6, points: 1500 },
      { category: "OSINT", solves: 5, points: 1700 },
    ],
  },
  {
    name: "rev_or_die",
    division: "Pro",
    score: 6540,
    solves: 29,
    lastSolve: "8m ago",
    breakdown: [
      { category: "Reverse", solves: 13, points: 3100 },
      { category: "Pwn", solves: 8, points: 2040 },
      { category: "Misc", solves: 8, points: 1400 },
    ],
  },
  {
    name: "Caffeine Overflow",
    division: "Students",
    score: 5870,
    solves: 27,
    lastSolve: "3m ago",
    breakdown: [
      { category: "Web", solves: 9, points: 1900 },
      { category: "Crypto", solves: 7, points: 1620 },
      { category: "Forensics", solves: 6, points: 1050 },
      { category: "OSINT", solves: 5, points: 1300 },
    ],
  },
  {
    name: "The Flagrants",
    division: "Open",
    score: 5210,
    solves: 24,
    lastSolve: "21m ago",
    breakdown: [
      { category: "Web", solves: 8, points: 1700 },
      { category: "Misc", solves: 9, points: 1810 },
      { category: "Crypto", solves: 7, points: 1700 },
    ],
  },
  {
    name: "packet_pushers",
    division: "Students",
    score: 4680,
    solves: 22,
    lastSolve: "15m ago",
    breakdown: [
      { category: "Forensics", solves: 10, points: 1600 },
      { category: "Web", solves: 6, points: 1280 },
      { category: "OSINT", solves: 6, points: 1800 },
    ],
  },
  {
    name: "Heap of Trouble",
    division: "Pro",
    score: 4120,
    solves: 19,
    lastSolve: "33m ago",
    breakdown: [
      { category: "Pwn", solves: 9, points: 2500 },
      { category: "Reverse", solves: 6, points: 1120 },
      { category: "Misc", solves: 4, points: 500 },
    ],
  },
  {
    name: "Script Kiddos",
    division: "Students",
    score: 3340,
    solves: 16,
    lastSolve: "41m ago",
    breakdown: [
      { category: "Web", solves: 7, points: 1340 },
      { category: "OSINT", solves: 5, points: 1200 },
      { category: "Misc", solves: 4, points: 800 },
    ],
  },
];

/** Returns teams sorted by score, with a 1-based rank attached. */
export async function getLeaderboard(): Promise<(Team & { rank: number })[]> {
  // When wiring a real source, fetch + map here; the rest of the app is agnostic.
  return [...TEAMS]
    .sort((a, b) => b.score - a.score)
    .map((team, i) => ({ ...team, rank: i + 1 }));
}
