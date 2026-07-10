export const COLORS = {
  ink: "#11100E",
  charcoal: "#5F5A52",
  clay: "#A94732",
  terra: "#C15A40",
  taupe: "#D8CDBB",
  brass: "#B99149",
  bone: "#F4EFE6",
  cream: "#FBF8F1",
  olive: "#6D745F"
};

export const TEE_PATH =
  "M40 50 L60 30 L80 45 L100 35 L120 45 L140 30 L160 50 L180 70 L160 80 L155 70 L155 220 L45 220 L45 70 L40 80 L20 70 Z";

export const HOODIE_PATH =
  "M40 50 L55 28 L72 35 L85 20 L100 28 L115 20 L128 35 L145 28 L160 50 L180 72 L160 82 L155 72 L158 220 L42 220 L45 72 L40 82 L20 72 Z";

export function formatPrice(value) {
  return `Rs ${Number(value).toLocaleString("en-US")}`;
}

export const navLinks = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "Customize", href: "/customize" },
  { label: "Size Guide", href: "/size-guide" },
  { label: "About", href: "/about" }
];

export const products = [
  {
    name: "Essential Oversized Tee",
    category: "Oversized",
    price: 4200,
    badge: "New",
    badgeBg: COLORS.clay,
    badgeColor: COLORS.cream,
    sizeHint: "S-XXL",
    colors: [COLORS.bone, COLORS.ink, COLORS.olive],
    mockColor: COLORS.ink,
    shape: TEE_PATH
  },
  {
    name: "Imprint Graphic Tee",
    category: "Graphic",
    price: 4600,
    badge: "Drop 01",
    badgeBg: COLORS.ink,
    badgeColor: COLORS.bone,
    sizeHint: "S-XL",
    colors: [COLORS.ink, "#3A3631", COLORS.clay],
    mockColor: "#3A3631",
    shape: TEE_PATH
  },
  {
    name: "Canvas Custom Tee",
    category: "Custom",
    price: 4800,
    badge: "Custom Ready",
    badgeBg: COLORS.brass,
    badgeColor: COLORS.ink,
    sizeHint: "S-XXL",
    colors: [COLORS.bone, COLORS.taupe],
    mockColor: COLORS.taupe,
    shape: TEE_PATH
  },
  {
    name: "Signature Mark Tee",
    category: "Classic",
    price: 4000,
    badge: "",
    badgeBg: "",
    badgeColor: "",
    sizeHint: "M-XXL",
    colors: ["#3A3631", COLORS.bone],
    mockColor: COLORS.bone,
    shape: TEE_PATH
  },
  {
    name: "Heavyweight Hoodie",
    category: "Hoodies",
    price: 6500,
    badge: "Heavy Cotton",
    badgeBg: COLORS.ink,
    badgeColor: COLORS.bone,
    sizeHint: "S-XL",
    colors: [COLORS.ink, COLORS.olive],
    mockColor: COLORS.ink,
    shape: HOODIE_PATH
  },
  {
    name: "Staple Crew Sweat",
    category: "Sweatshirts",
    price: 5800,
    badge: "",
    badgeBg: "",
    badgeColor: "",
    sizeHint: "M-XL",
    colors: ["#6F6A60", COLORS.bone],
    mockColor: "#6F6A60",
    shape: TEE_PATH
  }
];

export const categories = [
  { name: "Oversized Tees", count: "12 styles", fill: COLORS.ink },
  { name: "Classic Fit", count: "8 styles", fill: COLORS.charcoal },
  { name: "Hoodies", count: "6 styles", fill: COLORS.olive },
  { name: "Custom Prints", count: "Made to order", fill: COLORS.clay }
];

export const steps = [
  {
    num: "01",
    title: "Choose your garment",
    body: "Start from any of the available options in premium heavyweight cotton."
  },
  {
    num: "02",
    title: "Upload your artwork",
    body: "Drop your file, add print notes or choose from our design templates for our team."
  },
  {
    num: "03",
    title: "Preview and confirm",
    body: "We send a digital proof. Nothing prints until you approve."
  },
  {
    num: "04",
    title: "We print and deliver",
    body: "Pressed and shipped from our local studio in 5 to 7 business days."
  }
];

