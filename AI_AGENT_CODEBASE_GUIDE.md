# Khud Codebase Guide

This file is the shortest high-signal map of the repository for humans and AI agents.
Read this first when you need to understand the app structure, the data layer, or where a behavior lives.

## 1. What This Project Is

Khud is a Next.js 16 App Router storefront for a premium clothing brand.
It is intentionally built as a polished frontend-first experience, with Supabase-backed data paths for auth, products, orders, reviews, and admin tools.

Core stack:

- Next.js App Router
- React
- Plain CSS only, no Tailwind
- Supabase for auth and database access
- Framer Motion for selected entrance and reveal animations

Brand and visual system:

- Headings use Bodoni Moda
- Body and UI use Hanken Grotesk
- Palette is warm neutral: bone, ink, clay, brass, olive, taupe
- Styling lives mainly in one file: [app/globals.css](app/globals.css)

## 2. Fast Reading Order For Agents

If you want the minimum useful context, read in this order:

1. [CLAUDE.md](CLAUDE.md)
2. [app/layout.jsx](app/layout.jsx)
3. [components/SiteShell.jsx](components/SiteShell.jsx)
4. [lib/data.js](lib/data.js)
5. [lib/supabase-server.ts](lib/supabase-server.ts)
6. [components/CartContext.jsx](components/CartContext.jsx)
7. [db/clothing_ecommerce_schema.sql](db/clothing_ecommerce_schema.sql)
8. [scripts/](scripts/)

That sequence gives the app shell, design language, content source, data access, cart/order flow, and database source of truth.

## 3. Top-Level Directory Map

```text
Khud/
├── app/                 # Next.js routes, layouts, and page-level UI
├── components/          # Shared React components and UI primitives
├── db/                  # Base SQL schema and database source of truth
├── devs/                # Contributor notes and task tracking
├── docs/                # Database summaries and alignment reports
├── lib/                 # Shared data, Supabase clients, mapping helpers, animations
├── public/              # Static assets, mainly brand imagery
├── scripts/             # Ordered SQL migrations / fixes
├── CLAUDE.md            # Persistent project instructions
├── package.json         # Scripts and dependencies
├── jsconfig.json        # Path aliasing for @/ imports
├── next.config.mjs      # Next.js config
├── proxy.ts             # Next.js proxy/middleware layer
└── SKILLS.md            # Skill references for the workspace
```

## 4. App Router Structure

### Root App Shell

- [app/layout.jsx](app/layout.jsx) sets global metadata, loads Google Fonts, and wraps the app in [components/SiteShell.jsx](components/SiteShell.jsx).
- [app/globals.css](app/globals.css) contains the entire styling system, animations, responsive rules, and page chrome.
- [app/page.jsx](app/page.jsx) is the storefront homepage and the most data-rich landing page.

### Public Pages

- [app/shop/page.jsx](app/shop/page.jsx) renders the category landing page.
- [app/shop/[slug]/page.jsx](app/shop/%5Bslug%5D/page.jsx) renders a category-specific catalog page.
- [app/product/[slug]/page.jsx](app/product/%5Bslug%5D/page.jsx) renders an individual product page and normalizes DB data for the detail component.
- [app/customize/page.jsx](app/customize/page.jsx) opens the Fabric.js custom studio (see section 14).
- [app/size-guide/page.jsx](app/size-guide/page.jsx) shows the fit table and measurement guidance.
- [app/size/page.jsx](app/size/page.jsx) is a simple alias that re-exports the size guide page.
- [app/about/page.jsx](app/about/page.jsx) contains the brand story and quality promise.

### Auth Pages

- [app/login/page.jsx](app/login/page.jsx) loads the auth form.
- [app/login/LoginForm.jsx](app/login/LoginForm.jsx) handles sign-in, sign-up, profile creation fallback, and role-based redirect.
- [app/forgot-password/page.jsx](app/forgot-password/page.jsx) sends password reset emails.
- [app/reset-password/page.jsx](app/reset-password/page.jsx) accepts the new password after a reset link.

### Review Flow

- [app/reviews/new/page.jsx](app/reviews/new/page.jsx) lets an authenticated user submit a review for a product.

### Admin Area

- [app/admin/layout.jsx](app/admin/layout.jsx) gates the admin area by authenticated user and profile role.
- [app/admin/page.jsx](app/admin/page.jsx) manages products.
- [app/admin/categories/page.jsx](app/admin/categories/page.jsx) manages categories.
- [app/admin/orders/page.jsx](app/admin/orders/page.jsx) manages orders and order status.
- [app/admin/customization/page.jsx](app/admin/customization/page.jsx) toggles which categories are customizable + their mockup set.
- [app/admin/customization/designs/page.jsx](app/admin/customization/designs/page.jsx) manages the reusable "Choose Design" templates.
- [app/admin/storefront/page.jsx](app/admin/storefront/page.jsx) picks the homepage hero (best) product and the ≤3 footer categories.
- [app/admin/layout.jsx](app/admin/layout.jsx) renders [components/AdminSidebar.jsx](components/AdminSidebar.jsx), a client sidebar that collapses to an off-canvas drawer (hamburger toggle) below 900px so the editing area gets the full width.

### Admin Route Behavior

- Admin pages depend on `profiles.role === "admin"`.
- The layout redirects unauthenticated users to /login and non-admin users to /.
- The sidebar links are Products, Categories, and Orders.

## 5. Shared Components

These are the main reusable UI pieces and where they fit:

- [components/SiteShell.jsx](components/SiteShell.jsx) controls the top-level site chrome: nav, mobile menu, auth entry points, cart button, footer, route transition overlay, and reveal observer.
- [components/CartContext.jsx](components/CartContext.jsx) stores cart state in React context and also submits checkout orders to Supabase.
- [components/ProductCard.jsx](components/ProductCard.jsx) renders product tiles and quick add / link behavior.
- [components/CategoryShop.jsx](components/CategoryShop.jsx) handles category-page filtering and sorting.
- [components/CustomStudio.jsx](components/CustomStudio.jsx) is the Fabric.js customization studio orchestrator (see section 14). It replaced the old proof-request `CustomizeBuilder`.
- [components/Reveal.jsx](components/Reveal.jsx) wraps Framer Motion reveal patterns.
- [components/SessionMonitor.jsx](components/SessionMonitor.jsx) signs users out after inactivity and shows a warning modal.
- [components/TeeGraphic.jsx](components/TeeGraphic.jsx) draws the garment silhouette used across cards and illustrations.
- [components/Newsletter.jsx](components/Newsletter.jsx) is a frontend-only email capture demo.
- [components/StarRating.jsx](components/StarRating.jsx) renders interactive rating input and display.
- [components/Icons.jsx](components/Icons.jsx) is the custom SVG icon set.

## 6. Shared Library Files

### Content and Product Data

- [lib/data.js](lib/data.js) is the master static content file.
- It contains colors, product stubs, category cards, navigation links, custom-studio steps, quality promises, sizing tables, fit cards, measurement tips, about-page blocks, and custom builder options.
- It also exports formatting helpers such as `formatPrice` and shape paths for tees and hoodies.

### Supabase Clients

