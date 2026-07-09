import { ImageResponse } from "next/og";

// Auto-applied as og:image / twitter:image for every route that doesn't provide
// its own. Rendered on the server so the preview always matches the brand.
export const alt = "Khud — Wear Your Imprint";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#F4EFE6",
          fontFamily: "Georgia, 'Times New Roman', serif",
          color: "#11100E"
        }}
      >
        <div style={{ fontSize: 190, fontWeight: 700, letterSpacing: "-6px", lineHeight: 1 }}>Khud</div>
        <div
          style={{
            marginTop: 28,
            fontSize: 40,
            letterSpacing: "8px",
            textTransform: "uppercase",
            color: "#A94732"
          }}
        >
          Wear Your Imprint
        </div>
      </div>
    ),
    { ...size }
  );
}
