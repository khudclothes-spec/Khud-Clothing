# Char Meem Clothing Email System

Production email for Char Meem Clothing, split into two independent channels:

1. **Auth emails** — sent by **Supabase Auth** (signup verification, password reset). We only brand the templates and build the in-app verification UX.
2. **Transactional order emails** — sent by **our server** via Resend: order confirmation (customer), owner notifications (×4), and order status updates.

> Golden rule: order emails are **only ever sent server-side**. The client sends an order id to an API route; all content and delivery happen on the server.

---

## 1. Architecture

```
Checkout (client)                     Admin (client)
  CartContext.placeOrder                AdminOrdersPage.updateStatus
        │ order id                             │ order id + status
        ▼                                       ▼
  POST /api/orders/confirm            POST /api/orders/status
        │  (auth + ownership + idempotent)      │  (admin only)
        ▼                                       ▼
  lib/email/orders.js  ───────────────►  lib/email/client.js ──► Resend API
        │  builds model, renders templates
        ▼
  emails/*  (layout + components + templates → HTML strings)
```

| File | Responsibility |
|------|----------------|
| [lib/email/config.js](../lib/email/config.js) | Brand tokens, contact placeholders, owner emails, from-address |
| [lib/email/client.js](../lib/email/client.js) | Transport — Resend HTTP API via `fetch` (swap here for SMTP/SES) |
| [lib/email/orders.js](../lib/email/orders.js) | Normalises a DB order → model, sends confirmation / owner / status emails |
| [emails/layout.js](../emails/layout.js) | Branded shell (dark header + logo, content card, footer) |
| [emails/components.js](../emails/components.js) | Reusable blocks: heading, paragraph, itemsTable, totals, panel, button, badge |
| [emails/customerOrderConfirmation.js](../emails/customerOrderConfirmation.js) | Customer confirmation template |
| [emails/ownerOrderNotification.js](../emails/ownerOrderNotification.js) | Owner notification template |
| [emails/orderStatusUpdate.js](../emails/orderStatusUpdate.js) | Status update template + `STATUS_COPY` map |
| [app/api/orders/confirm/route.js](../app/api/orders/confirm/route.js) | Trigger for confirmation + owner emails |
| [app/api/orders/status/route.js](../app/api/orders/status/route.js) | Admin status update + customer email |

Templates are plain functions returning HTML strings — modular and composable, with **zero email-framework dependency**, so they render reliably in Gmail, Outlook and Apple Mail.

---

## 2. Authentication emails (Supabase)

Email verification is enabled in the Supabase dashboard. Supabase sends the
verification and password-reset emails; the app provides the UX around them.

### Verification flow

1. **Signup** ([app/login/LoginForm.jsx](../app/login/LoginForm.jsx)) calls `supabase.auth.signUp` with `emailRedirectTo: <origin>/verify-email`. With confirmation on, no session is returned.
2. The user is redirected to **[/verify-email](../app/verify-email/page.jsx)**, which shows:
   - "We've sent a verification email."
   - "Please check your inbox."
   - "Didn't receive it?" → **Resend** button (30s cooldown).
3. **Detection is automatic** — no manual restart:
   - `onAuthStateChange` fires when the confirmation link is opened in the same browser (Supabase redirects back to `/verify-email`, the browser client picks up the session).
   - A 4-second poll (`supabase.auth.getUser()`) catches the session appearing any other way.
   - On verification the page shows a success state and redirects into the app.

### Resend flow

The resend button calls `supabase.auth.resend({ type: "signup", email })`, then starts a 30-second cooldown to prevent spamming.

### Guards (unverified users can't order)

- Supabase already blocks unverified users from obtaining a session (`signInWithPassword` returns "Email not confirmed"), so they can never authenticate.
- Defence in depth is added anyway:
  - [components/CartContext.jsx](../components/CartContext.jsx) `placeOrder` throws if `user.email_confirmed_at` is missing.
  - [app/api/orders/confirm/route.js](../app/api/orders/confirm/route.js) returns 403 for unverified users.
- The `process_checkout` RPC requires `auth.uid()`, so an unauthenticated (hence unverified) user cannot place an order at the database level either.

### Branding (Phase 2)

Paste the branded templates into **Supabase Dashboard → Authentication → Emails**:

| Supabase template | File | Subject |
|-------------------|------|---------|
| Confirm signup | [docs/supabase-email-templates/confirm-signup.html](supabase-email-templates/confirm-signup.html) | `Verify your email for Char Meem Clothing` |
| Reset password | [docs/supabase-email-templates/reset-password.html](supabase-email-templates/reset-password.html) | `Reset your Char Meem Clothing password` |

