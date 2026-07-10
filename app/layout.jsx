import "./globals.css";
import { SiteShell } from "@/components/SiteShell";
import { SessionMonitor } from "@/components/SessionMonitor";
import { JsonLd } from "@/components/JsonLd";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION, organizationSchema, websiteSchema } from "@/lib/seo";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Khud — Wear Your Imprint",
    template: "%s — Khud"
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: ["Khud", "custom clothing", "oversized tees", "hoodies", "Pakistan fashion", "custom print studio", "streetwear", "personalised apparel"],
  authors: [{ name: "Khud Studio" }],
  creator: "Khud",
  publisher: "Khud",
  manifest: "/manifest.webmanifest",
  alternates: { canonical: "/" },
  // Favicon links are declared manually in <head> below so they can be
  // theme-aware (white wordmark on dark tabs, black on light tabs).
  openGraph: {
    title: "Khud — Wear Your Imprint",
    description: SITE_DESCRIPTION,
    url: "/",
    siteName: SITE_NAME,
    locale: "en_US",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Khud — Wear Your Imprint",
    description: SITE_DESCRIPTION
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 }
  }
};

export const viewport = {
  themeColor: "#11100E",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,500;0,6..96,600;0,6..96,700;0,6..96,800;1,6..96,400;1,6..96,500&family=Hanken+Grotesk:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        {/* Tab favicon = the Khud wordmark. White version by default (and on dark
            browser themes, as requested); auto-switches to the black version on
            light themes so it's always legible. */}
        <link rel="icon" type="image/png" href="/images/logo-white-writing.png" />
        <link rel="icon" type="image/png" media="(prefers-color-scheme: light)" href="/images/logo-black-writing.png" />
        <link rel="apple-touch-icon" href="/images/logo-white-writing.png" />
      </head>
      <body>
        {/* Site-wide structured data: who we are + the site itself. */}
        <JsonLd data={organizationSchema()} />
        <JsonLd data={websiteSchema()} />
        <SessionMonitor />
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
