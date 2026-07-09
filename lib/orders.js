// Shared order lifecycle helpers — one source of truth for status labels, the
// timeline order, and the current-vs-completed split. Used by the customer
// dashboard, the order-details page, order emails, and the admin dashboard.

export const ORDER_STATUS = {
  pending: { label: "Pending", tone: "wait" },
  // Bank-transfer lifecycle: kept as two distinct states so the admin can tell
  // "hasn't paid yet" apart from "paid, awaiting my review".
  pending_payment: { label: "Pending Payment Upload", tone: "wait" },
  pending_verification: { label: "Pending Payment Verification", tone: "wait" },
  payment_received: { label: "Payment Received", tone: "go" },
  confirmed: { label: "Confirmed", tone: "go" },
  processing: { label: "Processing", tone: "go" },
  printing: { label: "Printing", tone: "go" },
  ready: { label: "Ready", tone: "go" }, // legacy alias (superseded by "packed")
  packed: { label: "Packed", tone: "go" },
  shipped: { label: "Shipped", tone: "go" },
  delivered: { label: "Delivered", tone: "done" },
  cancelled: { label: "Cancelled", tone: "cancelled" }
};

// The visible progression shown on the order-details timeline (cancelled is
// handled separately). Processing → Printing → Packed are distinct steps.
export const ORDER_TIMELINE = [
  "pending_payment",
  "pending_verification",
  "confirmed",
  "processing",
  "printing",
  "packed",
  "shipped",
  "delivered"
];

// COD orders skip the payment-verification steps.
export const ORDER_TIMELINE_COD = [
  "confirmed",
  "processing",
  "printing",
  "packed",
  "shipped",
  "delivered"
];

export function statusLabel(status) {
  return ORDER_STATUS[status]?.label || status || "—";
}

export function statusTone(status) {
  return ORDER_STATUS[status]?.tone || "wait";
}

// Completed = delivered or cancelled → shown under "Previous orders".
export function isCompletedOrder(status) {
  return status === "delivered" || status === "cancelled";
}

// Index of a status within its timeline (for highlighting progress).
export function timelineFor(paymentMethod) {
  return paymentMethod === "online" ? ORDER_TIMELINE : ORDER_TIMELINE_COD;
}

export function paymentMethodLabel(method) {
  if (method === "online") return "Bank Transfer (Online)";
  return "Cash on Delivery";
}
