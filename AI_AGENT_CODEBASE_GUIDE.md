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
- [app/customize/page.jsx](app/customize/page.jsx) opens the custom studio builder.
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
- [components/CustomizeBuilder.jsx](components/CustomizeBuilder.jsx) powers the custom-studio UI.
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
