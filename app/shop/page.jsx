import Link from "next/link";
import { ArrowRight } from "@/components/Icons";
import { TeeGraphic } from "@/components/TeeGraphic";
import { Reveal } from "@/components/Reveal";
import { COLORS, categories as localCategories } from "@/lib/data";
import { createServerClient } from "@/lib/supabase-server";

export const metadata = {
  title: "Shop by Category",
  description: "Browse Khud by category — oversized tees, hoodies, sweatshirts and custom prints."
};

const FILLS = [COLORS.ink, COLORS.charcoal, COLORS.olive, COLORS.clay, COLORS.brass, COLORS.terra];

export default async function ShopPage() {
  let categories = [];

  try {
    const supabase = await createServerClient();
    const { data: cats } = await supabase
      .from("categories")
      .select("id, name, slug, description, image_url")
      .eq("is_active", true)
      .order("name");

    if (cats?.length) {
      const { data: prods } = await supabase
        .from("products")
        .select("category_id")
        .eq("status", "active");

      const counts = {};
      (prods ?? []).forEach((p) => {
        if (p.category_id) counts[p.category_id] = (counts[p.category_id] ?? 0) + 1;
      });

      categories = cats.map((c) => ({
        name: c.name,
        slug: c.slug,
        description: c.description,
        image: c.image_url ?? null,
        count: `${counts[c.id] ?? 0} ${(counts[c.id] ?? 0) === 1 ? "style" : "styles"}`
      }));
    }
  } catch {
    // DB not configured — fall back to local categories below
  }

  // Fallback: render the static categories (no dynamic links) so the page is never empty
  const usingDb = categories.length > 0;
  const list = usingDb
    ? categories
    : localCategories.map((c) => ({ name: c.name, slug: null, count: c.count }));

  return (
    <main className="container">
      <section className="page-title" data-reveal>
        <div className="eyebrow">The Shop</div>
        <h1 className="display display--large">Shop by category.</h1>
        <p>{list.length} categor{list.length !== 1 ? "ies" : "y"} to explore.</p>
      </section>

      <section className="section" style={{ paddingTop: 12 }}>
        <div className="category-grid category-grid--shop">
          {list.map((category, index) => {
            const fill = FILLS[index % FILLS.length];
            const inner = (
              <>
                <div className="category-card__art">
                  {category.image ? (
                    <img src={category.image} alt={category.name} className="category-card__photo" />
                  ) : (
                    <TeeGraphic fill={fill} width="50%" opacity={0.85} />
                  )}
                  <span className="category-card__count">{category.count}</span>
                </div>
                <div className="category-card__body">
                  <div className="category-card__name">{category.name}</div>
                  {category.slug && (
                    <div className="category-card__link">
                      Explore
                      <ArrowRight size={12} />
                    </div>
                  )}
                </div>
              </>
            );

            return category.slug ? (
              <Reveal key={category.slug} delay={index * 0.05}>
                <Link href={`/shop/${category.slug}`} className="category-card">
                  {inner}
                </Link>
              </Reveal>
            ) : (
              <Reveal key={category.name} delay={index * 0.05}>
                <div className="category-card category-card--static">{inner}</div>
              </Reveal>
            );
          })}
        </div>
      </section>
    </main>
  );
}