export const quality = [
  {
    no: "K1",
    title: "Premium fabric",
    body: "210 to 340 GSM combed cotton that holds shape wash after wash."
  },
  {
    no: "K2",
    title: "Clean printing",
    body: "Crisp DTG and screen prints with no cracking and true color."
  },
  {
    no: "K3",
    title: "Custom designs",
    body: "One-off prints, your art or ours, proofed before production."
  },
  {
    no: "K4",
    title: "Local production",
    body: "Cut, printed and made in Pakistan. Short, honest supply chain."
  },
  {
    no: "K5",
    title: "Easy ordering",
    body: "A builder made for first-timers. No minimums, no jargon."
  }
];

export const filters = [
  { name: "Category", options: ["Oversized", "Classic", "Graphic", "Hoodies", "Sweatshirts", "Custom"] },
  { name: "Size", options: ["S", "M", "L", "XL", "XXL"] },
  { name: "Color", options: ["Bone", "Black", "Clay", "Olive", "Stone"] }
];

export const sizeRows = [
  { size: "S", chest: '20"', length: '27"', shoulder: '18"', sleeve: '8"' },
  { size: "M", chest: '22"', length: '28"', shoulder: '19"', sleeve: '8.5"' },
  { size: "L", chest: '24"', length: '29"', shoulder: '20"', sleeve: '9"' },
  { size: "XL", chest: '26"', length: '30"', shoulder: '21"', sleeve: '9.5"' },
  { size: "XXL", chest: '28"', length: '31"', shoulder: '22"', sleeve: '10"' }
];

export const fitCards = [
  {
    icon: "TS",
    title: "True to size",
    body: "Our classic tees follow standard sizing. Pick your usual for a fitted look."
  },
  {
    icon: "OS",
    title: "Oversized fit",
    body: "Oversized cuts are intentionally boxy and relaxed. Size down if unsure."
  },
  {
    icon: "UP",
    title: "Size up for drop shoulder",
    body: "Hoodies and sweatshirts use a drop-shoulder cut. Go true to size for that look."
  }
];

export const measureTips = [
  {
    no: "01",
    title: "Chest",
    body: "Measure flat across, one inch below the armhole, seam to seam."
  },
  {
    no: "02",
    title: "Length",
    body: "From the highest point of the shoulder to the hem."
  },
  {
    no: "03",
    title: "Shoulder",
    body: "Seam to seam across the back, at the top of the garment."
  },
  {
    no: "04",
    title: "Sleeve",
    body: "From the shoulder seam to the end of the sleeve opening."
  }
];

export const aboutBlocks = [
  {
    no: "01",
    title: "Our philosophy",
    body: "Clothing is the most public thing we own. Khud treats every piece as a surface for identity: restrained, considered, built to be lived in."
  },
  {
    no: "02",
    title: "What we make",
    body: "Elevated everyday staples: oversized tees, heavyweight hoodies, clean sweatshirts, plus a custom studio that turns your art into a wearable print."
  },
  {
    no: "03",
    title: "Why custom clothing",
    body: "A logo off a rack belongs to everyone. A mark you made belongs to you. We exist so self-expression does not stop at black and white."
  },
  {
    no: "04",
    title: "The meaning of Khud",
    body: "Khud is the Urdu word for yourself. We named the brand after the most important designer in the room: you."
  }
];

export const promises = [
  {
    title: "Proof before print",
    body: "You approve a digital mockup before anything is produced."
  },
  {
    title: "Heavyweight only",
    body: "No flimsy blanks. 210 to 340 GSM cotton across the range."
  },
  {
    title: "Honest local making",
    body: "Produced in Pakistan with a short, transparent supply chain."
  }
];

export const customProducts = [
  { name: "Oversized Tee", price: 4200, shape: TEE_PATH },
  { name: "Classic Tee", price: 4000, shape: TEE_PATH },
  { name: "Boxy Tee", price: 4200, shape: TEE_PATH },
  { name: "Long-Sleeve Tee", price: 5200, shape: TEE_PATH },
  { name: "Hoodie", price: 6500, shape: HOODIE_PATH }
];

// Colour choices shown in the admin product dropdown. Admins can still type a
// custom colour; its swatch is resolved by resolveSwatch() below.
export const customColors = [
  { name: "White", hex: "#FFFFFF" },
  { name: "Black", hex: "#111111" },
  { name: "Grey", hex: "#9CA3AF" },
  { name: "Navy Blue", hex: "#1E3A8A" },
  { name: "Blue", hex: "#2563EB" },
  { name: "Light Blue", hex: "#60A5FA" },
  { name: "Green", hex: "#3F7D3B" },
  { name: "Olive", hex: COLORS.olive },
  { name: "Red", hex: "#B23A34" },
  { name: "Maroon", hex: "#7B2D26" },
  { name: "Beige", hex: "#E4D8C4" },
  { name: "Bone", hex: COLORS.bone }
];

