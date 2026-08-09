// Banner explaining that the active leaderboard source is illustrative mock
// data. Only rendered while LEADERBOARD_SOURCE=mock — see getLeaderboardSourceMode.

import EventCountdown from "./event-countdown";
import { currentEventPhase } from "@/lib/event-phase";

export default function MockDataNotice() {
  // Once the event is over, "this board switches over when the CTF opens" is
  // a promise about a moment that has already passed — say what's true now.
  if (currentEventPhase() === "over") {
    return (
      <div className="ds-card rounded-lg border border-[#d4a017]/30 bg-[#d4a017]/[0.06] p-5">
        <p className="text-xs font-medium uppercase tracking-wider text-[#d4a017]">Mock data</p>
        <p className="mt-1 max-w-xl text-sm leading-relaxed text-zinc-300">
          The CTF has ended, but this board is still pointed at illustrative placeholder data —
          these are not real contestant results and not the final standings.
        </p>
      </div>
    );
  }

  return (
    <div className="ds-card flex flex-col gap-4 rounded-lg border border-[#d4a017]/30 bg-[#d4a017]/[0.06] p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="max-w-xl">
        <p className="text-xs font-medium uppercase tracking-wider text-[#d4a017]">
          Mock data
        </p>
        <p className="mt-1 text-sm leading-relaxed text-zinc-300">
          The standings below are illustrative placeholder data, not real contestant results.
          Once the CTF opens and the first patches land, this board switches over to live scores.
        </p>
      </div>
      <EventCountdown variant="compact" hideWhenComplete />
    </div>
  );
}
