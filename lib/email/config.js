// Central email configuration + Char Meem Clothing brand tokens used by every
// template. Everything here is server-side only.

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://charmeem.com").replace(/\/$/, "");
}

// Brand palette + assets reused across all email templates.
export const brand = {
  name: "Char Meem Clothing",
  tagline: "Wear your imprint.",
  siteUrl: siteUrl(),
  // Emails need an absolute logo URL. Uses the gold wordmark on the dark header.
  logoUrl: `${siteUrl()}/images/charmeem-logo-gold.png`,
  colors: {
    ink: "#11100E",
    charcoal: "#5F5A52",
    clay: "#A94732",
    brass: "#B99149",
    bone: "#F4EFE6",
    cream: "#FBF8F1",
    olive: "#6D745F",
    taupe: "#D8CDBB",
    line: "#E7DFD1"
  },
  fontStack:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
};

// Customer-facing contact placeholders (override via env in production).
export const contact = {
  supportEmail: process.env.SUPPORT_EMAIL || "khudclothes@gmail.com",
  whatsapp: process.env.WHATSAPP_NUMBER || "+92 300 0000000",
  address: process.env.STORE_ADDRESS || "Islamabad, Pakistan"
};

// Shown to the customer on the confirmation email.
export const fulfilment = {
  processingTime: process.env.PROCESSING_TIME || "5 to 7 business days",
  paymentMethod: "Cash on Delivery (COD)"
};

// The four owner notification addresses. Replace the placeholders via env.
export function ownerEmails() {
  return [
    process.env.OWNER_EMAIL_1 || "owner1@example.com",
    process.env.OWNER_EMAIL_2 || "owner2@example.com",
    process.env.OWNER_EMAIL_3 || "owner3@example.com",
    process.env.OWNER_EMAIL_4 || "owner4@example.com"
  ].filter(Boolean);
}

// The "From" address. Must be a verified sender/domain in your email provider.
export function fromAddress() {
  return process.env.EMAIL_FROM || "Char Meem Clothing <onboarding@resend.dev>";
}
