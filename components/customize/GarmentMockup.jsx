import { TEE_PATH } from "@/lib/data";

// A flat, view-specific garment silhouette rendered behind the Fabric canvas.
// It is purely decorative (aria-hidden) — the printable region and all design
// objects live on the transparent canvas layered on top of this.
//
// `view`  : "Front" | "Back" | "Left Sleeve" | "Right Sleeve"
// `color` : garment hex
// `shape` : the product's body path (front/back use it; sleeves use their own)

const BACK_PATH =
  "M40 50 L60 30 L75 38 L75 30 Q100 22 125 30 L125 38 L140 30 L160 50 L180 70 L160 80 L155 70 L155 220 L45 220 L45 70 L40 80 L20 70 Z";

// The whole sleeve fabric, laid flat — wide at the shoulder, tapering to the
// cuff. Fills most of the canvas so the printable rectangle sits comfortably
// inside it.
const SLEEVE_PATH = "M50 18 L150 18 L138 222 L62 222 Z";

function isLight(hex) {
  const c = (hex || "").replace("#", "");
  if (c.length < 6) return false;
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b > 186;
}

export function GarmentMockup({ view, color = "#11100E", shape = TEE_PATH }) {
  const stroke = isLight(color) ? "rgba(17,16,14,0.18)" : "rgba(255,255,255,0.08)";
  const seam = isLight(color) ? "rgba(17,16,14,0.12)" : "rgba(255,255,255,0.14)";
  const isSleeve = view === "Left Sleeve" || view === "Right Sleeve";
  const isBack = view === "Back";

  return (
    <svg
      className="studio-garment__svg"
      viewBox="0 0 200 240"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="garmentShade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.1" />
        </linearGradient>
      </defs>

      {isSleeve ? (
        <g transform={view === "Right Sleeve" ? "translate(200,0) scale(-1,1)" : undefined}>
          <path d={SLEEVE_PATH} fill={color} stroke={stroke} strokeWidth="1.5" />
          <path d={SLEEVE_PATH} fill="url(#garmentShade)" />
          {/* shoulder + cuff seams */}
          <path d="M50 18 L150 18" stroke={seam} strokeWidth="2" fill="none" />
          <path d="M62 222 L138 222" stroke={seam} strokeWidth="2" fill="none" />
          <path d="M64 208 L136 208" stroke={seam} strokeWidth="1" fill="none" opacity="0.6" />
          {/* fold / outer-edge centre guideline (visual only, never printed) */}
          <line x1="100" y1="24" x2="100" y2="216" stroke={seam} strokeWidth="1.4"
            strokeDasharray="5 5" opacity="0.85" />
        </g>
      ) : (
        <g>
          <path d={isBack ? BACK_PATH : shape} fill={color} stroke={stroke} strokeWidth="1.5" />
          <path d={isBack ? BACK_PATH : shape} fill="url(#garmentShade)" />
          {/* collar detail */}
          {isBack ? (
            <path d="M80 32 Q100 44 120 32" stroke={seam} strokeWidth="2" fill="none" />
          ) : (
            <path d="M80 40 L100 52 L120 40" stroke={seam} strokeWidth="2" fill="none" />
          )}
        </g>
      )}
    </svg>
  );
}
