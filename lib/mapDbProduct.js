import { COLORS, TEE_PATH, customColors } from "@/lib/data";

// Map known colour names to hex for storefront swatches.
const COLOR_HEX = customColors.reduce((acc, c) => {
  acc[c.name.toLowerCase()] = c.hex;
  return acc;
}, {});

/**
 * Maps a Supabase product row (with joined categories + product_media
 * + product_variants) to the shape expected by ProductCard / CategoryShop.
 */
export function mapDbProduct(p) {
  const primaryMedia =
    p.product_media?.find((m) => m.is_primary) ?? p.product_media?.[0] ?? null;

  const imageUrl = primaryMedia
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/${primaryMedia.storage_path}`
    : null;

  const variants = p.product_variants ?? [];

  // Distinct colour + size names from the variants
  const colorNames = [...new Set(variants.map((v) => v.color).filter(Boolean))];
  const sizeNames = [...new Set(variants.map((v) => v.size).filter(Boolean))];

  // Swatch hexes for known colours (custom colours fall back to a neutral)
  const swatches = colorNames.map((name) => COLOR_HEX[name.toLowerCase()] ?? COLORS.taupe);

  // In stock when the product is active AND (has no variants OR some variant has stock)
  const hasVariants = variants.length > 0;
  const someInStock = variants.some((v) => Number(v.stock_quantity) > 0);
  const inStock = p.status === "active" && (!hasVariants || someInStock);

  const sizeHint = sizeNames.length > 0 ? sizeNames.join(" · ") : "S-XXL";

  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    category: p.categories?.name ?? "",
    price: Number(p.price),
    createdAt: p.created_at ?? null,
    image: imageUrl,
    // SVG fallback when no image uploaded yet
    shape: TEE_PATH,
    mockColor: COLORS.ink,
    colors: swatches,
    colorNames,
    sizeNames,
    badge: p.is_featured ? "Featured" : "",
    badgeBg: COLORS.clay,
    badgeColor: COLORS.cream,
    sizeHint,
    inStock
  };
}