Branding used across all emails:
- **Logo**: gold wordmark logo on the dark (`#11100E`) header. (`{{ .SiteURL }}/images/charmeem-logo-gold.png` in Supabase templates.)
- **Colours**: ink `#11100E`, clay accent `#A94732`, brass `#B99149`, olive `#6D745F`, bone `#F4EFE6`, cream `#FBF8F1`, line `#E7DFD1`.
- **Voice**: warm, concise, no jargon. Sign-off "Wear your imprint."
- **No references to Supabase** anywhere in the copy.

Also set **Authentication → URL Configuration → Site URL** to your production URL and add `<site>/verify-email` to the redirect allow-list.

---

## 3. Order confirmation emails (Phase 3)

Triggered after `process_checkout` succeeds. `CartContext.placeOrder` fires
`POST /api/orders/confirm` with the order id (fire-and-forget — an email hiccup
never fails a placed order). The route:

1. Authenticates the user and confirms `email_confirmed_at`.
2. Loads the order with the service-role client and verifies `order.profile_id === user.id`.
3. Skips if `orders.confirmation_sent_at` is already set (idempotent).
4. Sends the **customer** email + one **owner** email to each of the four addresses.
5. Stamps `confirmation_sent_at`.

### Customer email includes
Thank-you message, order number, order date, customer name, shipping address,
each product with quantity / size / colour / item price, order total, payment
method (Cash on Delivery), estimated processing time, WhatsApp + support
placeholders. **No shipment tracking.**

### Owner notification (×4) includes
Customer name, email, phone, shipping address, order number, ordered products,
quantities, notes, total, and time ordered. Sent to `OWNER_EMAIL_1..4`.

---

## 4. Order status update emails

When an owner changes an order's status in the admin dashboard, the change is
routed through `POST /api/orders/status` (admin-only), which updates
`orders.status` **and** emails the customer. Emails are sent for these statuses
(from `STATUS_COPY` in [emails/orderStatusUpdate.js](../emails/orderStatusUpdate.js)):

| Status | Customer message |
|--------|------------------|
| `confirmed` | Order confirmed, queued for production |
| `processing` | Being printed (in production) |
| `shipped` | On its way |
| `delivered` | Delivered — enjoy |
| `cancelled` | Cancelled, contact us if unexpected |

`pending` does not send (it's the initial state covered by the confirmation email).

---

## 5. Environment variables

| Variable | Purpose |
|----------|---------|
| `RESEND_API_KEY` | Resend API key. **If unset, order emails are skipped (logged)** so local checkout still works. |
| `EMAIL_FROM` | From address, e.g. `Char Meem Clothing <orders@yourdomain.com>` (must be a verified sender/domain). |
| `OWNER_EMAIL_1..4` | The four owner notification recipients. |
| `SUPPORT_EMAIL` | Support email shown to customers. |
| `WHATSAPP_NUMBER` | WhatsApp contact shown to customers. |
| `STORE_ADDRESS` | Footer address line. |
| `PROCESSING_TIME` | Estimated processing time copy. |
| `NEXT_PUBLIC_SITE_URL` | Used for the absolute logo URL in emails. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only; used by the API routes to read/update orders. |

See [.env.local.example](../.env.local.example).

---

## 6. Email provider setup (Resend)

1. Create an account at [resend.com](https://resend.com).
2. **Add and verify your domain** (DNS records), or use the sandbox `onboarding@resend.dev` for testing.
3. Create an **API key** → set `RESEND_API_KEY`.
4. Set `EMAIL_FROM` to an address on your verified domain.
5. Deploy. Place a test order and confirm the customer + owner emails arrive.

To switch providers (SMTP, SES, Postmark, etc.) change only
[lib/email/client.js](../lib/email/client.js) `sendEmail` — the templates and
callers are provider-agnostic.

---

## 7. Database

Migration [scripts/018_order_email_flags.sql](../scripts/018_order_email_flags.sql)
adds `orders.confirmation_sent_at` (idempotency). Run it in the Supabase SQL editor.

---

## 8. Future: shipment tracking notifications

The status system already supports `shipped`. To add tracking later:

1. Add `orders.tracking_number` + `orders.courier` columns (migration).
2. Capture them in the admin order editor.
3. Extend `STATUS_COPY.shipped` (and the template) to render a tracking block/link when present.
4. Optionally add a `carrier_url` map so the email links straight to the courier's tracking page.

No architectural change is needed — it's a template + column addition on the existing status-email path.
