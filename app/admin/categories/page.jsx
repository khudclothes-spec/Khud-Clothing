"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

function slugify(text) {
  return text.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-");
}

function emptyForm() {
  return { name: "", slug: "", description: "", is_active: true };
}

export default function AdminCategoriesPage() {
  const supabase = createClient();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | { mode: "add" } | { mode: "edit", category }
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const { data } = await supabase
      .from("categories")
      .select("id, name, slug, description, is_active, created_at")
      .order("name");
    setCategories(data ?? []);
    setLoading(false);
  }

  function openAdd() {
    setForm(emptyForm());
    setError("");
    setModal({ mode: "add" });
  }

  function openEdit(category) {
    setForm({
      name: category.name ?? "",
      slug: category.slug ?? "",
      description: category.description ?? "",
      is_active: category.is_active ?? true
    });
    setError("");
    setModal({ mode: "edit", category });
  }

  function closeModal() {
    setModal(null);
    setError("");
    setSaving(false);
  }

  function handleField(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => {
      const updated = { ...prev, [name]: type === "checkbox" ? checked : value };
      if (name === "name" && modal?.mode === "add") updated.slug = slugify(value);
      return updated;
    });
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      description: form.description.trim() || null,
      is_active: form.is_active
    };
    try {
      if (modal.mode === "add") {
        const { error: insErr } = await supabase.from("categories").insert(payload);
        if (insErr) throw new Error(insErr.message);
      } else {
        const { error: upErr } = await supabase.from("categories").update(payload).eq("id", modal.category.id);
        if (upErr) throw new Error(upErr.message);
      }
      await fetchAll();
      closeModal();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  async function toggleActive(category) {
    await supabase.from("categories").update({ is_active: !category.is_active }).eq("id", category.id);
    await fetchAll();
  }

  async function handleDelete(id) {
    await supabase.from("categories").delete().eq("id", id);
    setDeleteConfirm(null);
    await fetchAll();
  }

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <div className="admin-eyebrow">Catalogue</div>
          <h1 className="admin-page-title">Categories</h1>
        </div>
        <button type="button" className="button button--dark" onClick={openAdd}>+ Add Category</button>
      </div>

      {loading ? (
        <div className="admin-loading">Loading categories…</div>
      ) : categories.length === 0 ? (
        <div className="admin-empty">
          <p>No categories yet.</p>
          <button type="button" className="button button--outline" onClick={openAdd}>Add your first category</button>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Name</th><th>Slug</th><th>Description</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id}>
                  <td><div className="admin-product-name">{c.name}</div></td>
                  <td><span className="admin-product-slug">{c.slug}</span></td>
                  <td>{c.description ? <span className="admin-cat-desc">{c.description}</span> : <span className="admin-muted">—</span>}</td>
                  <td>
                    <button type="button" className={`status-badge status-badge--${c.is_active ? "active" : "draft"}`} onClick={() => toggleActive(c)} title="Toggle visibility">
                      {c.is_active ? "Active" : "Hidden"}
                    </button>
                  </td>
                  <td>
                    <div className="admin-actions">
                      <button type="button" className="admin-btn-edit" onClick={() => openEdit(c)}>Edit</button>
                      <button type="button" className="admin-btn-delete" onClick={() => setDeleteConfirm(c.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="admin-modal-overlay" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="admin-modal admin-modal--sm">
            <div className="admin-modal-head">
              <h2 className="admin-modal-title">{modal.mode === "add" ? "Add Category" : "Edit Category"}</h2>
              <button type="button" className="admin-modal-close" onClick={closeModal}>✕</button>
            </div>

            {error && <div className="admin-error">{error}</div>}

            <form onSubmit={handleSave} className="admin-form">
              <div className="admin-form-row admin-form-row--2">
                <div className="form-group">
                  <label className="form-label">Name *</label>
                  <input name="name" className="form-input" value={form.name} onChange={handleField} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Slug *</label>
                  <input name="slug" className="form-input" value={form.slug} onChange={handleField} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea name="description" className="form-input form-textarea" rows={3} value={form.description} onChange={handleField} placeholder="Optional" />
              </div>
              <div className="form-check">
                <input type="checkbox" id="cat-active" name="is_active" checked={form.is_active} onChange={handleField} className="form-checkbox" />
                <label htmlFor="cat-active" className="form-check-label">Active (visible on the storefront)</label>
              </div>
              <div className="admin-modal-foot">
                <button type="button" className="button button--outline" onClick={closeModal}>Cancel</button>
                <button type="submit" className="button button--dark" disabled={saving}>
                  {saving ? "Saving…" : modal.mode === "add" ? "Add Category" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="admin-modal-overlay" onClick={(e) => e.target === e.currentTarget && setDeleteConfirm(null)}>
          <div className="admin-modal admin-modal--sm">
            <h3 className="admin-modal-title">Delete category?</h3>
            <p className="admin-modal-body">Products in this category will keep existing but become uncategorised. This cannot be undone.</p>
            <div className="admin-modal-foot">
              <button type="button" className="button button--outline" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button type="button" className="button button--danger" onClick={() => handleDelete(deleteConfirm)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
