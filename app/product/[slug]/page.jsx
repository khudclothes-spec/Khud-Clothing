import { notFound } from "next/navigation";
import { createPublicClient } from "@/lib/supabase-server";
import { ProductDetail } from "@/components/ProductDetail";
import { productPricing } from "@/lib/pricing";

export const revalidate = 60;

// No build-time params; each product page is generated on first request and
// then cached (ISR) for the revalidate window.
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  try {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("products")
      .select("name, short_description")
      .eq("slug", slug)
      .eq("status", "active")
      .maybeSingle();
    if (data) {
      return {
        title: `${data.name} — Khud`,
        description: data.short_description || `Shop ${data.name} at Khud.`
      };
    }
  } catch {
    // ignore — fall through to default
  }
  return { title: "Product — Khud" };
}

export default async function ProductPage({ params }) {
  const { slug } = await params;

  let product = null;
  try {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("products")
      .select(
        "id, name, slug, price, discount_percentage, is_sold_out, compare_at_price, description, short_description, status, categories(name, slug), product_media(id, storage_path, color, is_primary, is_color_cover, sort_order), product_variants(id, color, size, stock_quantity)"
      )
      .eq("slug", slug)
      .eq("status", "active")
      .maybeSingle();

    if (!data) notFound();
    product = data;
  } catch (err) {
    if (err?.digest?.startsWith("NEXT_")) throw err; // let notFound() propagate
    notFound();
  }

  const baseUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images`;

  const pricing = productPricing({ price: product.price, discountPercent: product.discount_percentage });

  const normalized = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: pricing.price,                 // effective (discounted) selling price
    originalPrice: pricing.original,
    discountPercent: pricing.discountPercent,
    hasDiscount: pricing.hasDiscount,
    isSoldOut: product.is_sold_out === true,
    compareAtPrice: product.compare_at_price != null ? Number(product.compare_at_price) : null,
    description: product.description ?? "",
    shortDescription: product.short_description ?? "",
    category: product.categories
      ? { name: product.categories.name, slug: product.categories.slug }
      : null,
    media: (product.product_media ?? []).map((m) => ({
      id: m.id,
      url: `${baseUrl}/${m.storage_path}`,
      color: m.color ?? null,
      isPrimary: !!m.is_primary,
      isColorCover: !!m.is_color_cover,
      sortOrder: m.sort_order ?? 0
    })),
    variants: (product.product_variants ?? []).map((v) => ({
      id: v.id,
      color: v.color,
      size: v.size,
      stock: Number(v.stock_quantity) || 0
    }))
  };

  return <ProductDetail product={normalized} />;
}
