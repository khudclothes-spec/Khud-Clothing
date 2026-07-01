import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "@/components/Icons";
import { Newsletter } from "@/components/Newsletter";
import { FeaturedProducts } from "@/components/FeaturedProducts";
import { TeeGraphic } from "@/components/TeeGraphic";
import { categories, COLORS, quality, steps, TEE_PATH, formatPrice } from "@/lib/data";
import { createPublicClient } from "@/lib/supabase-server";
import { mapDbProduct } from "@/lib/mapDbProduct";

const HERO_PRODUCT_SELECT =
  "id, name, slug, price, status, is_hero, product_media(storage_path, color, is_primary, is_color_cover, sort_order), product_variants(id, color, size, stock_quantity)";
const FEATURED_SELECT =
  "id, name, slug, price, short_description, status, is_featured, categories(name), product_media(storage_path, color, is_primary, is_color_cover, sort_order), product_variants(id, color, size, stock_quantity)";

// Cache the public homepage and regenerate at most once a minute (ISR) so
// navigating back is near-instant instead of re-querying the DB every time.
export const revalidate = 60;

export const metadata = {
  title: "Khud — Wear Your Imprint",
  description: "Premium ready-made clothing and a custom-print studio. Design yourself."
};

export default async function HomePage() {
  let featured = [];
  let dbReviews = [];
  let shopCategories = [];
  let heroProduct = null;

  try {
    const supabase = createPublicClient();

    // Fire every public query at once instead of awaiting them one by one.
    const [heroRes, featuredRes, catsRes, countRes, reviewsRes] = await Promise.all([
      supabase.from("products").select(HERO_PRODUCT_SELECT).eq("is_hero", true).eq("status", "active").limit(1),
      supabase.from("products").select(FEATURED_SELECT).eq("status", "active").eq("is_featured", true).order("created_at", { ascending: false }).limit(4),
      supabase.from("categories").select("id, name, slug, image_url").eq("is_active", true).order("name"),
      supabase.from("products").select("category_id").eq("status", "active"),
      supabase.from("reviews").select("id, rating, comment, created_at, profiles(full_name), products(name)").eq("approved", true).order("rating", { ascending: false }).order("created_at", { ascending: false }).limit(6)
    ]);

    if (heroRes.data?.length) heroProduct = mapDbProduct(heroRes.data[0]);
    if (featuredRes.data?.length) featured = featuredRes.data.map(mapDbProduct);

    const cats = catsRes.data ?? [];
    if (cats.length) {
      const counts = {};
      (countRes.data ?? []).forEach((p) => {
        if (p.category_id) counts[p.category_id] = (counts[p.category_id] ?? 0) + 1;
      });
      shopCategories = cats.map((c) => ({
        name: c.name,
        slug: c.slug,
        image: c.image_url ?? null,
        count: `${counts[c.id] ?? 0} ${(counts[c.id] ?? 0) === 1 ? "style" : "styles"}`
      }));
    }

    dbReviews = reviewsRes.data ?? [];
  } catch {
    // DB not configured yet — local fallback is already set
  }

  // Build the category cards: active DB categories (linked) + a Customize card.
  // Fall back to static categories only when the DB has none.
  const FILLS = [COLORS.ink, COLORS.charcoal, COLORS.olive, COLORS.clay, COLORS.brass, COLORS.terra];
  const categoryCards = (
    shopCategories.length > 0
      ? shopCategories.map((c, i) => ({
          name: c.name,
          count: c.count,
          href: `/shop/${c.slug}`,
          image: c.image ?? null,
          fill: FILLS[i % FILLS.length]
        }))
      : categories.map((c, i) => ({
          name: c.name,
          count: c.count,
          href: "/shop",
          image: null,
          fill: c.fill ?? FILLS[i % FILLS.length]
        }))
  ).concat({
    name: "Customize",
    count: "Made to order",
    href: "/customize",
    image: "/mockups/classic/black/front.png",
    fill: COLORS.clay
  });

  return (
    <main>
      <section className="container hero">
        <div className="hero__intro">
          <div className="hero__kicker">
            <span className="hero__kicker-line" />
            <span className="hero__kicker-text">Drop 01 / Summer '26</span>
          </div>
          <h1 className="display display--hero">
            <span className="hero__word hero__word--block">WEAR</span>
            <span className="hero__word hero__word--block">YOUR</span>
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
            <Stat value="5-7" label="Business Days Custom Print" />
            <span className="stat__rule" />
            <Stat value="PK" label="Made Local" />
          </div>
        </div>

        <div className="hero-visual">
          {heroProduct ? (
            <Link href={`/product/${heroProduct.slug}`} className="hero-visual__link">
              <div className="hero-visual__card">
                <div className="hero-visual__watermark">
                  <img src="/images/logo-black-writing.png" alt="" />
                </div>
                {heroProduct.image ? (
                  <Image src={heroProduct.image} alt={heroProduct.name} className="hero-visual__photo" fill priority sizes="(max-width: 900px) 90vw, 40vw" />
                ) : (
                  <div className="hero-visual__tee">
                    <TeeGraphic path={TEE_PATH} fill={COLORS.ink} width="55%" />
                  </div>
                )}
                <div className="hero-visual__badge">
                  <strong>best</strong>
                  <span>SELLER</span>
                </div>
                <div className="hero-visual__accent" />
              </div>
              <div className="floating-product">
                <div className="floating-product__tag">Bestseller</div>
                <div className="floating-product__name">{heroProduct.name}</div>
                <div className="floating-product__price">{formatPrice(heroProduct.price)}</div>
              </div>
            </Link>
          ) : null}
        </div>
      </section>

      {featured.length > 0 && (
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
          <FeaturedProducts products={featured} />
        </section>
      )}

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
              Bring a sketch, a photo, or a single line of text. We handle the rest: proof, print and deliver.
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
          {categoryCards.map((category) => (
            <Link href={category.href} className="category-card" key={category.name}>
              <div className="category-card__art">
                {category.image ? (
                  <Image src={category.image} alt={category.name} className="category-card__photo" fill sizes="(max-width: 700px) 45vw, 22vw" />
                ) : (
                  <TeeGraphic fill={category.fill} width="50%" opacity={0.85} />
                )}
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

      {dbReviews.length > 0 && (
        <section className="container section" data-reveal>
          <div className="section-head">
            <div>
              <div className="eyebrow">Customer Reviews</div>
              <h2 className="display display--section">What they say.</h2>
            </div>
            <Link href="/reviews/new" className="link-button">
              Write a review
              <ArrowRight size={14} />
            </Link>
          </div>
          <div className="reviews-grid">
            {dbReviews.map((review) => (
              <article key={review.id} className="review-card">
                <div className="review-card__stars">
                  {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                </div>
                <p className="review-card__body">{review.comment}</p>
                <div className="review-card__meta">
                  <span>{review.profiles?.full_name ?? "Customer"}</span>
                  {review.products?.name && <span className="review-card__product">· {review.products.name}</span>}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="section--newsletter" data-reveal>
        <div className="container">
          <div className="newsletter-card">
            <div>
              <div className="eyebrow">First Drop</div>
              <h2 className="display display--section" style={{ color: "var(--bone)" }}>
                Join the
                <br />
                <span className="italic-clay">first drop.</span>
              </h2>
              <p>Early access to Drop 01, custom-studio openings, and everything else. Unsubscribe whenever.</p>
            </div>
            <Newsletter />
          </div>
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
