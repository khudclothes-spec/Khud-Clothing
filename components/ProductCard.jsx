"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { formatPrice } from "@/lib/data";
import { useCart } from "@/components/CartContext";
import { TeeGraphic } from "@/components/TeeGraphic";

export function ProductCard({ product, compact = false, priority = false }) {
  const { addItem } = useCart();
  const inStock = product.inStock !== false; // default true for local products
  const soldOut = product.isSoldOut === true || !inStock;
  const href = product.slug ? `/product/${product.slug}` : null;

  function handleAdd() {
    if (soldOut) return;
    addItem({
      key: product.id || product.name,
      name: product.name,
      meta: product.category,
      price: product.price, // effective (discounted) selling price
      shape: product.shape,
      image: product.image ?? null
    });
  }

  const art = (
    <div className="product-card__art">
      <div className="mockup-center">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            className="product-card__img"
            width={480}
            height={600}
            sizes="(max-width: 700px) 42vw, 22vw"
            priority={priority}
          />
        ) : (
          <TeeGraphic path={product.shape} fill={product.mockColor} width={compact ? "55%" : "60%"} />
        )}
      </div>
      {product.hasDiscount ? (
        <span className="product-card__discount">{product.discountPercent}% OFF</span>
      ) : null}
      {product.badge ? (
        <span
          className="product-card__badge"
          style={{ background: product.badgeBg, color: product.badgeColor }}
        >
          {product.badge}
        </span>
      ) : null}
      {soldOut ? (
        <div className="sold-out-label">Sold Out</div>
      ) : href ? (
        <div className="quick-add">
          <span className="quick-add__view">View product</span>
        </div>
      ) : (
        <div className="quick-add">
          <button type="button" onClick={handleAdd}>
            Quick Add
          </button>
        </div>
      )}
    </div>
  );

  const body = (
    <div className="product-card__body">
      <div className="product-card__top">
        <div>
          <div className="product-card__name">{product.name}</div>
          <div className="product-card__cat">{product.category}</div>
        </div>
        <div className="product-card__price">
          {product.hasDiscount ? (
            <>
              <span className="price-was">{formatPrice(product.originalPrice)}</span>
              <span className="price-now">{formatPrice(product.price)}</span>
            </>
          ) : (
            formatPrice(product.price)
          )}
        </div>
      </div>
      {product.shortDescription ? (
        <p className="product-card__desc">{product.shortDescription}</p>
      ) : null}
      <div className="product-card__meta">
        {product.colors?.length > 0 && (
          <div className="swatches" aria-label={`${product.name} colors`}>
            {product.colors.map((color, i) => (
              <span key={`${color}-${i}`} className="swatch" style={{ background: color }} />
            ))}
          </div>
        )}
        {product.sizeHint && <span className="size-hint">{product.sizeHint}</span>}
      </div>
    </div>
  );

  return (
    <motion.article
      className={`product-card${soldOut ? " product-card--sold-out" : ""}`}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      {href ? (
        <Link href={href} className="product-card__link" aria-label={product.name}>
          {art}
          {body}
        </Link>
      ) : (
        <>
          {art}
          {body}
        </>
      )}
    </motion.article>
  );
}
