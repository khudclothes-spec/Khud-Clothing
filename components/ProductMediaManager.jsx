"use client";

import { useMemo, useRef, useState } from "react";
import { Close } from "@/components/Icons";

/**
 * Per-colour image manager for the admin product editor.
 *
 * - Upload multiple images per colour.
 * - Exactly ONE "main display" image per product (is_primary) — used on the
 *   home/featured grid and category cards.
 * - Exactly ONE "cover" image per colour (is_color_cover) — the first image
 *   shown when that colour is selected on the product page.
 *
 * Each image belongs to one colour, so two colours can never share a cover.
 * The main image and a colour's cover may be the same image (both flags on).
 */
export function ProductMediaManager({ productId, slug, colors, media, supabase, getPublicUrl, onChanged }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Group media: every variant colour gets a bucket, plus an "Uncategorised"
  // bucket for legacy / colour-less images.
  const groups = useMemo(() => {
    const map = {};
    colors.forEach((c) => { map[c] = []; });
    const uncategorised = [];
    (media ?? []).forEach((m) => {
      if (m.color && map[m.color]) map[m.color].push(m);
      else uncategorised.push(m);
    });
    Object.values(map).forEach((list) =>
      list.sort((a, b) => Number(b.is_color_cover) - Number(a.is_color_cover) || (a.sort_order ?? 0) - (b.sort_order ?? 0))
    );
    return { map, uncategorised };
  }, [colors, media]);

  function colorSlug(color) {
    return String(color).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  async function uploadForColor(color, fileList) {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    setBusy(true);
    setError("");
    try {
      const existing = (media ?? []).filter((m) => m.color === color);
      let hasCover = existing.some((m) => m.is_color_cover);
      let nextOrder = existing.reduce((max, m) => Math.max(max, m.sort_order ?? 0), -1) + 1;

      for (const file of files) {
        const ext = file.name.split(".").pop();
        const path = `products/${productId}/${colorSlug(color)}/${Date.now()}-${nextOrder}.${ext}`;
        const { error: upErr } = await supabase.storage.from("product-images").upload(path, file, { upsert: true });
        if (upErr) throw new Error(upErr.message);

        const { error: insErr } = await supabase.from("product_media").insert({
          product_id: productId,
          color,
          storage_path: path,
          sort_order: nextOrder,
          is_color_cover: !hasCover, // first image of a colour becomes its cover
          is_primary: false
        });
        if (insErr) throw new Error(insErr.message);

        hasCover = true;
        nextOrder += 1;
      }
      await onChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function setMain(mediaId) {
    setBusy(true);
    setError("");
    try {
      await supabase.from("product_media").update({ is_primary: false }).eq("product_id", productId).eq("is_primary", true);
      const { error: upErr } = await supabase.from("product_media").update({ is_primary: true }).eq("id", mediaId);
      if (upErr) throw new Error(upErr.message);
      await onChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function setColorCover(mediaId, color) {
    setBusy(true);
    setError("");
    try {
      // Clear any existing cover for this colour first so the unique index holds.
      await supabase.from("product_media").update({ is_color_cover: false }).eq("product_id", productId).eq("color", color).eq("is_color_cover", true);
      const { error: upErr } = await supabase.from("product_media").update({ is_color_cover: true }).eq("id", mediaId);
      if (upErr) throw new Error(upErr.message);
      await onChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteImage(m) {
    setBusy(true);
    setError("");
    try {
      if (m.storage_path) {
        await supabase.storage.from("product-images").remove([m.storage_path]);
      }
      await supabase.from("product_media").delete().eq("id", m.id);

      // If we removed a colour's cover, promote another image of that colour.
      if (m.is_color_cover && m.color) {
        const next = (media ?? []).find((x) => x.color === m.color && x.id !== m.id);
        if (next) await supabase.from("product_media").update({ is_color_cover: true }).eq("id", next.id);
      }
      await onChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function renderImageCard(m) {
    const url = getPublicUrl(m.storage_path);
    return (
      <div key={m.id} className={`pm-card ${m.is_primary ? "is-main" : ""}`}>
        <div className="pm-card__img">
          {url ? <img src={url} alt="" loading="lazy" decoding="async" /> : <div className="pm-card__empty" />}
          {m.is_primary && <span className="pm-flag pm-flag--main">Main</span>}
          {m.is_color_cover && <span className="pm-flag pm-flag--cover">Cover</span>}
          <button type="button" className="pm-del" onClick={() => deleteImage(m)} aria-label="Delete image" disabled={busy}>
            <Close size={12} />
          </button>
        </div>
        <div className="pm-card__actions">
          <button
            type="button"
            className={`pm-mini ${m.is_color_cover ? "is-on" : ""}`}
            onClick={() => setColorCover(m.id, m.color)}
            disabled={busy || m.is_color_cover || !m.color}
          >
            {m.is_color_cover ? "Colour cover" : "Set cover"}
          </button>
          <button
            type="button"
            className={`pm-mini ${m.is_primary ? "is-on" : ""}`}
            onClick={() => setMain(m.id)}
            disabled={busy || m.is_primary}
          >
            {m.is_primary ? "Main image" : "Set main"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pm">
      <div className="admin-detail__section-title">Images — per colour</div>
      <p className="admin-hint">
        Upload images for each colour. The first image of a colour becomes its <strong>cover</strong> (shown first when that colour is picked).
        Pick one <strong>main</strong> image for the product — it shows on the home and category grids.
      </p>
      {error && <div className="admin-error">{error}</div>}

      {colors.length === 0 && (
        <div className="admin-muted" style={{ padding: "8px 0" }}>
          Add colour variants above first, then upload images for each colour here.
        </div>
      )}

      {colors.map((color) => (
        <ColorMediaGroup
          key={color}
          color={color}
          images={groups.map[color] ?? []}
          onUpload={(files) => uploadForColor(color, files)}
          renderImageCard={renderImageCard}
          busy={busy}
        />
      ))}

      {groups.uncategorised.length > 0 && (
        <div className="pm-group">
          <div className="pm-group__head">
            <span className="pm-group__name">Uncategorised</span>
            <span className="admin-hint" style={{ margin: 0 }}>Images with no colour (legacy). Can still be the main image.</span>
          </div>
          <div className="pm-grid">
            {groups.uncategorised.map(renderImageCard)}
          </div>
        </div>
      )}
    </div>
  );
}

function ColorMediaGroup({ color, images, onUpload, renderImageCard, busy }) {
  const inputRef = useRef(null);

  return (
    <div className="pm-group">
      <div className="pm-group__head">
        <span className="pm-group__name">{color}</span>
        <span className="pm-group__count">{images.length} image{images.length !== 1 ? "s" : ""}</span>
        <button type="button" className="button button--outline pm-upload-btn" onClick={() => inputRef.current?.click()} disabled={busy}>
          + Upload
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => { onUpload(e.target.files); e.target.value = ""; }}
        />
      </div>
      {images.length === 0 ? (
        <div className="admin-muted pm-empty">No images for {color} yet.</div>
      ) : (
        <div className="pm-grid">
          {images.map(renderImageCard)}
        </div>
      )}
    </div>
  );
}
