// Order status update email — sent to the customer when an owner moves an order
// through the pipeline (e.g. confirmed -> processing/printing -> shipped ->
// delivered). Driven by the existing orders.status field.

import { brand, contact } from "@/lib/email/config";
import { emailLayout } from "./layout";
import {
  eyebrow,
  heading,
  paragraph,
  divider,
  panel,
  infoTable,
  statusBadge,
  escapeHtml
} from "./components";

const c = brand.colors;

// Copy + badge colour per status. Each lifecycle status the admin can notify on
// has its own reusable template entry. Statuses we don't email for are omitted.
export const STATUS_COPY = {
  confirmed: {
    label: "Confirmed",
    color: c.brass,
    title: "Your order is confirmed",
    body: "Thanks for your order. We've confirmed it and it's queued for production."
  },
  processing: {
    label: "Processing",
    color: c.brass,
    title: "Your order is being prepared",
    body: "We're getting your order ready — our studio is preparing your pieces for production."
  },
  printing: {
    label: "Printing",
    color: c.clay,
    title: "Your order is being printed",
    body: "Good news — your pieces are now in production. Our studio is printing and finishing your order."
  },
  packed: {
    label: "Packed",
    color: c.olive,
    title: "Your order is packed",
    body: "Your order has been packed and is ready to be handed to the courier for dispatch."
  },
  shipped: {
    label: "Shipped",
    color: c.olive,
    title: "Your order is on its way",
    body: "Your order has been handed to the courier and is on its way to you."
  },
  delivered: {
    label: "Delivered",
    color: c.olive,
    title: "Your order has been delivered",
    body: "Your order has been marked delivered. We hope you love it — wear it well."
  },
  cancelled: {
    label: "Cancelled",
    color: c.charcoal,
    title: "Your order was cancelled",
    body: "Your order has been cancelled. If this is unexpected, please get in touch and we'll help sort it out."
  }
};

// Whether a status change should trigger a customer email.
export function shouldEmailStatus(status) {
  return Boolean(STATUS_COPY[status]);
}

export function renderOrderStatusUpdate(order, status) {
  const s = STATUS_COPY[status] || STATUS_COPY.confirmed;

  const content = `
    ${eyebrow("Order update")}
    <div style="margin:0 0 12px;">${statusBadge(s.label, s.color)}</div>
    ${heading(s.title)}
    ${paragraph(`Hi ${escapeHtml(order.customerFirstName || order.customerName || "there")}, ${s.body}`, { muted: true })}

    ${panel(
      infoTable([
        { label: "Order number", value: order.orderNumber, strong: true },
        { label: "Order placed", value: order.orderDateTime || order.orderDate },
        { label: "Status", value: s.label, strong: true }
      ]),
      { title: "Order" }
    )}

    ${divider()}
    ${paragraph(
      `Questions? WhatsApp <a href="https://wa.me/${contact.whatsapp.replace(/[^0-9]/g, "")}" style="color:${c.clay};text-decoration:none;">${escapeHtml(contact.whatsapp)}</a> or email <a href="mailto:${escapeHtml(contact.supportEmail)}" style="color:${c.clay};text-decoration:none;">${escapeHtml(contact.supportEmail)}</a>.`,
      { muted: true }
    )}
  `;

  return emailLayout({
    title: `Order ${order.orderNumber} — ${s.label}`,
    preheader: `${s.title} (${order.orderNumber}).`,
    contentHtml: content
  });
}
