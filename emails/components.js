// Reusable, inline-styled HTML building blocks for emails. Kept as small
// functions so templates compose instead of repeating inline HTML. Table-based
// + inline styles for broad email-client support (Gmail, Outlook, Apple Mail).

import { brand } from "@/lib/email/config";

const c = brand.colors;

export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function money(n) {
  return `Rs ${Number(n ?? 0).toLocaleString("en-US")}`;
}

export function heading(text, { size = 22 } = {}) {
  return `<h1 style="margin:0 0 6px;font-family:${brand.fontStack};font-size:${size}px;line-height:1.25;font-weight:700;color:${c.ink};">${escapeHtml(text)}</h1>`;
}

export function paragraph(html, { muted = false } = {}) {
  return `<p style="margin:0 0 14px;font-family:${brand.fontStack};font-size:14px;line-height:1.6;color:${muted ? c.charcoal : c.ink};">${html}</p>`;
}

export function eyebrow(text) {
  return `<div style="font-family:${brand.fontStack};font-size:11px;letter-spacing:1.5px;text-transform:uppercase;font-weight:700;color:${c.clay};margin:0 0 10px;">${escapeHtml(text)}</div>`;
}

export function divider() {
  return `<div style="height:1px;background:${c.line};margin:22px 0;"></div>`;
}

// Simple label/value stack used for order + contact summaries.
export function infoTable(rows) {
  const body = rows
    .filter((r) => r && (r.value ?? "") !== "")
    .map(
      (r) => `
      <tr>
        <td style="padding:5px 0;font-family:${brand.fontStack};font-size:12px;color:${c.charcoal};white-space:nowrap;vertical-align:top;">${escapeHtml(r.label)}</td>
        <td style="padding:5px 0 5px 16px;font-family:${brand.fontStack};font-size:13px;color:${c.ink};font-weight:${r.strong ? 700 : 500};text-align:right;">${r.raw ? r.value : escapeHtml(r.value)}</td>
      </tr>`
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;">${body}</table>`;
}

// The line-items table (product, colour/size, qty, price).
export function itemsTable(items) {
  const rows = items
    .map(
      (it) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid ${c.line};font-family:${brand.fontStack};font-size:13px;color:${c.ink};vertical-align:top;">
          <div style="font-weight:600;">${escapeHtml(it.name)}</div>
          <div style="font-size:12px;color:${c.charcoal};margin-top:2px;">${escapeHtml([it.color, it.size].filter(Boolean).join(" / ") || "—")}</div>
        </td>
        <td style="padding:10px 0;border-bottom:1px solid ${c.line};font-family:${brand.fontStack};font-size:13px;color:${c.charcoal};text-align:center;vertical-align:top;white-space:nowrap;">x${escapeHtml(it.quantity)}</td>
        <td style="padding:10px 0;border-bottom:1px solid ${c.line};font-family:${brand.fontStack};font-size:13px;color:${c.ink};text-align:right;vertical-align:top;white-space:nowrap;">${money(it.lineTotal)}</td>
      </tr>`
    )
    .join("");

  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;margin:4px 0 0;">
    <thead>
      <tr>
        <th align="left" style="padding:0 0 8px;font-family:${brand.fontStack};font-size:11px;letter-spacing:0.5px;text-transform:uppercase;color:${c.charcoal};border-bottom:2px solid ${c.ink};">Item</th>
        <th align="center" style="padding:0 0 8px;font-family:${brand.fontStack};font-size:11px;letter-spacing:0.5px;text-transform:uppercase;color:${c.charcoal};border-bottom:2px solid ${c.ink};">Qty</th>
        <th align="right" style="padding:0 0 8px;font-family:${brand.fontStack};font-size:11px;letter-spacing:0.5px;text-transform:uppercase;color:${c.charcoal};border-bottom:2px solid ${c.ink};">Total</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>`;
}

// Totals block (subtotal / promo / online discount / shipping / total).
export function totals({ subtotal, shippingCost, total, discount = 0, promoDiscount = 0, promoCode = "" }) {
  const shipLabel = Number(shippingCost) > 0 ? money(shippingCost) : "Free";
  const line = (label, value, accent = false) => `
    <tr>
      <td style="padding:4px 0;font-family:${brand.fontStack};font-size:13px;color:${c.charcoal};">${escapeHtml(label)}</td>
      <td style="padding:4px 0;font-family:${brand.fontStack};font-size:13px;color:${accent ? c.clay : c.ink};text-align:right;">${value}</td>
    </tr>`;
  const promoRow = Number(promoDiscount) > 0 ? line(`Promo${promoCode ? ` (${promoCode})` : ""}`, `−${money(promoDiscount)}`, true) : "";
  const discountRow = Number(discount) > 0 ? line("Online discount", `−${money(discount)}`, true) : "";
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;margin-top:12px;">
    ${line("Subtotal", money(subtotal))}
    ${promoRow}
    ${discountRow}
    ${line("Shipping", shipLabel)}
    <tr>
      <td style="padding:10px 0 0;border-top:2px solid ${c.ink};font-family:${brand.fontStack};font-size:15px;font-weight:700;color:${c.ink};">Total</td>
      <td style="padding:10px 0 0;border-top:2px solid ${c.ink};font-family:${brand.fontStack};font-size:15px;font-weight:700;color:${c.clay};text-align:right;">${money(total)}</td>
    </tr>
  </table>`;
}

// A framed panel used to group content (e.g. the shipping address).
export function panel(innerHtml, { title } = {}) {
  return `
  <div style="border:1px solid ${c.line};border-radius:8px;background:${c.cream};padding:18px 20px;margin:0 0 18px;">
    ${title ? `<div style="font-family:${brand.fontStack};font-size:11px;letter-spacing:1px;text-transform:uppercase;font-weight:700;color:${c.charcoal};margin:0 0 10px;">${escapeHtml(title)}</div>` : ""}
    ${innerHtml}
  </div>`;
}

export function button(href, label) {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:6px 0 4px;">
    <tr>
      <td style="border-radius:3px;background:${c.ink};">
        <a href="${escapeHtml(href)}" target="_blank" style="display:inline-block;padding:13px 26px;font-family:${brand.fontStack};font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${c.bone};text-decoration:none;border-radius:3px;">${escapeHtml(label)}</a>
      </td>
    </tr>
  </table>`;
}

export function statusBadge(label, color) {
  return `<span style="display:inline-block;padding:4px 12px;border-radius:20px;background:${color};color:#ffffff;font-family:${brand.fontStack};font-size:11px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;">${escapeHtml(label)}</span>`;
}
