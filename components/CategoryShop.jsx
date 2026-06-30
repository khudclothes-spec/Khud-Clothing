"use client";

import { useMemo, useState } from "react";
import { ProductCard } from "@/components/ProductCard";
import { Reveal } from "@/components/Reveal";
import { formatPrice } from "@/lib/data";
import { useLiveStock } from "@/lib/useLiveStock";

const PRICE_MAX = 10000;
const PRICE_STEP = 100;

const SORTS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "az", label: "Alphabetical (A–Z)" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" }
];

export function CategoryShop({ products: initialProducts }) {
  // Live stock keeps each card's Sold-Out state current without a reload.
  const products = useLiveStock(initialProducts);
  const [sort, setSort] = useState("newest");
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [maxPrice, setMaxPrice] = useState(PRICE_MAX);

  // Available filter options derived from the products in this category
  const { colorOptions, sizeOptions } = useMemo(() => {
    const colors = new Set();
    const sizes = new Set();
    products.forEach((p) => {
      (p.colorNames ?? []).forEach((c) => colors.add(c));
      (p.sizeNames ?? []).forEach((s) => sizes.add(s));
    });
    return { colorOptions: [...colors], sizeOptions: [...sizes] };
  }, [products]);

  function toggle(list, setList, value) {
    setList(list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);
  }

  function clearAll() {
    setSelectedColors([]);
    setSelectedSizes([]);
    setMaxPrice(PRICE_MAX);
  }

  const filtered = useMemo(() => {
    let list = products.filter((p) => {
      if (p.price > maxPrice) return false;
      if (selectedColors.length > 0 && !(p.colorNames ?? []).some((c) => selectedColors.includes(c))) return false;
      if (selectedSizes.length > 0 && !(p.sizeNames ?? []).some((s) => selectedSizes.includes(s))) return false;
      return true;
    });

    list = [...list].sort((a, b) => {
      switch (sort) {
        case "oldest":
          return new Date(a.createdAt ?? 0) - new Date(b.createdAt ?? 0);
        case "az":
          return a.name.localeCompare(b.name);
        case "price-asc":
          return a.price - b.price;
        case "price-desc":
          return b.price - a.price;
        case "newest":
        default:
          return new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0);
      }
    });

    return list;
  }, [products, sort, selectedColors, selectedSizes, maxPrice]);

  const hasFilters = selectedColors.length > 0 || selectedSizes.length > 0 || maxPrice < PRICE_MAX;

  return (
    <section className="shop-layout">
      <aside className="filters" data-reveal>
        <div className="filters__head">
          <span className="filter-title" style={{ margin: 0 }}>Filters</span>
          {hasFilters && (
            <button type="button" className="filter-clear" onClick={clearAll}>Clear all</button>
          )}
        </div>

        {colorOptions.length > 0 && (
          <div className="filter-group">
            <div className="filter-title">Colour</div>
            <div className="filter-options">
              {colorOptions.map((color) => (
                <button
                  type="button"
                  key={color}
                  className={`filter-chip ${selectedColors.includes(color) ? "is-active" : ""}`}
                  onClick={() => toggle(selectedColors, setSelectedColors, color)}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>
        )}

        {sizeOptions.length > 0 && (
          <div className="filter-group">
            <div className="filter-title">Size</div>
            <div className="filter-options">
              {sizeOptions.map((size) => (
                <button
                  type="button"
                  key={size}
                  className={`filter-chip ${selectedSizes.includes(size) ? "is-active" : ""}`}
                  onClick={() => toggle(selectedSizes, setSelectedSizes, size)}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="filter-group">
          <div className="filter-title">Max price</div>
          <input
            className="price-range"
            type="range"
            min="0"
            max={PRICE_MAX}
            step={PRICE_STEP}
            value={maxPrice}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
          />
          <div className="range-labels">
            <span>Rs 0</span>
            <span>Up to <strong>{formatPrice(maxPrice)}</strong></span>
          </div>
        </div>
      </aside>

      <div>
        <Reveal delay={0.1}>
          <div className="shop-toolbar">
            <span className="muted">
              Showing {filtered.length} of {products.length}
            </span>
            <label className="sort-pill">
              <span>Sort</span>
              <select className="sort-select" value={sort} onChange={(e) => setSort(e.target.value)}>
                {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </label>
          </div>
        </Reveal>

        {filtered.length === 0 ? (
          <div className="shop-empty">
            <p>No pieces match these filters.</p>
            {hasFilters && <button type="button" className="button button--outline" onClick={clearAll}>Clear filters</button>}
          </div>
        ) : (
          <div className="product-grid product-grid--shop">
            {filtered.map((product) => (
              <ProductCard key={product.id || product.name} product={product} compact />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
