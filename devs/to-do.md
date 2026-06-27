# E-Commerce Backend Foundation — To-Do & Reference

> This document tracks core backend/auth patterns used in Lumberwiz.
> When starting a new store, the **TO DO** section lists what to implement.
> Once done, move each item to **DONE**.
> The descriptions are written for an AI agent to read and implement directly.

---

## 🔲 TO DO

*(Move items here when starting a new project and building them out)*

---

## ✅ DONE

These are fully implemented in Lumberwiz and form the reusable foundation for new stores. The only thing that changes per project is the Supabase table schema — the auth, routing, and role patterns stay the same.

---

### 1. Supabase Client Setup
**Two clients via `@supabase/ssr` — never `@supabase/auth-helpers-nextjs`.**
- `lib/supabase.ts` exports a **browser client** (`createBrowserClient`) for use in `"use client"` components.
- `lib/supabase.ts` also exports a **server client** (`createServerClient` with `cookies()` from `next/headers`) for use in Server Components, middleware, and API routes.
- Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (public), `SUPABASE_SERVICE_ROLE_KEY` (server-only, never `NEXT_PUBLIC_`).
- `.env.local` is in `.gitignore` and never committed. Production keys go in the host dashboard (e.g. Vercel).

---

### 2. Supabase Database Tables (Lumberwiz-specific — adapt per project)
**New projects replace these tables but keep the `profiles` pattern exactly.**
- `profiles`: `id (uuid, FK → auth.users)`, `role (text, default 'customer')`, `name`, `address`, `phone`, `created_at`. Email is in `auth.users`, linked by FK.
- `products`: `id`, `name`, `price`, `description`, `category`, `inventory (boolean)`, `image (text, public URL)`, `serial_number`, `created_at`.
- `reviews`: `id`, `product_id (FK → products)`, `user_id (FK → auth.users, nullable)`, `customer_name`, `rating (int, 1–5)`, `comment`, `category`, `created_at`.
- All tables: RLS **enabled**. Verify with: `select tablename, rowsecurity from pg_tables where schemaname='public';`

---

### 3. Auto-Create Profile on Signup (Database Trigger)
**On every new auth signup, a `profiles` row is inserted automatically.**
Run this once in Supabase SQL Editor:
```sql
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, role)
  values (new.id, 'customer');
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```
New users default to `role = 'customer'`. Set admin manually:
```sql
update profiles set role = 'admin' where id = 'YOUR-UUID-HERE';
```

---

### 4. Row Level Security (RLS) Policies
**RLS is the real security layer — client-side checks are UX only.**

**`profiles` table:**
- SELECT: `auth.uid() = id` — users can only read their own row. Never `(true)`.
- UPDATE: `auth.uid() = id` — users update their own profile only.

**`products` table:**
- SELECT: `true` — public read.
- INSERT / UPDATE / DELETE: `(select role from profiles where id = auth.uid()) = 'admin'`

**`reviews` table:**
- SELECT: `true` — public read.
- INSERT: `auth.uid() is not null` — logged-in users only.
- DELETE: admin only (same pattern as products).

---

### 5. Middleware (Server-Side JWT Validation)
**`middleware.ts` in project root — runs before every request to protected routes.**
- Uses `createServerClient` from `@supabase/ssr` with `cookies()`.
- Calls `supabase.auth.getUser()` to validate the JWT server-side.
- If session is invalid or expired on an `/admin` route → redirect to `/login`.
- If session is invalid on a general protected route → redirect to `/login`.
- Matcher config covers `/admin/:path*` and any other protected segments.
- This is the server enforcement layer. Client-side role checks in components are UX only.

---

### 6. Admin Layout — Server-Side Role Gate
**`app/admin/layout.tsx` is a Server Component that checks role before rendering.**
- Fetches session server-side using the server Supabase client.
- Queries `profiles` for `role` using the authenticated user's `id`.
- If `role !== 'admin'` → `redirect('/')` server-side before any HTML is sent.
- No client-side `useEffect` role check as the primary gate — server redirect is the gate.
- Client-side check in page components is acceptable as a secondary UX layer only.

---

### 7. Login / Signup Page
**`app/login/page.tsx` — single page with two tabs.**
- Login tab: email + password → `supabase.auth.signInWithPassword()`.
- Signup tab: email, password, name, address, phone → `supabase.auth.signUp()`, then insert remaining fields into `profiles` (trigger handles `id` + `role`).
- On login success: fetch `profiles.role`, redirect to `/admin` if admin, else `/`.
- Error messages: generic for login ("Invalid credentials"). Signup: never confirm whether an email is already registered — use "If this email is available, check your inbox."
- Logout: `supabase.auth.signOut()` clears the JWT cookie.

---

### 8. Session Timeout (Idle Auto-Logout)
**`components/SessionMonitor.tsx` — client component added to root layout.**
- Tracks `mousemove`, `keydown`, `click`, `scroll` events to detect activity.
- After 30 minutes of inactivity: show a warning modal ("Session expiring in 2 minutes").
- After 2 more minutes of no activity: call `supabase.auth.signOut()` (actually invalidates the JWT, not just a UI redirect), then `router.push('/login')`.
- Reset timer on any activity event.
- Only runs when a user session is active (check `supabase.auth.getSession()` on mount).

