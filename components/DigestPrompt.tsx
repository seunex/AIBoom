"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const storageKey = "downstream-digest-dismissed";

export function DigestPrompt() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (pathname.startsWith("/subscribe")) return;
    if (localStorage.getItem(storageKey) === "1") return;
    setVisible(true);
  }, [pathname]);

  if (!visible || pathname.startsWith("/subscribe")) return null;

  function dismiss() {
    localStorage.setItem(storageKey, "1");
    setVisible(false);
  }

  return (
    <aside
      aria-label="Daily digest"
      className="digest-rise fixed right-4 bottom-4 z-40 w-[min(22rem,calc(100vw-2rem))] overflow-hidden border border-line bg-white shadow-[0_18px_40px_rgba(16,33,30,0.16)] sm:right-6 sm:bottom-6"
    >
      <div className="flex items-center justify-between gap-3 bg-mast px-4 py-2.5 text-paper">
        <p className="text-[0.68rem] uppercase tracking-[0.16em] text-glow">Daily digest</p>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss daily digest"
          className="grid size-6 place-items-center text-lg leading-none text-glow hover:text-paper"
        >
          ×
        </button>
      </div>
      <form action="/subscribe" method="post" className="px-4 pt-4 pb-4">
        <p className="font-serif text-[1.45rem] leading-snug tracking-tight text-ink">
          The next story, before it slips past.
        </p>
        <p className="mt-2 text-sm leading-6 text-ink/80">
          One short note on the days the desk has something new: who was affected,
          what the source said, and the link to read it.
        </p>
        <label className="sr-only" htmlFor="digest-email">
          Email for the daily digest
        </label>
        <input
          id="digest-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="Email address"
          className="mt-4 w-full border border-line bg-paper px-3 py-2.5 text-base text-ink outline-none placeholder:text-muted focus:border-accent"
        />
        <button
          type="submit"
          className="mt-2 w-full bg-accent px-3 py-2.5 text-sm text-paper hover:bg-ink"
        >
          Send me the daily note
        </button>
        <p className="mt-3 text-xs leading-5 text-muted">
          Unsubscribe anytime. Every note has a one-click link, and quiet days send nothing.
        </p>
      </form>
    </aside>
  );
}
