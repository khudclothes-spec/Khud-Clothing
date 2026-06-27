import { ChevronDown } from "@/components/Icons";
import { ProductCard } from "@/components/ProductCard";
import { Reveal } from "@/components/Reveal";
import { filters, products } from "@/lib/data";

export const metadata = {
  title: "Shop the Drop"
};

export default function ShopPage() {
  return (
    <main className="container">
      <section className="page-title" data-reveal>
        <div className="eyebrow">The Shop</div>
        <h1 className="display display--large">Shop the Drop.</h1>
        <p>{products.length} pieces — Filters and sort are UI-only in this demo.</p>
      </section>

      <section className="shop-layout">
        <aside className="filters" data-reveal>
          {filters.map((filter) => (
            <div className="filter-group" key={filter.name}>
              <div className="filter-title">{filter.name}</div>
              <div className="filter-options">
                {filter.options.map((option) => (
                  <span className="filter-chip" key={option}>
                    {option}
                  </span>
                ))}
              </div>
            </div>
          ))}
          <div className="filter-group">
            <div className="filter-title">Price - PKR</div>
            <input className="price-range" type="range" min="0" max="100" defaultValue="70" />
            <div className="range-labels">
              <span>Rs 0</span>
              <span>Rs 7,000+</span>
            </div>
          </div>
        </aside>

        <div>
          <Reveal delay={0.1}>
            <div className="shop-toolbar">
              <span className="muted">
                Showing {products.length} of {products.length}
              </span>
              <div className="sort-pill">
                <span>Sort: Featured</span>
                <ChevronDown />
              </div>
            </div>
          </Reveal>

          <div className="product-grid product-grid--shop">
            {products.map((product) => (
              <ProductCard key={product.name} product={product} compact />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
