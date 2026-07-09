// "Payment received / awaiting verification" emails — customer acknowledgement
// and owner notification — sent when a shopper uploads their bank-transfer proof.

import { brand, contact } from "@/lib/email/config";
import { emailLayout } from "./layout";
import { eyebrow, heading, paragraph, divider, panel, infoTable, itemsTable, totals, escapeHtml } from "./components";

const c = brand.colors;

export function renderPaymentSubmittedCustomer(order) {
  const content = `
    ${eyebrow("Payment received")}
    ${heading(`Thanks, ${order.customerFirstName || "there"} — we've got your payment proof.`)}
    ${paragraph(
      `We're verifying your bank transfer for order <strong>${escapeHtml(order.orderNumber)}</strong>. You'll get another email as soon as it's approved and your order moves into production.`,
      { muted: true }
    )}
    ${panel(
      infoTable([
        { label: "Order number", value: order.orderNumber, strong: true },
        { label: "Amount", value: order.totalFormatted },
        { label: "Payment", value: order.paymentMethodLabel }
      ]),
      { title: "Order summary" }
    )}
    <div style="font-family:${brand.fontStack};font-size:11px;letter-spacing:1px;text-transform:uppercase;font-weight:700;color:${c.charcoal};margin:0 0 4px;">Your items</div>
    ${itemsTable(order.items)}
    ${totals(order)}
    ${divider()}
    ${paragraph(`Questions? Email <a href="mailto:${escapeHtml(contact.supportEmail)}" style="color:${c.clay};text-decoration:none;">${escapeHtml(contact.supportEmail)}</a>.`, { muted: true })}
  `;
  return emailLayout({
    title: `Payment received ${order.orderNumber}`,
    preheader: `We're verifying your payment for ${order.orderNumber}.`,
    contentHtml: content
  });
}

export function renderPaymentSubmittedOwner(order) {
  const content = `
    ${eyebrow("Payment to verify")}
    ${heading(`Verify payment — ${order.orderNumber}`)}
    ${paragraph(`${escapeHtml(order.customerName)} uploaded a bank-transfer receipt totalling <strong style="color:${c.clay};">${order.totalFormatted}</strong>. Review it in the admin dashboard and approve or reject.`, { muted: true })}
    ${panel(
      infoTable([
        { label: "Order", value: order.orderNumber, strong: true },
        { label: "Customer", value: order.customerName },
        { label: "Email", value: order.customerEmail },
        { label: "Amount", value: order.totalFormatted }
      ]),
      { title: "Order" }
    )}
    ${itemsTable(order.items)}
    ${totals(order)}
  `;
  return emailLayout({
    title: `Payment to verify ${order.orderNumber}`,
    preheader: `${order.customerName} — ${order.totalFormatted}`,
    contentHtml: content
  });
}
