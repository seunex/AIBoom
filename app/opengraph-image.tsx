import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Downstream, the other side of the AI boom";

export default function Image() {
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
        <div style={{ fontSize: 64, lineHeight: 1.15, maxWidth: 980 }}>
          The other side of the AI boom, told through other people&apos;s reporting.
        </div>
      </div>
    ),
    { ...size },
  );
}