- [lib/supabase.ts](lib/supabase.ts) is the browser client for use inside client components.
- [lib/supabase-server.ts](lib/supabase-server.ts) is the server client for Server Components, Route Handlers, and Server Actions.
- [lib/supabase-server.ts](lib/supabase-server.ts) also exposes an admin client using the service-role key for trusted server-only use.

### Database Mapping

- [lib/mapDbProduct.js](lib/mapDbProduct.js) converts joined Supabase product rows into the shape expected by product cards, category grids, and the product detail page.
- It selects a primary image from `product_media`, converts storage paths into public URLs, collects sizes and colors from variants, and determines stock state.

### Motion Helpers

- [lib/animations.js](lib/animations.js) defines reusable Framer Motion variants and viewport settings.

## 7. Data Flow By Feature

### Homepage

[app/page.jsx](app/page.jsx) is the most important consumer of both static and DB-backed content.

- Starts with local fallback products from [lib/data.js](lib/data.js).
- Attempts to fetch featured active products from Supabase.
- Attempts to fetch active categories and counts of active products per category.
- Attempts to fetch approved reviews.
- Falls back to local content if Supabase is unavailable.

### Shop Pages

[app/shop/page.jsx](app/shop/page.jsx) and [app/shop/[slug]/page.jsx](app/shop/%5Bslug%5D/page.jsx) both fetch categories and active products from Supabase, then use [components/CategoryShop.jsx](components/CategoryShop.jsx) and [lib/mapDbProduct.js](lib/mapDbProduct.js) to present them.

### Product Detail

[app/product/[slug]/page.jsx](app/product/%5Bslug%5D/page.jsx) loads a single active product, normalizes it, and passes it to the product detail component.
The page expects the database shape to include product media and variants joined from related tables.

### Cart and Checkout

[components/CartContext.jsx](components/CartContext.jsx) owns the cart.

- Cart is in-memory only; there is no persistence layer for reload recovery.
- `placeOrder` creates an order row, then inserts order items.
- The flow requires an authenticated Supabase user.
- Shipping address lines are flattened into a single text field before insert.

### Authentication

[app/login/LoginForm.jsx](app/login/LoginForm.jsx) handles both login and signup.

- Login uses Supabase password auth.
- Signup creates auth credentials and stores `full_name` in auth metadata.
- It then looks up the matching profile row and redirects based on role.
- Phone is patched into the profile row when provided.

### Password Reset

- [app/forgot-password/page.jsx](app/forgot-password/page.jsx) triggers the reset email.
- [app/reset-password/page.jsx](app/reset-password/page.jsx) completes the password update.

### Reviews

[app/reviews/new/page.jsx](app/reviews/new/page.jsx) requires authentication, loads active products, and inserts a review row for the signed-in profile.

### Admin

- [app/admin/page.jsx](app/admin/page.jsx) can create, edit, delete, and toggle products.
- [app/admin/categories/page.jsx](app/admin/categories/page.jsx) can create, edit, delete, and toggle categories.
- [app/admin/orders/page.jsx](app/admin/orders/page.jsx) lists orders, expands line items, and updates order status.

## 8. Database Structure

### Source of Truth

- [db/clothing_ecommerce_schema.sql](db/clothing_ecommerce_schema.sql) is the canonical base schema.
- [docs/database-schema-summary.md](docs/database-schema-summary.md) is the human-readable schema summary.
- [docs/database-alignment-report.md](docs/database-alignment-report.md) records the code-to-schema audit.
- [docs/final-summary.md](docs/final-summary.md) summarizes the migration and alignment work.

### Tables In The Base Schema

- `profiles`
- `categories`
- `products`
- `product_variants`
- `product_media`
- `orders`
- `order_items`
- `reviews`
- `custom_orders`

### Important Schema Notes

- `products` uses `price` and `is_active`.
- `reviews` uses `profile_id`, `comment`, and `approved`.
- `orders` uses `profile_id`, `order_number`, `customer_name`, `customer_phone`, `customer_email`, `shipping_address`, `city`, and `total_amount`.
- `order_items` stores only the relational line-item fields and simple denormalized size/color fields.
- `product_media` points to storage paths in the public `product-images` bucket.

### Migration Folder

The [scripts/](scripts/) folder contains ordered migration and fix scripts. In this repo they are part of the tracked source, not throwaway local notes.

Current order:

1. [scripts/001_create_profiles_table.sql](scripts/001_create_profiles_table.sql)
2. [scripts/002_create_categories_table.sql](scripts/002_create_categories_table.sql)
3. [scripts/003_add_products_status_column.sql](scripts/003_add_products_status_column.sql)
4. [scripts/004_rls_admin_products.sql](scripts/004_rls_admin_products.sql)
5. [scripts/005_rls_order_items_insert.sql](scripts/005_rls_order_items_insert.sql)
6. [scripts/006_rls_admin_orders.sql](scripts/006_rls_admin_orders.sql)
7. [scripts/007_rls_admin_reviews.sql](scripts/007_rls_admin_reviews.sql)
8. [scripts/008_rls_admin_custom_orders.sql](scripts/008_rls_admin_custom_orders.sql)
9. [scripts/009_storage_bucket_note.sql](scripts/009_storage_bucket_note.sql)
10. [scripts/010_fix_rls_recursion.sql](scripts/010_fix_rls_recursion.sql)
11. [scripts/011_fix_table_grants.sql](scripts/011_fix_table_grants.sql)
12. [scripts/012_fix_all_table_grants.sql](scripts/012_fix_all_table_grants.sql)
13. [scripts/013_product_variants_active.sql](scripts/013_product_variants_active.sql)
14. [scripts/014_product_media_per_color.sql](scripts/014_product_media_per_color.sql)
15. [scripts/015_inventory_checkout_and_realtime.sql](scripts/015_inventory_checkout_and_realtime.sql)
16. [scripts/016_customization.sql](scripts/016_customization.sql) — `categories.is_customizable` + `mockup_key`, the `design_templates` table, RLS, and seed.
17. [scripts/017_storefront_settings.sql](scripts/017_storefront_settings.sql) — `products.is_hero` (homepage hero) + `categories.show_in_footer` (footer Shop column).
18. [scripts/018_order_email_flags.sql](scripts/018_order_email_flags.sql) — `orders.confirmation_sent_at` (order-email idempotency).

## 9. Styling And UI Conventions

- All global styling is centralized in [app/globals.css](app/globals.css).
- The site uses BEM-like class naming for most custom UI.
- Framer Motion is used sparingly for entrance and scroll reveal patterns.
- `data-reveal` sections are observed by [components/SiteShell.jsx](components/SiteShell.jsx).
- The site transition overlay is controlled by [components/SiteShell.jsx](components/SiteShell.jsx) and should not be casually removed.

## 10. Authentication And Session Behavior

- Signed-in state is handled by Supabase auth.
- Admin access depends on the `profiles` table role.
- [components/SessionMonitor.jsx](components/SessionMonitor.jsx) warns on inactivity and signs the user out after the timeout window.
- The auth UI and admin guards both assume the `profiles` row exists for the Supabase user.

## 11. Public Assets

