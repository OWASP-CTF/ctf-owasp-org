import "server-only";
import { cookies } from "next/headers";

const MOCK_TEAM_COOKIE = "ctf-mock-team";

/**
 * Gate for real Upstash team writes. Requires a separate write token
 * (UPSTASH_REDIS_REST_WRITE_TOKEN — never the read-only token already in
 * use) that doesn't exist yet. Until it's provisioned, team actions persist
 * to a per-browser httpOnly cookie instead, so join/leave is fully demoable
 * against the mock leaderboard with zero backend.
 *
 * When enabled, this should pipeline against the v2 schema proposed for the
 * scorer (dc34-owasp-secure-development-ctf PR):
 *   HSET ctf:team:<slug> name <name> captain <login> createdAt <iso>
 *   SADD ctf:team:<slug>:members <login>
 *   HSET ctf:user:<login> team <slug>
 *   ZINCRBY ctf:lb:teams <memberTotal> <slug>
 * (join: same SADD/HSET/ZINCRBY without the team HSET; leave: SREM/HDEL/
 * negative ZINCRBY, deleting the team keys when membership hits zero.)
 */
export const TEAM_WRITES_ENABLED = process.env.TEAM_WRITES_ENABLED === "true";

export type TeamActionResult = { ok: true; team: string | null } | { ok: false; error: string };

function slugify(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

/** Reads the viewer's mock team override, if any. Only meaningful when the
 *  active LEADERBOARD_SOURCE is "mock" — it overlays the fixture data. */
export async function getMockTeamOverride(): Promise<string | null> {
  const store = await cookies();
  return store.get(MOCK_TEAM_COOKIE)?.value ?? null;
}

export async function createTeam(login: string, name: string): Promise<TeamActionResult> {
  void login;
  const slug = slugify(name);
  if (!slug) return { ok: false, error: "Team name is required" };
  if (TEAM_WRITES_ENABLED) return { ok: false, error: "Live team writes are not enabled yet" };

  const store = await cookies();
  store.set(MOCK_TEAM_COOKIE, slug, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
  return { ok: true, team: slug };
}

export async function joinTeam(login: string, slugInput: string): Promise<TeamActionResult> {
  void login;
  const slug = slugify(slugInput);
  if (!slug) return { ok: false, error: "Team is required" };
  if (TEAM_WRITES_ENABLED) return { ok: false, error: "Live team writes are not enabled yet" };

  const store = await cookies();
  store.set(MOCK_TEAM_COOKIE, slug, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
  return { ok: true, team: slug };
}

export async function leaveTeam(login: string): Promise<TeamActionResult> {
  void login;
  if (TEAM_WRITES_ENABLED) return { ok: false, error: "Live team writes are not enabled yet" };

  const store = await cookies();
  store.delete(MOCK_TEAM_COOKIE);
  return { ok: true, team: null };
}
