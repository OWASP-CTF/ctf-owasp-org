"use client";

// Copy-to-clipboard for values a contestant would otherwise retype by hand.
// The source text stays selectable on the page, so a clipboard failure degrades
// to a manual copy rather than blocking the reader.

import { useEffect, useState } from "react";

export default function CopyButton({
  value,
  label = "Copy",
}: {
  value: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  // Reset the confirmation on a timer, cancelled on unmount so React is never
  // asked to update a component that has gone.
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      // Clipboard blocked — denied permission, or an insecure context. The
      // value is selectable right next to this button, so there is nothing
      // worth recovering here and nothing worth alarming the reader about.
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="flex-none rounded-md border border-white/10 bg-white/[0.03] px-3 py-1.5 font-mono text-xs text-zinc-300 transition-colors hover:border-white/20 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]"
    >
      {/* Live region so the confirmation is announced, not just seen. */}
      <span aria-live="polite">{copied ? "Copied" : label}</span>
    </button>
  );
}
