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

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Send several emails SEQUENTIALLY with a gap between each, so we stay under the
// provider's rate limit (Resend's default is 2 requests/second). Failures are
// isolated so one bad address doesn't block the rest. Returns Promise.allSettled
// -shaped results; callers should log, not throw, on failure. gapMs of 600 keeps
// us at ~1.6/sec. This runs server-side in fire-and-forget routes, so the extra
// wall-clock time never delays the customer.
export async function sendEmails(messages, { gapMs = 600 } = {}) {
  const results = [];
  for (let i = 0; i < messages.length; i++) {
    if (i > 0) await sleep(gapMs);
    try {
      results.push({ status: "fulfilled", value: await sendEmail(messages[i]) });
    } catch (reason) {
      results.push({ status: "rejected", reason });
    }
  }
  return results;
}
