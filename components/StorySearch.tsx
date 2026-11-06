"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { feedHref } from "@/lib/links";

export function StorySearch({
  query,
  impact,
  industry,
}: {
  query?: string;
  impact?: string;
  industry?: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(Boolean(query));

  function openSearch() {
    setOpen(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function closeSearch() {
    setOpen(false);
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const q = String(data.get("q") || "").trim();
    router.push(feedHref({ impact, industry, q: q || undefined }));
  }

  if (!open) {
    return (
      <div className="shrink-0">
        <button
          type="button"
          onClick={openSearch}
          aria-label={query ? `Search stories, current search ${query}` : "Search stories"}
          aria-expanded="false"
          className={
            query
              ? "inline-flex h-10 w-10 items-center justify-center border border-accent text-accent hover:bg-ink hover:text-paper"
              : "inline-flex h-10 w-10 items-center justify-center border border-line text-ink hover:border-accent"
          }
        >
          <SearchIcon />
        </button>
      </div>
    );
  }

  return (
    <form
      action="/"
      method="get"
      role="search"
      onSubmit={onSubmit}
      className="flex w-full basis-full gap-2"
    >
      {impact ? <input type="hidden" name="impact" value={impact} /> : null}
      {industry ? <input type="hidden" name="industry" value={industry} /> : null}
      <label className="sr-only" htmlFor="story-search">
        Search stories
      </label>
      <input
        ref={inputRef}
        id="story-search"
        name="q"
        defaultValue={query ?? ""}
        placeholder="Search companies, outlets, headlines"
        onKeyDown={(event) => {
          if (event.key === "Escape") closeSearch();
        }}
        className="min-w-0 flex-1 border border-line bg-white px-3 py-2 text-base text-ink outline-none placeholder:text-muted focus:border-accent"
      />
      <button
        type="submit"
        aria-label="Search stories"
        className="inline-flex h-10 w-10 items-center justify-center bg-ink text-paper hover:bg-accent"
      >
        <SearchIcon />
      </button>
      <button
        type="button"
        onClick={closeSearch}
        aria-label="Close search"
        className="inline-flex h-10 w-10 items-center justify-center border border-line text-ink hover:border-accent"
      >
        <CloseIcon />
      </button>
    </form>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none">
      <circle cx="11" cy="11" r="6.25" stroke="currentColor" strokeWidth="1.75" />
      <path d="M16 16.5 20 20.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none">
      <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}
