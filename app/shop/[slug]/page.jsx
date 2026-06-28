import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import { mapDbProduct } from "@/lib/mapDbProduct";
import { CategoryShop } from "@/components/CategoryShop";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  try {
    const supabase = await createServerClient();
    const { data: cat } = await supabase
      .from("categories")
      .select("name, description")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();
    if (cat) {
      return { title: `${cat.name} — Khud`, description: cat.description || `Shop ${cat.name} at Khud.` };
    }
  } catch {
    // ignore
  }
  return { title: "Shop — Khud" };
}

export default async function CategoryPage({ params }) {
  const { slug } = await params;

  let category = null;
  let products = [];

  try {
    const supabase = await createServerClient();

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
      .select("id, name, slug, price, status, is_featured, created_at, categories(name), product_media(storage_path, is_primary), product_variants(color, size, stock_quantity)")
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
