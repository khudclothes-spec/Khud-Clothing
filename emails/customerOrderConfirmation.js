// Customer order confirmation email.

import { brand, contact, fulfilment } from "@/lib/email/config";
import { emailLayout } from "./layout";
import {
  eyebrow,
  heading,
  paragraph,
  divider,
  panel,
  infoTable,
  itemsTable,
  totals,
  escapeHtml
} from "./components";

const c = brand.colors;

export function renderCustomerOrderConfirmation(order) {
  const content = `
    ${eyebrow("Order confirmed")}
    ${heading(`Thank you, ${order.customerFirstName || order.customerName || "there"}.`)}
    ${paragraph(
      `We've received your order and it's now being prepared. You'll get another note from us as it moves through printing and dispatch.`,
      { muted: true }
    )}

    ${panel(
      infoTable([
        { label: "Order number", value: order.orderNumber, strong: true },
        { label: "Order date", value: order.orderDate },
        { label: "Payment", value: order.paymentMethodLabel || fulfilment.paymentMethod },
        { label: "Est. processing", value: fulfilment.processingTime }
      ]),
      { title: "Order summary" }
    )}

    ${panel(
      `
      <div style="font-family:${brand.fontStack};font-size:13px;line-height:1.7;color:${c.ink};">
        <strong>${escapeHtml(order.customerName)}</strong><br />
        ${escapeHtml(order.shippingAddress)}<br />
        ${escapeHtml(order.city)}${order.customerPhone ? `<br />${escapeHtml(order.customerPhone)}` : ""}
      </div>`,
      { title: "Shipping to" }
    )}

    <div style="font-family:${brand.fontStack};font-size:11px;letter-spacing:1px;text-transform:uppercase;font-weight:700;color:${c.charcoal};margin:0 0 4px;">Your items</div>
    ${itemsTable(order.items)}
    ${totals(order)}

    ${divider()}

    ${paragraph(
      `Questions about your order? Message us on WhatsApp at <a href="https://wa.me/${contact.whatsapp.replace(/[^0-9]/g, "")}" style="color:${c.clay};text-decoration:none;">${escapeHtml(contact.whatsapp)}</a> or email <a href="mailto:${escapeHtml(contact.supportEmail)}" style="color:${c.clay};text-decoration:none;">${escapeHtml(contact.supportEmail)}</a>.`,
      { muted: true }
    )}
  `;

  return emailLayout({
    title: `Your Char Meem Clothing order ${order.orderNumber}`,
    preheader: `Thanks for your order ${order.orderNumber}. Total ${order.totalFormatted}.`,
    contentHtml: content
  });
}
