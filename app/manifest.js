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
    // Splash/background is the light bone colour, so the black wordmark stays
    // legible against it.
    icons: [
      { src: "/images/logo-black-writing.png", sizes: "500x500", type: "image/png", purpose: "any" }
    ]
  };
}
