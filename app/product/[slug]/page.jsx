import { notFound } from "next/navigation";
import { createPublicClient } from "@/lib/supabase-server";
import { ProductDetail } from "@/components/ProductDetail";
import { productPricing } from "@/lib/pricing";
import { JsonLd } from "@/components/JsonLd";
import { productSchema, breadcrumbSchema, absoluteUrl } from "@/lib/seo";

export const revalidate = 60;

// Choose the best display image from a product's media rows.
function primaryImageUrl(media, baseUrl) {
  if (!media?.length) return null;
  const pick =
    media.find((m) => m.is_primary) ||
    media.find((m) => m.is_color_cover) ||
    [...media].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))[0];
  return pick ? `${baseUrl}/${pick.storage_path}` : null;
}

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
      .select("name, short_description, product_media(storage_path, is_primary, is_color_cover, sort_order)")
      .eq("slug", slug)
      .eq("status", "active")
      .maybeSingle();
    if (data) {
      const description = data.short_description || `Shop ${data.name} at Khud.`;
      const baseUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images`;
      const image = primaryImageUrl(data.product_media, baseUrl);
      return {
        title: `${data.name} — Khud`,
        description,
        alternates: { canonical: `/product/${slug}` },
        openGraph: {
          url: `/product/${slug}`,
          title: `${data.name} — Khud`,
          description,
          ...(image ? { images: [{ url: image, alt: data.name }] } : {})
        }
      };
    }
  } catch {
    // ignore — fall through to default
  }
  return { title: "Product — Khud", alternates: { canonical: `/product/${slug}` } };
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

  // ── Structured data for rich results / AI discoverability ──
  const productUrl = absoluteUrl(`/product/${normalized.slug}`);
  const primaryImage = primaryImageUrl(product.product_media, baseUrl);
  const totalStock = normalized.variants.reduce((t, v) => t + v.stock, 0);
  const available = !normalized.isSoldOut && totalStock > 0 ? "InStock" : "OutOfStock";

  const schema = productSchema({
    name: normalized.name,
    description: normalized.shortDescription || normalized.description,
    image: primaryImage || undefined,
    url: productUrl,
    price: normalized.price,
    availability: available,
    sku: normalized.id
  });

  const crumbs = breadcrumbSchema([
    { name: "Home", path: "/" },
    { name: "Shop", path: "/shop" },
    ...(normalized.category ? [{ name: normalized.category.name, path: `/shop/${normalized.category.slug}` }] : []),
    { name: normalized.name, path: `/product/${normalized.slug}` }
  ]);

  return (
    <>
      <JsonLd data={schema} />
      <JsonLd data={crumbs} />
      <ProductDetail product={normalized} />
    </>
  );
}
