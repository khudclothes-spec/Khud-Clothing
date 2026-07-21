// Central SEO configuration + Schema.org JSON-LD builders. Used by the root
// layout (Organization + WebSite), product/category pages (Product, Offer,
// BreadcrumbList), and content pages (FAQPage). Keep every absolute URL derived
// from NEXT_PUBLIC_SITE_URL so canonical/OG links are correct in every env.

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://charmeem.com").replace(/\/$/, "");
export const SITE_NAME = "Char Meem Clothing";
export const SITE_TAGLINE = "Wear your imprint.";
export const SITE_DESCRIPTION =
  "Char Meem Clothing — premium heavyweight tees, hoodies and a custom-print studio. Shop the drop or design your own, printed locally in Pakistan.";
// Schema.org Organization logo. Google requires a logo that renders well on a
// white background, so this is the black wordmark on a transparent PNG.
export const SITE_LOGO = `${SITE_URL}/images/charmeem-logo-black.png`;
// Customer contact surfaced in Organization JSON-LD (mirrors lib/email/config.js).
export const CONTACT_EMAIL = process.env.SUPPORT_EMAIL || "khudclothes@gmail.com";

// Brand Open Graph image (gold 4م monogram wordmark on black, 1200×630).
// Served by the app/opengraph-image.jpg file convention. Pages that define
// their own `openGraph` object must include this in `images` — a page-level
// openGraph replaces the inherited one, dropping the file-convention image.
export const OG_IMAGE = {
  url: "/opengraph-image.jpg",
  width: 1200,
  height: 630,
  alt: "Char Meem Clothing — gold 4 Meem monogram wordmark on a black background"
};

// Build an absolute URL from a site-relative path.
export function absoluteUrl(path = "/") {
  if (!path) return SITE_URL;
  if (/^https?:\/\//.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    // The logo artwork reads "4 Meem" — char is Urdu for four, meem is the
    // Arabic letter م. Listing the variants helps search/AI engines connect them.
    alternateName: ["Char Meem", "4 Meem Clothing", "4 Meem"],
    url: SITE_URL,
    logo: SITE_LOGO,
    image: `${SITE_URL}/images/charmeem-logo-gold-black-bg.jpg`,
    description: SITE_DESCRIPTION,
    slogan: SITE_TAGLINE,
    email: CONTACT_EMAIL,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      email: CONTACT_EMAIL,
      availableLanguage: ["en", "ur"]
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: "Islamabad",
      addressCountry: "PK"
    },
    // Add real social profiles here when they exist (Instagram, TikTok, …) —
    // also update the placeholder links in the SiteShell footer.
    sameAs: []
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE_NAME,
    alternateName: "Char Meem",
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    inLanguage: "en",
    publisher: { "@id": `${SITE_URL}/#organization` }
  };
}

// items: [{ name, path }] — path is site-relative (or absolute).
export function breadcrumbSchema(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: absoluteUrl(it.path)
    }))
  };
}

// availability: "InStock" | "OutOfStock" (Schema.org enum name).
export function productSchema({ name, description, image, url, price, availability = "InStock", brand = SITE_NAME, sku }) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    ...(description ? { description } : {}),
    ...(image ? { image: Array.isArray(image) ? image : [image] } : {}),
    ...(sku ? { sku } : {}),
    brand: { "@type": "Brand", name: brand },
    offers: {
      "@type": "Offer",
      priceCurrency: "PKR",
      price: Number(price) || 0,
      availability: `https://schema.org/${availability}`,
      url,
      seller: { "@type": "Organization", name: SITE_NAME }
    }
  };
}

// faqs: [{ q, a }]
export function faqSchema(faqs) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a }
    }))
  };
}
