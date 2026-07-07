"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "@/components/Icons";
import { TeeGraphic } from "@/components/TeeGraphic";
import { useCart } from "@/components/CartContext";
import { createClient } from "@/lib/supabase";
import { COLORS, TEE_PATH, resolveSwatch, formatPrice } from "@/lib/data";

const SIZE_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL", "2XL", "3XL", "4XL"];

function swatchFor(name) {
  return resolveSwatch(name);
}

function sortSizes(sizes) {
  return [...sizes].sort((a, b) => {
    const ia = SIZE_ORDER.indexOf(String(a).toUpperCase());
    const ib = SIZE_ORDER.indexOf(String(b).toUpperCase());
    if (ia === -1 && ib === -1) return String(a).localeCompare(String(b));
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
}

export function ProductDetail({ product }) {
  const { addItem } = useCart();

  // Variants live in state so Supabase Realtime can patch stock without a
  // page reload. Every availability value below derives from `variants`,
  // so the whole UI (size buttons, sold-out tag, add button, stock count)
  // reacts the moment stock changes anywhere.
  const [variants, setVariants] = useState(product.variants);

  // Re-sync on navigation between products, and subscribe to live stock
  // changes for this product's variants (checkout decrements + admin edits).
  useEffect(() => {
    setVariants(product.variants);

    const supabase = createClient();
    const channel = supabase
      .channel(`variants:${product.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "product_variants",
          filter: `product_id=eq.${product.id}`
        },
        (payload) => {
          setVariants((prev) => {
            if (payload.eventType === "DELETE") {
              return prev.filter((v) => v.id !== payload.old?.id);
            }
            const row = payload.new;
            const mapped = {
              id: row.id,
              color: row.color,
              size: row.size,
              stock: Number(row.stock_quantity) || 0
            };
            const idx = prev.findIndex((v) => v.id === row.id);
            if (idx === -1) return [...prev, mapped];
            return prev.map((v) => (v.id === row.id ? mapped : v));
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [product.id]);

  // Preload every image up front so switching colour or thumbnail is instant
  // (the first/cover image already loads eagerly below).
  useEffect(() => {
    if (typeof window === "undefined") return;
    for (const m of product.media) {
      if (!m.url) continue;
      const img = new window.Image();
      img.decoding = "async";
      img.src = m.url;
    }
  }, [product.media]);

  // Distinct colours in the order they appear in the variants
  const colors = useMemo(() => {
    const seen = [];
    variants.forEach((v) => {
      if (v.color && !seen.includes(v.color)) seen.push(v.color);
    });
    return seen;
  }, [variants]);

  // Full size scale across every colour (so the size row is consistent)
  const sizeScale = useMemo(() => {
    const set = new Set();
    variants.forEach((v) => v.size && set.add(v.size));
    return sortSizes([...set]);
  }, [variants]);

  // "color|size" -> variant
  const variantMap = useMemo(() => {
    const m = {};
    variants.forEach((v) => { m[`${v.color}|${v.size}`] = v; });
    return m;
  }, [variants]);

  const colorAvailable = (color) =>
    variants.some((v) => v.color === color && v.stock > 0);

  const sizeAvailableIn = (color, size) =>
    (variantMap[`${color}|${size}`]?.stock ?? 0) > 0;

  const firstAvailableSize = (color) =>
    sizeScale.find((s) => sizeAvailableIn(color, s)) ?? null;

  // Images grouped by colour, cover first then sort order
  const mediaByColor = useMemo(() => {
    const map = {};
    product.media.forEach((m) => {
      const key = m.color ?? "__none__";
      (map[key] ||= []).push(m);
    });
    Object.values(map).forEach((list) =>
      list.sort(
        (a, b) => Number(b.isColorCover) - Number(a.isColorCover) || a.sortOrder - b.sortOrder
      )
    );
    return map;
  }, [product.media]);

  const initialColor = colors.find((c) => colorAvailable(c)) ?? colors[0] ?? null;
  const [selectedColor, setSelectedColor] = useState(initialColor);
  const [selectedSize, setSelectedSize] = useState(() => firstAvailableSize(initialColor));
  const [imgIndex, setImgIndex] = useState(0);

  const images = useMemo(() => {
    const forColor = selectedColor ? mediaByColor[selectedColor] : null;
    if (forColor && forColor.length) return forColor;
    if (mediaByColor["__none__"]?.length) return mediaByColor["__none__"];
    return product.media.length ? [...product.media] : [];
  }, [selectedColor, mediaByColor, product.media]);

  const currentImage = images[Math.min(imgIndex, Math.max(images.length - 1, 0))] ?? null;
  // Admin "Sold Out" toggle overrides everything — product stays visible but
  // can't be bought.
  const soldOut = product.isSoldOut === true;
  const colorIsAvailable = !soldOut && (selectedColor ? colorAvailable(selectedColor) : false);
  const sizeIsAvailable =
    !soldOut && selectedColor && selectedSize ? sizeAvailableIn(selectedColor, selectedSize) : false;
  const canAdd = colorIsAvailable && sizeIsAvailable;

  // Live stock counts for the availability line near the Add to bag button.
  const totalStock = variants.reduce((t, v) => t + (v.stock || 0), 0);
  const selectedStock =
    selectedColor && selectedSize
      ? variantMap[`${selectedColor}|${selectedSize}`]?.stock ?? 0
      : 0;

  function pickColor(color) {
    setSelectedColor(color);
    setImgIndex(0);
    setSelectedSize(firstAvailableSize(color));
  }

  function prevImg() {
    setImgIndex((i) => (images.length ? (i - 1 + images.length) % images.length : 0));
  }
  function nextImg() {
    setImgIndex((i) => (images.length ? (i + 1) % images.length : 0));
  }

  function handleAdd() {
    if (!canAdd) return;
    const variant = variantMap[`${selectedColor}|${selectedSize}`];
    addItem({
      key: `${product.id}-${selectedColor}-${selectedSize}`,
      id: product.id,
      variantId: variant?.id ?? null,
      name: product.name,
      meta: `${selectedColor} · ${selectedSize}`,
      color: selectedColor,
      size: selectedSize,
      price: product.price,
      image: currentImage?.url ?? null
    });
  }

  const addLabel = soldOut
    ? "Sold out"
    : !colorIsAvailable
      ? "Sold out"
      : !selectedSize || !sizeIsAvailable
        ? "Select a size"
        : "Add to bag";

  return (
    <main className="container product-detail" data-reveal>
      <nav className="pd-crumbs">
        <Link href="/shop" className="crumb-link">Shop</Link>
        {product.category?.slug && (
          <>
            {" / "}
            <Link href={`/shop/${product.category.slug}`} className="crumb-link">
              {product.category.name}
            </Link>
          </>
        )}
        {" / "}
        <span>{product.name}</span>
      </nav>

      <div className="pd-layout">
        {/* Gallery */}
        <div className="pd-gallery">
          <div className="pd-main">
            {currentImage ? (
              <Image
                src={currentImage.url}
                alt={product.name}
                className="pd-main__img"
                fill
                priority
                sizes="(max-width: 700px) 100vw, 45vw"
              />
            ) : (
              <div className="pd-main__placeholder">
                <TeeGraphic path={TEE_PATH} fill={COLORS.ink} width="48%" />
              </div>
            )}

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  className="pd-arrow pd-arrow--prev"
                  onClick={prevImg}
                  aria-label="Previous image"
                >
                  <ArrowRight size={18} />
                </button>
                <button
                  type="button"
                  className="pd-arrow pd-arrow--next"
                  onClick={nextImg}
                  aria-label="Next image"
                >
                  <ArrowRight size={18} />
                </button>
                <div className="pd-counter">{Math.min(imgIndex + 1, images.length)} / {images.length}</div>
              </>
            )}

            {(soldOut || !colorIsAvailable) && <span className="pd-soldout-tag">Sold out</span>}
          </div>

          {images.length > 1 && (
            <div className="pd-thumbs">
              {images.map((img, i) => (
                <button
                  type="button"
                  key={img.id ?? i}
                  className={`pd-thumb ${i === imgIndex ? "is-active" : ""}`}
                  onClick={() => setImgIndex(i)}
                  aria-label={`View image ${i + 1}`}
                >
                  <Image src={img.url} alt="" width={132} height={165} sizes="66px" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info / options */}
        <div className="pd-info">
          {product.category?.name && <div className="eyebrow">{product.category.name}</div>}
          <div className="pd-title-row">
            <h1 className="display display--large pd-title">{product.name}</h1>
            {soldOut && <span className="pd-soldout-pill">Sold Out</span>}
          </div>

          <div className={`pd-price ${product.hasDiscount ? "pd-price--sale" : ""}`}>
            {product.hasDiscount ? (
              <>
                <span className="pd-price__now">{formatPrice(product.price)}</span>
                <span className="pd-price__compare">{formatPrice(product.originalPrice)}</span>
                <span className="pd-price__off">{product.discountPercent}% OFF</span>
              </>
            ) : (
              <>
                {formatPrice(product.price)}
                {product.compareAtPrice && product.compareAtPrice > product.price && (
                  <span className="pd-price__compare">{formatPrice(product.compareAtPrice)}</span>
                )}
              </>
            )}
          </div>

          {product.shortDescription && <p className="pd-short">{product.shortDescription}</p>}

          {/* Colours */}
          {colors.length > 0 && (
            <div className="pd-option">
              <div className="pd-option__label">
                Colour{selectedColor ? <strong> · {selectedColor}</strong> : null}
              </div>
              <div className="pd-colors">
                {colors.map((color) => {
                  const avail = colorAvailable(color);
                  return (
                    <button
                      type="button"
                      key={color}
                      className={`pd-color ${selectedColor === color ? "is-selected" : ""} ${avail ? "" : "is-unavailable"}`}
                      onClick={() => pickColor(color)}
                      title={avail ? color : `${color} — sold out`}
                    >
                      <span className="pd-color__swatch" style={{ background: swatchFor(color) }} />
                      <span className="pd-color__name">{color}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sizes */}
          {sizeScale.length > 0 && (
            <div className="pd-option">
              <div className="pd-option__label">Size</div>
              <div className="pd-sizes">
                {sizeScale.map((size) => {
                  const avail = !soldOut && selectedColor ? sizeAvailableIn(selectedColor, size) : false;
                  return (
                    <button
                      type="button"
                      key={size}
                      className={`pd-size ${selectedSize === size ? "is-selected" : ""} ${avail ? "" : "is-unavailable"}`}
                      onClick={() => avail && setSelectedSize(size)}
                      disabled={!avail}
                      aria-disabled={!avail}
                      title={avail ? size : `${size} — unavailable in ${selectedColor}`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Live stock — updates over websockets without a refresh */}
          {variants.length > 0 && (
            <div className="pd-stock" aria-live="polite">
              {selectedSize && sizeIsAvailable && (
                <span className={`pd-stock__count ${selectedStock <= 5 ? "pd-stock__count--low" : ""}`}>
                  {selectedStock <= 5 ? `Only ${selectedStock} left` : `${selectedStock} in stock`}
                  {selectedColor ? ` · ${selectedColor} ${selectedSize}` : ""}
                </span>
              )}
              <span className="pd-stock__total">
                {totalStock > 0 ? `${totalStock} available in total` : "Currently sold out"}
              </span>
            </div>
          )}

          <button
            type="button"
            className="button button--dark pd-add"
            onClick={handleAdd}
            disabled={!canAdd}
          >
            {addLabel}
            {canAdd && <ArrowRight />}
          </button>

          {product.description && (
            <div className="pd-description">
              <div className="pd-description__title">Details</div>
              <p>{product.description}</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
