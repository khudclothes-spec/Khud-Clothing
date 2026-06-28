"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { StarRating } from "@/components/StarRating";
import Link from "next/link";

export default function NewReviewPage() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ product_id: "", rating: 0, title: "", body: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    async function init() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        router.push("/login");
        return;
      }
      setUser(authUser);

      const { data: prods } = await supabase
        .from("products")
        .select("id, name")
        .eq("status", "active")
        .order("name");
      setProducts(prods ?? []);
      setLoading(false);
    }
    init();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.rating === 0) { setError("Please select a star rating."); return; }
    if (!form.product_id) { setError("Please select a product."); return; }
    setSaving(true);
    setError("");

    const comment = [form.title.trim(), form.body.trim()].filter(Boolean).join("\n\n") || null;

    const { error: insertError } = await supabase.from("reviews").insert({
      product_id: form.product_id,
      profile_id: user.id,
      rating: form.rating,
      comment,
      approved: false
    });

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    setDone(true);
  }

  if (loading) return <main className="container" style={{ padding: "80px 0" }}>Loading…</main>;

  if (done) {
    return (
      <main className="auth-page">
        <div className="auth-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>★</div>
          <h2 className="auth-heading">Thanks for your review!</h2>
          <p style={{ color: "var(--charcoal)", marginBottom: 24 }}>
            Your review has been submitted and will appear once approved.
          </p>
          <Link href="/shop" className="button button--dark">Back to Shop</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="auth-page" style={{ alignItems: "flex-start", paddingTop: 60 }}>
      <div className="auth-card" style={{ maxWidth: 520 }}>
        <h1 className="auth-heading">Write a Review</h1>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Product *</label>
            <select
              className="form-input form-select"
              value={form.product_id}
              onChange={(e) => setForm({ ...form, product_id: e.target.value })}
              required
            >
              <option value="">— Select a product —</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Rating *</label>
            <StarRating
              value={form.rating}
              onChange={(r) => setForm({ ...form, rating: r })}
              interactive
              size={28}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Review Title <span className="form-optional">(optional)</span></label>
            <input
              className="form-input"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Summarise your experience"
              maxLength={120}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Your Review <span className="form-optional">(optional)</span></label>
            <textarea
              className="form-input form-textarea"
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              placeholder="Tell us what you thought…"
              rows={5}
            />
          </div>

          <button type="submit" className="button button--dark auth-submit" disabled={saving}>
            {saving ? "Submitting…" : "Submit Review"}
          </button>
          <div className="auth-footer-link">
            <Link href="/shop" className="auth-link">Cancel</Link>
          </div>
        </form>
      </div>
    </main>
  );
}
