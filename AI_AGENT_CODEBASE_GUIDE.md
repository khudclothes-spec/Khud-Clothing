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
- **Order confirmation:** [components/CartContext.jsx](components/CartContext.jsx) `placeOrder` fires `POST /api/orders/confirm` (fire-and-forget) → [app/api/orders/confirm/route.js](app/api/orders/confirm/route.js) authenticates + verifies ownership + idempotent (`orders.confirmation_sent_at`) → customer email + 4 owner notifications (`OWNER_EMAIL_1..4`).
- **Status updates:** [app/admin/orders/page.jsx](app/admin/orders/page.jsx) routes status changes through `POST /api/orders/status` (admin-only) which updates `orders.status` AND emails the customer (`STATUS_COPY` in [emails/orderStatusUpdate.js](emails/orderStatusUpdate.js) covers confirmed/processing/shipped/delivered/cancelled).
- **Verification:** [app/login/LoginForm.jsx](app/login/LoginForm.jsx) signup → `/verify-email` ([app/verify-email/page.jsx](app/verify-email/page.jsx)) which polls + `onAuthStateChange` + resend. Unverified users are blocked from checkout (client guard + route 403 + the RPC needs `auth.uid()`).
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
- **Mockup images.** [components/customize/GarmentArt.jsx](components/customize/GarmentArt.jsx) renders `/mockups/<mockupKey>/<colorKey>/<view>.png` (via `studioMockupSrc`) and falls back to the SVG `GarmentMockup` on a missing/empty file. Changing garment, colour, or view recomputes the path. Folders live in [public/mockups/](public/mockups). Asset spec: [docs/mockup-specifications.md](docs/mockup-specifications.md).
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
- Shipping is **item-count based**: `SHIPPING_FLAT` Rs 230, free at `FREE_SHIPPING_MIN_ITEMS` (3)+ items. The announcement bar and the bag "add N more for free shipping" hint read from these constants.
- Two payment methods (`PAYMENT_METHODS`): `cod` (no change) and `online` (5% off subtotal, `ONLINE_DISCOUNT_RATE`). The checkout summary uses `orderTotals({subtotal, itemCount, paymentMethod})` → `{ subtotal, onlineDiscount, shipping, freeShipping, total }` and shows Subtotal / Discount / Shipping / Total. `paymentMethod` is passed to `placeOrder` and forwarded inside `p_customer.payment_method`.

### Server of record
- RPC [scripts/020_checkout_pricing_rpc.sql](scripts/020_checkout_pricing_rpc.sql): computes effective per-item price (discount + charm round), **rejects sold-out**, sums an item count, applies the online 5% + item-based shipping, and stores `subtotal / discount_amount / payment_method / shipping_cost / total_amount`. `order_items.unit_price` snapshots the discounted price.
- Order emails: `buildOrderModel` ([lib/email/orders.js](lib/email/orders.js)) surfaces `discount` + `paymentMethodLabel`; `totals()` ([emails/components.js](emails/components.js)) renders a Discount row; the confirmation shows the real payment method. Admin orders detail ([app/admin/orders/page.jsx](app/admin/orders/page.jsx)) shows discount + payment + "Free" shipping.
- **Migrations to run in Supabase:** [019_pricing_discounts_soldout.sql](scripts/019_pricing_discounts_soldout.sql) then [020_checkout_pricing_rpc.sql](scripts/020_checkout_pricing_rpc.sql).

### Admin editor scroll fix (Feature)
- Root cause: `fetchAll()` flipped a global `loading` flag that swapped the whole table for a spinner on every in-row mutation (variant add/delete, status toggle, image upload), which reset scroll to the top. Fix in [app/admin/page.jsx](app/admin/page.jsx): `fetchAll(silent)` — the spinner only shows on the initial load; a `refresh()` (silent) is used for all post-mutation re-reads, so the table never unmounts and scroll is preserved. Save and Cancel are the only actions that exit edit mode (`onClose`).
