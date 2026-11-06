import type { Story } from "@/lib/stories";
import { impactLabels, linkTypeLabels } from "@/lib/taxonomy";

export function StoryLabels({
  story,
  className,
}: {
  story: Pick<Story, "impact" | "linkType">;
  className?: string;
}) {
  const impactLabel = impactLabels[story.impact];
  const linkLabel = linkTypeLabels[story.linkType];

  return (
    <p className={className}>
      <span>{impactLabel}</span>
      {impactLabel === linkLabel ? null : (
        <>
          <span aria-hidden="true"> · </span>
          <span>{linkLabel}</span>
        </>
      )}
    </p>
  );
}
