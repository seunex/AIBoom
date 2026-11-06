import { ImageResponse } from "next/og";
import { getStory } from "@/lib/stories";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Downstream story";

export default async function Image({ params }: PageProps<"/stories/[slug]">) {
  const { slug } = await params;
  const story = await getStory(slug);
  const title = story?.title ?? "Downstream";
  const kicker = story
    ? `${story.companies.join(", ")} · ${story.sourceName}`
    : "Downstream";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#10211e",
          color: "#f3f7f6",
          padding: "72px",
        }}
      >
        <div style={{ fontSize: 28, letterSpacing: 6, color: "#9ed9d2" }}>DOWNSTREAM</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 24, color: "#9ed9d2", marginBottom: 24 }}>{kicker}</div>
          <div style={{ fontSize: 56, lineHeight: 1.15, maxWidth: 1000 }}>{title}</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
