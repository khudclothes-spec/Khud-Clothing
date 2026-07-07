"use client";

import { ProductCard } from "@/components/ProductCard";
import { useLiveStock } from "@/lib/useLiveStock";

/**
 * Home-page featured grid. Thin client wrapper so the cards pick up live
 * stock (Sold-Out state) over Supabase Realtime, just like the shop grids.
 */
export function FeaturedProducts({ products }) {
  const live = useLiveStock(products);
  return (
    <div className="product-grid">
      {live.map((product, i) => (
        <ProductCard key={product.id || product.slug || product.name} product={product} priority={i === 0} />
      ))}
    </div>
  );
}
