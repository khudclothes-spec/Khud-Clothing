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
  keywords: [
    "Khud", "custom clothing Pakistan", "custom printed shirts", "custom t-shirts", "custom shirts",
    "custom shorts", "oversized tees", "hoodies", "sweatshirts", "streetwear Pakistan",
    "custom print studio", "personalised apparel", "design your own t-shirt", "printed clothing Pakistan"
  ],
  authors: [{ name: "Khud Studio" }],
  creator: "Khud",
  publisher: "Khud",
  manifest: "/manifest.webmanifest",
  alternates: { canonical: "/" },
  // Google Search Console ownership verification (HTML-tag method).
  verification: { google: "3DKm9LjZtk659Q17a7CmXsadSI3L6CsJf02Ey5W9mpU" },
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
        {/* Favicon = the Khud wordmark. Default is the BLACK version so it stays
            legible on light/white backgrounds — including Google search results,
            which always render the favicon on white. It auto-switches to the
            white version only on dark browser themes. */}
        <link rel="icon" type="image/png" href="/images/logo-black-writing.png" />
        <link rel="icon" type="image/png" media="(prefers-color-scheme: dark)" href="/images/logo-white-writing.png" />
        <link rel="apple-touch-icon" href="/images/logo-black-writing.png" />
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
