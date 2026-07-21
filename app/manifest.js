import { SITE_NAME, SITE_DESCRIPTION } from "@/lib/seo";

// Served at /manifest.webmanifest. Enables installability + a consistent theme
// colour in mobile browser chrome.
export default function manifest() {
  return {
    name: `${SITE_NAME} — Wear Your Imprint`,
    short_name: "Char Meem",
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#F4EFE6",
    theme_color: "#11100E",
    // Black 4م monogram on white — same artwork as the favicon set. The
    // maskable variant has extra padding to survive Android's circular crop.
    icons: [
      { src: "/images/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/images/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/images/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
    ]
  };
}
