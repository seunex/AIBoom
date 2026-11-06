import Link from "next/link";
import { DigestPrompt } from "@/components/DigestPrompt";
import { site } from "@/lib/site";

export function SiteFrame({
  isHome = false,
  children,
}: {
  isHome?: boolean;
  children: React.ReactNode;
}) {
  const Name = isHome ? "h1" : "p";

  return (
    <>
      <header className="bg-mast text-paper">
        <div className="mx-auto w-full max-w-3xl px-6 py-8 sm:py-12">
          <div className="flex items-baseline justify-between gap-6">
            <Name className="font-serif text-4xl tracking-tight sm:text-5xl">
              <Link href="/" className="text-paper hover:text-glow">
                {site.name}
              </Link>
            </Name>
            <nav aria-label="Site">
              <Link
                href="/about"
                className="text-sm uppercase tracking-[0.16em] text-glow hover:text-paper"
              >
                About
              </Link>
            </nav>
          </div>
          <p className="mt-4 max-w-xl font-serif text-xl leading-snug text-paper/80 sm:text-2xl">
            {site.dek}
          </p>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 pt-8 pb-16">
        {children}
      </main>
      <footer className="mx-auto w-full max-w-3xl px-6 pb-12 text-sm leading-6 text-muted">
        <p>
          Figures appear as the source worded them. Downstream keeps each
          number with its story.
        </p>
        <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1">
          <Link
            href="/about"
            className="underline decoration-line underline-offset-4 hover:decoration-accent"
          >
            How this desk works
          </Link>
          <a
            href="/feed.xml"
            className="underline decoration-line underline-offset-4 hover:decoration-accent"
          >
            Story feed
          </a>
        </p>
        <DigestPrompt />
      </footer>
    </>
  );
}
