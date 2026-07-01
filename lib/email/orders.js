// Order email orchestration. Normalises a DB order row into a template model
// and sends the customer confirmation, the four owner notifications, and status
// updates. Server-side only.

import { sendEmail, sendEmails } from "./client";
import { brand, contact, ownerEmails } from "./config";
import { renderCustomerOrderConfirmation } from "@/emails/customerOrderConfirmation";
import { renderOwnerOrderNotification } from "@/emails/ownerOrderNotification";
import { renderOrderStatusUpdate, shouldEmailStatus, STATUS_COPY } from "@/emails/orderStatusUpdate";

function fmtDate(iso) {
  try {
    return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return "";
  }
}

function fmtDateTime(iso) {
  try {
    return new Date(iso).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return "";
  }
}

function money(n) {
  return `Rs ${Number(n ?? 0).toLocaleString("en-US")}`;
}

// DB order (+ joined order_items -> products) -> template model.
export function buildOrderModel(order) {
  const items = (order.order_items ?? []).map((it) => ({
    name: it.products?.name ?? "Item",
    color: it.color ?? "",
    size: it.size ?? "",
    quantity: Number(it.quantity) || 0,
    unitPrice: Number(it.unit_price) || 0,
    lineTotal: (Number(it.unit_price) || 0) * (Number(it.quantity) || 0)
  }));

  const name = order.customer_name || "";
  return {
    id: order.id,
    orderNumber: order.order_number,
    orderDate: fmtDate(order.created_at),
    orderDateTime: fmtDateTime(order.created_at),
    customerName: name,
    customerFirstName: name.trim().split(/\s+/)[0] || "",
    customerEmail: order.customer_email || "",
    customerPhone: order.customer_phone || "",
    shippingAddress: order.shipping_address || "",
    city: order.city || "",
    notes: order.notes || "",
    subtotal: Number(order.subtotal) || 0,
    shippingCost: Number(order.shipping_cost) || 0,
    total: Number(order.total_amount) || 0,
    totalFormatted: money(order.total_amount),
    itemCount: items.reduce((t, i) => t + i.quantity, 0),
    items
  };
}

// Customer confirmation + one notification to each of the four owners.
export async function sendOrderConfirmationEmails(dbOrder) {
  const model = buildOrderModel(dbOrder);

  const messages = [];

  if (model.customerEmail) {
    messages.push({
      to: model.customerEmail,
      subject: `Your Khud order is confirmed — ${model.orderNumber}`,
      html: renderCustomerOrderConfirmation(model),
      replyTo: contact.supportEmail
    });
  }

  const ownerHtml = renderOwnerOrderNotification(model);
  for (const owner of ownerEmails()) {
    messages.push({
      to: owner,
      subject: `New order ${model.orderNumber} — ${model.totalFormatted}`,
      html: ownerHtml,
      replyTo: model.customerEmail || undefined
    });
  }

  const results = await sendEmails(messages);
  const failed = results.filter((r) => r.status === "rejected");
  if (failed.length) {
    console.error(`[email] ${failed.length}/${results.length} order emails failed for ${model.orderNumber}`, failed.map((f) => f.reason?.message));
  }
  return { sent: results.length - failed.length, failed: failed.length };
}

// Customer status update (confirmed / processing / shipped / delivered / cancelled).
export async function sendOrderStatusEmail(dbOrder, status) {
  if (!shouldEmailStatus(status)) return { skipped: true };
  const model = buildOrderModel(dbOrder);
  if (!model.customerEmail) return { skipped: true };

  const label = STATUS_COPY[status]?.label || status;

  return sendEmail({
    to: model.customerEmail,
    subject: `Order ${model.orderNumber} — ${label}`,
    html: renderOrderStatusUpdate(model, status),
    replyTo: contact.supportEmail
  });
}
