"use client";

// Team join/create/leave control on the profile page. Currently backed by a
// per-browser mock cookie (see src/lib/team-store.ts) — fully demoable, but
// not shared across contestants until a write-enabled Upstash token exists.

import { useRouter } from "next/navigation";
import { useState } from "react";

async function postTeam(path: string, body?: Record<string, string>) {
  const res = await fetch(`/api/team${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) throw new Error(data.error ?? "Request failed");
}

export default function TeamCard({
  team,
  writesEnabled,
}: {
  team: string | null;
  writesEnabled: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"create" | "join">("join");
  const [value, setValue] = useState("");

  const run = async (fn: () => Promise<void>) => {
    setPending(true);
    setError(null);
    try {
      await fn();
      setValue("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="ds-card rounded-lg border border-white/[0.06] bg-[#16162a] p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Team</h2>
        {!writesEnabled && (
          <span className="rounded border border-[#d4a017]/40 bg-[#d4a017]/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-[#d4a017]">
            mock mode
          </span>
        )}
      </div>

      {team ? (
        <div className="mt-3 flex items-center justify-between">
          <p className="font-mono text-white">{team}</p>
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => postTeam("/leave"))}
            className="rounded-md border border-white/10 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:border-[#e53e3e]/50 hover:text-white disabled:opacity-50"
          >
            Leave team
          </button>
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          <div className="flex gap-2 text-xs">
            <button
              type="button"
              onClick={() => setMode("join")}
              className={`rounded-full border px-2.5 py-0.5 ${mode === "join" ? "border-[#2563eb] text-[#2563eb]" : "border-white/10 text-zinc-400"}`}
            >
              Join
            </button>
            <button
              type="button"
              onClick={() => setMode("create")}
              className={`rounded-full border px-2.5 py-0.5 ${mode === "create" ? "border-[#2563eb] text-[#2563eb]" : "border-white/10 text-zinc-400"}`}
            >
              Create
            </button>
          </div>
          <div className="flex gap-2">
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={mode === "join" ? "team slug" : "team name"}
              className="w-full rounded-md border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm text-white placeholder:text-zinc-500 focus-visible:border-[#2563eb]/60 focus-visible:outline-none"
            />
            <button
              type="button"
              disabled={pending || !value.trim()}
              onClick={() =>
                run(() =>
                  mode === "join" ? postTeam("/join", { slug: value }) : postTeam("", { name: value }),
                )
              }
              className="flex-none rounded-md bg-[#2563eb] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#2563eb]/90 disabled:opacity-50"
            >
              {mode === "join" ? "Join" : "Create"}
            </button>
          </div>
        </div>
      )}

      {error && <p className="mt-2 text-xs text-[#e53e3e]">{error}</p>}
    </div>
  );
}
