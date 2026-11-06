import { absoluteUrl, site } from "@/lib/site";
import { getStories } from "@/lib/stories";

export async function GET() {
  const stories = await getStories();
  const lines = [
    `# ${site.name}`,
    "",
    `> ${site.dek}`,
    "",
    site.description,
    "",
    "Each story is an original headline and a short summary. The reporting stays at the linked source. Figures are quoted as the source worded them and are not independently verified.",
    "",
    `- Desk: ${absoluteUrl("/")}`,
    `- About: ${absoluteUrl("/about")}`,
    `- Feed: ${absoluteUrl("/feed.xml")}`,
    `- Sitemap: ${absoluteUrl("/sitemap.xml")}`,
    "",
    "## Stories",
    "",
    ...stories.map(
      (story) =>
        `- [${story.title}](${absoluteUrl(`/stories/${story.slug}`)}): ${story.summary} Source: ${story.sourceName}, ${story.sourceUrl}`,
    ),
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=300",
    },
  });
}