- Brand images live in [public/images](public/images).
- The main logo variants are used in the header, shell, and auth screens.
- The product image bucket is expected to expose public URLs for storefront display.

## 12. Current Architecture Summary


The app is split into three main layers:

1. Presentation layer: pages, shell, cards, and motion.
2. Content layer: static data in [lib/data.js](lib/data.js) plus Supabase-backed records.
3. Database layer: schema, migrations, and admin-oriented SQL scripts.

The practical pattern in the codebase is: try Supabase first, fall back to static data when the database is unavailable, and keep the storefront usable even while backend wiring is incomplete.

## 13. Notes For Future Agents

- Prefer starting from [CLAUDE.md](CLAUDE.md) and this file before exploring the entire tree.
- Use the Supabase client split correctly: browser client in client components, server client in server code.
- Keep all style edits in [app/globals.css](app/globals.css) unless the project direction changes.
- Treat [db/clothing_ecommerce_schema.sql](db/clothing_ecommerce_schema.sql) as the base contract and the migration scripts as tracked, meaningful source files.
- When you need a route map, the app folder is the first place to inspect.
- [upload.js](upload.js) is a standalone bulk uploader (`node upload.js`) that pushes the `Shirt_Mockups_Only_2/` designs to Supabase (products, variants, per-colour front/back media). It reads `.env.local`, uses the service-role key, derives category/price/colour/name from the filenames, and is idempotent (re-inserts by slug).
- **Performance:** public pages (`/`, `/shop`, `/product/[slug]`, `/shop/[slug]`) use `createPublicClient()` (cookie-less anon) + `export const revalidate = 60` so they are ISR-cached (fast repeat navigation) instead of dynamic per-request; the homepage/shop queries run via `Promise.all`. ISR only kicks in for `next build && next start`, not `next dev`. Storefront images use `loading="lazy"`/`decoding="async"` (grids/thumbnails) and `fetchPriority="high"` (hero + product main image); [components/ProductDetail.jsx](components/ProductDetail.jsx) preloads all of a product's images so colour/thumbnail switches are instant.
- **Colour swatches:** [lib/data.js](lib/data.js) `resolveSwatch(name)` + `SWATCH_HEX` map any colour name (dropdown options + custom colours + CSS keywords) to a display hex; used by [lib/mapDbProduct.js](lib/mapDbProduct.js) and [components/ProductDetail.jsx](components/ProductDetail.jsx). The admin colour dropdown is `customColors`.
- **Images:** storefront product/category/hero images use `next/image` (config in [next.config.mjs](next.config.mjs) `images.remotePatterns` → `*.supabase.co`). Full-bleed spots use `fill`; ProductCard/thumbnails use explicit `width/height`.

### Email system (full docs: [docs/email-system.md](docs/email-system.md))

Two channels: **Supabase Auth** sends signup-verification + password-reset (we brand the templates in [docs/supabase-email-templates/](docs/supabase-email-templates/) and build the `/verify-email` UX); **our server** sends order emails via Resend.

- **Never send from the client.** The client posts an order id to a route; content + delivery are server-side.
- **Service:** [lib/email/](lib/email/) — `config.js` (brand + owner emails + env), `client.js` (Resend HTTP transport via `fetch`; no-ops with a warning if `RESEND_API_KEY` unset), `orders.js` (order model + senders). **Templates:** [emails/](emails/) are modular HTML-string builders (`layout.js`, `components.js`, three templates) — zero email-framework deps.
- **Order placement emails:** [components/CartContext.jsx](components/CartContext.jsx) `placeOrder` fires `POST /api/orders/confirm` for **every** placed order. [app/api/orders/confirm/route.js](app/api/orders/confirm/route.js) authenticates + verifies ownership, then sends **two independent, idempotent** things: (1) a **"new order placed" email to the 4 owners** (`OWNER_EMAIL_1..4`) for *any* order — COD or bank transfer — once (`orders.owner_notified_at`), the owner email showing the payment method; (2) the **customer confirmation**, only when `status === 'confirmed'` (COD), once (`orders.confirmation_sent_at`). Bank-transfer customers get their confirmation later, when an admin confirms the order. Senders are split in [lib/email/orders.js](lib/email/orders.js): `sendOwnerNewOrderEmails` + `sendCustomerOrderConfirmation`.
- **Status updates are now MANUAL (Feature 7).** Admin status changes go through `POST /api/orders/status` (admin-only) which **only saves `orders.status` — it does not email**. `POST /api/payments/verify` (approve/reject) likewise saves only. After any change the admin dashboard shows a "Notify the customer? [Send Email] [Skip]" toast; **Send Email** calls `POST /api/orders/notify` ([app/api/orders/notify/route.js](app/api/orders/notify/route.js)), which picks the right reusable template from the order's current state — a lifecycle status (`STATUS_COPY` in [emails/orderStatusUpdate.js](emails/orderStatusUpdate.js) covers confirmed/processing/printing/packed/shipped/delivered/cancelled) or, for a rejected transfer, the payment-rejected email. So a bank-transfer order's "Order Confirmed" email is sent when the admin approves the payment (→`confirmed`) and presses Send Email.
- **Verification + auto-login:** [app/login/LoginForm.jsx](app/login/LoginForm.jsx) signup → `/verify-email` ([app/verify-email/page.jsx](app/verify-email/page.jsx)) (the "check your inbox" waiter). The confirmation email link points at the **server route** [app/auth/confirm/route.js](app/auth/confirm/route.js): `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup&next=/` (see [docs/supabase-email-templates/confirm-signup.html](docs/supabase-email-templates/confirm-signup.html)). That handler calls `verifyOtp({ type, token_hash })` **server-side**, which confirms the email + sets the session **cookies** and redirects the user in already signed in — works on any device (no PKCE verifier), no client-side race. On a bad/expired token it redirects to `/verify-email?error=link`. The `/verify-email` page still handles fallbacks (`token_hash`, old PKCE `?code=`, existing session, poll). Unverified users are blocked from checkout (client guard + route 403 + the RPC needs `auth.uid()`). `friendlyAuthError()` in LoginForm turns opaque `{}` auth failures (Supabase email-send failure) into actionable messages. **Requires:** the email template pasted into Supabase, Site URL = the deployed domain, and the app deployed (the email link hits the live `/auth/confirm`).
- The `/customize` studio uses Fabric.js (client-only). Never import `fabric` at module top level — it touches the DOM and breaks SSR. Load it inside an effect (`await import("fabric")`), as [components/customize/StudioCanvas.jsx](components/customize/StudioCanvas.jsx) does.

## 14. Custom Studio (Fabric.js Editor)

The `/customize` route is a full apparel customization studio. It lets a shopper
place text and images onto predefined printable areas, approve a final proof,
and add the result to the cart. There is intentionally **no design save/load,
history, or draft persistence** yet — the canvas only lives in memory.

### Dependency

- `fabric` (v7) — the only new runtime dependency. Browser-only; see the SSR note in section 13.

### Components

