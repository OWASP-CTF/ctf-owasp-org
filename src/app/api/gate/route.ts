import { NextResponse, type NextRequest } from "next/server";
import { GATE_COOKIE, GATE_COOKIE_MAX_AGE, isGateActive, signGateCookie, verifyGatePassword } from "@/lib/gate";
import { clearGateThrottle, gateLockRemainingSeconds, getGateThrottle, recordGateFailure } from "@/lib/dynamo-gate-store";

/** Unlocks the pre-event challenges gate. The password only ever exists
 *  server-side; the per-IP throttle is checked BEFORE the compare, so a locked
 *  client can neither guess nor extend its own lock. Success answers with the
 *  signed unlock cookie the proxy checks. */
export async function POST(request: NextRequest) {
  if (!isGateActive()) return NextResponse.json({ error: "not found" }, { status: 404 });

  // Vercel sets x-forwarded-for at its edge, so the first value is trustworthy
  // there; locally it is absent and everyone shares the "unknown" bucket.
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  const body = await request.json().catch(() => ({}));
  const password = typeof body.password === "string" ? body.password : "";
  if (!password) return NextResponse.json({ error: "Password is required" }, { status: 400 });

  const now = Date.now();
  let throttle;
  try {
    throttle = await getGateThrottle(ip);
  } catch (err) {
    // Fail closed: with the throttle unreadable, nobody gets to guess.
    console.error(`[gate] throttle read failed: ${(err as Error).message}`);
    return NextResponse.json({ error: "Try again later" }, { status: 500 });
  }

  const lockedFor = gateLockRemainingSeconds(throttle, now);
  if (lockedFor > 0) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(lockedFor) } },
    );
  }

  if (!verifyGatePassword(password)) {
    try {
      await recordGateFailure(ip, throttle, now);
    } catch (err) {
      // The failed attempt still gets its 401 even if the bookkeeping write
      // fails; the next read will just see one fewer failure.
      console.error(`[gate] throttle write failed: ${(err as Error).message}`);
    }
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  await clearGateThrottle(ip);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(GATE_COOKIE, signGateCookie(now + GATE_COOKIE_MAX_AGE * 1000), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: GATE_COOKIE_MAX_AGE,
  });
  return res;
}
