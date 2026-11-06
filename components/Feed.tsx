import { FilterBar } from "@/components/FilterBar";
import { LabelGuide } from "@/components/LabelGuide";
import { Pagination } from "@/components/Pagination";
import { StoryRow } from "@/components/StoryRow";
import { StorySearch } from "@/components/StorySearch";
import {
  STORIES_PER_PAGE,
  filterStories,
  getStories,
  industriesIn,
  storyCountLabel,
} from "@/lib/stories";

type SearchParams = Promise<{
  impact?: string | string[];
  industry?: string | string[];
  q?: string | string[];
  page?: string | string[];
}>;

export async function Feed({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const stories = await getStories();
  const filtered = filterStories(
    stories,
    firstParam(params.impact),
    firstParam(params.industry),
    firstParam(params.q),
  );
  const total = filtered.stories.length;
  const totalPages = Math.max(1, Math.ceil(total / STORIES_PER_PAGE));
  const requested = Number(firstParam(params.page) || "1");
  const page = Number.isFinite(requested)
    ? Math.min(Math.max(1, Math.floor(requested)), totalPages)
    : 1;
  const start = (page - 1) * STORIES_PER_PAGE;
  const visible = filtered.stories.slice(start, start + STORIES_PER_PAGE);

  return (
    <div className="mt-8 border-t border-line pt-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <LabelGuide />
        <StorySearch
          query={filtered.query}
          impact={filtered.impact}
          industry={filtered.industry}
        />
      </div>
      <div className="mt-4">
        <FilterBar
          impact={filtered.impact}
          industry={filtered.industry}
          industries={industriesIn(stories)}
          query={filtered.query}
        />
      </div>
      <p className="mt-4 text-sm text-muted">
        {total === 0
          ? "0 stories"
          : `${storyCountLabel(total)} · ${start + 1}–${start + visible.length}`}
      </p>
      {visible.length > 0 ? (
        <div className="mt-2">
          {visible.map((story) => (
            <StoryRow key={story.slug} story={story} />
          ))}
        </div>
      ) : (
        <p className="mt-8 border-t border-line py-8 text-base leading-7">
          {filtered.query
            ? "No stories match that search."
            : "No stories carry that combination yet."}
        </p>
      )}
      <Pagination
        page={page}
        totalPages={totalPages}
        impact={filtered.impact}
        industry={filtered.industry}
        query={filtered.query}
      />
    </div>
  );
}

export function FeedFallback() {
  return (
    <div className="mt-8 space-y-4 border-t border-line pt-4" aria-hidden="true">
      <div className="h-10 animate-pulse bg-line/70" />
      <div className="h-16 animate-pulse bg-line/70" />
      <div className="h-32 animate-pulse border-t border-line bg-line/50" />
      <div className="h-32 animate-pulse border-t border-line bg-line/50" />
    </div>
  );
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
