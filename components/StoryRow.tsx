import Link from "next/link";
import { OriginalLink } from "@/components/OriginalLink";
import { StoryLabels } from "@/components/StoryLabels";
import { formatStoryDate, type Story } from "@/lib/stories";

export function StoryRow({ story }: { story: Story }) {
  return (
    <article className="border-t border-line py-8">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-xs uppercase tracking-[0.14em] text-muted">
        <StoryLabels story={story} />
        <time dateTime={story.publishedAt}>{formatStoryDate(story.publishedAt)}</time>
      </div>
      <p className="mt-4 text-sm text-accent">{story.companies.join(", ")}</p>
      <h2 className="mt-1 font-serif text-2xl leading-snug tracking-tight text-ink sm:text-3xl">
        <Link href={`/stories/${story.slug}`} className="block hover:text-accent">
          {story.title}
        </Link>
      </h2>
      <p className="mt-3 max-w-2xl text-base leading-7 text-ink/90">{story.summary}</p>
      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
        <OriginalLink href={story.sourceUrl} sourceName={story.sourceName} />
        <Link
          href={`/stories/${story.slug}`}
          className="text-sm text-ink underline decoration-line underline-offset-4 hover:decoration-accent"
        >
          Context
        </Link>
      </div>
    </article>
  );
}
