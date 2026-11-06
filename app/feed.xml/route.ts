import { absoluteUrl, site } from "@/lib/site";
import { getStories, storyDateTime } from "@/lib/stories";

export async function GET() {
  const stories = await getStories();
  const items = stories
    .map(
      (story) => `  <item>
    <title>${xml(story.title)}</title>
    <link>${xml(absoluteUrl(`/stories/${story.slug}`))}</link>
    <guid>${xml(absoluteUrl(`/stories/${story.slug}`))}</guid>
    <pubDate>${new Date(storyDateTime(story.publishedAt)).toUTCString()}</pubDate>
    <description>${xml(story.summary)}</description>
    <source url="${xml(story.sourceUrl)}">${xml(story.sourceName)}</source>
  </item>`,
    )
    .join("\n");

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${xml(site.name)}</title>
    <link>${xml(absoluteUrl("/"))}</link>
    <description>${xml(site.description)}</description>
    <language>en-gb</language>
${items}
  </channel>
</rss>
`;

  return new Response(body, {
    headers: {
      "content-type": "application/rss+xml; charset=utf-8",
      "cache-control": "public, max-age=300",
    },
  });
}

function xml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