- [components/CustomStudio.jsx](components/CustomStudio.jsx) — orchestrator. Owns garment/colour/size/view state, the left/center/right layout, validation toasts, the approval + leave-guard modals, add-to-cart, and the navigation guard.
- [components/customize/StudioCanvas.jsx](components/customize/StudioCanvas.jsx) — wraps the single Fabric canvas. Owns per-view design storage, the hard printable-area boundary, layering, and offscreen export. Exposes an imperative API via `ref` (`addText`, `addImage`, `setProp`, `bringForward`, `sendBackward`, `deleteActive`, `clearView`, `validateBounds`, `exportViews`, `exportThumbnail`, `getSummary`, `hasAnyObjects`).
- [components/customize/GarmentMockup.jsx](components/customize/GarmentMockup.jsx) — flat per-view garment SVG (front/back/left+right sleeve) tinted to the selected colour. Rendered behind the transparent canvas and inside the proof/selector thumbnails.
- [components/customize/ViewSelector.jsx](components/customize/ViewSelector.jsx) — right panel; picks the printable surface and shows a per-view element-count badge.
- [components/customize/TextControls.jsx](components/customize/TextControls.jsx) — left panel; font family/size/colour/weight/style/alignment/content for the selected text.
- [components/customize/LayerControls.jsx](components/customize/LayerControls.jsx) — left panel; bring forward / send backward / delete.
- [components/customize/ApprovalModal.jsx](components/customize/ApprovalModal.jsx) — clean proof of every printed surface + the explicit "I confirm…" checkbox gating add-to-cart.
- [components/customize/LeaveGuardModal.jsx](components/customize/LeaveGuardModal.jsx) — "design will be lost" confirm shown when navigating away mid-design.

### Configuration (in [lib/data.js](lib/data.js))

- `customViews` — the four printable surfaces (`Front`, `Back`, `Left Sleeve`, `Right Sleeve`).
- `customPrintAreas` — each surface's rectangular region as fractions (`x, y, width, height` in 0..1). The canvas converts these to a pixel region at runtime and enforces it as a **hard boundary**.
- `customFonts`, `customTextColors`, `customAcceptedImageTypes`, `customMaxImageBytes` — control + upload-validation options.

### How the boundary is enforced

One Fabric canvas serves all four views; each view's objects are serialized to an
in-memory `designsRef` map and swapped on view change. Every object is constrained
to the active region: **moving** is clamped to the edges; **scaling/rotating** revert
to the last fully-inside transform the instant a corner would overflow (snapshots
kept per object); **adds** and text edits are auto-fitted then clamped. The dashed
region guide is painted in the canvas `after:render` hook (it is not a real object,
so it never serializes or interferes). `validateBounds()` is a final safety net run
before preview/add.

### Approval + navigation flow

"Preview final design" validates (≥1 element, all in-bounds), exports each non-empty
view to a transparent PNG via an offscreen `StaticCanvas`, and opens the approval
modal. Add-to-cart is gated behind the confirmation checkbox; "Back to editor" just
closes (canvas state is preserved). A capture-phase document click listener plus a
`beforeunload` handler warn before leaving with an in-progress design — "Discard &
leave" continues, "Keep editing" stays. Custom cart items carry a rendered thumbnail
and a `custom: true` flag and have no `variantId` (so, like the previous flow, they
are not part of the Supabase checkout RPC).

### Customization v2 (admin-driven, mockup images, blue theme)

- **Dynamic garments.** The studio no longer hard-codes garments. [components/CustomStudio.jsx](components/CustomStudio.jsx) fetches `categories` where `is_customizable = true` (browser client, anon) and maps each to `{ mockupKey, price, shape }`. `customFallbackGarments` in [lib/data.js](lib/data.js) keeps it working if the DB/column is missing (DB-first, static fallback). Admins control the list at [app/admin/customization/page.jsx](app/admin/customization/page.jsx).
- **Mockup images.** [components/customize/GarmentArt.jsx](components/customize/GarmentArt.jsx) renders `/mockups/<colorKey>/<view>.png` (e.g. `/mockups/black/back.png`) via `studioMockupSrc` and falls back to the SVG `GarmentMockup` on a missing/empty file. There is now **one shared shirt set** — the folders are `black` / `blue` / `grey` / `white` directly under [public/mockups/](public/mockups) (no per-garment folder; `studioMockupSrc` keeps its `mockupKey` arg but ignores it). Changing colour/view recomputes the path. Asset spec: [docs/mockup-specifications.md](docs/mockup-specifications.md).
- **Design templates.** [components/customize/ChooseDesign.jsx](components/customize/ChooseDesign.jsx) loads enabled rows from `design_templates` and adds the chosen image to the canvas. Admins upload/enable/delete at [app/admin/customization/designs/page.jsx](app/admin/customization/designs/page.jsx); images sit in the `product-images` bucket under `designs/`.
- **Colours.** Fixed studio palette `studioColors` (White/Black/Navy/Grey) with a `key` matching the mockup folder. The orange/clay accent is replaced by brand blue `#1E3A8A` — the studio CSS locally remaps `--clay → #1E3A8A` (real error/danger stay red).
- **Printable areas.** Enlarged (front/back ≈75% width, ~10% insets top/bottom). Sleeves show the whole sleeve cloth with a dashed fold/centre guideline (drawn both in the SVG and on the Fabric canvas) and a "whole sleeve cloth" note; the boundary itself is a conservative rectangle inside the sleeve.
- **Auth note.** Stale Supabase refresh tokens are now swallowed in [proxy.ts](proxy.ts) and [app/admin/layout.jsx](app/admin/layout.jsx) (treated as "no user"; proxy also clears dead `sb-*` cookies) so they no longer throw `refresh_token_not_found`.

### Storefront display settings (admin-driven)

- **Homepage hero = "best product".** `products.is_hero` (migration 017) marks one product. [app/page.jsx](app/page.jsx) queries the active `is_hero` product and renders its cover/title/price in the hero, linked to the product page. No hero selected ⇒ the hero area is blank (the old hardcoded "Essential Oversized Tee" placeholder was removed). Admin picks it at [app/admin/storefront/page.jsx](app/admin/storefront/page.jsx) (clears others, sets one).
- **Footer Shop column.** `categories.show_in_footer` (migration 017) flags ≤3 categories. [components/SiteShell.jsx](components/SiteShell.jsx) shows "All categories" + those 3; the Studio column is Customize / About / Size Guide. Admin selects them on the same storefront page (hard-capped at 3).
- **Customize card image.** The "Customize" card in the homepage category grid uses `/mockups/classic/black/front.png`.
- **Add-product flow.** [app/admin/page.jsx](app/admin/page.jsx) `AddProductModal` is now two steps: step 1 creates the product + variants (colours/sizes required); step 2 reuses [ProductMediaManager](components/ProductMediaManager.jsx) so the admin adds **unlimited images per colour** (no more single "uncategorised" image). The inline edit flow is unchanged.

## 15. Pricing: discounts, sold-out, shipping & payment

All money maths lives in one place — [lib/pricing.js](lib/pricing.js) — and the
`process_checkout` RPC mirrors it in SQL so the database charges exactly what the
UI shows. Never hardcode a price rule in a component; import from `lib/pricing`.

