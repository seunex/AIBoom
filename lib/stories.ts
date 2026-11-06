import { cacheLife } from "next/cache";
import { z } from "zod";
import { listStories } from "@/lib/db.mjs";
import {
  impacts,
  isImpact,
  linkTypes,
  type Impact,
  type LinkType,
} from "@/lib/taxonomy";

export { feedHref } from "@/lib/links";

const storySchema = z
  .object({
    title: z.string().trim().min(1),
    summary: z.string().trim().min(1),
    quote: z.string().trim().min(1).optional(),
    quoteAttribution: z.string().trim().min(1).optional(),
    sourceName: z.string().trim().min(1),
    sourceHeadline: z.string().trim().min(1),
    sourceUrl: z.string().trim().url(),
    sourceAuthor: z.string().trim().min(1).optional(),
    publishedAt: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z)?$/),
    companies: z.array(z.string().trim().min(1)).min(1),
    industries: z.array(z.string().trim().min(1)).min(1),
    impact: z.enum(impacts),
    linkType: z.enum(linkTypes),
    figure: z.string().trim().min(1).optional(),
  })
  .superRefine((story, ctx) => {
    if (story.quote && !story.quoteAttribution) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["quoteAttribution"],
        message: "Add quoteAttribution when a story includes a quote.",
      });
    }

    if (!story.quote) return;

    const words = story.quote.split(/\s+/).filter(Boolean).length;
    if (words > 40) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["quote"],
        message: `Quote is ${words} words. Keep it to about 40.`,
      });
    }
  });

export type Story = z.infer<typeof storySchema> & { slug: string };

function readStories(): Story[] {
  return listStories().map((story) => {
    const parsed = storySchema.safeParse(story);
    if (!parsed.success) {
      const details = parsed.error.issues
        .map((issue) => `${issue.path.join(".") || "story"}: ${issue.message}`)
        .join("; ");
      throw new Error(`Invalid story ${story.slug}: ${details}`);
    }
    return { ...parsed.data, slug: story.slug };
  });
}

export async function getStories(): Promise<Story[]> {
  "use cache";
  cacheLife("minutes");
  return readStories();
}

export async function getStory(slug: string) {
  const stories = await getStories();
  return stories.find((story) => story.slug === slug);
}

export function industriesIn(stories: Story[]) {
  return [...new Set(stories.flatMap((story) => story.industries))].sort(
    (a, b) => a.localeCompare(b),
  );
}

export function filterStories(
  stories: Story[],
  impact: string | undefined,
  industry: string | undefined,
  query: string | undefined,
) {
  const activeImpact: Impact | undefined = isImpact(impact) ? impact : undefined;
  const knownIndustries = new Set(industriesIn(stories));
  const activeIndustry =
    industry && knownIndustries.has(industry) ? industry : undefined;
  const needle = query?.trim().toLowerCase() || undefined;

  const filtered = stories.filter((story) => {
    if (activeImpact && story.impact !== activeImpact) return false;
    if (activeIndustry && !story.industries.includes(activeIndustry)) {
      return false;
    }
    if (needle && !storyText(story).includes(needle)) return false;
    return true;
  });

  return {
    stories: filtered,
    impact: activeImpact,
    industry: activeIndustry,
    query: needle,
  };
}

function storyText(story: Story) {
  return [
    story.title,
    story.summary,
    story.quote,
    story.figure,
    story.sourceName,
    story.sourceHeadline,
    ...story.companies,
    ...story.industries,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function relatedStories(story: Story, stories: Story[]) {
  const others = stories.filter((item) => item.slug !== story.slug);
  const sameCompany = others.filter((item) =>
    item.companies.some((company) => story.companies.includes(company)),
  );
  const sameIndustry = others.filter(
    (item) =>
      !sameCompany.includes(item) &&
      item.industries.some((industry) => story.industries.includes(industry)),
  );
  return [...sameCompany, ...sameIndustry].slice(0, 3);
}

export function storyDateTime(isoDate: string) {
  return isoDate.length === 10 ? `${isoDate}T00:00:00.000Z` : isoDate;
}

export function formatStoryDate(isoDate: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(storyDateTime(isoDate)));
}

export const STORIES_PER_PAGE = 8;

export function storyCountLabel(count: number) {
  return count === 1 ? "1 story" : `${count} stories`;
}

export type { Impact, LinkType };
