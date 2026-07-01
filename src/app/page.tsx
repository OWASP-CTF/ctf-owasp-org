import Image from "next/image";

export default function Home() {
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-[#1a1a2e]">
      {/* Subtle scanline overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-10 opacity-[0.03]"
        style={{
          background:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.05) 2px, rgba(255,255,255,0.05) 4px)",
        }}
      />

      {/* Slow scanline bar */}
      <div
        className="pointer-events-none absolute inset-x-0 z-10 h-[1px] bg-white/[0.04]"
        style={{ animation: "scanline 10s linear infinite" }}
      />

      {/* Content */}
      <main className="relative z-20 flex flex-col items-center gap-10 px-6 text-center">
        {/* OWASP Logo */}
        <Image
          src="/owasp-logo.png"
          alt="OWASP"
          width={280}
          height={97}
          priority
          className="invert"
        />

        {/* DEF CON 34 icon row - security themed, matching DC34 colorful circle style */}
        <div className="flex items-center gap-4">
          {/* Clock / Time - red */}
          <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#e53e3e] text-[#e53e3e]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          </div>
          {/* Shield - yellow */}
          <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#d4a017] text-[#d4a017]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          {/* Lock - blue */}
          <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#2563eb] text-[#2563eb]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          {/* People - teal */}
          <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#14b8a6] text-[#14b8a6]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <div className="flex flex-col items-center gap-3">
          <h1
            className="text-5xl font-bold tracking-tight text-white sm:text-7xl"
            style={{ animation: "pulse-glow 4s ease-in-out infinite" }}
          >
            CTF <span className="text-[#2563eb]">@</span> DEF CON 34
          </h1>
          <p className="text-lg font-medium uppercase tracking-[0.25em] text-[#14b8a6]">
            Capture The Flag
          </p>
        </div>

        {/* Theme badge */}
        <div className="rounded-md border border-white/10 bg-white/[0.03] px-5 py-2.5">
          <span className="text-sm text-zinc-500">DC34 Theme:</span>{" "}
          <span className="font-semibold text-[#2563eb]">Agency</span>
        </div>

        {/* Gradient divider */}
        <div className="h-px w-64 bg-gradient-to-r from-transparent via-[#2563eb]/40 to-transparent" />

        {/* Coming soon */}
        <div className="flex flex-col items-center gap-4">
          <span
            className="text-3xl font-bold tracking-widest text-white uppercase"
            style={{ animation: "float 3s ease-in-out infinite" }}
          >
            Coming Soon
          </span>
          <div className="flex items-center gap-3 text-sm text-zinc-400">
            <span>August 6&ndash;9, 2026</span>
            <span className="text-zinc-600">&middot;</span>
            <span>Las Vegas Convention Center</span>
          </div>
        </div>

        {/* Terminal prompt */}
        <div className="mt-6 rounded-lg border border-white/[0.06] bg-[#12121e] px-6 py-3.5 font-mono text-sm text-zinc-500">
          <span className="text-[#22c55e]">$</span>{" "}
          <span className="text-zinc-400">owasp-ctf</span> init --theme agency
          <span
            className="ml-1 inline-block w-2 bg-[#2563eb]"
            style={{ animation: "blink 1s step-end infinite" }}
          >
            &nbsp;
          </span>
        </div>
      </main>

      {/* Bottom accent */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#2563eb]/20 to-transparent" />
    </div>
  );
}