### Per-product discounts (Feature)
- `products.discount_percentage` (0–100, migration [019](scripts/019_pricing_discounts_soldout.sql)). There is **no stored sale price** — the selling price is *derived* from `price + discount_percentage` in both JS (`discountedPrice`) and SQL, so they can never drift.
- Charm rounding: `roundToCharm(v) = round(v/100)*100 - 1` → always a `…99` ending (e.g. 1500−20% → 1199, 2390−15% → 1999, 5200−10% → 4699). The RPC uses the identical `round(price*(1-pct/100)/100)*100 - 1`.
- `productPricing({price, discountPercent})` returns `{ original, price, discountPercent, hasDiscount, saved }`. Mappers ([lib/mapDbProduct.js](lib/mapDbProduct.js), [app/product/[slug]/page.jsx](app/product/[slug]/page.jsx)) expose `price` (effective), `originalPrice`, `discountPercent`, `hasDiscount`. **`product.price` everywhere is the discounted selling price** (so cart/subtotal maths is automatic); `originalPrice` is the struck-through original.
- Display: [ProductCard](components/ProductCard.jsx) (corner `% OFF` badge + was/now price) and [ProductDetail](components/ProductDetail.jsx) (`pd-price--sale` with `pd-price__now` / `__compare` / `__off`).

### Sold-out (Feature)
- `products.is_sold_out` (migration 019). Sold-out products **stay visible** but can't be bought. Admin toggles it in the editor; the RPC rejects them with `SOLD_OUT|<name>`.
- `mapDbProduct` folds it into `inStock` and exposes `isSoldOut`. [ProductCard](components/ProductCard.jsx) → `soldOut = isSoldOut || !inStock` (badge + disabled quick-add). [ProductDetail](components/ProductDetail.jsx) → `soldOut` disables add, crosses out all sizes, shows a "Sold Out" pill by the title.

### Shipping & payment (Feature — cart/checkout in [components/SiteShell.jsx](components/SiteShell.jsx) `CartDrawer`)
- Shipping: `SHIPPING_FLAT` Rs 230, **free when the pre-promo subtotal is strictly over `FREE_SHIPPING_OVER` (Rs 3499)** — the earlier 3+ items condition was removed. `isFreeShipping(subtotal)` / `shippingFor(subtotal)` / `freeShippingRemaining(subtotal)` (returns `{ amount }` only) drive it; the announcement bar + the bag hint ("Add Rs X more…") read from these. The `process_checkout` RPC mirrors it (`CASE WHEN v_subtotal > 3499 THEN 0 ELSE 230`, migration [031](scripts/031_free_shipping_subtotal_only.sql), which supersedes [030](scripts/030_free_shipping_subtotal.sql)).
- Two payment methods (`PAYMENT_METHODS`): `cod` (no change) and `online` (5% off subtotal, `ONLINE_DISCOUNT_RATE`). The checkout summary uses `orderTotals({subtotal, paymentMethod})` → `{ subtotal, onlineDiscount, shipping, freeShipping, total }` and shows Subtotal / Discount / Shipping / Total. `paymentMethod` is passed to `placeOrder` and forwarded inside `p_customer.payment_method`.

### Server of record
- RPC [scripts/020_checkout_pricing_rpc.sql](scripts/020_checkout_pricing_rpc.sql): computes effective per-item price (discount + charm round), **rejects sold-out**, sums an item count, applies the online 5% + item-based shipping, and stores `subtotal / discount_amount / payment_method / shipping_cost / total_amount`. `order_items.unit_price` snapshots the discounted price.
- Order emails: `buildOrderModel` ([lib/email/orders.js](lib/email/orders.js)) surfaces `discount` + `paymentMethodLabel`; `totals()` ([emails/components.js](emails/components.js)) renders a Discount row; the confirmation shows the real payment method. Admin orders detail ([app/admin/orders/page.jsx](app/admin/orders/page.jsx)) shows discount + payment + "Free" shipping.
- **Migrations to run in Supabase:** [019_pricing_discounts_soldout.sql](scripts/019_pricing_discounts_soldout.sql) then [020_checkout_pricing_rpc.sql](scripts/020_checkout_pricing_rpc.sql).

### Admin editor scroll fix (Feature)
- Root cause: `fetchAll()` flipped a global `loading` flag that swapped the whole table for a spinner on every in-row mutation (variant add/delete, status toggle, image upload), which reset scroll to the top. Fix in [app/admin/page.jsx](app/admin/page.jsx): `fetchAll(silent)` — the spinner only shows on the initial load; a `refresh()` (silent) is used for all post-mutation re-reads, so the table never unmounts and scroll is preserved. Save and Cancel are the only actions that exit edit mode (`onClose`).

## 16. Accounts, checkout, promos, payments & student verification (DONE)

Full multi-phase platform build. **Migrations live in [supabase/scripts/](supabase/scripts/) (021–026)** — run AFTER `scripts/` 001–020, in numeric order (all additive + idempotent). 025 supersedes the `scripts/020` checkout RPC.

