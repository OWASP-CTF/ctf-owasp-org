// Where we are in the event's life, derived purely from the clock.
//
// Several places need to agree on this: the countdown re-evaluates it every
// second in the browser, while the challenges and leaderboard notices are
// server-rendered and evaluate it once per render. Keeping the rule pure (and
// the boundaries in one place) means they can't drift apart — a notice saying
// "when the event starts" while the countdown says the event is over.
//
// Server-side callers are as fresh as their page: the leaderboard is dynamic
// (it reads headers for the session) so it re-evaluates per request; the
// challenges page is ISR with a 300s revalidate, so it can lag a phase change
// by at most five minutes. Both are fine for copy that changes twice, ever.

import { event } from "./site";

export type EventPhase = "before" | "live" | "over";

export const CTF_STARTS_MS = new Date(event.ctfStartsAt).getTime();
export const CTF_ENDS_MS = new Date(event.ctfEndsAt).getTime();

/** Phase at a given instant. The start instant reads as live (the countdown
 *  hits zero there) and the end instant reads as over. */
export function getEventPhase(nowMs: number): EventPhase {
  if (nowMs < CTF_STARTS_MS) return "before";
  return nowMs < CTF_ENDS_MS ? "live" : "over";
}

/** Phase right now. The clock read lives here rather than in the Server
 *  Components that need it, so `Date.now()` never appears in a render body —
 *  React's purity lint rejects that, and rightly: on the client it would be a
 *  value that changes without a re-render. Server renders have no such
 *  problem, and the pages using this re-render often enough to stay honest. */
export function currentEventPhase(): EventPhase {
  return getEventPhase(Date.now());
}
