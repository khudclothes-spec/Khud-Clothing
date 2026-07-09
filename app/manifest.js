import { SITE_NAME, SITE_DESCRIPTION } from "@/lib/seo";

// Served at /manifest.webmanifest. Enables installability + a consistent theme
// colour in mobile browser chrome.
export default function manifest() {
  return {
    name: `${SITE_NAME} — Wear Your Imprint`,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#F4EFE6",
    theme_color: "#11100E",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/images/logo-white-writing.png", sizes: "512x512", type: "image/png" }
    ]
  };
}