### Migrations (run 021 → 026)
- **021** `profiles` address + student columns; `student_email_domains`; `student_verification_tokens`; `verify_student_token()`; `protect_profile_columns()` trigger blocking client writes to `role`/`student_*`/`total_*`.
- **022** `promo_codes` (`percentage`|`fixed`|`student`) + `validate_promo_code(code, subtotal)` (codes never publicly listable; usage incremented at checkout).
- **023** order pricing/snapshot columns (`tax`, `promo_code`, `promo_discount`, billing + shipping snapshot), widened `orders.status` lifecycle, `payment_verifications` audit table, private `payment-screenshots` bucket + policies.
- **024** `categories` custom base + half/full-sleeve prices & enable flags.
- **025** `process_checkout` **v3** — per-product discount, promo apply + increment, online 5% (post-promo), item-based shipping, billing/shipping snapshot, status by payment (`cod`→`confirmed`, `online`→`pending_payment` + a `payment_verifications` row).
- **026** `submit_payment_proof(order_id, path)` definer (customer records screenshot + advances order to `pending_verification`, since customers can't UPDATE orders).

### Money (single source of truth)
[lib/pricing.js](lib/pricing.js): `orderTotals({subtotal,itemCount,paymentMethod,promoDiscount})` mirrors the RPC exactly (subtotal → promo → online 5% → +shipping; **no tax**). `PAYMENT_METHODS` = COD + Bank Transfer (`online`). The `orders.tax` column stays but is always 0. [lib/orders.js](lib/orders.js) owns the status lifecycle (`ORDER_STATUS`, `ORDER_TIMELINE`/`_COD`, `statusLabel/Tone`, `timelineFor`).

### Customer flow
- **Dashboard** [app/account/page.jsx](app/account/page.jsx) + [components/account/AccountDashboard.jsx](components/account/AccountDashboard.jsx): editable profile, Current/Previous orders, total orders + spent, and [StudentVerify](components/account/StudentVerify.jsx) when unverified. **Order details** [app/account/orders/[id]/page.jsx](app/account/orders/%5Bid%5D/page.jsx): timeline, prices, snapshots, signed-URL screenshot.
- **Checkout** [app/checkout/page.jsx](app/checkout/page.jsx) (auth-gated → `/login?redirect=/checkout`) + [components/checkout/CheckoutClient.jsx](components/checkout/CheckoutClient.jsx): contact/shipping/billing/shipping-method/payment/promo/summary, profile autofill + **save-back**. Cart persists via localStorage in [CartContext](components/CartContext.jsx) (so the login round-trip never loses it); the cart drawer is now bag-only and routes to `/checkout`.
- **Online payment** [app/checkout/payment/[id]/page.jsx](app/checkout/payment/%5Bid%5D/page.jsx) + [PaymentUpload](components/checkout/PaymentUpload.jsx): bank details ([lib/data.js](lib/data.js) `bankTransferDetails` — PLACEHOLDERS), screenshot/PDF upload → `submit_payment_proof` → `pending_verification`.

### Admin
- **Payment verification** on [app/admin/orders/page.jsx](app/admin/orders/page.jsx) (`AdminPaymentPanel`): view screenshot, approve/reject + notes via [app/api/payments/verify/route.js](app/api/payments/verify/route.js) (approve→`confirmed`, reject→`pending_payment`). Status dropdown now uses the full lifecycle ([app/api/orders/status/route.js](app/api/orders/status/route.js) `ALLOWED` widened).
- **Promo codes** [app/admin/promos/page.jsx](app/admin/promos/page.jsx) — CRUD + enable toggle.
- **Student verification** [app/admin/students/page.jsx](app/admin/students/page.jsx) — approved domains CRUD + verified list + revoke ([app/api/student/revoke/route.js](app/api/student/revoke/route.js)).
- **Sleeve pricing** editor added to [app/admin/customization/page.jsx](app/admin/customization/page.jsx); the studio ([components/CustomStudio.jsx](components/CustomStudio.jsx)) shows only enabled sleeve options and prices the garment at **the selected sleeve's price** (the admin-set half/full price — **not** base + sleeve). The sleeve buttons no longer show a `+Rs…` add-on. Falls back to the base price only when no sleeve options are enabled. A "use a laptop / larger screen" note sits atop [/customize](app/customize/page.jsx).

### Student verification (account-based, never promo-based)
[app/api/student/request/route.js](app/api/student/request/route.js) sends the code **to the account's own registered email** (`user.email`, never a typed one — so only the mailbox owner can verify and the registered email's domain must be on the allow-list), issues a 24h token (service role), emails it ([lib/email/student.js](lib/email/student.js)); the customer enters it → `verify_student_token` RPC flips `student_verified`. [StudentVerify](components/account/StudentVerify.jsx) is now a single **"Send code to my email"** button (no email input) and, once verified, tells them to use **STUDENT10** at checkout. That code was seeded directly in the SQL editor as a `student` 10% promo — there is **no** `031_seed_student10_promo.sql` in the repo (the 031 slot is the free-shipping migration); only verified students can apply it; manage at /admin/promos.

### Emails ([emails/](emails/), Resend via [lib/email/](lib/email/) — no-ops until `RESEND_API_KEY` set)
New: [emails/paymentStatusUpdate.js](emails/paymentStatusUpdate.js) (approved/rejected) + [emails/paymentSubmitted.js](emails/paymentSubmitted.js) (customer ack + owner "verify"), wired in [lib/email/orders.js](lib/email/orders.js) (`sendPaymentStatusEmail`, `sendPaymentSubmittedEmails`) via [app/api/payments/verify](app/api/payments/verify/route.js) + [app/api/payments/submitted](app/api/payments/submitted/route.js). `totals()` now renders promo + online discount + tax; `buildOrderModel` surfaces them.

## 17. Checkout / order lifecycle / manual emails / SEO (DONE)

Refinement pass over the order + payment + email flow, plus full SEO. **Run migrations in order after 001–026: [027](scripts/027_add_packed_status.sql)** (adds `packed`), **[028](scripts/028_defer_online_stock.sql)** (deferred stock + `confirm_order_payment`), **[029](scripts/029_owner_order_notified.sql)** (`owner_notified_at`), **[030](scripts/030_free_shipping_subtotal.sql)** (free shipping ≥ Rs 3500 + 3 items — superseded), **[031](scripts/031_free_shipping_subtotal_only.sql)** (free shipping subtotal-only > Rs 3499; STUDENT10 was seeded directly in the SQL editor, not via a script).

### Stock is committed only when money is real (bank transfer)
- `orders.stock_committed` (migration 028) tracks whether an order's inventory has been decremented. **COD** decrements at checkout (final immediately, `stock_committed = true`). **Bank transfer** decrements **nothing** at checkout — the order is created `pending_payment` with `stock_committed = false` (stock is still *verified* so we never accept an impossible order, but not reserved).
- **`confirm_order_payment(order_id, verified_by, notes)`** (SECURITY DEFINER, service_role only) is the single atomic commit point: it locks each variant, **re-checks stock** (it may have sold out since checkout), decrements, flips the order to `confirmed`, and marks the payment approved. Idempotent via `stock_committed` (never double-decrements).
- Called by **[app/api/payments/verify](app/api/payments/verify/route.js)** on *approve* (returns a friendly `OUT_OF_STOCK` 409 the admin panel shows), and defensively by **[app/api/orders/status](app/api/orders/status/route.js)** whenever an admin drags an *online* order into a committed status (`confirmed`→`delivered`) via the dropdown without using Approve — so inventory can never drift. *Reject* just returns the order to `pending_payment` (no stock touched). Trade-off accepted: two shoppers can both place an online order for the last unit; the second is cleanly rejected at approval (nobody is silently oversold). Cancelling a committed order does **not** auto-restock (pre-existing behaviour).

### Order lifecycle (Features 1 & 6) — [lib/orders.js](lib/orders.js)
- Two distinct pre-confirmation states for bank transfer so the admin can tell them apart: `pending_payment` = **"Pending Payment Upload"** (order created, no proof yet), `pending_verification` = **"Pending Payment Verification"** (proof uploaded, awaiting admin). Never merge them.
- Fulfilment steps are now three distinct stages: **Processing → Printing → Packed** (`packed` replaces the legacy `ready`; `ready` is kept as a label alias). `ORDER_TIMELINE`/`ORDER_TIMELINE_COD` and the customer timeline ([app/account/orders/[id]/page.jsx](app/account/orders/%5Bid%5D/page.jsx)) reflect this; `processing` is no longer folded into `printing`.
- Per-status reusable email templates live in `STATUS_COPY` ([emails/orderStatusUpdate.js](emails/orderStatusUpdate.js)): confirmed / processing / printing / packed / shipped / delivered / cancelled.

### COD vs Bank Transfer confirmation (Feature 1)
- **COD**: `process_checkout` creates the order `confirmed` → client fires `/api/orders/confirm` → rich confirmation email sent immediately.
- **Bank Transfer**: created `pending_payment`; **no** confirmation email at checkout (client skips the call; the route also gates on `status === 'confirmed'`). The customer's "Order Confirmed" email is sent later, manually, once an admin approves the payment (Feature 7).

