import "./globals.css";
import { SiteShell } from "@/components/SiteShell";

export const metadata = {
  title: {
    default: "Khud",
    template: "%s — Khud"
  },
  description: "Premium ready-made clothing and a custom-print studio. Design yourself.",
  keywords: ["Khud", "custom clothing", "oversized tees", "Pakistan fashion", "custom print", "streetwear"],
  authors: [{ name: "Khud Studio" }],
  creator: "Khud",
  icons: {
    icon: [
      { url: "/images/logo-black-writing.png", type: "image/png" }
    ],
    apple: [
      { url: "/images/logo-black-writing.png" }
    ]
  },
  openGraph: {
    title: "Khud — Wear Your Imprint",
    description: "Premium ready-made clothing and a custom-print studio. Design yourself.",
    siteName: "Khud",
    locale: "en_US",
    type: "website"
  },
  twitter: {
    card: "summary",
    title: "Khud — Wear Your Imprint",
    description: "Premium ready-made clothing and a custom-print studio."
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,500;0,6..96,600;0,6..96,700;0,6..96,800;1,6..96,400;1,6..96,500&family=Hanken+Grotesk:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
