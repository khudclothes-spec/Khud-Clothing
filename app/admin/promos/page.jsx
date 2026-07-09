"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Close } from "@/components/Icons";

const TYPES = [
  { value: "percentage", label: "Percentage (%)" },
  { value: "fixed", label: "Fixed amount (Rs)" },
  { value: "student", label: "Student (%) — verified only" }
];

function emptyForm() {
  return {
    code: "",
    description: "",
    discount_type: "percentage",
    discount_value: "",
    min_subtotal: "",
    max_uses: "",
    requires_student: false,
    expires_at: "",
    is_enabled: true
  };
}

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function AdminPromosPage() {
  const supabase = createClient();
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll(silent = false) {
    if (!silent) setLoading(true);
    const { data } = await supabase
      .from("promo_codes")
      .select("id, code, description, discount_type, discount_value, min_subtotal, max_uses, current_uses, requires_student, expires_at, is_enabled, created_at")
      .order("created_at", { ascending: false });
    setCodes(data ?? []);
    if (!silent) setLoading(false);
  }

  function openNew() {
    setEditing(null);
    setForm(emptyForm());
    setError("");
    setShowForm(true);
  }

  function openEdit(c) {
    setEditing(c);
    setForm({
      code: c.code,
      description: c.description ?? "",
      discount_type: c.discount_type,
      discount_value: String(c.discount_value ?? ""),
      min_subtotal: c.min_subtotal ? String(c.min_subtotal) : "",
      max_uses: c.max_uses != null ? String(c.max_uses) : "",
      requires_student: c.requires_student,
      expires_at: c.expires_at ? c.expires_at.slice(0, 10) : "",
      is_enabled: c.is_enabled
    });
    setError("");
    setShowForm(true);
  }

  function field(name, value) {
    setForm((p) => {
      const next = { ...p, [name]: value };
      if (name === "discount_type" && value === "student") next.requires_student = true;
      return next;
    });
  }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        description: form.description.trim() || null,
        discount_type: form.discount_type,
        discount_value: Number(form.discount_value) || 0,
        min_subtotal: Number(form.min_subtotal) || 0,
        max_uses: form.max_uses === "" ? null : Number(form.max_uses),
        requires_student: form.discount_type === "student" ? true : !!form.requires_student,
        expires_at: form.expires_at ? new Date(`${form.expires_at}T23:59:59`).toISOString() : null,
        is_enabled: !!form.is_enabled
      };
      if (!payload.code) throw new Error("Enter a code.");

      if (editing) {
        const { error: upErr } = await supabase.from("promo_codes").update(payload).eq("id", editing.id);
        if (upErr) throw new Error(upErr.message);
      } else {
        const { error: insErr } = await supabase.from("promo_codes").insert(payload);
        if (insErr) throw new Error(insErr.message.includes("duplicate") ? "A code with that name already exists." : insErr.message);
      }
      setShowForm(false);
      await fetchAll(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleEnabled(c) {
    await supabase.from("promo_codes").update({ is_enabled: !c.is_enabled }).eq("id", c.id);
    await fetchAll(true);
  }

  async function remove(id) {
    await supabase.from("promo_codes").delete().eq("id", id);
    await fetchAll(true);
  }

  function valueLabel(c) {
    return c.discount_type === "fixed" ? `Rs ${Number(c.discount_value).toLocaleString()}` : `${c.discount_value}%`;
  }

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <div className="admin-eyebrow">Marketing</div>
          <h1 className="admin-page-title">Promo Codes</h1>
        </div>
        <button type="button" className="button button--dark" onClick={openNew}>+ Add Code</button>
      </div>

      {loading ? (
        <div className="admin-loading">Loading codes…</div>
      ) : codes.length === 0 ? (
        <div className="admin-empty"><p>No promo codes yet.</p><button type="button" className="button button--outline" onClick={openNew}>Add your first code</button></div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Code</th><th>Type</th><th>Value</th><th>Min</th><th>Uses</th><th>Expires</th><th>Enabled</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {codes.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div className="admin-product-name">{c.code}{c.requires_student ? <span className="admin-soldout-pill" style={{ background: "var(--olive)" }}>Student</span> : null}</div>
                    {c.description && <div className="admin-product-slug">{c.description}</div>}
                  </td>
                  <td>{c.discount_type}</td>
                  <td>{valueLabel(c)}</td>
                  <td>{c.min_subtotal > 0 ? `Rs ${Number(c.min_subtotal).toLocaleString()}` : "—"}</td>
                  <td>{c.current_uses}{c.max_uses != null ? ` / ${c.max_uses}` : ""}</td>
                  <td>{fmtDate(c.expires_at)}</td>
                  <td>
                    <button type="button" className={`status-badge status-badge--${c.is_enabled ? "active" : "draft"}`} onClick={() => toggleEnabled(c)}>
                      {c.is_enabled ? "Enabled" : "Disabled"}
                    </button>
                  </td>
                  <td>
                    <div className="admin-actions">
                      <button type="button" className="admin-btn-edit" onClick={() => openEdit(c)}>Edit</button>
                      <button type="button" className="admin-btn-delete" onClick={() => remove(c.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="admin-modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <div className="admin-modal">
            <div className="admin-modal-head">
              <h2 className="admin-modal-title">{editing ? "Edit Code" : "Add Promo Code"}</h2>
              <button type="button" className="admin-modal-close" onClick={() => setShowForm(false)}><Close size={16} /></button>
            </div>
            {error && <div className="admin-error">{error}</div>}
            <form onSubmit={save} className="admin-form">
              <div className="admin-form-row admin-form-row--2">
                <div className="form-group">
                  <label className="form-label">Code *</label>
                  <input className="form-input" value={form.code} onChange={(e) => field("code", e.target.value)} placeholder="WELCOME10" required style={{ textTransform: "uppercase" }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select className="form-input form-select" value={form.discount_type} onChange={(e) => field("discount_type", e.target.value)}>
                    {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="admin-form-row admin-form-row--2">
                <div className="form-group">
                  <label className="form-label">{form.discount_type === "fixed" ? "Amount (Rs)" : "Percent (%)"} *</label>
                  <input type="number" min="0" step="0.01" className="form-input" value={form.discount_value} onChange={(e) => field("discount_value", e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Min subtotal (Rs)</label>
                  <input type="number" min="0" className="form-input" value={form.min_subtotal} onChange={(e) => field("min_subtotal", e.target.value)} placeholder="0" />
                </div>
              </div>
              <div className="admin-form-row admin-form-row--2">
                <div className="form-group">
                  <label className="form-label">Max uses</label>
                  <input type="number" min="0" className="form-input" value={form.max_uses} onChange={(e) => field("max_uses", e.target.value)} placeholder="Unlimited" />
                </div>
                <div className="form-group">
                  <label className="form-label">Expires on</label>
                  <input type="date" className="form-input" value={form.expires_at} onChange={(e) => field("expires_at", e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input className="form-input" value={form.description} onChange={(e) => field("description", e.target.value)} placeholder="Shown internally" />
              </div>
              <div className="form-check">
                <input type="checkbox" id="promo-student" className="form-checkbox" checked={form.requires_student} disabled={form.discount_type === "student"} onChange={(e) => field("requires_student", e.target.checked)} />
                <label htmlFor="promo-student" className="form-check-label">Verified students only</label>
              </div>
              <div className="form-check">
                <input type="checkbox" id="promo-enabled" className="form-checkbox" checked={form.is_enabled} onChange={(e) => field("is_enabled", e.target.checked)} />
                <label htmlFor="promo-enabled" className="form-check-label">Enabled</label>
              </div>
              <div className="admin-modal-foot">
                <button type="button" className="button button--outline" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="button button--dark" disabled={saving}>{saving ? "Saving…" : editing ? "Save changes" : "Create code"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
