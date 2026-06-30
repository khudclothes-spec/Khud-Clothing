"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

// Loads admin-enabled design templates and shows them as a grid. Clicking a
// design drops it onto the Fabric canvas via onPick(url).
export function ChooseDesign({ onPick, disabled }) {
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const supabase = createClient();
    supabase
      .from("design_templates")
      .select("id, name, storage_path")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        if (!active) return;
        const rows = (data ?? [])
          .map((d) => {
            const url = supabase.storage.from("product-images").getPublicUrl(d.storage_path)
              .data.publicUrl;
            return url ? { id: d.id, name: d.name, url } : null;
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

  return (
    <div className="studio-designs">
      {designs.map((d) => (
        <button
          key={d.id}
          type="button"
          className="studio-design"
          onClick={() => onPick(d.url)}
          disabled={disabled}
          title={d.name || "Add design"}
        >
          <img src={d.url} alt={d.name || "Design"} />
        </button>
      ))}
    </div>
  );
}
