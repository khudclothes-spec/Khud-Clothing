import { SITE_URL } from "@/lib/seo";

// Served at /robots.txt. Public storefront is fully crawlable; private/account
// and API surfaces are disallowed. Points crawlers at the sitemap.
export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/account",
          "/checkout",
          "/api",
          "/login",
          "/forgot-password",
          "/reset-password",
          "/verify-email",
          "/reviews/new"
        ]
      }
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL
  };
}
