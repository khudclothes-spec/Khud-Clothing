"use client";

import { formatPrice } from "@/lib/data";
import { useCart } from "@/components/CartContext";
import { TeeGraphic } from "@/components/TeeGraphic";

export function ProductCard({ product, compact = false }) {
  const { addItem } = useCart();

  function handleAdd() {
    addItem({
      key: product.name,
      name: product.name,
      meta: product.category,
      price: product.price,
      shape: product.shape
    });
  }

  return (
    <article className="product-card">
      <div className="product-card__art">
        <div className="mockup-center">
          <TeeGraphic path={product.shape} fill={product.mockColor} width={compact ? "55%" : "60%"} />
        </div>
        {product.badge ? (
          <span
            className="product-card__badge"
            style={{ background: product.badgeBg, color: product.badgeColor }}
          >
            {product.badge}
          </span>
        ) : null}
        <div className="quick-add">
          <button type="button" onClick={handleAdd}>
            Quick Add
          </button>
        </div>
      </div>
      <div className="product-card__body">
        <div className="product-card__top">
          <div>
            <div className="product-card__name">{product.name}</div>
            <div className="product-card__cat">{product.category}</div>
          </div>
          <div className="product-card__price">{formatPrice(product.price)}</div>
        </div>
        <div className="product-card__meta">
          <div className="swatches" aria-label={`${product.name} colors`}>
            {product.colors.map((color) => (
              <span key={color} className="swatch" style={{ background: color }} />
            ))}
          </div>
          <span className="size-hint">{product.sizeHint}</span>
        </div>
      </div>
    </article>
  );
}