// Name -> hex for storefront colour swatches. Covers the dropdown options plus
// common apparel / CSS colour names so custom colours still get a real swatch.
export const SWATCH_HEX = {
  white: "#FFFFFF",
  offwhite: "#F5F1E8",
  black: "#111111",
  jetblack: "#0B0B0B",
  grey: "#9CA3AF",
  gray: "#9CA3AF",
  lightgrey: "#C7CCD1",
  lightgray: "#C7CCD1",
  darkgrey: "#4B4F55",
  darkgray: "#4B4F55",
  charcoal: "#3A3B3C",
  silver: "#C0C0C0",
  navy: "#1E3A8A",
  navyblue: "#1E3A8A",
  blue: "#2563EB",
  royalblue: "#2563EB",
  lightblue: "#60A5FA",
  skyblue: "#7DD3FC",
  teal: "#0D9488",
  green: "#3F7D3B",
  forestgreen: "#245C36",
  olive: "#6D745F",
  mint: "#A7D7C5",
  red: "#B23A34",
  crimson: "#9B1C2E",
  maroon: "#7B2D26",
  burgundy: "#6B1F2A",
  pink: "#EC9EC0",
  hotpink: "#E85C9A",
  purple: "#7B3F9E",
  lavender: "#B7A7D6",
  yellow: "#EAB308",
  mustard: "#C79A3B",
  gold: "#B99149",
  orange: "#D97706",
  coral: "#F08A70",
  brown: "#6B4A2B",
  tan: "#C8A97E",
  khaki: "#B3A369",
  sand: "#D8C3A5",
  beige: "#E4D8C4",
  cream: "#FBF8F1",
  bone: "#F4EFE6",
  ivory: "#F5F0E1",
  clay: "#A94732",
  brass: "#B99149",
  taupe: "#D8CDBB",
  ink: "#11100E"
};

// Resolve any colour name to a display hex. Handles the dropdown options and
// custom colours: exact hex passthrough, dictionary match (ignoring case/spaces),
// then a single-word CSS keyword fallback, then a neutral.
export function resolveSwatch(name) {
  if (!name) return SWATCH_HEX.taupe;
  const raw = String(name).trim();
  if (raw.startsWith("#")) return raw;
  const key = raw.toLowerCase().replace(/[\s_-]+/g, "");
  if (SWATCH_HEX[key]) return SWATCH_HEX[key];
  // valid single-word CSS colour keyword (e.g. "salmon", "indigo")
  if (/^[a-z]+$/.test(key)) return key;
  return SWATCH_HEX.taupe;
}

export const customPlacements = ["Front", "Back", "Sleeve", "Chest"];
export const customSizes = ["S", "M", "L", "XL", "XXL"];

// --- Custom studio (Fabric.js editor) configuration ---------------------------
// The four printable surfaces a shopper can design on. The `id` is the canonical
// key used everywhere (canvas store, validation, cart summary); `label`/`sub`
// are display only.
export const customViews = [
  { id: "Front", label: "Front", sub: "Front chest" },
  { id: "Back", label: "Back", sub: "Full back" },
  { id: "Left Sleeve", label: "Left Sleeve", sub: "Sleeve panel" },
  { id: "Right Sleeve", label: "Right Sleeve", sub: "Sleeve panel" }
];

// Predefined rectangular printable regions, one per view. Stored as fractions
// (0..1) of the canvas so they stay correct at any canvas size. The studio
// converts each to a concrete pixel region { x, y, width, height } at runtime
// and enforces it as a hard boundary — objects can never leave it.
//
// Fractions (0..1) of the canvas: x/y = top-left corner, width/height = size.
// To shrink the printable area, reduce width/height; to keep it centred, raise
// x/y by half of what you removed (centre is at x + width/2, y + height/2).
// Sleeves use a conservative rectangle fully contained inside the sleeve.
export const customPrintAreas = {
  Front: { x: 0.26, y: 0.28, width: 0.48, height: 0.46 },
  Back: { x: 0.26, y: 0.25, width: 0.48, height: 0.52 },
  "Left Sleeve": { x: 0.35, y: 0.18, width: 0.3, height: 0.6 },
  "Right Sleeve": { x: 0.35, y: 0.18, width: 0.3, height: 0.6 }
};

