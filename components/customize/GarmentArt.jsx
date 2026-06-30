"use client";

import { useEffect, useState } from "react";
import { studioMockupSrc } from "@/lib/data";
import { GarmentMockup } from "@/components/customize/GarmentMockup";

// Renders the garment background for a given product/colour/view.
// Prefers the uploaded mockup PNG at /mockups/<mockupKey>/<colorKey>/<view>.png;
// if that file is missing/empty it falls back to the tinted SVG silhouette so
// the studio is always usable before real assets are uploaded.
export function GarmentArt({ mockupKey, colorKey, colorHex, view, shape }) {
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
      />
    );
  }

  return <GarmentMockup view={view} color={colorHex} shape={shape} />;
}
