"use client";

import { useEffect, useState } from "react";
import { studioMockupSrc } from "@/lib/data";
import { GarmentMockup } from "@/components/customize/GarmentMockup";

// Renders the garment background for a given product/colour/view.
// Prefers the uploaded mockup PNG at /mockups/<mockupKey>/<colorKey>/<view>.png;
// if that file is missing/empty it falls back to the tinted SVG silhouette so
// the studio is always usable before real assets are uploaded.
//
// `priority` is set for the large canvas background so it decodes fast / first;
// thumbnails leave it off so they don't compete with the main image.
export function GarmentArt({ mockupKey, colorKey, colorHex, view, shape, priority = false }) {
  const src = studioMockupSrc(mockupKey, colorKey, view);
  const [failed, setFailed] = useState(false);

  // Retry the image whenever the target path changes.
  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (src && !failed) {
    return (
      <img
        src={src}
        alt=""
        className="studio-garment__img"
        onError={() => setFailed(true)}
        draggable={false}
        decoding="async"
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "low"}
      />
    );
  }

  return <GarmentMockup view={view} color={colorHex} shape={shape} />;
}