### Manual customer notifications (Feature 7) — admin only ever emails on purpose
- `/api/orders/status` and `/api/payments/verify` **save only, never email**. After a status change or an approve/reject, [app/admin/orders/page.jsx](app/admin/orders/page.jsx) shows a fixed **"Notify the customer? [Send Email] [Skip]"** toast (`.admin-notify`). Send Email → `POST /api/orders/notify` → chooses the template from the order's current state (lifecycle `STATUS_COPY`, or payment-rejected). No email is ever sent automatically on an admin action.
- **Toast button contrast fix**: `.admin-notify` has a dark `--ink` (and, in the error variant, `--clay`) background. The **Send Email** button was `.button--dark` — same background as its own container, so it was invisible until `:hover` flipped it to clay. Now `.button--light` (white/bone bg, ink text; hovers to terra/cream) so it's visible at rest. The neighbouring Skip/Close/Dismiss buttons (`.button--outline`, dark text on a light border — also dark-on-dark here) get a scoped override, `.admin-notify .button--outline`, restyled bone text/border with a brass hover, right after `.admin-notify--error` in [app/globals.css](app/globals.css). Any future button added inside `.admin-notify` needs `--light` (or the scoped `--outline` override) for the same reason — never `--dark` or a bare `--outline`.

### Payment-proof-received emails — code is complete; PRODUCTION ENV VARS ARE THE ONLY GAP
- Flow: customer uploads a bank-transfer screenshot in [PaymentUpload](components/checkout/PaymentUpload.jsx) → `submit_payment_proof` RPC records it → client fire-and-forgets `POST /api/payments/submitted` → [app/api/payments/submitted/route.js](app/api/payments/submitted/route.js) calls `sendPaymentSubmittedEmails()` ([lib/email/orders.js](lib/email/orders.js)), which sends the customer a "We received your payment proof" email and each of the four owners a "Payment to verify" email ([emails/paymentSubmitted.js](emails/paymentSubmitted.js) — customer + owner templates). This is fully wired; do not re-build it.
- `.env.local` (gitignored, local-machine only) already has real values: `RESEND_API_KEY`, `EMAIL_FROM=Khud <orders@khudclothes.com>`, `OWNER_EMAIL_1..4`. **These have never been committed and must be added separately to the Vercel project's Environment Variables (Production, and Preview if used) or the deployed site silently skips every order/payment email** — [lib/email/client.js](lib/email/client.js) `sendEmail()` degrades gracefully (logs + `{ skipped: true }`) instead of throwing when `RESEND_API_KEY` is unset, so a missing key in prod fails silently with no visible error, only a server log line.
- Also confirm in the **Resend dashboard** (not checkable via the app's API key — it's a send-only restricted key, `GET /domains` returns 401) that `khudclothes.com` is a verified sending domain; otherwise `orders@khudclothes.com` sends will fail.

### Reported bug: approve-payment → "Send Email" not delivering (diagnosed → hardened, watch for recurrence)
- User report: the customer-facing "Order confirmed" email (STATUS_COPY `confirmed`, sent via `POST /api/orders/notify` after an admin approves a bank-transfer payment) doesn't arrive, while other emails (order-placed, payment-proof-received) do.
- Added error-transparency first (see below), then reproduced: order `KHD-0D29E836` — the toast read **"No email to send — KHD-0D29E836's current status has no customer-facing template"** (i.e. `skipped: "no_template"`, meaning `shouldEmailStatus(order.status)` was `false` at click time). A direct read-only Supabase REST query (service-role key, bypassing the app) at that same moment showed the order's TRUE state was already `status: "confirmed"`, `payment_verifications.payment_status: "approved"`, `verified_at` populated — i.e. the DB was correct and `/api/orders/notify` should have matched `STATUS_COPY.confirmed` and sent. So the route's read was stale/out of sync with the DB at the moment it ran, on `next dev` (localhost, not yet deployed).
- None of the order/payment API routes ([app/api/orders/notify](app/api/orders/notify/route.js), [.../status](app/api/orders/status/route.js), [.../confirm](app/api/orders/confirm/route.js), [app/api/payments/verify](app/api/payments/verify/route.js), [.../submitted](app/api/payments/submitted/route.js)) declared `export const dynamic`, leaving Next.js free to apply its default fetch-caching heuristics to the Supabase reads inside them. **Added `export const dynamic = "force-dynamic"` + `export const fetchCache = "force-no-store"` to all five** — every one of them reads-then-decides off live order/payment state (or mutates state another route immediately re-reads), so none may ever be served from a cache. This is the standing fix; if the bug recurs after this, the cache-staleness hypothesis is disproven and the next place to look is Resend delivery itself (see below), not Next.js caching.
- **Also fixed the diagnosability gap** that let this get this far undiagnosed: `/api/orders/notify` used to swallow the real error (`catch (err) { ...; return { error: "Failed to send email" } }`) — the admin never saw *why* a send failed. It now returns `err.message` (safe — admin-only route) plus a `reason` (`no_customer_email` / `no_api_key` / `no_template`) alongside `emailed:false`. [app/admin/orders/page.jsx](app/admin/orders/page.jsx) `sendNotify()` parses that JSON on the error path too (was `new Error(await res.text())`, discarding structure) and the toast branches on `reason`/`errorMessage` instead of one generic string. **Keep this — it's what made the diagnosis above possible in one round-trip instead of guessing.**
- **If it recurs post-fix**: it's no longer a caching question. Read the now-specific toast message, then check the Resend dashboard **Logs/Activity** tab for that timestamp — it'll show whether Resend even received the request and, if not delivered, the exact rejection reason (bounced / sandbox-restricted recipient / `khudclothes.com` domain unverified — not checkable via this app's Resend key, it's send-only restricted, `GET /domains` returns 401).

### Payment proof — upload later & replace
- A bank-transfer customer who skipped the upload can finish it later from the account area (no more dead-end): the **order-details** payment card ([app/account/orders/[id]/page.jsx](app/account/orders/%5Bid%5D/page.jsx)) and the **dashboard order card** ([components/account/AccountDashboard.jsx](components/account/AccountDashboard.jsx)) show a CTA to `/checkout/payment/[id]` whenever an online order isn't approved (card CTA keys off `status === 'pending_payment'`; details CTA off the `payment_verifications.payment_status`).
- [PaymentUpload](components/checkout/PaymentUpload.jsx) now only **locks on `approved`** — a `submitted` (awaiting-verification) proof can be **replaced** and a `rejected` one re-uploaded. Backend already supported this (storage `upsert` + `submit_payment_proof` overwrites; the RPC only advances status from the pre-verification states, so it never regresses a confirmed order). CTA labels: Upload / Replace / Re-upload by state.

