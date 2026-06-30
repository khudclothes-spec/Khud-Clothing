"use client";

import { customViews, customPrintAreas } from "@/lib/data";
import { GarmentArt } from "@/components/customize/GarmentArt";

// Right panel: pick which printable surface to design on. Each tile shows a
// mini garment mockup with its printable region outlined, plus a badge for how
// many elements are already placed there.
export function ViewSelector({ activeView, onSelect, colorHex, colorKey, mockupKey, shape, counts }) {
  return (
    <div className="studio-views">
      {customViews.map((v) => {
        const area = customPrintAreas[v.id];
        const count = counts?.[v.id] || 0;
        const active = v.id === activeView;
        return (
          <button
            key={v.id}
            type="button"
            className={`studio-view ${active ? "is-active" : ""}`}
            onClick={() => onSelect(v.id)}
          >
            <span className="studio-view__thumb">
              <GarmentArt
                view={v.id}
                colorHex={colorHex}
                colorKey={colorKey}
                mockupKey={mockupKey}
                shape={shape}
              />
              <span
                className="studio-view__region"
                style={{
                  left: `${area.x * 100}%`,
                  top: `${area.y * 100}%`,
                  width: `${area.width * 100}%`,
                  height: `${area.height * 100}%`
                }}
              />
              {count > 0 && <span className="studio-view__badge">{count}</span>}
            </span>
            <span className="studio-view__meta">
              <span className="studio-view__label">{v.label}</span>
              <span className="studio-view__sub">{v.sub}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
