"use client";

import { Fragment, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

const MOCKUP_OPTIONS = [
  { value: "", label: "— None (SVG preview)" },
  { value: "classic", label: "Classic tee mockups" },
  { value: "oversized", label: "Oversized tee mockups" }
];

// Admin → Customization → Customizable Categories.
// Toggles which categories appear in the customer customization studio and which
// /public/mockups set each one uses.
export default function AdminCustomizationPage() {
  const supabase = createClient();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchAll() {
    setLoading(true);
    setError("");
    const { data, error: err } = await supabase
      .from("categories")
      .select("id, name, slug, is_active, is_customizable, mockup_key, custom_base_price, custom_half_sleeve_enabled, custom_half_sleeve_price, custom_full_sleeve_enabled, custom_full_sleeve_price")
      .order("name");
    if (err) {
      setError(
        "Could not load customization settings. Make sure migration 016_customization.sql has been run on your Supabase project."
      );
      setCategories([]);
    } else {
      setCategories(data ?? []);
    }
    setLoading(false);
  }

  async function patch(category, patchObj) {
    setBusyId(category.id);
    setError("");
    // optimistic update
    setCategories((list) => list.map((c) => (c.id === category.id ? { ...c, ...patchObj } : c)));
    const { error: err } = await supabase.from("categories").update(patchObj).eq("id", category.id);
    if (err) {
      setError(err.message);
      await fetchAll();
    }
    setBusyId(null);
  }

  const enabledCount = categories.filter((c) => c.is_customizable).length;

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <div className="admin-eyebrow">Customization</div>
          <h1 className="admin-page-title">Customizable Categories</h1>
        </div>
      </div>

      <p className="admin-hint" style={{ marginTop: 0 }}>
        Tick the categories you want available in the customer customization studio. Only checked
        categories appear there. Pick a mockup set so the studio shows the right shirt images.
        Currently <strong>{enabledCount}</strong> enabled.
      </p>

      {error && <div className="admin-error">{error}</div>}

      {loading ? (
        <div className="admin-loading">Loading categories…</div>
      ) : categories.length === 0 ? (
        <div className="admin-empty">
          <p>No categories found.</p>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Customizable</th>
                <th>Category</th>
                <th>Mockup set</th>
                <th>Pricing</th>
                <th>Storefront</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <Fragment key={c.id}>
                <tr>
                  <td>
                    <label className="admin-check">
                      <input
                        type="checkbox"
                        checked={!!c.is_customizable}
                        disabled={busyId === c.id}
                        onChange={(e) => patch(c, { is_customizable: e.target.checked })}
                      />
                      <span>{c.is_customizable ? "Enabled" : "Off"}</span>
                    </label>
                  </td>
                  <td>
                    <div className="admin-product-name">{c.name}</div>
                    <span className="admin-product-slug">{c.slug}</span>
                  </td>
                  <td>
                    <select
                      className="form-input admin-mockup-select"
                      value={c.mockup_key ?? ""}
                      disabled={busyId === c.id || !c.is_customizable}
                      onChange={(e) => patch(c, { mockup_key: e.target.value || null })}
                    >
                      {MOCKUP_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="admin-btn-edit"
                      disabled={!c.is_customizable}
                      onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                    >
                      {expandedId === c.id ? "Close" : "Sleeves & price"}
                    </button>
                  </td>
                  <td>
                    <span className={`status-badge status-badge--${c.is_active ? "active" : "draft"}`}>
                      {c.is_active ? "Active" : "Hidden"}
                    </span>
                  </td>
                </tr>
                {expandedId === c.id && (
                  <tr className="admin-detail-row">
                    <td colSpan={5}>
                      <SleevePricingEditor category={c} busy={busyId === c.id} onSave={(patchObj) => patch(c, patchObj)} />
                    </td>
                  </tr>
                )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="admin-hint">
        Note: a category must also be <strong>Active</strong> on the storefront to appear in the
        studio for shoppers.
      </p>
    </div>
  );
}

/* ───────────────────────── Sleeve pricing editor ───────────────────────── */

function SleevePricingEditor({ category, busy, onSave }) {
  const [form, setForm] = useState({
    custom_base_price: category.custom_base_price ?? "",
    custom_half_sleeve_enabled: !!category.custom_half_sleeve_enabled,
    custom_half_sleeve_price: category.custom_half_sleeve_price ?? "",
    custom_full_sleeve_enabled: !!category.custom_full_sleeve_enabled,
    custom_full_sleeve_price: category.custom_full_sleeve_price ?? ""
  });
  const [saved, setSaved] = useState(false);

  function set(name, value) { setForm((p) => ({ ...p, [name]: value })); setSaved(false); }

  function save() {
    onSave({
      custom_base_price: form.custom_base_price === "" ? null : Number(form.custom_base_price),
      custom_half_sleeve_enabled: !!form.custom_half_sleeve_enabled,
      custom_half_sleeve_price: form.custom_half_sleeve_price === "" ? null : Number(form.custom_half_sleeve_price),
      custom_full_sleeve_enabled: !!form.custom_full_sleeve_enabled,
      custom_full_sleeve_price: form.custom_full_sleeve_price === "" ? null : Number(form.custom_full_sleeve_price)
    });
    setSaved(true);
  }

  return (
    <div className="admin-detail sleeve-editor">
      <p className="admin-hint" style={{ marginTop: 0 }}>Set the base price and optional sleeve upgrades. Only enabled sleeve options show in the studio.</p>
      <div className="admin-form-row admin-form-row--3">
        <div className="form-group">
          <label className="form-label">Base price (Rs)</label>
          <input type="number" min="0" className="form-input" value={form.custom_base_price} onChange={(e) => set("custom_base_price", e.target.value)} placeholder="e.g. 4000" />
        </div>
        <div className="form-group">
          <label className="form-label">Half-sleeve price (Rs)</label>
          <input type="number" min="0" className="form-input" value={form.custom_half_sleeve_price} onChange={(e) => set("custom_half_sleeve_price", e.target.value)} disabled={!form.custom_half_sleeve_enabled} placeholder="0" />
          <label className="form-check" style={{ marginTop: 8 }}>
            <input type="checkbox" className="form-checkbox" checked={form.custom_half_sleeve_enabled} onChange={(e) => set("custom_half_sleeve_enabled", e.target.checked)} />
            <span className="form-check-label">Offer half sleeve</span>
          </label>
        </div>
        <div className="form-group">
          <label className="form-label">Full-sleeve price (Rs)</label>
          <input type="number" min="0" className="form-input" value={form.custom_full_sleeve_price} onChange={(e) => set("custom_full_sleeve_price", e.target.value)} disabled={!form.custom_full_sleeve_enabled} placeholder="0" />
          <label className="form-check" style={{ marginTop: 8 }}>
            <input type="checkbox" className="form-checkbox" checked={form.custom_full_sleeve_enabled} onChange={(e) => set("custom_full_sleeve_enabled", e.target.checked)} />
            <span className="form-check-label">Offer full sleeve</span>
          </label>
        </div>
      </div>
      <div className="admin-detail__foot">
        {saved && <span className="account-note account-note--ok" style={{ margin: 0, padding: "6px 10px" }}>Saved</span>}
        <button type="button" className="button button--dark" disabled={busy} onClick={save}>Save pricing</button>
      </div>
    </div>
  );
}
