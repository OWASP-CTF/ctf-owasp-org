// Pins the sign-in registration hook in lib/auth.ts: a completed GitHub
// callback records the contestant, and NOTHING else does — other endpoints,
// failed callbacks (no newSession), and sessions without a usable login must
// all stay silent.
//
// The hook is invoked directly: better-call middleware accepts a plain
// { path, context } input (createInternalContext passes both through), which
// is exactly the shape dispatchAuthEndpoint hands to after-hooks.

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.hoisted(() => {
  // betterAuth() runs at import time and warns on a weak secret. Only fills
  // gaps, so a real .env.local still wins locally.
  process.env.BETTER_AUTH_URL ??= "http://localhost:3000";
  process.env.BETTER_AUTH_SECRET ??= "0123456789abcdef0123456789abcdef";
  process.env.GITHUB_CLIENT_ID ??= "test-client-id";
  process.env.GITHUB_CLIENT_SECRET ??= "test-client-secret";
});

const mocks = vi.hoisted(() => ({
  recordContestant: vi.fn<(login: string) => Promise<void>>(),
}));

// Replaces the whole module, so its server-only/AWS import graph never loads.
// vi.mock also intercepts the hook's dynamic import().
vi.mock("@/lib/registration-store", () => ({ recordContestant: mocks.recordContestant }));

import { auth } from "@/lib/auth";

type HookInput = { path: string; context: Record<string, unknown> };
const afterHook = auth.options.hooks?.after as unknown as (ctx: HookInput) => Promise<unknown>;

const callbackCtx = (newSession: unknown): HookInput => ({
  path: "/callback/:id",
  context: { newSession },
});

beforeEach(() => {
  vi.clearAllMocks();
  mocks.recordContestant.mockResolvedValue(undefined);
});

describe("sign-in registration hook", () => {
  it("is registered", () => {
    expect(typeof afterHook).toBe("function");
  });

  it("records the contestant when the OAuth callback minted a session", async () => {
    await afterHook(callbackCtx({ user: { login: "octocat" } }));

    expect(mocks.recordContestant).toHaveBeenCalledExactlyOnceWith("octocat");
  });

  it("ignores every other endpoint, even with a fresh session present", async () => {
    await afterHook({ path: "/get-session", context: { newSession: { user: { login: "octocat" } } } });

    expect(mocks.recordContestant).not.toHaveBeenCalled();
  });

  it("ignores failed callbacks (error redirects never set newSession)", async () => {
    await afterHook(callbackCtx(null));

    expect(mocks.recordContestant).not.toHaveBeenCalled();
  });

  it("ignores sessions without a usable login", async () => {
    await afterHook(callbackCtx({ user: {} }));
    await afterHook(callbackCtx({ user: { login: "" } }));
    await afterHook(callbackCtx({ user: { login: 42 } }));

    expect(mocks.recordContestant).not.toHaveBeenCalled();
  });
});