### Cart integrity + completion flow (Feature 2 + follow-ups) — [components/CartContext.jsx](components/CartContext.jsx)
- The bag mirrors to `localStorage` (survives reload + the login round-trip); a `hydrated` flag lets [CheckoutClient](components/checkout/CheckoutClient.jsx) show "Loading your bag…" instead of flashing "your bag is empty".
- **The cart is cleared at true completion, which differs by method:** `placeOrder` clears it only for **COD** (created `confirmed`). **Bank transfer** clears it **after the payment proof is uploaded** ([components/checkout/PaymentPageClient.jsx](components/checkout/PaymentPageClient.jsx) `handleComplete` → `clearCart()`), so a customer who abandons before paying keeps their bag. (Trade-off: the order row already exists at `pending_payment`, so the retained bag could seed a second order if they re-checkout instead of using the "Complete payment" CTA — accepted per product decision.)
- **Post-completion screen** ([components/checkout/OrderComplete.jsx](components/checkout/OrderComplete.jsx)): after COD confirm OR bank-transfer proof upload, the page swaps to a completion screen that asks "view your order in your dashboard?" with exactly two destinations — **Yes → `/account/orders/[id]`** or **No → `/` (home)**. Nothing auto-navigates on completion anymore. The payment page is now a thin server shell delegating to [PaymentPageClient](components/checkout/PaymentPageClient.jsx) (owns the `completed` state); [PaymentUpload](components/checkout/PaymentUpload.jsx) signals completion via an `onComplete` callback instead of routing.

### Bank details from env (Feature 3)
- `bankTransferDetails` in [lib/data.js](lib/data.js) reads `NEXT_PUBLIC_BANK_NAME` / `NEXT_PUBLIC_ACCOUNT_TITLE` / `NEXT_PUBLIC_ACCOUNT_NUMBER` / `NEXT_PUBLIC_IBAN` (documented in [.env.local.example](.env.local.example)); never hardcoded. `bankTransferConfigured` lets the payment page show a graceful note if unset.

### Timestamps (Feature 4)
- Orders show **date + time** (viewer's local tz) everywhere: admin list ([app/admin/orders/page.jsx](app/admin/orders/page.jsx) `formatDateTime`), customer dashboard cards ([components/account/AccountDashboard.jsx](components/account/AccountDashboard.jsx) `fmtDateTime`), order details (already), and the status email (`orderDateTime`).

### Bag extras + email throttle
- **Size guide links**: the product page ([components/ProductDetail.jsx](components/ProductDetail.jsx)) shows a "Size guide" link beside the Size label; the **cart drawer** ([components/SiteShell.jsx](components/SiteShell.jsx) `CartDrawer`) has a "View the size guide" link + the **exchange/returns policy** note (genuine issues only — wrong size/colour/defect — otherwise all sales final). Both live in the bag only, never on `/checkout`.
- **Email rate limit**: `sendEmails` ([lib/email/client.js](lib/email/client.js)) now sends **sequentially with a 600 ms gap** (~1.6/sec) to stay under Resend's 2 req/sec limit — the 4 owner notifications (and payment-submitted batch) no longer burst. It runs in fire-and-forget server routes, so the extra ~2 s never delays the customer. No need to raise the Resend limit.

### Polish pass — SEO domain, favicon, OG, owner email, mobile nav
- **⚠️ Sitemap "URL is not allowed" in Search Console** = `NEXT_PUBLIC_SITE_URL` is still `http://localhost:3000` in the deployed build, so every sitemap/canonical URL is a localhost URL. Fix is env-only: set `NEXT_PUBLIC_SITE_URL` to the exact verified domain (https, www consistency) and rebuild — it drives canonicals, OG, sitemap AND robots together (see [.env.local.example](.env.local.example)).
- **Favicon = white-square wordmark** (superseded the earlier theme-aware `<link>` tags, which are gone from [app/layout.jsx](app/layout.jsx)). All icons are Next.js file conventions generated from `public/images/logo-black-writing-with white bg .png` (source keeps its odd spaced filename; its checkerboard "background" was baked-in light gray and is flattened to pure white during generation): [app/favicon.ico](app/favicon.ico) (16/32/48 PNG-in-ICO), [app/icon.png](app/icon.png) (512×512), [app/apple-icon.png](app/apple-icon.png) (180×180), plus [public/images/icon-192.png](public/images/icon-192.png) / [icon-512.png](public/images/icon-512.png) for the manifest (`any` + `maskable`). White background chosen deliberately so the mark reads in Google Search results and dark browser tabs alike. The **site UI logo system is unchanged**: black transparent logo on light surfaces, white on dark (SiteShell, auth pages, admin sidebar, emails).
- **Link previews**: static [app/opengraph-image.png](app/opengraph-image.png) + [app/twitter-image.png](app/twitter-image.png) (1200×630, white bg, centred wordmark, alt via the sibling `.alt.txt` files) replaced the old dynamic `opengraph-image.jsx`. `OG_IMAGE` in [lib/seo.js](lib/seo.js) is the shared descriptor: **any page that defines its own `openGraph` must include `images: [OG_IMAGE]` and `type: "website"`** — a page-level `openGraph` replaces the inherited object, silently dropping og:image/og:type otherwise (about, shop, shop/[slug], customize, size-guide do this; product pages use the product photo with `OG_IMAGE` as fallback).
- **Owner "new order" email** at placement (see §13 order-placement emails) — migration [scripts/029_owner_order_notified.sql](scripts/029_owner_order_notified.sql) adds `owner_notified_at`.
- **Mobile nav**: the hamburger is now the first child of `.site-nav` (hidden on desktop), so on mobile it sits on the **left** (logo centres, cart right) — consistent with the left-opening menu panel. [components/SiteShell.jsx](components/SiteShell.jsx).

### SEO & AI discoverability (Feature 8) — uses the `seo` skill
- **Central helpers:** [lib/seo.js](lib/seo.js) (`SITE_URL`, builders: `organizationSchema`, `websiteSchema`, `breadcrumbSchema`, `productSchema`, `faqSchema`) + [components/JsonLd.jsx](components/JsonLd.jsx) (renders a JSON-LD `<script>`, server component).
- **Route files:** [app/sitemap.js](app/sitemap.js) (static routes + all active products/categories from Supabase, ISR 1h), [app/robots.js](app/robots.js) (allow all, disallow admin/account/checkout/api/auth, points at sitemap), [app/manifest.js](app/manifest.js) (`/manifest.webmanifest`, white-square icon set), [app/opengraph-image.png](app/opengraph-image.png) + [app/twitter-image.png](app/twitter-image.png) (static 1200×630 brand images, auto-applied site-wide; product pages override with the product photo; see the Polish-pass favicon/OG bullets above).
- **Root [app/layout.jsx](app/layout.jsx):** `metadataBase`, title template, canonical, `robots`, `openGraph`/`twitter` (summary_large_image), `manifest`, a separate `viewport` export for `themeColor`, site-wide Organization + WebSite JSON-LD in `<body>`, and `<Analytics />` from `@vercel/analytics/next` (cookieless Vercel page-view analytics; same-origin script, so the prod CSP needs no changes; no-op locally).
- **Per-page:** every public page sets `alternates.canonical` + OG. Product ([app/product/[slug]/page.jsx](app/product/%5Bslug%5D/page.jsx)) emits **Product + Offer** (PKR, InStock/OutOfStock from stock) + **BreadcrumbList** and a per-product OG image; category emits **BreadcrumbList**; size-guide emits a sizing **FAQPage**. `AggregateRating` is intentionally left for when review aggregates are wired (`productSchema` can carry it); `SearchAction` omitted (no site search).
- **Note:** there is no `lint`/`next lint` script; `next build` runs TypeScript + compiles. Build is green with all SEO routes.
