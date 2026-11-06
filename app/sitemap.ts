import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";
import { getStories, storyDateTime } from "@/lib/stories";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const stories = await getStories();

  return [
    {
      url: absoluteUrl("/"),
      changeFrequency: "hourly",
      priority: 1,
    },
    {
      url: absoluteUrl("/about"),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: absoluteUrl("/feed.xml"),
      changeFrequency: "hourly",
      priority: 0.5,
    },
    ...stories.map((story) => ({
      url: absoluteUrl(`/stories/${story.slug}`),
      lastModified: storyDateTime(story.publishedAt),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
