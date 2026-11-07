import { ImageResponse } from "next/og";
import { getStory } from "@/lib/stories";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Downstream story";

export default async function Image({ params }: PageProps<"/stories/[slug]">) {
  const { slug } = await params;
  const story = await getStory(slug);
  const title = story?.title ?? "Downstream";
  const kicker = story ? `${story.companies.join(", ")} · ${story.sourceName}` : "aiboom.news";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#10211e",
          color: "#f3f7f6",
        }}
      >
        <div style={{ width: 16, background: "#9ed9d2" }} />
        <div
          style={{
            display: "flex",
            flex: 1,
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "52px 64px 52px 56px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              color: "#9ed9d2",
              fontSize: 22,
              letterSpacing: 4,
            }}
          >
            <div>DOWNSTREAM</div>
            <div style={{ letterSpacing: 0 }}>aiboom.news</div>
          </div>
          <div style={{ fontSize: title.length > 80 ? 48 : 58, lineHeight: 1.15, maxWidth: 980 }}>
            {title}
          </div>
          <div style={{ fontSize: 26, color: "#9ed9d2" }}>{kicker}</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
