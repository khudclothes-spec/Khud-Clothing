// Payment verification result email (manual bank transfer): approved / rejected.

import { brand, contact } from "@/lib/email/config";
import { emailLayout } from "./layout";
import { eyebrow, heading, paragraph, divider, panel, itemsTable, totals, button, escapeHtml } from "./components";

const c = brand.colors;

export function renderPaymentStatusUpdate(order, status, notes) {
  const approved = status === "approved";
  const content = `
    ${eyebrow(approved ? "Payment approved" : "Payment needs attention")}
    ${heading(approved
      ? `Thanks, ${order.customerFirstName || "there"} — payment received.`
      : `We couldn't verify your payment.`)}
    ${paragraph(
      approved
        ? `Your bank transfer for order <strong>${escapeHtml(order.orderNumber)}</strong> has been approved and your order is now confirmed and queued for production.`
        : `We couldn't confirm the transfer for order <strong>${escapeHtml(order.orderNumber)}</strong>. Please re-check the details and upload your receipt again.`,
      { muted: true }
    )}

    ${notes ? panel(
      `<div style="font-family:${brand.fontStack};font-size:13px;line-height:1.6;color:${c.ink};">${escapeHtml(notes)}</div>`,
      { title: "Note from our team" }
    ) : ""}

    <div style="font-family:${brand.fontStack};font-size:11px;letter-spacing:1px;text-transform:uppercase;font-weight:700;color:${c.charcoal};margin:0 0 4px;">Your items</div>
    ${itemsTable(order.items)}
    ${totals(order)}

    ${!approved ? button(`${brand.siteUrl}/checkout/payment/${order.id}`, "Re-upload payment") : ""}

    ${divider()}
    ${paragraph(
      `Questions? Email <a href="mailto:${escapeHtml(contact.supportEmail)}" style="color:${c.clay};text-decoration:none;">${escapeHtml(contact.supportEmail)}</a>.`,
      { muted: true }
    )}
  `;

  return emailLayout({
    title: approved ? `Payment approved ${order.orderNumber}` : `Payment needs attention ${order.orderNumber}`,
    preheader: approved ? `Your order ${order.orderNumber} is confirmed.` : `Action needed for order ${order.orderNumber}.`,
    contentHtml: content
  });
}
