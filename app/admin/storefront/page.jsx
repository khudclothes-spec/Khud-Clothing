"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

const MAX_FOOTER = 3;

// Admin → Storefront. Two homepage/footer display controls:
//   A. Homepage hero — the single "best product" shown in the hero.
//   B. Footer categories — up to 3 categories listed in the footer Shop column.
export default function AdminStorefrontPage() {
  const supabase = createClient();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [counts, setCounts] = useState({});
  const [heroId, setHeroId] = useState("");
  const [footerIds, setFooterIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingHero, setSavingHero] = useState(false);
  const [savingFooter, setSavingFooter] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function getPublicUrl(path) {
    if (!path) return null;
    return supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
  }

  function coverFor(product) {
    const media = product?.product_media ?? [];
    const m = media.find((x) => x.is_primary) ?? media.find((x) => x.is_color_cover) ?? media[0];
    return m ? getPublicUrl(m.storage_path) : null;
  }

  async function fetchAll() {
    setLoading(true);
    setError("");
    const [{ data: prods, error: pErr }, { data: cats, error: cErr }, { data: prodRows }] =
      await Promise.all([
        supabase
          .from("products")
          .select("id, name, slug, price, status, is_hero, product_media(storage_path, is_primary, is_color_cover, sort_order)")
          .order("name"),
        supabase
          .from("categories")
          .select("id, name, slug, show_in_footer")
          .eq("is_active", true)
          .order("name"),
        supabase.from("products").select("category_id")
      ]);

    if (pErr || cErr) {
      setError(
        "Could not load storefront settings. Make sure migration 017_storefront_settings.sql has been run on your Supabase project."
      );
    }

    const c = {};
    (prodRows ?? []).forEach((p) => {
      if (p.category_id) c[p.category_id] = (c[p.category_id] || 0) + 1;
    });
    setCounts(c);
    setProducts(prods ?? []);
    setCategories(cats ?? []);
    setHeroId((prods ?? []).find((p) => p.is_hero)?.id ?? "");
    setFooterIds((cats ?? []).filter((cat) => cat.show_in_footer).map((cat) => cat.id));
    setLoading(false);
  }

  async function saveHero() {
    setSavingHero(true);
    setError("");
    setNotice("");
    try {
      // Only one hero at a time: clear, then set the chosen one (if any).
      await supabase.from("products").update({ is_hero: false }).eq("is_hero", true);
      if (heroId) {
        const { error: e } = await supabase.from("products").update({ is_hero: true }).eq("id", heroId);
        if (e) throw new Error(e.message);
      }
      setNotice("Homepage hero updated.");
      await fetchAll();
    } catch (e) {
      setError(e.message);
    } finally {
      setSavingHero(false);
    }
  }

  function toggleFooter(id) {
    setFooterIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_FOOTER) return prev; // hard cap at 3
      return [...prev, id];
    });
  }

  async function saveFooter() {
    setSavingFooter(true);
    setError("");
    setNotice("");
    try {
      await supabase.from("categories").update({ show_in_footer: false }).eq("show_in_footer", true);
      if (footerIds.length) {
        const { error: e } = await supabase
          .from("categories")
          .update({ show_in_footer: true })
          .in("id", footerIds);
        if (e) throw new Error(e.message);
      }
      setNotice("Footer categories updated.");
      await fetchAll();
    } catch (e) {
      setError(e.message);
    } finally {
      setSavingFooter(false);
    }
  }

  const heroProduct = products.find((p) => p.id === heroId) || null;
  const heroCover = heroProduct ? coverFor(heroProduct) : null;

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <div className="admin-eyebrow">Storefront</div>
          <h1 className="admin-page-title">Homepage &amp; Footer</h1>
        </div>
      </div>

      {error && <div className="admin-error">{error}</div>}
      {notice && <div className="admin-notice">{notice}</div>}

      {loading ? (
        <div className="admin-loading">Loading…</div>
      ) : (
        <>
          {/* A. Hero product */}
          <section className="admin-card">
            <div className="admin-detail__section-title">Homepage hero — best product</div>
            <p className="admin-hint" style={{ marginTop: 0 }}>
              Pick one product to feature in the homepage hero. It shows its cover image, name and
              price and links to the product page. Choose <strong>— None —</strong> to leave the hero
              area blank. (Only <strong>active</strong> products appear on the live site.)
            </p>

            <div className="admin-form-row admin-form-row--2" style={{ alignItems: "start" }}>
              <div className="form-group">
                <label className="form-label">Hero product</label>
                <select
                  className="form-input form-select"
                  value={heroId}
                  onChange={(e) => setHeroId(e.target.value)}
                >
                  <option value="">— None (blank hero) —</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                      {p.status !== "active" ? `  (${p.status})` : ""}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="button button--dark"
                  style={{ marginTop: 14 }}
                  onClick={saveHero}
                  disabled={savingHero}
                >
                  {savingHero ? "Saving…" : "Save hero"}
                </button>
              </div>

              <div className="form-group">
                <label className="form-label">Preview</label>
                {heroProduct ? (
                  <div className="hero-preview">
                    <div className="hero-preview__img">
                      {heroCover ? <img src={heroCover} alt={heroProduct.name} /> : <div className="admin-thumb-empty" />}
                    </div>
                    <div className="hero-preview__meta">
                      <div className="hero-preview__name">{heroProduct.name}</div>
                      <div className="hero-preview__price">Rs {Number(heroProduct.price).toLocaleString()}</div>
                      {heroProduct.status !== "active" && (
                        <div className="admin-muted">Not active — won’t show on the live site.</div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="admin-muted">No hero selected — the hero area will be blank.</div>
                )}
              </div>
            </div>
          </section>

          {/* B. Footer categories */}
          <section className="admin-card">
            <div className="admin-detail__section-title">Footer categories</div>
            <p className="admin-hint" style={{ marginTop: 0 }}>
              Choose up to <strong>{MAX_FOOTER}</strong> categories to list in the footer “Shop”
              column (under “All categories”). Selected <strong>{footerIds.length}</strong> /{" "}
              {MAX_FOOTER}.
            </p>

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: 80 }}>Footer</th>
                    <th>Category</th>
                    <th>Products</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((c) => {
                    const checked = footerIds.includes(c.id);
                    const atCap = !checked && footerIds.length >= MAX_FOOTER;
                    return (
                      <tr key={c.id}>
                        <td>
                          <input
                            type="checkbox"
                            className="form-checkbox"
                            checked={checked}
                            disabled={atCap}
                            onChange={() => toggleFooter(c.id)}
                            aria-label={`Show ${c.name} in footer`}
                          />
                        </td>
                        <td>
                          <div className="admin-product-name">{c.name}</div>
                          <span className="admin-product-slug">{c.slug}</span>
                        </td>
                        <td>{counts[c.id] ?? 0}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <button
              type="button"
              className="button button--dark"
              style={{ marginTop: 14 }}
              onClick={saveFooter}
              disabled={savingFooter}
            >
              {savingFooter ? "Saving…" : "Save footer categories"}
            </button>
          </section>
        </>
      )}
    </div>
  );
}
