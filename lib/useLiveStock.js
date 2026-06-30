"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase";

/**
 * Keeps a product grid's `inStock` flags live. Subscribes once (one channel
 * for the whole grid) to all product_variants stock changes over Supabase
 * Realtime, then recomputes each product's availability from its lightweight
 * `variants: [{ id, stock }]` array (added by mapDbProduct). Cards flip to
 * "Sold Out" — or back to available — with no page reload.
 *
 * @param {Array} products mapped products (each needs `variants` + `inStock`)
 * @returns {Array} the same products with `inStock` reflecting live stock
 */
export function useLiveStock(products) {
  // variantId -> latest stock_quantity seen over the wire
  const [overrides, setOverrides] = useState({});

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("variants:grid")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "product_variants" },
        (payload) => {
          const id = payload.new?.id ?? payload.old?.id;
          if (!id) return;
          const stock =
            payload.eventType === "DELETE" ? 0 : Number(payload.new.stock_quantity) || 0;
          setOverrides((prev) => (prev[id] === stock ? prev : { ...prev, [id]: stock }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return useMemo(() => {
    if (Object.keys(overrides).length === 0) return products;
    return products.map((p) => {
      if (!p.variants || p.variants.length === 0) return p;
      const someInStock = p.variants.some((v) => (overrides[v.id] ?? v.stock) > 0);
      return someInStock === p.inStock ? p : { ...p, inStock: someInStock };
    });
  }, [products, overrides]);
}