---

### 9. Navbar — Role-Aware UI
**`components/Navbar.tsx` — `"use client"` component.**
- Uses `supabase.auth.onAuthStateChange()` to reactively track session state.
- If logged out: show Login button linking to `/login`.
- If logged in as customer: show user name/email + Logout button.
- If logged in as admin: show user name + Admin Dashboard link + Logout button.
- Admin link never visible to non-admin users (profile role check on mount).

---

### 10. Admin Dashboard — CRUD for Products
**`app/admin/page.tsx` (or layout) — protected by middleware + server role gate.**
- Fetches all products live from Supabase on load.
- **Add product**: form with name, price, description, category, inventory toggle, image upload. Image uploads to Supabase Storage bucket `product-images`, saves public URL to `products.image`.
- **Edit product**: inline or modal form, updates the row via `.update()`.
- **Delete product**: confirmation prompt, then `.delete()`.
- All operations refetch the product list on completion for live updates.
- Admin can also view/delete reviews from a separate `/admin/reviews` sub-page.

---

### 11. Server-Side Product Fetching (SSR)
**Pages that display products are Server Components — data is in the HTML for SEO.**
- `app/page.tsx` and `app/category/[name]/page.tsx` are `async` Server Components.
- They fetch from Supabase using the server client, pass data as props to child client components.
- No `useEffect` or `useState` for initial product data on these pages.
- Result: product names, images, and counts appear in raw page source (`Ctrl+U`) — Google can index them.
- `"use client"` components (carousel, cart, modals) receive data as props and handle interactivity.

---

### 12. Inventory / Sold Out Logic
**`products.inventory` (boolean) controls cart eligibility.**
- `true` → Add to Cart button is active.
- `false` → Button is disabled, "Sold Out" label shown, visually greyed out.
- Check is done in the product card component on render — no extra query needed (field comes with the product fetch).

---

### 13. Cart & Order Flow (Frontend-Only)
**Cart state lives in React context — no orders table in the DB.**
- `CartContext` (or equivalent) manages items array in memory.
- Placing an order constructs a message string from cart contents and opens one of:
  - `wa.me/[number]?text=[encoded message]` — WhatsApp
  - `mailto:lumberwiz@gmail.com?subject=Order&body=[encoded message]` — Email
  - Instagram link — manual DM
- User must be logged in before order placement — gate checked at cart drawer level.
- Cart is client-side only; no server-side price validation (acceptable for manual-fulfillment model).

---

### 14. Password Reset Flow
**Supabase email-based reset — no custom token logic needed.**
- `/forgot-password`: calls `supabase.auth.resetPasswordForEmail(email, { redirectTo: '/reset-password' })`.
- `/reset-password`: reads token from URL, shows new password + confirm fields, calls `supabase.auth.updateUser({ password: newPassword })`.
- Reset links expire after 1 hour (Supabase default).
- Redirect URL must be whitelisted in Supabase Dashboard → Auth → URL Configuration.

---

### 15. Review System
**`app/reviews/new` — requires login. Home page pulls top reviews from DB.**
- Submission: product picker (fetched from Supabase) → star rating (1–5, interactive) + comment form → insert into `reviews` table with `product_id`, `customer_name`, `rating`, `comment`, `category` (copied from product).
- Home page review section: server-side fetch, ordered by `rating desc, created_at desc`, limit 6–8. Replaces all hardcoded testimonials.
- Shared `StarRating` component: interactive mode for submission form, display mode for home page.

---

### 16. Data Upload Script (One-Time)
**`scripts/upload.js` — Node.js CLI to seed the database from local JSON + images.**
- Reads JSON files from `data/products/`.
- Maps JSON `id` field → `serial_number` in DB.
- Uploads images to Supabase Storage `product-images` bucket using the service role key.
- Inserts product rows with all fields including the public image URL.
- Uses `upsert` on `serial_number` so re-running is safe.
- Requires `dotenv` (`npm install dotenv`) and `node scripts/upload.js` to run.
- Service role key is used here only — never imported into the app.

---

### 17. SEO — Metadata & Page Titles
**Each route exports a `metadata` object or `generateMetadata` function.**
- Root layout: global fallback title and description.
- `app/page.tsx`: "Lumberwiz — Premium Timber & Wood Products" + full description.
- `app/category/[name]/page.tsx`: dynamic title using category name via `generateMetadata`.
- `app/about/page.tsx`: static title + description.
- `app/login/page.tsx`: `robots: 'noindex'` — login pages must not appear in Google.
- All `/admin` routes: `robots: 'noindex'`.

---

### 18. Storage Bucket (Product Images)
**Supabase Storage bucket: `product-images` (public).**
- Public read — images accessible without auth via public URL.
- INSERT restricted to admin role via storage policy:
  ```sql
  (select role from profiles where id = auth.uid()) = 'admin'
  ```
- Client enforces `accept="image/*"` for UX. Storage policy is the real gate.
- Image URL format: `[SUPABASE_URL]/storage/v1/object/public/product-images/[filename]`

---

*Last updated: Lumberwiz v1 — June 2026*
