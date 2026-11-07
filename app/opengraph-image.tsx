import { ImageResponse } from "next/og";
import { getStories } from "@/lib/stories";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Downstream, the other side of the AI boom";

export default async function Image() {
  const stories = await getStories();
  const lines = stories.slice(0, 3).map((story) => oneLine(story.title));

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
              alignItems: "center",
              color: "#9ed9d2",
              fontSize: 22,
              letterSpacing: 4,
            }}
          >
            <div>THE OTHER SIDE OF THE AI BOOM</div>
            <div style={{ letterSpacing: 0 }}>aiboom.news</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 92, lineHeight: 1, letterSpacing: -2 }}>Downstream</div>
            <div style={{ display: "flex", marginTop: 28, width: 112, height: 6, background: "#0c6e6a" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {lines.map((line) => (
              <div
                key={line}
                style={{
                  display: "flex",
                  alignItems: "center",
                  fontSize: 28,
                  lineHeight: 1.3,
                  marginTop: 10,
                }}
              >
                <div style={{ width: 28, color: "#9ed9d2" }}>—</div>
                <div>{line}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}

function oneLine(value: string) {
  const clean = value.replace(/\s+/g, " ").trim();
  if (clean.length <= 68) return clean;
  return `${clean.slice(0, 67).trimEnd()}…`;
}
