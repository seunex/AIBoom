import Link from "next/link";
import { feedHref } from "@/lib/stories";

export function Pagination({
  page,
  totalPages,
  impact,
  industry,
  query,
}: {
  page: number;
  totalPages: number;
  impact?: string;
  industry?: string;
  query?: string;
}) {
  if (totalPages <= 1) return null;

  const href = (nextPage: number) =>
    feedHref({ impact, industry, q: query, page: nextPage });

  return (
    <nav aria-label="Stories pages" className="mt-8 flex flex-wrap items-center gap-2">
      {page > 1 ? (
        <Link href={href(page - 1)} className="border border-line px-3 py-1.5 text-sm hover:border-accent">
          Previous
        </Link>
      ) : (
        <span className="border border-line px-3 py-1.5 text-sm text-muted">Previous</span>
      )}
      {Array.from({ length: totalPages }, (_, index) => index + 1).map((number) => (
        <Link
          key={number}
          href={href(number)}
          aria-current={number === page ? "page" : undefined}
          className={
            number === page
              ? "bg-ink px-3 py-1.5 text-sm text-paper"
              : "border border-line px-3 py-1.5 text-sm hover:border-accent"
          }
        >
          {number}
        </Link>
      ))}
      {page < totalPages ? (
        <Link href={href(page + 1)} className="border border-line px-3 py-1.5 text-sm hover:border-accent">
          Next
        </Link>
      ) : (
        <span className="border border-line px-3 py-1.5 text-sm text-muted">Next</span>
      )}
    </nav>
  );
}
