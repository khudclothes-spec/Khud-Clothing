// Centralised pricing logic — the single source of truth for per-product
// discounts, psychological price rounding, shipping, and the online-payment
// discount. The storefront, cart, checkout and admin editor all import from
// here, and the process_checkout RPC mirrors this maths in SQL so the database
// charges exactly what the UI shows. Nothing pricing-related is hardcoded in
// components.

// ── Tunable constants ────────────────────────────────────────────────────
export const SHIPPING_FLAT = 230;          // Rs flat shipping fee
export const FREE_SHIPPING_MIN_ITEMS = 3;  // free shipping once the bag has N+ items
export const ONLINE_DISCOUNT_RATE = 0.05;  // 5% off the subtotal for online payment

export const PAYMENT_METHODS = [
  { value: "cod", label: "Cash on Delivery", note: "Pay when it arrives" },
  { value: "online", label: "Online Payment", note: `Save ${Math.round(ONLINE_DISCOUNT_RATE * 100)}% instantly` }
];

export function paymentLabel(method) {
  return PAYMENT_METHODS.find((m) => m.value === method)?.label || "Cash on Delivery";
}

// ── Per-product discounting ──────────────────────────────────────────────

// Round a price to a charm ending (…99) for pricing psychology. Rounds to the
// nearest 100 then drops one, e.g. 1200→1199, 2031→1999, 4680→4699. This is
// mirrored exactly by the process_checkout RPC (round(v/100)*100 - 1).
export function roundToCharm(value) {
  const v = Number(value) || 0;
  if (v <= 0) return 0;
  const rounded = Math.round(v / 100) * 100 - 1;
  return rounded < 0 ? 0 : rounded;
}

export function clampPercent(pct) {
  const n = Math.round(Number(pct) || 0);
  if (n < 0) return 0;
  if (n > 100) return 100;
  return n;
}

// The raw discounted price before charm rounding (shown to the admin as the
// "calculated" price).
export function rawDiscountedPrice(originalPrice, discountPercent) {
  const price = Number(originalPrice) || 0;
  const pct = clampPercent(discountPercent);
  return pct <= 0 ? price : Math.round(price * (1 - pct / 100));
}

// The final selling price after a per-product discount (charm-rounded). A 0%
// discount returns the original price untouched (full-price items aren't
// re-rounded).
export function discountedPrice(originalPrice, discountPercent) {
  const price = Number(originalPrice) || 0;
  const pct = clampPercent(discountPercent);
  if (pct <= 0) return price;
  return roundToCharm(price * (1 - pct / 100));
}

// A product's full pricing model for display: original price, effective selling
// price, whether a discount is active, and how much is saved.
export function productPricing({ price, discountPercent = 0 } = {}) {
  const original = Number(price) || 0;
  const pct = clampPercent(discountPercent);
  const selling = discountedPrice(original, pct);
  const hasDiscount = pct > 0 && selling < original;
  return {
    original,
    price: hasDiscount ? selling : original,
    discountPercent: pct,
    hasDiscount,
    saved: hasDiscount ? original - selling : 0
  };
}

// ── Cart / checkout totals ───────────────────────────────────────────────

export function shippingFor(itemCount) {
  return Number(itemCount) >= FREE_SHIPPING_MIN_ITEMS ? 0 : SHIPPING_FLAT;
}

export function isFreeShipping(itemCount) {
  return shippingFor(itemCount) === 0;
}

// How many more items unlock free shipping (0 once unlocked).
export function itemsToFreeShipping(itemCount) {
  return Math.max(0, FREE_SHIPPING_MIN_ITEMS - Number(itemCount || 0));
}

export function onlineDiscountFor(subtotal, paymentMethod) {
  return paymentMethod === "online" ? Math.round((Number(subtotal) || 0) * ONLINE_DISCOUNT_RATE) : 0;
}

// Full order breakdown. `subtotal` is the sum of the (already per-product
// discounted) line prices; `itemCount` is the total quantity in the bag.
export function orderTotals({ subtotal, itemCount, paymentMethod = "cod" }) {
  const sub = Number(subtotal) || 0;
  const onlineDiscount = onlineDiscountFor(sub, paymentMethod);
  const discountedSubtotal = sub - onlineDiscount;
  const shipping = shippingFor(itemCount);
  return {
    subtotal: sub,
    onlineDiscount,
    discountedSubtotal,
    shipping,
    freeShipping: shipping === 0,
    total: discountedSubtotal + shipping
  };
}
