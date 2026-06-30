"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { ArrowRight } from "@/components/Icons";

const PER_PAGE = 3;

// Loads admin-enabled design templates and shows them 3-per-row with prev/next
// arrows. Thumbnails request a small transformed image for speed and fall back
// to the full image if storage transforms aren't available.
export function ChooseDesign({ onPick, disabled }) {
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  useEffect(() => {
    let active = true;
    const supabase = createClient();
    const bucket = supabase.storage.from("product-images");
    supabase
      .from("design_templates")
      .select("id, name, storage_path")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        if (!active) return;
        const rows = (data ?? [])
          .map((d) => {
            const url = bucket.getPublicUrl(d.storage_path).data.publicUrl;
            if (!url) return null;
            // Small, cache-friendly preview (ignored gracefully if transforms
            // aren't enabled — onError swaps in the full image).
            const thumb = bucket.getPublicUrl(d.storage_path, {
              transform: { width: 220, height: 220, resize: "contain", quality: 70 }
            }).data.publicUrl;
            return { id: d.id, name: d.name, url, thumb };
          })
          .filter(Boolean);
        setDesigns(rows);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <p className="studio-hint-muted">Loading designs…</p>;
  }

  if (designs.length === 0) {
    return <p className="studio-hint-muted">No designs available yet. Check back soon.</p>;
  }

  const pageCount = Math.max(1, Math.ceil(designs.length / PER_PAGE));
  const safePage = Math.min(page, pageCount - 1);
  const visible = designs.slice(safePage * PER_PAGE, safePage * PER_PAGE + PER_PAGE);

  // Warm the full-resolution image so clicking adds it to the canvas instantly.
  function prefetch(url) {
    if (typeof window === "undefined") return;
    const img = new window.Image();
    img.decoding = "async";
    img.src = url;
  }

  return (
    <div className="studio-design-block">
      <div className="studio-design-carousel">
        <button
          type="button"
          className="studio-carousel-arrow"
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={safePage === 0}
          aria-label="Previous designs"
        >
          <span className="studio-carousel-arrow__flip">
            <ArrowRight size={15} />
          </span>
        </button>

        <div className="studio-designs">
          {visible.map((d) => (
            <button
              key={d.id}
              type="button"
              className="studio-design"
              onClick={() => onPick(d.url)}
              onMouseEnter={() => prefetch(d.url)}
              disabled={disabled}
              title={d.name || "Add design"}
            >
              <img
                src={d.thumb}
                alt={d.name || "Design"}
                loading="lazy"
                decoding="async"
                onError={(e) => {
                  if (e.currentTarget.src !== d.url) e.currentTarget.src = d.url;
                }}
              />
            </button>
          ))}
        </div>

        <button
          type="button"
          className="studio-carousel-arrow"
          onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
          disabled={safePage >= pageCount - 1}
          aria-label="More designs"
        >
          <ArrowRight size={15} />
        </button>
      </div>

      {pageCount > 1 && (
        <div className="studio-carousel-meta">
          {safePage + 1} / {pageCount}
        </div>
      )}
    </div>
  );
}
