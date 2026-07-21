// The shared shell every Char Meem Clothing email renders inside: dark branded
// header with the logo, a light content card, and a footer with contact placeholders.

import { brand, contact } from "@/lib/email/config";
import { escapeHtml } from "./components";

const c = brand.colors;

/**
 * Wrap content in the branded email layout.
 * @param {object} opts
 * @param {string} opts.title      Document <title> / accessible title.
 * @param {string} opts.preheader  Hidden inbox-preview line.
 * @param {string} opts.contentHtml
 */
export function emailLayout({ title, preheader = "", contentHtml }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light only" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:${c.taupe};background:${c.bone};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;font-size:1px;line-height:1px;color:${c.bone};">${escapeHtml(preheader)}</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;background:${c.bone};padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:92%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 8px 30px rgba(17,16,14,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:${c.ink};padding:24px 32px;">
              <img src="${brand.logoUrl}" alt="${escapeHtml(brand.name)}" height="46" style="height:46px;width:auto;display:block;" />
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:32px;">
              ${contentHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:${c.cream};border-top:1px solid ${c.line};padding:24px 32px;">
              <p style="margin:0 0 8px;font-family:${brand.fontStack};font-size:12px;line-height:1.6;color:${c.charcoal};">
                Need help with your order? We're here.
              </p>
              <p style="margin:0 0 4px;font-family:${brand.fontStack};font-size:12px;line-height:1.6;color:${c.charcoal};">
                WhatsApp: <a href="https://wa.me/${contact.whatsapp.replace(/[^0-9]/g, "")}" style="color:${c.clay};text-decoration:none;">${escapeHtml(contact.whatsapp)}</a>
                &nbsp;&middot;&nbsp;
                Email: <a href="mailto:${escapeHtml(contact.supportEmail)}" style="color:${c.clay};text-decoration:none;">${escapeHtml(contact.supportEmail)}</a>
              </p>
              <p style="margin:12px 0 0;font-family:${brand.fontStack};font-size:11px;line-height:1.6;color:${c.charcoal};opacity:0.75;">
                ${escapeHtml(brand.name)} &middot; ${escapeHtml(contact.address)}<br />
                ${escapeHtml(brand.tagline)}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
