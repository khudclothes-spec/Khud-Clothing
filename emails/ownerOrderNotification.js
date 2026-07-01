// Owner / studio notification email — sent to each of the four owners on every
// successful order. Operations-focused: full customer + order detail.

import { brand } from "@/lib/email/config";
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

export function renderOwnerOrderNotification(order) {
  const content = `
    ${eyebrow("New order")}
    ${heading(`New order ${order.orderNumber}`)}
    ${paragraph(`Placed ${order.orderDateTime}. Total <strong style="color:${c.clay};">${order.totalFormatted}</strong>.`, { muted: true })}

    ${panel(
      infoTable([
        { label: "Name", value: order.customerName, strong: true },
        { label: "Email", value: order.customerEmail },
        { label: "Phone", value: order.customerPhone },
        { label: "Order #", value: order.orderNumber },
        { label: "Placed", value: order.orderDateTime }
      ]),
      { title: "Customer" }
    )}

    ${panel(
      `
      <div style="font-family:${brand.fontStack};font-size:13px;line-height:1.7;color:${c.ink};">
        ${escapeHtml(order.shippingAddress)}<br />
        ${escapeHtml(order.city)}
      </div>`,
      { title: "Ship to" }
    )}

    ${
      order.notes
        ? panel(
            `<div style="font-family:${brand.fontStack};font-size:13px;line-height:1.6;color:${c.ink};">${escapeHtml(order.notes)}</div>`,
            { title: "Notes" }
          )
        : ""
    }

    <div style="font-family:${brand.fontStack};font-size:11px;letter-spacing:1px;text-transform:uppercase;font-weight:700;color:${c.charcoal};margin:0 0 4px;">Items</div>
    ${itemsTable(order.items)}
    ${totals(order)}

    ${divider()}
    ${paragraph(`Manage this order in the admin dashboard.`, { muted: true })}
  `;

  return emailLayout({
    title: `New order ${order.orderNumber}`,
    preheader: `${order.customerName} — ${order.totalFormatted} — ${order.itemCount} item(s)`,
    contentHtml: content
  });
}
