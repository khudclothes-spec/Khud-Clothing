import Link from "next/link";
import { notFound } from "next/navigation";
import { createPublicClient } from "@/lib/supabase-server";
import { mapDbProduct } from "@/lib/mapDbProduct";
import { CategoryShop } from "@/components/CategoryShop";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbSchema } from "@/lib/seo";

export const revalidate = 60;

// No build-time params; each category page is generated on first request and
// then cached (ISR) for the revalidate window.
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  try {
    const supabase = createPublicClient();
    const { data: cat } = await supabase
      .from("categories")
      .select("name, description")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();
    if (cat) {
      const description = cat.description || `Shop ${cat.name} at Khud.`;
      return {
        title: `${cat.name} — Khud`,
        description,
        alternates: { canonical: `/shop/${slug}` },
        openGraph: { url: `/shop/${slug}`, title: `${cat.name} — Khud`, description }
      };
    }
  } catch {
    // ignore
  }
  return { title: "Shop — Khud", alternates: { canonical: `/shop/${slug}` } };
}

export default async function CategoryPage({ params }) {
  const { slug } = await params;

  let category = null;
  let products = [];

  try {
    const supabase = createPublicClient();

    const { data: cat } = await supabase
      .from("categories")
      .select("id, name, slug, description")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();

    if (!cat) notFound();
    category = cat;

    const { data: dbProducts } = await supabase
      .from("products")
      .select("id, name, slug, price, discount_percentage, is_sold_out, short_description, status, is_featured, created_at, categories(name), product_media(storage_path, color, is_primary, is_color_cover, sort_order), product_variants(id, color, size, stock_quantity)")
      .eq("status", "active")
      .eq("category_id", cat.id)
      .order("created_at", { ascending: false });

    products = (dbProducts ?? []).map(mapDbProduct);
  } catch (err) {
    // notFound() throws a special error — let it propagate
    if (err?.digest?.startsWith("NEXT_")) throw err;
    notFound();
  }

  return (
    <main className="container">
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Shop", path: "/shop" },
          { name: category.name, path: `/shop/${category.slug}` }
        ])}
      />
      <section className="page-title" data-reveal>
        <div className="eyebrow">
          <Link href="/shop" className="crumb-link">Shop</Link> / {category.name}
        </div>
        <h1 className="display display--large">{category.name}.</h1>
        {category.description && <p>{category.description}</p>}
      </section>

      <CategoryShop products={products} />
    </main>
  );
}
