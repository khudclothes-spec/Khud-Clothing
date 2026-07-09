// Student verification email (account-based). Sends a one-time code the
// customer enters on their account to unlock student pricing. Never emails a
// promo code. No-ops if Resend is unconfigured (see client.js).

import { sendEmail } from "./client";
import { brand } from "./config";
import { emailLayout } from "@/emails/layout";
import { eyebrow, heading, paragraph, panel, escapeHtml } from "@/emails/components";

const c = brand.colors;

export async function sendStudentVerificationEmail(to, token, name) {
  const content = `
    ${eyebrow("Student verification")}
    ${heading("Verify your student status")}
    ${paragraph(`Hi ${escapeHtml(name || "there")}, enter this code on your Khud account to unlock student pricing:`, { muted: true })}
    ${panel(
      `<div style="font-family:${brand.fontStack};font-size:26px;font-weight:800;letter-spacing:4px;text-align:center;color:${c.ink};">${escapeHtml(token)}</div>`
    )}
    ${paragraph("This code expires in 24 hours. If you didn't request it, you can ignore this email.", { muted: true })}
  `;
  return sendEmail({
    to,
    subject: "Verify your student status — Khud",
    html: emailLayout({ title: "Student verification", preheader: "Your student verification code", contentHtml: content })
  });
}
