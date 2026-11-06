import Link from "next/link";
import { feedHref } from "@/lib/stories";
import {
  impactLabels,
  impacts,
  type Impact,
} from "@/lib/taxonomy";

export function FilterBar({
  impact,
  industry,
  industries,
  query,
}: {
  impact?: Impact;
  industry?: string;
  industries: string[];
  query?: string;
}) {
  const q = query;
  return (
    <div className="space-y-3">
      <FilterGroup label="Impact">
        <FilterChip href={feedHref({ industry, q })} active={!impact}>
          All
        </FilterChip>
        {impacts.map((item) => (
          <FilterChip
            key={item}
            href={feedHref({ impact: item, industry, q })}
            active={impact === item}
          >
            {impactLabels[item]}
          </FilterChip>
        ))}
      </FilterGroup>
      <FilterGroup label="Industry">
        <FilterChip href={feedHref({ impact, q })} active={!industry}>
          All
        </FilterChip>
        {industries.map((item) => (
          <FilterChip
            key={item}
            href={feedHref({ impact, industry: item, q })}
            active={industry === item}
          >
            {item}
          </FilterChip>
        ))}
      </FilterGroup>
    </div>
  );
}

function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
      <p className="w-20 shrink-0 pt-1.5 text-xs uppercase tracking-[0.14em] text-muted">{label}</p>
      <div className="flex min-w-0 flex-1 flex-wrap gap-2" role="group" aria-label={label}>
        {children}
      </div>
    </div>
  );
}

function FilterChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={
        active
          ? "rounded-full border border-ink bg-ink px-3 py-1 text-sm text-paper"
          : "rounded-full border border-line bg-transparent px-3 py-1 text-sm text-ink hover:border-accent"
      }
    >
      {children}
    </Link>
  );
}
