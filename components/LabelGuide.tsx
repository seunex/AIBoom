import {
  impactDescriptions,
  impactLabels,
  impacts,
  linkTypeDescriptions,
  linkTypeLabels,
  linkTypes,
} from "@/lib/taxonomy";

export function LabelGuide({ open = false }: { open?: boolean }) {
  const content = (
    <div className="grid gap-8 sm:grid-cols-2">
      <DescriptionList
        title="What happened"
        items={impacts.map((impact) => ({
          term: impactLabels[impact],
          detail: impactDescriptions[impact],
        }))}
      />
      <DescriptionList
        title="How AI was linked"
        items={linkTypes.map((linkType) => ({
          term: linkTypeLabels[linkType],
          detail: linkTypeDescriptions[linkType],
        }))}
      />
    </div>
  );

  if (open) return content;

  return (
    <details className="text-sm leading-6 text-muted">
      <summary className="cursor-pointer text-ink">How to read a label</summary>
      <div className="pt-4">{content}</div>
    </details>
  );
}

function DescriptionList({
  title,
  items,
}: {
  title: string;
  items: { term: string; detail: string }[];
}) {
  return (
    <div>
      <h3 className="text-xs uppercase tracking-[0.16em] text-muted">{title}</h3>
      <dl className="mt-3 space-y-3">
        {items.map((item) => (
          <div key={item.term}>
            <dt className="text-ink">{item.term}</dt>
            <dd>{item.detail}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
