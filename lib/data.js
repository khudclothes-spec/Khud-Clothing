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
    body: "Start from a tee, hoodie or sweatshirt in premium heavyweight cotton."
  },
  {
    num: "02",
    title: "Upload your artwork",
    body: "Drop your file or add print notes for our team."
  },
  {
    num: "03",
    title: "Preview and confirm",
    body: "We send a digital proof. Nothing prints until you approve."
  },
  {
    num: "04",
    title: "We print and deliver",
    body: "Pressed, stitched and shipped from our local studio in 3 to 5 days."
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
    body: "Cut, printed and stitched in Pakistan. Short, honest supply chain."
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

export const customColors = [
  { name: "Bone", hex: COLORS.bone },
  { name: "Black", hex: COLORS.ink },
  { name: "Clay", hex: COLORS.clay },
  { name: "Olive", hex: COLORS.olive },
  { name: "Grey", hex: "#8A8478" }
];

export const customPlacements = ["Front", "Back", "Sleeve", "Chest"];
export const customSizes = ["S", "M", "L", "XL", "XXL"];
