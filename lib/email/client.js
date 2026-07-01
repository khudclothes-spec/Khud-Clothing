// Email transport. Uses Resend's HTTP API via fetch — no SDK dependency, so it
// works anywhere and is trivial to swap for SMTP/SES later (only this file
// changes). Server-side only; never import from a client component.

import { fromAddress } from "./config";

const RESEND_ENDPOINT = "https://api.resend.com/emails";

/**
 * Send one email.
 * @param {object} opts
 * @param {string|string[]} opts.to
 * @param {string} opts.subject
 * @param {string} opts.html
 * @param {string} [opts.replyTo]
 * @returns {Promise<{ id?: string, skipped?: boolean }>}
 */
export async function sendEmail({ to, subject, html, replyTo }) {
  const apiKey = process.env.RESEND_API_KEY;

  // Degrade gracefully in dev / when unconfigured: log instead of throwing so
  // checkout never breaks because email isn't set up yet.
  if (!apiKey) {
    console.warn(`[email] RESEND_API_KEY not set — skipped "${subject}" to ${Array.isArray(to) ? to.join(", ") : to}`);
    return { skipped: true };
  }

  const res = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: fromAddress(),
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      ...(replyTo ? { reply_to: replyTo } : {})
    })
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`[email] send failed (${res.status}): ${detail}`);
  }

  return res.json().catch(() => ({}));
}

// Send several emails, isolating failures so one bad address doesn't block the
// rest. Returns per-message results; callers should log, not throw, on failure.
export async function sendEmails(messages) {
  return Promise.allSettled(messages.map((m) => sendEmail(m)));
}
