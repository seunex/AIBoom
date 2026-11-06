"use client";

import { useState } from "react";

export function ShareBar({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const shareUrl = encodeURIComponent(url);
  const shareTitle = encodeURIComponent(title);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="mt-6 flex flex-wrap items-center gap-2">
      <p className="mr-1 text-xs uppercase tracking-[0.16em] text-muted">Share</p>
      <ShareLink
        href={`https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareTitle}`}
        label="Share on X"
      >
        <XIcon />
      </ShareLink>
      <ShareLink
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`}
        label="Share on LinkedIn"
      >
        <LinkedInIcon />
      </ShareLink>
      <ShareLink
        href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
        label="Share on Facebook"
      >
        <FacebookIcon />
      </ShareLink>
      <ShareLink
        href={`mailto:?subject=${shareTitle}&body=${encodeURIComponent(`${title}\n${url}`)}`}
        label="Share by email"
      >
        <MailIcon />
      </ShareLink>
      <button
        type="button"
        onClick={copyLink}
        aria-label={copied ? "Link copied" : "Copy link"}
        className="inline-flex h-9 w-9 items-center justify-center border border-line text-ink hover:border-accent hover:text-accent"
      >
        <LinkIcon />
      </button>
      {copied ? <span className="text-sm text-muted">Copied</span> : null}
    </div>
  );
}

function ShareLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="inline-flex h-9 w-9 items-center justify-center border border-line text-ink hover:border-accent hover:text-accent"
    >
      {children}
    </a>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="currentColor">
      <path d="M14.6 10.4 21.7 2h-1.7l-6.1 7.1L8.8 2H2.3l7.4 10.8L2.3 22h1.7l6.5-7.5L15.2 22h6.5l-7.1-11.6Zm-2.3 2.7-.8-1.1-6-8.6h2.6l4.8 6.9.8 1.1 6.3 9h-2.6l-5.1-7.3Z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="currentColor">
      <path d="M6.5 9.2H3.7V20h2.8V9.2ZM5.1 3.8A1.7 1.7 0 1 0 5.1 7a1.7 1.7 0 0 0 0-3.2ZM20.3 20h-2.8v-5.6c0-1.6-.6-2.6-2-2.6-1 0-1.6.7-1.9 1.4-.1.2-.1.6-.1.9V20H10.7s.1-9.3 0-10.8h2.8v1.8c.4-.6 1.1-1.5 2.8-1.5 2 0 3.6 1.3 3.6 4.2V20Z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="currentColor">
      <path d="M14.2 20v-7.1h2.4l.4-2.8h-2.8V8.4c0-.8.2-1.4 1.4-1.4H17V4.5c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2h-2.5v2.8H11V20h3.2Z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none">
      <rect x="3.5" y="5.5" width="17" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
      <path d="m4.5 7 7.5 6L19.5 7" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none">
      <path
        d="M10 13.5a4 4 0 0 0 5.7.4l2.3-2.3a4 4 0 0 0-5.7-5.6l-1.2 1.2"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M14 10.5a4 4 0 0 0-5.7-.4l-2.3 2.3a4 4 0 0 0 5.7 5.6l1.1-1.1"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}
