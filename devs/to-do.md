# E-Commerce Backend Foundation — To-Do & Reference

> This document tracks core backend/auth patterns used in Lumberwiz.
> When starting a new store, the **TO DO** section lists what to implement.
> Once done, move each item to **DONE**.
> The descriptions are written for an AI agent to read and implement directly.

---
## ✅ DONE

### 1. Supabase Client Setup
**Two clients via `@supabase/ssr` — never `@supabase/auth-helpers-nextjs`.**
- `lib/supabase.ts` — browser client (`createBrowserClient`) for `"use client"` components.
- `lib/supabase-server.ts` — server client (`createServerClient`) for Server Components + middleware. Also exports `createAdminClient()` (service-role, bypasses RLS).
- Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.

---

### 2. Supabase Database Tables
Schema is in `db/clothing_ecommerce_schema.sql` — matches live Supabase DB.
Key tables: `profiles`, `categories`, `products`, `product_variants`, `product_media`, `addresses`, `discounts`, `carts`, `cart_items`, `orders`, `order_items`, `order_status_history`, `payments`, `reviews`, `review_media`.
Run `db/drop_tables.sql` first if migrating from the old schema.

---

### 3. Auto-Create Profile on Signup (Database Trigger)
`handle_new_user()` trigger is defined in the schema. Creates a `profiles` row with `role = 'customer'` on every signup.
To set admin manually:
```sql
update profiles set role = 'admin' where id = 'YOUR-UUID-HERE';
```

---

### 4. Row Level Security (RLS) Policies
Defined in the schema. Key rules:
- `profiles`: own row only
- `products`/`categories`: public SELECT, admin-only INSERT/UPDATE/DELETE
- `orders`/`order_items`: own rows + admin
- `reviews`: public SELECT (approved), own INSERT/UPDATE

---

### 5. Middleware (Server-Side JWT Validation)
`middleware.ts` in project root. Uses `createServerClient` + `supabase.auth.getUser()`. Redirects unauthenticated requests to `/admin/*` → `/login`. Matcher: `/admin/:path*`.

---

### 6. Admin Layout — Server-Side Role Gate
`app/admin/layout.jsx` — async Server Component. Fetches user + profile server-side. Redirects non-admins to `/`. Renders dark sidebar + admin nav.

---

### 7. Login / Signup Page
`app/login/page.jsx` + `app/login/LoginForm.jsx`. Two-tab layout (Sign In / Create Account). On login: checks role, redirects admin → `/admin`, customer → `/`. Signup: calls `signUp()` then updates phone in `profiles`. Generic error messages — never confirms email existence.

---

### 8. Session Timeout (Idle Auto-Logout)
`components/SessionMonitor.jsx` — mounted in root layout. Tracks `mousemove`, `keydown`, `click`, `scroll`, `touchstart`. Warning modal at 30 min, auto sign-out at 32 min. Only active when a session exists.

---

### 9. Navbar — Role-Aware UI
`components/SiteShell.jsx` — subscribes to `onAuthStateChange()`. Shows Sign In link when logged out, Sign Out button when logged in, Admin link if role = `admin`. Same logic in mobile menu.

---

### 10. Admin Dashboard — CRUD for Products
`app/admin/page.jsx` — full product CRUD. Table view, add/edit modal (name, slug, price, category, description, status, image upload, featured toggle), delete with confirm dialog, one-click status toggle. Images upload to `product-media` bucket → `product_media` table.
**Required Supabase setup**: Create a public storage bucket named `product-media`.

---

### 11. Server-Side Product Fetching (SSR)
`app/page.jsx` and `app/shop/page.jsx` are `async` Server Components. Fetch active products from Supabase via `createServerClient()`. Falls back to local `lib/data.js` products if DB returns nothing (safe during development). `lib/mapDbProduct.js` maps DB rows → ProductCard format.

---

### 12. Inventory / Sold Out Logic
`components/ProductCard.jsx` reads `product.inStock`. For DB products: `inStock = status === 'active'`. When `false`, "Sold Out" label shown and Quick Add button disabled. `product.inStock` defaults to `true` for local fallback products.

---

### 13. Cart & Order Flow
`components/CartContext.jsx` has `placeOrder(shippingDetails)` — creates an `orders` row and `order_items` rows in Supabase, then clears the cart. Cart drawer in `SiteShell.jsx` has three steps: bag → checkout form → confirmation. Checkout form collects full_name, phone, address, city, province, postal. All orders are Cash on Delivery (`payment_method: 'cod'`). Sign-in hint shown in bag if user is not authenticated.

---

### 14. Password Reset Flow
`app/forgot-password/page.jsx` — calls `resetPasswordForEmail()` with `redirectTo: NEXT_PUBLIC_SITE_URL/reset-password`. Never reveals whether email exists.
`app/reset-password/page.jsx` — calls `updateUser({ password })` with the Supabase session token from the URL.

---

### 15. Review System
`components/StarRating.jsx` — shared component, `interactive` prop switches between clickable (form) and display-only modes.
`app/reviews/new/page.jsx` — requires login (redirects if not). Product picker, star rating, optional title + body. Inserts into `reviews` table (`is_approved: false` — admin must approve in DB).
Home page (`app/page.jsx`) fetches approved reviews server-side and renders a reviews section when data exists.

---

### 16. Data Upload Script (One-Time)
`scripts/upload.js` — Node.js CLI. Seeds Supabase `products` table from the local product array. Uses `upsert` on `slug` so re-running is safe. Requires `.env.local` with `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`.
```
node scripts/upload.js
```

---

### 17. SEO — Metadata & Page Titles
All public pages export a `metadata` object:
- `/` → full description + OG tags (in root layout + page)
- `/shop` → "Shop the Drop"
- `/customize` → "Customize - Khud"
- `/size-guide` → "Size Guide"
- `/about` → "About Khud"
- `/login` → `robots: 'noindex'`
- `/admin/*` → `robots: 'noindex'` (in admin layout)

---

## 🔲 TO DO

### 18. Storage Bucket (Manual Supabase Setup)
**Supabase Storage bucket: `product-media` (public) — create in Supabase Dashboard.**
- Set to public read so product images are accessible without auth.
- Add INSERT storage policy (in Dashboard → Storage → Policies):
  ```sql
  (select role from profiles where id = auth.uid()) = 'admin'
  ```
- After creating the bucket, image uploads in the admin dashboard will work.

---

### 19. Admin Review Moderation
**Admins should be able to approve / reject submitted reviews.**
- Add `/admin/reviews` sub-page that lists all reviews with `is_approved = false`.
- Approve button: `.update({ is_approved: true })`.
- Reject / delete button: `.delete()`.
- Approved reviews appear on the home page automatically (SSR fetch already filters by `is_approved = true`).

---

### 20. Admin Orders View
**`/admin/orders` sub-page to view and manage orders.**
- List orders with: order_number, status, user email, total, created_at.
- Status update dropdown (pending → confirmed → shipped → delivered).
- Status changes auto-log to `order_status_history` via the DB trigger already in place.

---

### 21. Product Variants (Size / Color)
**Variants drive the real inventory system.**
- Add variant management to the admin product form: size + color combinations, each with `sku` and `stock_quantity`.
- Cart items should reference `variant_id` instead of just product name.
- `inStock` logic should be: `any variant has stock_quantity > 0`.
- This is complex — do only after the core CRUD is stable and tested.

---
