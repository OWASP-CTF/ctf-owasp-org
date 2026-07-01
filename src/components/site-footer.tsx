// Footer shared by content routes. Plain Server Component — no interactivity.

import Link from "next/link";
import { event, navLinks } from "@/lib/site";

export default function SiteFooter() {
  return (
    <footer className="relative mt-auto border-t border-white/[0.06]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#2563eb]/20 to-transparent" />
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-mono text-sm text-white">
            <span className="text-[#22c55e]">$</span> owasp-ctf
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            {event.dates} · {event.location}
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-zinc-400 transition-colors hover:text-[#2563eb]"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
