"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase";

// Admin → Customization → Design Templates.
// Upload reusable artwork that customers can drop onto their design under
// "Choose Design". Images live in the public 'product-images' bucket under
// the 'designs/' prefix; the table row tracks enabled state + order.
export default function AdminDesignTemplatesPage() {
  const supabase = createClient();
  const inputRef = useRef(null);
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function getPublicUrl(path) {
    if (!path) return null;
    return supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
  }

  async function fetchAll() {
    setLoading(true);
    setError("");
    const { data, error: err } = await supabase
      .from("design_templates")
      .select("id, name, storage_path, is_active, sort_order")
      .order("sort_order", { ascending: true });
    if (err) {
      setError(
        "Could not load design templates. Make sure migration 016_customization.sql has been run on your Supabase project."
      );
      setDesigns([]);
    } else {
      setDesigns(data ?? []);
    }
    setLoading(false);
  }

  async function handleUpload(fileList) {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    setBusy(true);
    setError("");
    try {
      let nextOrder = designs.reduce((max, d) => Math.max(max, d.sort_order ?? 0), -1) + 1;
      for (const file of files) {
        if (!file.type.startsWith("image/")) continue;
        const ext = file.name.split(".").pop();
        const path = `designs/${Date.now()}-${nextOrder}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("product-images")
          .upload(path, file, { upsert: true });
        if (upErr) throw new Error(upErr.message);

        const { error: insErr } = await supabase.from("design_templates").insert({
          name: file.name.replace(/\.[^.]+$/, ""),
          storage_path: path,
          is_active: true,
          sort_order: nextOrder
        });
        if (insErr) throw new Error(insErr.message);
        nextOrder += 1;
      }
      await fetchAll();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(design) {
    setBusy(true);
    setError("");
    const { error: err } = await supabase
      .from("design_templates")
      .update({ is_active: !design.is_active })
      .eq("id", design.id);
    if (err) setError(err.message);
    await fetchAll();
    setBusy(false);
  }

  async function remove(design) {
    setBusy(true);
    setError("");
    try {
      if (design.storage_path) {
        await supabase.storage.from("product-images").remove([design.storage_path]);
      }
      const { error: err } = await supabase.from("design_templates").delete().eq("id", design.id);
      if (err) throw new Error(err.message);
      await fetchAll();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <div className="admin-eyebrow">Customization</div>
          <h1 className="admin-page-title">Design Templates</h1>
        </div>
        <button
          type="button"
          className="button button--dark"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
        >
          {busy ? "Working…" : "+ Upload Design"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/svg+xml"
          multiple
          hidden
          onChange={(e) => {
            handleUpload(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      <p className="admin-hint" style={{ marginTop: 0 }}>
        Enabled designs appear under <strong>Choose Design</strong> in the customer studio. Disable
        to hide without deleting.
      </p>

      {error && <div className="admin-error">{error}</div>}

      {loading ? (
        <div className="admin-loading">Loading designs…</div>
      ) : designs.length === 0 ? (
        <div className="admin-empty">
          <p>No designs yet.</p>
          <button type="button" className="button button--outline" onClick={() => inputRef.current?.click()}>
            Upload your first design
          </button>
        </div>
      ) : (
        <div className="design-grid">
          {designs.map((d) => {
            const url = getPublicUrl(d.storage_path);
            return (
              <div key={d.id} className={`design-card ${d.is_active ? "" : "is-off"}`}>
                <div className="design-card__img">
                  {url ? <img src={url} alt={d.name || "Design"} /> : <div className="design-card__empty" />}
                  {!d.is_active && <span className="design-card__flag">Disabled</span>}
                </div>
                <div className="design-card__name">{d.name || "Untitled"}</div>
                <div className="design-card__actions">
                  <button
                    type="button"
                    className={`pm-mini ${d.is_active ? "is-on" : ""}`}
                    onClick={() => toggleActive(d)}
                    disabled={busy}
                  >
                    {d.is_active ? "Enabled" : "Enable"}
                  </button>
                  <button
                    type="button"
                    className="admin-btn-delete"
                    onClick={() => remove(d)}
                    disabled={busy}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
