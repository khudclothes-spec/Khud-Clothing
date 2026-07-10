// Central SEO configuration + Schema.org JSON-LD builders. Used by the root
// layout (Organization + WebSite), product/category pages (Product, Offer,
// BreadcrumbList), and content pages (FAQPage). Keep every absolute URL derived
// from NEXT_PUBLIC_SITE_URL so canonical/OG links are correct in every env.

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
export const SITE_NAME = "Khud";
export const SITE_TAGLINE = "Wear your imprint.";
export const SITE_DESCRIPTION =
  "Khud — premium heavyweight tees, hoodies and a custom-print studio. Shop the drop or design your own, printed locally in Pakistan.";
export const SITE_LOGO = `${SITE_URL}/images/logo-black-writing.png`;

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
    name: SITE_NAME,
    url: SITE_URL,
    logo: SITE_LOGO,
    description: SITE_DESCRIPTION,
    slogan: SITE_TAGLINE,
    // Add real social profiles here when they exist.
    sameAs: []
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    inLanguage: "en"
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
