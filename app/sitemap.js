import { createPublicClient } from "@/lib/supabase-server";
import { SITE_URL } from "@/lib/seo";

// Regenerated hourly (ISR). Combines the static marketing routes with every
// active product and category pulled from Supabase. If the DB is unavailable
// the static routes still ship.
export const revalidate = 3600;

export default async function sitemap() {
  const now = new Date();

  const routes = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${SITE_URL}/shop`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/customize`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/size-guide`, lastModified: now, changeFrequency: "monthly", priority: 0.5 }
  ];

  try {
    const supabase = createPublicClient();
    const [productsRes, categoriesRes] = await Promise.all([
      supabase.from("products").select("slug").eq("status", "active"),
      supabase.from("categories").select("slug").eq("is_active", true)
    ]);

    for (const c of categoriesRes.data ?? []) {
      if (!c.slug) continue;
      routes.push({ url: `${SITE_URL}/shop/${c.slug}`, lastModified: now, changeFrequency: "weekly", priority: 0.7 });
    }
    for (const p of productsRes.data ?? []) {
      if (!p.slug) continue;
      routes.push({ url: `${SITE_URL}/product/${p.slug}`, lastModified: now, changeFrequency: "weekly", priority: 0.8 });
    }
  } catch {
    // DB unavailable at build/revalidate — static routes still ship.
  }

  return routes;
}
