import Link from "next/link";
import { ArrowRight } from "@/components/Icons";
import { Newsletter } from "@/components/Newsletter";
import { ProductCard } from "@/components/ProductCard";
import { TeeGraphic } from "@/components/TeeGraphic";
import { categories, COLORS, products, quality, steps, TEE_PATH } from "@/lib/data";

export default function HomePage() {
  const featured = products.slice(0, 4);

  return (
    <main>
      <section className="container hero">
        <div className="hero__intro">
          <div className="hero__kicker">
            <span className="hero__kicker-line" />
            <span className="hero__kicker-text">Drop 01 / Summer '26</span>
          </div>
          <h1 className="display display--hero">
            <span className="hero__word">WEAR</span>
            <span className="hero__word">YOUR</span>
            <span className="hero__word italic-clay">IMPRINT.</span>
          </h1>
          <p className="hero__copy">
            Ready-made tees and custom prints, designed around the mark that is yours.
          </p>
          <div className="hero__actions">
            <Link href="/shop" className="button button--dark">
              Shop the Drop
              <ArrowRight />
            </Link>
            <Link href="/customize" className="button button--outline">
              Build Your Own
            </Link>
          </div>
          <div className="hero__stats" aria-label="Khud highlights">
            <Stat value="100%" label="Heavy Cotton" />
            <span className="stat__rule" />
            <Stat value="3-5" label="Day Custom Print" />
            <span className="stat__rule" />
            <Stat value="PK" label="Made Local" />
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-visual__card">
            <div className="hero-visual__watermark">
              <img src="/images/logo-black-writing.png" alt="" />
            </div>
            <div className="hero-visual__tee">
              <TeeGraphic path={TEE_PATH} fill={COLORS.ink} width="55%" />
            </div>
            <div className="hero-visual__mark">
              <img src="/images/logo-white-writing.png" alt="" />
            </div>
            <div className="hero-visual__badge">
              <strong>new</strong>
              <span>DROP 01</span>
            </div>
            <div className="hero-visual__accent" />
          </div>
          <div className="floating-product">
            <div className="floating-product__tag">Bestseller</div>
            <div className="floating-product__name">Essential Oversized Tee</div>
            <div className="floating-product__price">Rs 4,200</div>
          </div>
        </div>
      </section>

      <section className="container section" data-reveal>
        <div className="section-head">
          <div>
            <div className="eyebrow">The Keepers</div>
            <h2 className="display display--section">Featured pieces.</h2>
          </div>
          <Link href="/shop" className="link-button">
            View all
            <ArrowRight size={14} />
          </Link>
        </div>
        <div className="product-grid">
          {featured.map((product) => (
            <ProductCard key={product.name} product={product} />
          ))}
        </div>
      </section>

      <section className="section section--dark" data-reveal>
        <div className="container custom-steps">
          <div>
            <div className="eyebrow eyebrow--brass">The Custom Studio</div>
            <h2 className="display display--section" style={{ color: "var(--bone)" }}>
              From idea to
              <br />
              <span className="italic-clay">imprint</span>, in four.
            </h2>
            <p className="dark-copy">
              Bring a sketch, a photo, or a single line of text. We handle the rest: proof, print and stitch.
            </p>
            <Link href="/customize" className="button button--light">
              Start Customizing
              <ArrowRight />
            </Link>
          </div>
          <div className="step-grid">
            {steps.map((step) => (
              <article className="step-card" key={step.num}>
                <div className="step-card__num">{step.num}</div>
                <div className="step-card__title">{step.title}</div>
                <div className="step-card__body">{step.body}</div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="container section" data-reveal>
        <div style={{ marginBottom: 36 }}>
          <div className="eyebrow">Shop by Category</div>
          <h2 className="display display--section">Find your fit.</h2>
        </div>
        <div className="category-grid">
          {categories.map((category) => (
            <Link href="/shop" className="category-card" key={category.name}>
              <div className="category-card__art">
                <TeeGraphic fill={category.fill} width="50%" opacity={0.85} />
                <span className="category-card__count">{category.count}</span>
              </div>
              <div className="category-card__body">
                <div className="category-card__name">{category.name}</div>
                <div className="category-card__link">
                  Explore
                  <ArrowRight size={12} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="section section--border" data-reveal>
        <div className="container">
          <div style={{ marginBottom: 36 }}>
            <div className="eyebrow">Why Khud</div>
            <h2 className="display display--section">No shortcuts.</h2>
          </div>
          <div className="quality-grid">
            {quality.map((item) => (
              <article className="quality-card" key={item.no}>
                <div className="quality-card__no">{item.no}</div>
                <div className="quality-card__title">{item.title}</div>
                <div className="quality-card__body">{item.body}</div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section--clay" data-reveal>
        <div className="container newsletter">
          <div>
            <h2 className="display display--section" style={{ color: "var(--cream)" }}>
              Join the
              <br />
              first drop.
            </h2>
            <p>Early access to Drop 01, custom-studio openings, and nothing else. Unsubscribe whenever.</p>
          </div>
          <Newsletter />
        </div>
      </section>
    </main>
  );
}

function Stat({ value, label }) {
  return (
    <div>
      <div className="stat__value">{value}</div>
      <div className="stat__label">{label}</div>
    </div>
  );
}
