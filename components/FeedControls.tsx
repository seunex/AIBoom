"use client";

import { useState } from "react";

export function FeedControls({
  active,
  label,
  search,
  filters,
}: {
  active: boolean;
  label: React.ReactNode;
  search: React.ReactNode;
  filters: React.ReactNode;
}) {
  const [open, setOpen] = useState(active);

  return (
    <>
      <div className="flex w-full flex-wrap items-center gap-2">
        {label}
        <button
          type="button"
          className={
            active
              ? "ml-auto inline-flex h-10 w-10 items-center justify-center border border-accent text-accent hover:bg-ink hover:text-paper md:ml-0 md:hidden"
              : "ml-auto inline-flex h-10 w-10 items-center justify-center border border-line text-ink hover:border-accent md:ml-0 md:hidden"
          }
          aria-expanded={open}
          aria-controls="story-filters"
          aria-label={open ? "Hide story filters" : "Show story filters"}
          onClick={() => setOpen((value) => !value)}
        >
          <FilterIcon />
        </button>
        {search}
      </div>
      <div id="story-filters" className={open ? "mt-4" : "mt-4 hidden md:block"}>
        {filters}
      </div>
    </>
  );
}

function FilterIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none">
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <circle cx="9" cy="7" r="2.1" fill="currentColor" />
      <circle cx="15" cy="12" r="2.1" fill="currentColor" />
      <circle cx="8" cy="17" r="2.1" fill="currentColor" />
    </svg>
  );
}
