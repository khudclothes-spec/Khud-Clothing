// Renders a Schema.org JSON-LD block. Server component — safe to use in server
// pages and the root layout. Pass a plain object (or array of objects) from
// lib/seo.js builders.
export function JsonLd({ data }) {
  if (!data) return null;
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
