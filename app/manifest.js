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
    // White-square wordmark icons — same artwork as the favicon set, with
    // enough padding to survive maskable cropping on Android.
    icons: [
      { src: "/images/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/images/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/images/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
    ]
  };
}
