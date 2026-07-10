import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import { join } from "path";

// Auto-applied as og:image / twitter:image for every route that doesn't provide
// its own. Renders the black-writing Khud logo centred on the brand bone
// background so link previews are unmistakably ours.
export const alt = "Khud — Wear Your Imprint";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const logo = await readFile(join(process.cwd(), "public/images/logo-black-writing.png"));
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

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
          background: "#F4EFE6"
        }}
      >
        {/* Logo is 500×500 — display it large and square. */}
        <img src={logoSrc} width={360} height={360} alt="Khud" />
        <div
          style={{
            marginTop: 8,
            fontSize: 34,
            letterSpacing: "10px",
            textTransform: "uppercase",
            fontFamily: "Georgia, 'Times New Roman', serif",
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
