// The phase is the one clock-derived fact several places need to agree on:
// the countdown re-evaluates it every second in the browser, the challenges
// and leaderboard notices evaluate it once per server render. Keeping the
// rule pure means both read the same boundaries.

import { afterEach, describe, expect, it, vi } from "vitest";
import { CTF_ENDS_MS, CTF_STARTS_MS, currentEventPhase, getEventPhase } from "@/lib/event-phase";

const MINUTE = 60_000;

describe("getEventPhase", () => {
  it("is 'before' any time ahead of the start", () => {
    expect(getEventPhase(CTF_STARTS_MS - MINUTE)).toBe("before");
    expect(getEventPhase(0)).toBe("before");
  });

  it("is 'live' between the start and the end", () => {
    expect(getEventPhase(CTF_STARTS_MS + MINUTE)).toBe("live");
    expect(getEventPhase(CTF_ENDS_MS - MINUTE)).toBe("live");
  });

  it("is 'over' from the end onward", () => {
    expect(getEventPhase(CTF_ENDS_MS + MINUTE)).toBe("over");
    expect(getEventPhase(CTF_ENDS_MS + 365 * 24 * 60 * MINUTE)).toBe("over");
  });

  it("treats the start instant as live and the end instant as over", () => {
    // The countdown hits zero exactly at the start, so the start instant must
    // already read as live — otherwise there is a one-tick gap showing neither.
    expect(getEventPhase(CTF_STARTS_MS)).toBe("live");
    expect(getEventPhase(CTF_ENDS_MS)).toBe("over");
  });
});

describe("currentEventPhase", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("reads the system clock", () => {
    vi.useFakeTimers();

    vi.setSystemTime(CTF_STARTS_MS - MINUTE);
    expect(currentEventPhase()).toBe("before");

    vi.setSystemTime(CTF_STARTS_MS + MINUTE);
    expect(currentEventPhase()).toBe("live");

    vi.setSystemTime(CTF_ENDS_MS + MINUTE);
    expect(currentEventPhase()).toBe("over");
  });
});

describe("event boundaries", () => {
  it("parses both configured instants", () => {
    expect(Number.isNaN(CTF_STARTS_MS)).toBe(false);
    expect(Number.isNaN(CTF_ENDS_MS)).toBe(false);
  });

  it("ends after it starts", () => {
    expect(CTF_ENDS_MS).toBeGreaterThan(CTF_STARTS_MS);
  });
});
