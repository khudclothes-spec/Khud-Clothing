# Final Summary — Database Alignment

## Build Status

✓ `npm run build` passes with zero errors and zero warnings.

---

## Files Changed

| File | Changes |
|---|---|
| `lib/mapDbProduct.js` | `p.base_price` → `p.price`; bucket URL `product-media` → `product-images` |
| `app/page.jsx` | `base_price` → `price` in select; reviews: `is_approved`→`approved`, `body`→`comment`, removed `title`; display uses `review.comment` |
| `app/shop/page.jsx` | `base_price` → `price` in select |
| `app/reviews/new/page.jsx` | Insert: `user_id`→`profile_id`; `title`+`body` merged into `comment`; `is_approved`→`approved`; removed `is_verified` |
| `app/admin/page.jsx` | All `base_price`→`price` (form field, state, payload, display); bucket `product-media`→`product-images`; removed `media_type` from two `product_media` inserts |
| `components/CartContext.jsx` | Orders insert: `user_id`→`profile_id`, added `order_number` generation, `shipping_name/phone`→`customer_name/phone`, added `customer_email` from auth user, combined address fields into `shipping_address`, `shipping_city`→`city`, `total`→`total_amount`, removed `discount_amount/tax_amount/payment_method/payment_status`; Order items: removed `product_name/variant_label/sku/line_total/image_url` |

---

## Documents Created

| File | Purpose |
|---|---|
| `docs/database-schema-summary.md` | Full reference of all tables, columns, types, constraints, triggers, functions, RLS policies, and storage buckets |
| `docs/database-alignment-report.md` | Complete audit: tables used/unused, every wrong column, datatype issues, broken queries, RLS gaps, storage issues, recommended fixes |
| `docs/final-summary.md` | This file |

---

## Migration Scripts Created

Run these in order in the Supabase SQL editor. They are additive — they do not modify the original schema file.

| File | Purpose |
|---|---|
| `scripts/001_create_profiles_table.sql` | Creates `profiles` table with `id`, `full_name`, `phone`, `role`. Adds RLS: own-read/update, admin-read-all, role escalation prevention. |
| `scripts/002_create_categories_table.sql` | Creates `categories` table with `id`, `name`, `sort_order`. Adds RLS. Seeds 6 default categories. |
| `scripts/003_add_products_status_column.sql` | Adds `status TEXT CHECK IN ('draft','active','archived')` to products. Backfills from `is_active`. Replaces public RLS policy to use `status = 'active'`. Adds trigger to keep `is_active` in sync. |
| `scripts/004_rls_admin_products.sql` | Adds admin INSERT/UPDATE/DELETE policies to `products`, `product_variants`, `product_media`. |
| `scripts/005_rls_order_items_insert.sql` | Adds INSERT policy for order items (blocked by RLS in base schema). |
| `scripts/006_rls_admin_orders.sql` | Adds admin SELECT/UPDATE policies to `orders` and `order_items`. |
| `scripts/007_rls_admin_reviews.sql` | Adds admin SELECT/UPDATE/DELETE policies to `reviews` for moderation. |
| `scripts/008_rls_admin_custom_orders.sql` | Adds admin SELECT/UPDATE/DELETE to `custom_orders`. |
| `scripts/009_storage_bucket_note.sql` | Informational: documents the bucket rename from `product-media` → `product-images`. Includes manual steps if old bucket had data. |

---

## Tables Affected

| Table | Issue Fixed |
|---|---|
| `products` | Column `price` (was queried as `base_price`); `status` column added via migration |
| `product_media` | Removed invalid `media_type` from inserts; bucket corrected to `product-images` |
| `reviews` | Columns `profile_id`, `comment`, `approved` (were `user_id`, `title`+`body`, `is_approved`/`is_verified`) |
| `orders` | Columns `profile_id`, `order_number`, `customer_name`, `customer_phone`, `customer_email`, `shipping_address`, `city`, `total_amount` (all were wrong/missing) |
| `order_items` | Removed 5 non-existent columns from insert |
| `profiles` | Created via migration 001 (missing from base schema) |
| `categories` | Created via migration 002 (missing from base schema) |

---

## RLS Fixes Added

| Migration | Tables | Gap Filled |
|---|---|---|
| 001 | `profiles` | Own-row read/update; admin read-all; role escalation prevention |
| 002 | `categories` | Public read; admin write |
| 003 | `products` | Updated public SELECT policy to use new `status` column |
| 004 | `products`, `product_variants`, `product_media` | Admin INSERT/UPDATE/DELETE (was completely missing) |
| 005 | `order_items` | User INSERT (was missing — checkout would fail silently) |
| 006 | `orders`, `order_items` | Admin full read + order UPDATE |
| 007 | `reviews` | Admin SELECT (unapproved), UPDATE (approve), DELETE (reject) |
| 008 | `custom_orders` | Admin full access |

---

## Remaining Manual Steps

1. **Run migrations 001–009 in order** in the Supabase SQL editor.

2. **Promote an admin user manually** after signup:
   ```sql
   UPDATE profiles SET role = 'admin' WHERE id = 'YOUR-UUID-HERE';
   ```

3. **Storage bucket**: The base schema creates `product-images` automatically. If you previously created a `product-media` bucket with uploaded images, follow the manual steps in `scripts/009_storage_bucket_note.sql`.

4. **Admin orders page** (`/admin/orders`) is linked in the sidebar but not yet implemented — the page component does not exist yet. This is pre-existing; no code change was made.

5. **Product variants** — the `product_variants` table exists but is not yet wired to the admin UI or cart. This is pre-existing.

6. **Custom orders** — the `CustomizeBuilder` component adds items to cart but does not insert into `custom_orders`. Connecting artwork uploads and the `custom_orders` insert is a future task.
