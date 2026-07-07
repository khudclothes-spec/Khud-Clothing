import { COLORS, TEE_PATH, resolveSwatch } from "@/lib/data";
import { productPricing } from "@/lib/pricing";

/**
 * Maps a Supabase product row (with joined categories + product_media
 * + product_variants) to the shape expected by ProductCard / CategoryShop.
 */
export function mapDbProduct(p) {
  // Card / featured image: the main display image, else any colour cover,
  // else the first uploaded image.
  const media = p.product_media ?? [];
  const primaryMedia =
    media.find((m) => m.is_primary) ??
    media.find((m) => m.is_color_cover) ??
    media[0] ??
    null;

  const imageUrl = primaryMedia
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/${primaryMedia.storage_path}`
    : null;

  const variants = p.product_variants ?? [];

  // Distinct colour + size names from the variants
  const colorNames = [...new Set(variants.map((v) => v.color).filter(Boolean))];
  const sizeNames = [...new Set(variants.map((v) => v.size).filter(Boolean))];

  // Swatch hexes for every colour (dropdown options + custom colours)
  const swatches = colorNames.map((name) => resolveSwatch(name));

  // Admin "Sold Out" toggle takes precedence over live stock.
  const isSoldOut = p.is_sold_out === true;

  // In stock when the product is active, not flagged sold out, AND
  // (has no variants OR some variant has stock)
  const hasVariants = variants.length > 0;
  const someInStock = variants.some((v) => Number(v.stock_quantity) > 0);
  const inStock = p.status === "active" && !isSoldOut && (!hasVariants || someInStock);

  const sizeHint = sizeNames.length > 0 ? sizeNames.join(" · ") : "S-XXL";

  // Per-product discount → effective selling price + display metadata.
  const pricing = productPricing({ price: p.price, discountPercent: p.discount_percentage });

  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    category: p.categories?.name ?? "",
    shortDescription: p.short_description ?? "",
    price: pricing.price,               // effective (discounted) selling price
    originalPrice: pricing.original,
    discountPercent: pricing.discountPercent,
    hasDiscount: pricing.hasDiscount,
    isSoldOut,
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
    inStock,
    // Lightweight variant stock so grids can recompute inStock live
    // (see useLiveStock). Requires `id` in the product_variants select.
    variants: variants.map((v) => ({ id: v.id, stock: Number(v.stock_quantity) || 0 }))
  };
}