// Views that represent a sleeve — these get a fold/centre guideline and the
// "whole sleeve cloth" messaging instead of a body silhouette.
export const customSleeveViews = ["Left Sleeve", "Right Sleeve"];

// Font families offered in the text controls. Web-safe stacks plus the two
// brand fonts already loaded by the app shell.
export const customFonts = [
  { label: "Hanken Grotesk", value: "'Hanken Grotesk', sans-serif" },
  { label: "Bodoni Moda", value: "'Bodoni Moda', serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Times New Roman", value: "'Times New Roman', serif" },
  { label: "Courier New", value: "'Courier New', monospace" },
  { label: "Impact", value: "Impact, sans-serif" },
  { label: "Brush Script", value: "'Brush Script MT', cursive" }
];

// Quick-pick swatches for text colour.
export const customTextColors = [
  COLORS.ink,
  COLORS.bone,
  "#1E3A8A",
  COLORS.brass,
  COLORS.olive,
  "#ffffff",
  "#2f6f6a",
  "#7b3f9e"
];

// Image upload guardrails surfaced in the UI and enforced on upload.
export const customAcceptedImageTypes = [
  "image/png",
  "image/jpeg",
  "image/svg+xml"
];
export const customMaxImageBytes = 8 * 1024 * 1024; // 8 MB

// --- Studio shirt colours -----------------------------------------------------
// The only colours offered in the customization studio. `key` matches the
// folder name under /public/mockups/<garment>/<key>/. The clay/orange option
// was removed per the brief.
export const studioColors = [
  { name: "White", hex: "#FFFFFF", key: "white" },
  { name: "Black", hex: "#111111", key: "black" },
  { name: "Navy Blue", hex: "#1E3A8A", key: "blue" },
  { name: "Grey", hex: "#9CA3AF", key: "grey" }
];

// Studio accent (replaces the clay/orange accent across the customization UI).
export const STUDIO_ACCENT = "#1E3A8A";

// --- Mockup image system ------------------------------------------------------
// One shared shirt mockup set. Static PNGs live at:
//   /public/mockups/<colorKey>/<viewFile>.png   e.g. /mockups/black/back.png
// Colour + view select the file (garment no longer has its own folder). A
// missing file falls back to the SVG silhouette (GarmentMockup). `mockupKey` is
// kept in the signature for callers but is no longer part of the path.
export const STUDIO_VIEW_FILES = {
  Front: "front",
  Back: "back",
  "Left Sleeve": "left-sleeve",
  "Right Sleeve": "right-sleeve"
};

export function studioMockupSrc(mockupKey, colorKey, view) {
  if (!colorKey) return null;
  const file = STUDIO_VIEW_FILES[view];
  if (!file) return null;
  return `/mockups/${colorKey}/${file}.png`;
}

// Estimated studio prices by mockup key (categories have no single price).
export const studioGarmentPrice = { classic: 4000, oversized: 4200 };

// Map a DB category to a mockup set when the admin hasn't set mockup_key.
export function inferMockupKey(category) {
  const hay = `${category?.slug || ""} ${category?.name || ""}`.toLowerCase();
  if (hay.includes("oversize")) return "oversized";
  if (hay.includes("classic") || hay.includes("tee") || hay.includes("t-shirt") || hay.includes("tshirt")) {
    return "classic";
  }
  return null;
}

// Used when Supabase is unavailable or no categories are flagged customizable,
// so the studio is never empty (mirrors the app's "DB first, static fallback").
export const customFallbackGarments = [
  { id: "classic", name: "Classic T-Shirt", slug: "classic", mockupKey: "classic", price: 4000, shape: TEE_PATH },
  { id: "oversized", name: "Oversized T-Shirt", slug: "oversized", mockupKey: "oversized", price: 4200, shape: TEE_PATH }
];

// Manual bank-transfer details shown on the online-payment step. These are NEVER
// hardcoded — they come from public env vars so the store owner sets their real
// account without a code change (see .env.local.example). `bankTransferConfigured`
// lets the UI show a graceful note when they haven't been set yet.
export const bankTransferDetails = {
  bankName: process.env.NEXT_PUBLIC_BANK_NAME || "",
  accountTitle: process.env.NEXT_PUBLIC_ACCOUNT_TITLE || "",
  accountNumber: process.env.NEXT_PUBLIC_ACCOUNT_NUMBER || "",
  iban: process.env.NEXT_PUBLIC_IBAN || ""
};

export const bankTransferConfigured = Boolean(
  bankTransferDetails.bankName || bankTransferDetails.accountNumber || bankTransferDetails.iban
);
