"use client";

import { motion } from "framer-motion";
import { formatPrice } from "@/lib/data";
import { useCart } from "@/components/CartContext";
import { TeeGraphic } from "@/components/TeeGraphic";

export function ProductCard({ product, compact = false }) {
  const { addItem } = useCart();
  const inStock = product.inStock !== false; // default true for local products

  function handleAdd() {
    if (!inStock) return;
    addItem({
      key: product.id || product.name,
      name: product.name,
      meta: product.category,
      price: product.price,
      shape: product.shape,
      image: product.image ?? null
    });
  }

  return (
    <motion.article
      className={`product-card${!inStock ? " product-card--sold-out" : ""}`}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="product-card__art">
        <div className="mockup-center">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="product-card__img"
            />
          ) : (
            <TeeGraphic path={product.shape} fill={product.mockColor} width={compact ? "55%" : "60%"} />
          )}
        </div>
        {product.badge ? (
          <span
            className="product-card__badge"
            style={{ background: product.badgeBg, color: product.badgeColor }}
          >
            {product.badge}
          </span>
        ) : null}
        {!inStock ? (
          <div className="sold-out-label">Sold Out</div>
        ) : (
          <div className="quick-add">
            <button type="button" onClick={handleAdd}>
              Quick Add
            </button>
          </div>
        )}
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
          {product.colors?.length > 0 && (
            <div className="swatches" aria-label={`${product.name} colors`}>
              {product.colors.map((color) => (
                <span key={color} className="swatch" style={{ background: color }} />
              ))}
            </div>
          )}
          {product.sizeHint && <span className="size-hint">{product.sizeHint}</span>}
        </div>
      </div>
    </motion.article>
  );
}
