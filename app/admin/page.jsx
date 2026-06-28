"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { customColors, customSizes } from "@/lib/data";
import { ChevronDown, Close } from "@/components/Icons";

const STATUS_LABELS = { draft: "Draft", active: "Active", archived: "Archived" };
const COLOR_OPTIONS = customColors.map((c) => c.name); // Bone, Black, Clay, Olive, Grey
const SIZE_OPTIONS = customSizes;                       // S, M, L, XL, XXL

function slugify(text) {
  return text.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-");
}

// Auto-generate a Stock Keeping Unit so the admin never types one.
function makeVariantSku(slug, color, size) {
  return `${slug}-${color}-${size}`.toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function emptyProductForm() {
  return {
    name: "",
    slug: "",
    price: "",
    category_id: "",
    description: "",
    short_description: "",
    status: "active",
    is_featured: false
  };
}

export default function AdminProductsPage() {
  const supabase = createClient();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [{ data: prods }, { data: cats }] = await Promise.all([
      supabase
        .from("products")
        .select("id, name, slug, price, status, is_featured, category_id, short_description, description, created_at, categories(name), product_media(id, storage_path, is_primary), product_variants(id, color, size, stock_quantity, sku, is_active)")
        .order("created_at", { ascending: false }),
      supabase.from("categories").select("id, name").eq("is_active", true).order("name")
    ]);
    setProducts(prods ?? []);
    setCategories(cats ?? []);
    setLoading(false);
  }

  function getPublicUrl(storagePath) {
    if (!storagePath) return null;
    return supabase.storage.from("product-images").getPublicUrl(storagePath).data.publicUrl;
  }

  function primaryImage(product) {
    const media = product.product_media ?? [];
    const primary = media.find((m) => m.is_primary) ?? media[0];
    return primary ? getPublicUrl(primary.storage_path) : null;
  }

  function variantSummary(product) {
    const variants = product.product_variants ?? [];
    if (variants.length === 0) return { total: 0, inStock: 0, label: "No variants" };
    const inStock = variants.filter((v) => v.stock_quantity > 0).length;
    const totalStock = variants.reduce((t, v) => t + v.stock_quantity, 0);
    return { total: variants.length, inStock, totalStock, label: `${variants.length} variant${variants.length !== 1 ? "s" : ""}` };
  }

  async function toggleStatus(product) {
    const next = product.status === "active" ? "draft" : "active";
    await supabase.from("products").update({ status: next }).eq("id", product.id);
    await fetchAll();
  }

  async function handleDelete(productId) {
    await supabase.from("products").delete().eq("id", productId);
    setDeleteConfirm(null);
    await fetchAll();
  }

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <div className="admin-eyebrow">Catalogue</div>
          <h1 className="admin-page-title">Products</h1>
        </div>
        <button type="button" className="button button--dark" onClick={() => setShowAdd(true)}>
          + Add Product
        </button>
      </div>

      {loading ? (
        <div className="admin-loading">Loading products…</div>
      ) : products.length === 0 ? (
        <div className="admin-empty">
          <p>No products yet.</p>
          <button type="button" className="button button--outline" onClick={() => setShowAdd(true)}>Add your first product</button>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table admin-table--expandable">
            <thead>
              <tr>
                <th style={{ width: 36 }}></th>
                <th>Image</th>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Featured</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const img = primaryImage(p);
                const vs = variantSummary(p);
                const isOpen = expandedId === p.id;
                return (
                  <ProductRow
                    key={p.id}
                    product={p}
                    categories={categories}
                    supabase={supabase}
                    img={img}
                    variantSummary={vs}
                    isOpen={isOpen}
                    onToggleExpand={() => setExpandedId(isOpen ? null : p.id)}
                    onToggleStatus={() => toggleStatus(p)}
                    onAskDelete={() => setDeleteConfirm(p.id)}
                    onChanged={fetchAll}
                    getPublicUrl={getPublicUrl}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && (
        <AddProductModal
          supabase={supabase}
          categories={categories}
          onClose={() => setShowAdd(false)}
          onSaved={async () => { setShowAdd(false); await fetchAll(); }}
        />
      )}

      {deleteConfirm && (
        <div className="admin-modal-overlay" onClick={(e) => e.target === e.currentTarget && setDeleteConfirm(null)}>
          <div className="admin-modal admin-modal--sm">
            <h3 className="admin-modal-title">Delete product?</h3>
            <p className="admin-modal-body">This permanently removes the product, its media, and all its variants. This cannot be undone.</p>
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

/* ───────────────────────── Product row (expandable + inline edit) ───────────────────────── */

function ProductRow({ product, categories, supabase, img, variantSummary, isOpen, onToggleExpand, onToggleStatus, onAskDelete, onChanged, getPublicUrl }) {
  const [form, setForm] = useState(() => ({
    name: product.name ?? "",
    slug: product.slug ?? "",
    price: product.price ?? "",
    category_id: product.category_id ?? "",
    description: product.description ?? "",
    short_description: product.short_description ?? "",
    status: product.status ?? "draft",
    is_featured: product.is_featured ?? false
  }));
  const [imageFile, setImageFile] = useState(null);
  const [variants, setVariants] = useState(product.product_variants ?? []);
  const [newVariant, setNewVariant] = useState({ color: COLOR_OPTIONS[0], customColor: "", size: SIZE_OPTIONS[0], stock_quantity: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Keep local copies fresh when the parent reloads
  useEffect(() => {
    setVariants(product.product_variants ?? []);
  }, [product.product_variants]);

  function handleField(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => {
      const updated = { ...prev, [name]: type === "checkbox" ? checked : value };
      if (name === "name") updated.slug = slugify(value);
      return updated;
    });
  }

  async function uploadImage(productId) {
    if (!imageFile) return null;
    const ext = imageFile.name.split(".").pop();
    const path = `products/${productId}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("product-images").upload(path, imageFile, { upsert: true });
    if (upErr) throw new Error(upErr.message);
    return path;
  }

  async function saveProduct(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        price: parseFloat(form.price),
        category_id: form.category_id || null,
        description: form.description.trim() || null,
        short_description: form.short_description.trim() || null,
        sku: form.slug.trim().toUpperCase(),
        status: form.status,
        is_featured: form.is_featured
      };
      const { error: upErr } = await supabase.from("products").update(payload).eq("id", product.id);
      if (upErr) throw new Error(upErr.message);

      if (imageFile) {
        const path = await uploadImage(product.id);
        await supabase.from("product_media").delete().eq("product_id", product.id).eq("is_primary", true);
        await supabase.from("product_media").insert({ product_id: product.id, storage_path: path, is_primary: true });
      }

      // Persist any stock edits to existing variants
      for (const v of variants) {
        const original = (product.product_variants ?? []).find((o) => o.id === v.id);
        if (original && Number(original.stock_quantity) !== Number(v.stock_quantity)) {
          await supabase.from("product_variants").update({ stock_quantity: Number(v.stock_quantity) || 0 }).eq("id", v.id);
        }
      }

      setImageFile(null);
      await onChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function setVariantStock(id, value) {
    setVariants((vs) => vs.map((v) => (v.id === id ? { ...v, stock_quantity: value } : v)));
  }

  async function addVariant() {
    setError("");
    const color = newVariant.color === "__custom__" ? newVariant.customColor.trim() : newVariant.color;
    if (!color) { setError("Enter a colour name."); return; }
    const exists = variants.some((v) => v.color.toLowerCase() === color.toLowerCase() && v.size === newVariant.size);
    if (exists) { setError(`A ${color} / ${newVariant.size} variant already exists.`); return; }
    const sku = makeVariantSku(form.slug || product.slug, color, newVariant.size);
    const { error: insErr } = await supabase.from("product_variants").insert({
      product_id: product.id,
      color,
      size: newVariant.size,
      stock_quantity: Number(newVariant.stock_quantity) || 0,
      sku
    });
    if (insErr) { setError(insErr.message); return; }
    setNewVariant({ color: COLOR_OPTIONS[0], customColor: "", size: SIZE_OPTIONS[0], stock_quantity: "" });
    await onChanged();
  }

  async function deleteVariant(id) {
    await supabase.from("product_variants").delete().eq("id", id);
    await onChanged();
  }

  return (
    <>
      <tr className={isOpen ? "is-expanded" : ""}>
        <td>
          <button type="button" className={`row-expand ${isOpen ? "is-open" : ""}`} onClick={onToggleExpand} aria-label={isOpen ? "Collapse" : "Expand"}>
            <ChevronDown size={14} />
          </button>
        </td>
        <td>
          <div className="admin-thumb">
            {img ? <img src={img} alt={product.name} /> : <div className="admin-thumb-empty" />}
          </div>
        </td>
        <td>
          <div className="admin-product-name">{product.name}</div>
          <div className="admin-product-slug">{product.slug}</div>
        </td>
        <td>{product.categories?.name ?? <span className="admin-muted">—</span>}</td>
        <td>Rs {Number(product.price).toLocaleString()}</td>
        <td>
          {variantSummary.total === 0 ? (
            <span className="admin-muted">—</span>
          ) : (
            <span className="stock-pill">{variantSummary.inStock}/{variantSummary.total} in stock</span>
          )}
        </td>
        <td>
          <button type="button" className={`status-badge status-badge--${product.status}`} onClick={onToggleStatus} title="Toggle active/draft">
            {STATUS_LABELS[product.status]}
          </button>
        </td>
        <td><span className={`featured-dot ${product.is_featured ? "is-on" : ""}`} /></td>
        <td>
          <div className="admin-actions">
            <button type="button" className="admin-btn-edit" onClick={onToggleExpand}>{isOpen ? "Close" : "Edit"}</button>
            <button type="button" className="admin-btn-delete" onClick={onAskDelete}>Delete</button>
          </div>
        </td>
      </tr>

      {isOpen && (
        <tr className="admin-detail-row">
          <td colSpan={9}>
            <div className="admin-detail">
              {error && <div className="admin-error">{error}</div>}

              <form onSubmit={saveProduct} className="admin-detail__form">
                <div className="admin-detail__section-title">Product details</div>
                <div className="form-group">
                  <label className="form-label">Name *</label>
                  <input name="name" className="form-input" value={form.name} onChange={handleField} required />
                  <span className="slug-preview">URL slug (auto): <code>{form.slug || "—"}</code></span>
                </div>

                <div className="admin-form-row admin-form-row--3">
                  <div className="form-group">
                    <label className="form-label">Price (PKR) *</label>
                    <input name="price" type="number" step="0.01" min="0" className="form-input" value={form.price} onChange={handleField} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select name="category_id" className="form-input form-select" value={form.category_id} onChange={handleField}>
                      <option value="">— None —</option>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select name="status" className="form-input form-select" value={form.status} onChange={handleField}>
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Short description</label>
                  <input name="short_description" className="form-input" value={form.short_description} onChange={handleField} placeholder="One-line summary" />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea name="description" className="form-input form-textarea" rows={3} value={form.description} onChange={handleField} />
                </div>

                <div className="admin-form-row admin-form-row--2">
                  <div className="form-group">
                    <label className="form-label">Replace image</label>
                    <input type="file" accept="image/*" className="form-input form-file" onChange={(e) => setImageFile(e.target.files[0] ?? null)} />
                  </div>
                  <div className="form-check" style={{ alignSelf: "end" }}>
                    <input type="checkbox" id={`feat-${product.id}`} name="is_featured" checked={form.is_featured} onChange={handleField} className="form-checkbox" />
                    <label htmlFor={`feat-${product.id}`} className="form-check-label">Featured product</label>
                  </div>
                </div>

                <div className="admin-detail__section-title">Variants — size, colour &amp; stock</div>
                <p className="admin-hint">SKU is auto-generated. A variant is automatically archived (sold out) when its stock reaches 0.</p>

                {variants.length === 0 ? (
                  <div className="admin-muted" style={{ padding: "8px 0" }}>No variants yet — add size/colour combinations below.</div>
                ) : (
                  <table className="variant-table">
                    <thead>
                      <tr>
                        <th>Colour</th><th>Size</th><th>SKU</th><th>Stock</th><th>Status</th><th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {variants.map((v) => {
                        const stockNum = Number(v.stock_quantity) || 0;
                        return (
                          <tr key={v.id}>
                            <td>{v.color}</td>
                            <td>{v.size}</td>
                            <td className="variant-sku">{v.sku ?? makeVariantSku(product.slug, v.color, v.size)}</td>
                            <td>
                              <input
                                type="number"
                                min="0"
                                className="form-input variant-stock-input"
                                value={v.stock_quantity}
                                onChange={(e) => setVariantStock(v.id, e.target.value)}
                              />
                            </td>
                            <td>
                              <span className={`variant-badge ${stockNum > 0 ? "is-active" : "is-archived"}`}>
                                {stockNum > 0 ? "Active" : "Archived"}
                              </span>
                            </td>
                            <td>
                              <button type="button" className="variant-del" onClick={() => deleteVariant(v.id)} aria-label="Delete variant">
                                <Close size={13} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}

                <div className="variant-add">
                  <select className="form-input form-select" value={newVariant.color} onChange={(e) => setNewVariant({ ...newVariant, color: e.target.value })}>
                    {COLOR_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                    <option value="__custom__">Custom colour…</option>
                  </select>
                  {newVariant.color === "__custom__" && (
                    <input className="form-input" placeholder="Colour name" value={newVariant.customColor} onChange={(e) => setNewVariant({ ...newVariant, customColor: e.target.value })} />
                  )}
                  <select className="form-input form-select" value={newVariant.size} onChange={(e) => setNewVariant({ ...newVariant, size: e.target.value })}>
                    {SIZE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <input type="number" min="0" className="form-input variant-stock-input" placeholder="Qty" value={newVariant.stock_quantity} onChange={(e) => setNewVariant({ ...newVariant, stock_quantity: e.target.value })} />
                  <button type="button" className="button button--outline" onClick={addVariant}>+ Add variant</button>
                </div>

                <div className="admin-detail__foot">
                  <button type="button" className="button button--outline" onClick={onToggleExpand}>Cancel</button>
                  <button type="submit" className="button button--dark" disabled={saving}>
                    {saving ? "Saving…" : "Save changes"}
                  </button>
                </div>
              </form>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

/* ───────────────────────── Add product (with variant builder) ───────────────────────── */

function AddProductModal({ supabase, categories, onClose, onSaved }) {
  const [form, setForm] = useState(emptyProductForm());
  const [imageFile, setImageFile] = useState(null);
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [customColor, setCustomColor] = useState("");
  const [combos, setCombos] = useState({}); // key "Color|Size" -> qty string
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function handleField(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => {
      const updated = { ...prev, [name]: type === "checkbox" ? checked : value };
      if (name === "name") updated.slug = slugify(value);
      return updated;
    });
  }

  function addColor(c) {
    const name = c.trim();
    if (!name) return;
    setSelectedColors((prev) => prev.some((x) => x.toLowerCase() === name.toLowerCase()) ? prev : [...prev, name]);
  }
  function removeColor(c) {
    setSelectedColors((prev) => prev.filter((x) => x !== c));
  }
  function addCustomColor() {
    addColor(customColor);
    setCustomColor("");
  }
  function toggleSize(s) {
    setSelectedSizes((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  }
  function setCombo(key, qty) {
    setCombos((prev) => ({ ...prev, [key]: qty }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const slug = form.slug.trim();
      const payload = {
        name: form.name.trim(),
        slug,
        price: parseFloat(form.price),
        category_id: form.category_id || null,
        description: form.description.trim() || null,
        short_description: form.short_description.trim() || null,
        sku: slug.toUpperCase(),
        status: form.status,
        is_featured: form.is_featured
      };
      const { data: inserted, error: insErr } = await supabase.from("products").insert(payload).select("id").single();
      if (insErr) throw new Error(insErr.message);
      const productId = inserted.id;

      if (imageFile) {
        const ext = imageFile.name.split(".").pop();
        const path = `products/${productId}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("product-images").upload(path, imageFile, { upsert: true });
        if (upErr) throw new Error(upErr.message);
        await supabase.from("product_media").insert({ product_id: productId, storage_path: path, is_primary: true });
      }

      // Build variant rows from the selected color × size combos
      const variantRows = [];
      for (const color of selectedColors) {
        for (const size of selectedSizes) {
          const key = `${color}|${size}`;
          const qty = Number(combos[key]) || 0;
          variantRows.push({
            product_id: productId,
            color,
            size,
            stock_quantity: qty,
            sku: makeVariantSku(slug, color, size)
          });
        }
      }
      if (variantRows.length > 0) {
        const { error: vErr } = await supabase.from("product_variants").insert(variantRows);
        if (vErr) throw new Error(vErr.message);
      }

      await onSaved();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <div className="admin-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="admin-modal">
        <div className="admin-modal-head">
          <h2 className="admin-modal-title">Add Product</h2>
          <button type="button" className="admin-modal-close" onClick={onClose}>✕</button>
        </div>

        {error && <div className="admin-error">{error}</div>}

        <form onSubmit={handleSave} className="admin-form">
          <div className="form-group">
            <label className="form-label">Name *</label>
            <input name="name" className="form-input" value={form.name} onChange={handleField} required />
            <span className="slug-preview">URL slug (auto): <code>{form.slug || "—"}</code></span>
          </div>

          <div className="admin-form-row admin-form-row--3">
            <div className="form-group">
              <label className="form-label">Price (PKR) *</label>
              <input name="price" type="number" step="0.01" min="0" className="form-input" value={form.price} onChange={handleField} required />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select name="category_id" className="form-input form-select" value={form.category_id} onChange={handleField}>
                <option value="">— None —</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select name="status" className="form-input form-select" value={form.status} onChange={handleField}>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Short description</label>
            <input name="short_description" className="form-input" value={form.short_description} onChange={handleField} placeholder="One-line summary" />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea name="description" className="form-input form-textarea" rows={3} value={form.description} onChange={handleField} />
          </div>

          <div className="admin-form-row admin-form-row--2">
            <div className="form-group">
              <label className="form-label">Image</label>
              <input type="file" accept="image/*" className="form-input form-file" onChange={(e) => setImageFile(e.target.files[0] ?? null)} />
            </div>
            <div className="form-check" style={{ alignSelf: "end" }}>
              <input type="checkbox" id="add-featured" name="is_featured" checked={form.is_featured} onChange={handleField} className="form-checkbox" />
              <label htmlFor="add-featured" className="form-check-label">Featured product</label>
            </div>
          </div>

          {/* Variant builder */}
          <div className="admin-detail__section-title">Variants — pick colours &amp; sizes, set stock</div>
          <p className="admin-hint">Tick the colours and sizes you stock. A row appears for each combination so you can set its quantity. SKU is auto-generated; 0 stock = archived.</p>

          <div className="vb-group vb-group--stack">
            <span className="vb-label">Colours</span>
            <div className="vb-add">
              <select
                className="form-input form-select"
                value=""
                onChange={(e) => { if (e.target.value) addColor(e.target.value); }}
              >
                <option value="">Choose a colour…</option>
                {COLOR_OPTIONS.filter((c) => !selectedColors.includes(c)).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <input
                className="form-input"
                placeholder="or type a custom colour"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomColor(); } }}
              />
              <button type="button" className="button button--outline" onClick={addCustomColor}>Add</button>
            </div>
            {selectedColors.length > 0 && (
              <div className="vb-chips">
                {selectedColors.map((c) => (
                  <span key={c} className="vb-chip is-on vb-chip--removable">
                    {c}
                    <button type="button" onClick={() => removeColor(c)} aria-label={`Remove ${c}`}>×</button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="vb-group">
            <span className="vb-label">Sizes</span>
            <div className="vb-chips">
              {SIZE_OPTIONS.map((s) => (
                <button type="button" key={s} className={`vb-chip ${selectedSizes.includes(s) ? "is-on" : ""}`} onClick={() => toggleSize(s)}>{s}</button>
              ))}
            </div>
          </div>

          {selectedColors.length > 0 && selectedSizes.length > 0 && (
            <table className="variant-table">
              <thead>
                <tr><th>Colour</th><th>Size</th><th>Stock qty</th></tr>
              </thead>
              <tbody>
                {selectedColors.map((color) =>
                  selectedSizes.map((size) => {
                    const key = `${color}|${size}`;
                    return (
                      <tr key={key}>
                        <td>{color}</td>
                        <td>{size}</td>
                        <td>
                          <input type="number" min="0" className="form-input variant-stock-input" value={combos[key] ?? ""} placeholder="0" onChange={(e) => setCombo(key, e.target.value)} />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}

          <div className="admin-modal-foot">
            <button type="button" className="button button--outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="button button--dark" disabled={saving}>
              {saving ? "Saving…" : "Add Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
