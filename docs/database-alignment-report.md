# Database Alignment Report

Generated against: `db/clothing_ecommerce_schema.sql`

---

## Tables Used by Code

| Table | Used in |
|---|---|
| `products` | app/page.jsx, app/shop/page.jsx, app/reviews/new/page.jsx, app/admin/page.jsx, lib/mapDbProduct.js |
| `product_media` | app/admin/page.jsx, lib/mapDbProduct.js |
| `orders` | components/CartContext.jsx |
| `order_items` | components/CartContext.jsx |
| `reviews` | app/page.jsx, app/reviews/new/page.jsx |
| `categories` | app/admin/page.jsx (join from products queries) |
| `profiles` | app/login/LoginForm.jsx, app/admin/layout.jsx, components/SiteShell.jsx |

---

## Tables Unused by Code

| Table | Reason |
|---|---|
| `product_variants` | Admin CRUD does not yet manage variants; CartContext does not reference variant_id |
| `custom_orders` | CustomizeBuilder adds to cart only; never inserts into custom_orders table |

---

## Incorrect Table References

None — all referenced table names are correct string literals. However, two tables referenced in queries (`profiles`, `categories`) are not defined in the schema SQL and must be created via migration.

---

## Incorrect Column References

### `products` table

| Location | Code Column | DB Column | Issue |
|---|---|---|---|
| app/page.jsx:24 | `base_price` | `price` | Wrong column name |
| app/shop/page.jsx:20 | `base_price` | `price` | Wrong column name |
| app/admin/page.jsx:52 | `base_price` | `price` | Wrong column name |
| app/admin/page.jsx:84 | `product.base_price` | `product.price` | Wrong column name |
| app/admin/page.jsx:131 | `base_price: parseFloat(form.base_price)` | `price` | Wrong column name in insert/update payload |
| lib/mapDbProduct.js:20 | `p.base_price` | `p.price` | Wrong column name in mapper |
| app/page.jsx:26 | `.eq("status", "active")` | `is_active` | Wrong column; schema has `is_active` boolean, not a `status` text column |
| app/shop/page.jsx:22 | `.eq("status", "active")` | `is_active` | Same as above |
| app/reviews/new/page.jsx:33 | `.eq("status", "active")` | `is_active` | Same as above |
| app/admin/page.jsx:198 | `status: form.status` | `is_active` | Same as above (admin form also has status: "draft"/"active"/"archived") |
| lib/mapDbProduct.js:31 | `p.status === "active"` | `p.is_active === true` | Wrong field for inStock check |

### `reviews` table

| Location | Code Column | DB Column | Issue |
|---|---|---|---|
| app/page.jsx:36 | `title` in select | _(none)_ | Column does not exist in schema |
| app/page.jsx:36 | `body` in select | `comment` | Wrong column name |
| app/page.jsx:38 | `.eq("is_approved", true)` | `.eq("approved", true)` | Wrong column name |
| app/page.jsx:213 | `review.title` | _(none)_ | Rendering non-existent column |
| app/page.jsx:214 | `review.body` | `review.comment` | Wrong column name |
| app/reviews/new/page.jsx:48 | `user_id: user.id` | `profile_id` | Wrong column name for FK |
| app/reviews/new/page.jsx:51 | `title: form.title.trim()` | _(none)_ | Column does not exist |
| app/reviews/new/page.jsx:52 | `body: form.body.trim()` | `comment` | Wrong column name |
| app/reviews/new/page.jsx:53 | `is_verified: false` | _(none)_ | Column does not exist |
| app/reviews/new/page.jsx:54 | `is_approved: false` | `approved` | Wrong column name |

### `orders` table

| Location | Code Column | DB Column | Issue |
|---|---|---|---|
| components/CartContext.jsx:79 | `user_id: user.id` | `profile_id` | Wrong FK column name |
| components/CartContext.jsx:80 | _(missing)_ | `order_number` | Required NOT NULL column never set |
| components/CartContext.jsx:81 | `shipping_name: shipping.full_name` | `customer_name` | Wrong column name |
| components/CartContext.jsx:82 | `shipping_phone: shipping.phone` | `customer_phone` | Wrong column name |
| components/CartContext.jsx:83 | _(missing)_ | `customer_email` | Required NOT NULL column never set |
| components/CartContext.jsx:83-87 | `shipping_line1`, `shipping_line2`, `shipping_state`, `shipping_postal`, `shipping_country` | `shipping_address` (single TEXT) | Schema uses one flat address field |
| components/CartContext.jsx:88 | `shipping_city: shipping.city` | `city` | Wrong column name |
| components/CartContext.jsx:91 | `discount_amount: 0` | _(none)_ | Column does not exist |
| components/CartContext.jsx:93 | `tax_amount: 0` | _(none)_ | Column does not exist |
| components/CartContext.jsx:94 | `total: subtotalNumber` | `total_amount` | Wrong column name |
| components/CartContext.jsx:95 | `payment_method: "cod"` | _(none)_ | Column does not exist |
| components/CartContext.jsx:96 | `payment_status: "unpaid"` | _(none)_ | Column does not exist |

### `order_items` table

| Location | Code Column | DB Column | Issue |
|---|---|---|---|
| components/CartContext.jsx:104 | `product_name: item.name` | _(none)_ | Column does not exist |
| components/CartContext.jsx:105 | `variant_label: item.meta` | _(none)_ | Column does not exist |
| components/CartContext.jsx:106 | `sku: null` | _(none)_ | Column does not exist in order_items |
| components/CartContext.jsx:108 | `line_total: item.price * item.qty` | _(none)_ | Column does not exist |
| components/CartContext.jsx:109 | `image_url: item.image` | _(none)_ | Column does not exist |

---

## Missing Columns

These columns are referenced in code but do not exist in the schema:

| Table | Missing Column | Location |
|---|---|---|
| products | `base_price` | Used everywhere instead of correct `price` |
| products | `status` (text) | Code treats products.status as "active"/"draft"/"archived" |
| reviews | `title` | app/page.jsx, app/reviews/new/page.jsx |
| reviews | `body` | app/page.jsx, app/reviews/new/page.jsx |
| reviews | `is_verified` | app/reviews/new/page.jsx |
| reviews | `is_approved` | app/page.jsx, app/reviews/new/page.jsx |
| orders | `user_id` | components/CartContext.jsx |
| orders | `order_number` | Never populated in code, but required NOT NULL in DB |
| orders | `customer_email` | Never populated, but required NOT NULL in DB |
| orders | `shipping_name` | components/CartContext.jsx |
| orders | `shipping_phone` | components/CartContext.jsx |
| orders | `shipping_line1/2/state/postal/country` | components/CartContext.jsx |
| orders | `shipping_city` | components/CartContext.jsx |
| orders | `discount_amount` | components/CartContext.jsx |
| orders | `tax_amount` | components/CartContext.jsx |
| orders | `total` | components/CartContext.jsx (should be total_amount) |
| orders | `payment_method` | components/CartContext.jsx |
| orders | `payment_status` | components/CartContext.jsx |
| order_items | `product_name` | components/CartContext.jsx |
| order_items | `variant_label` | components/CartContext.jsx |
| order_items | `sku` | components/CartContext.jsx |
| order_items | `line_total` | components/CartContext.jsx |
| order_items | `image_url` | components/CartContext.jsx |
| product_media | `media_type` | app/admin/page.jsx (inserts non-existent field) |

---

## Datatype Mismatches

| Location | Issue |
|---|---|
| lib/mapDbProduct.js:20 | `Number(p.base_price)` — correct use of Number() for NUMERIC; column name is wrong (should be `price`) |
| app/admin/page.jsx:251 | `Number(p.base_price).toLocaleString()` — correct cast; column name is wrong |
| lib/mapDbProduct.js:31 | `p.status === "active"` compares TEXT against BOOLEAN field `is_active` |

---

## Broken Queries

### 1. All product selects — `base_price` column

Every product query selects `base_price` which does not exist. Supabase will return `null` for this column silently, causing prices to display as `NaN` or `Rs 0`.

**Files:** app/page.jsx, app/shop/page.jsx, app/admin/page.jsx

### 2. Product active filter — `status` vs `is_active`

`.eq("status", "active")` targets a non-existent column. Without a `status` column, Supabase will return a column-not-found error or an empty result set.

**Files:** app/page.jsx, app/shop/page.jsx, app/reviews/new/page.jsx, app/admin/page.jsx

### 3. Reviews select — non-existent columns

`.select("..., title, body, ...")` selects non-existent columns. Supabase returns `null` for both.

**File:** app/page.jsx

### 4. Reviews filter — `is_approved`

`.eq("is_approved", true)` targets a non-existent column. Result: no reviews returned, section hidden.

**File:** app/page.jsx

### 5. Review insert — multiple wrong columns

Inserts `user_id`, `title`, `body`, `is_verified`, `is_approved` — none of which exist in the schema. Insert will fail with a column error.

**File:** app/reviews/new/page.jsx

### 6. Order insert — all shipping fields wrong

Inserts `user_id`, `shipping_name`, `shipping_phone`, `shipping_line1/2/state/postal/country`, `shipping_city`, `discount_amount`, `tax_amount`, `total`, `payment_method`, `payment_status`. None of these match the schema. Missing required fields: `profile_id`, `order_number`, `customer_name`, `customer_phone`, `customer_email`, `shipping_address`, `city`, `total_amount`. Every order insert will fail.

**File:** components/CartContext.jsx

### 7. Order items insert — all extra columns wrong

Inserts `product_name`, `variant_label`, `sku`, `line_total`, `image_url`. None exist in schema. Order items insert will fail.

**File:** components/CartContext.jsx

### 8. Admin — storage bucket name

`supabase.storage.from("product-media")` references a bucket named `product-media`. Schema defines bucket `product-images`. Image uploads will fail.

**File:** app/admin/page.jsx

### 9. mapDbProduct.js — storage bucket URL

Public URL is built using path `.../product-media/...`. Should be `.../product-images/...`.

**File:** lib/mapDbProduct.js

### 10. Admin — `product_media` insert has `media_type`

Insert into `product_media` includes `media_type: "image"` — a column that does not exist in schema. Insert will fail.

**File:** app/admin/page.jsx

---

## RLS Issues

### Missing admin write policies

The schema defines public read for products, variants, and media — but has **no admin write policies** for these tables. The admin dashboard insert/update/delete operations will be blocked by RLS.

Missing policies:
- `products`: admin INSERT, UPDATE, DELETE
- `product_variants`: admin INSERT, UPDATE, DELETE
- `product_media`: admin INSERT, UPDATE, DELETE

### Missing order_items INSERT policy

Users can read their own order_items but there is no INSERT policy. Cart checkout will fail because `order_items` insert is blocked by RLS (even for authenticated users inserting their own order's items).

### Missing profiles policies

The `profiles` table is not in this schema file, so its RLS policies are unknown. The application:
- Reads `profiles.role` to gate admin access
- Updates `profiles.phone` on signup
- Reads `profiles.full_name` for display

Without correct RLS on `profiles`, these operations will fail silently.

### RLS gap: custom_orders has no UPDATE policy

Users cannot update their own custom order after creation. Admins have no access at all.

---

## Storage Issues

| Issue | Detail |
|---|---|
| Bucket name mismatch | Code uses `product-media`; schema defines `product-images` |
| URL path mismatch | mapDbProduct.js builds URL with `/product-media/` path segment |

---

## Recommended Fixes

### Database migrations (do not modify schema file)

1. **`001_create_profiles_table.sql`** — Create `profiles` table with `id`, `full_name`, `phone`, `role` columns. Enable RLS. Add self-read/update policy. Add admin-read policy. Prevent role escalation.

2. **`002_create_categories_table.sql`** — Create `categories` table with `id`, `name`, `sort_order`. Enable RLS. Add public SELECT policy. Add admin write policies.

3. **`003_add_products_status_column.sql`** — Add `status TEXT NOT NULL DEFAULT 'active' CHECK IN ('draft','active','archived')` to products. Backfill: set `status = 'active'` where `is_active = true`, `status = 'draft'` where `is_active = false`. Update public RLS policy to use `status = 'active'`. This aligns the schema with the admin UI's three-state status.

4. **`004_rls_admin_products.sql`** — Add admin INSERT/UPDATE/DELETE policies to `products`, `product_variants`, `product_media`.

5. **`005_rls_order_items_insert.sql`** — Add INSERT policy to `order_items` for authenticated users (restricting to their own orders).

6. **`006_rls_admin_orders.sql`** — Add admin SELECT/UPDATE policies to `orders` and `order_items`.

7. **`007_rls_admin_reviews.sql`** — Add admin UPDATE/DELETE policies to `reviews`.

8. **`008_rls_admin_custom_orders.sql`** — Add admin full access to `custom_orders`. Add UPDATE for users on own records.

### Code fixes

| File | Fix |
|---|---|
| `lib/mapDbProduct.js` | Rename `p.base_price` → `p.price`; `p.status === "active"` → `p.status === "active"` (valid after migration 003); fix bucket URL `product-media` → `product-images` |
| `app/page.jsx` | Rename `base_price` → `price` in select; rename `is_approved` → `approved`; rename `body` → `comment`, remove `title`; fix display to use `review.comment` |
| `app/shop/page.jsx` | Rename `base_price` → `price` in select |
| `app/reviews/new/page.jsx` | Rename `user_id` → `profile_id`; merge `title`+`body` → `comment`; remove `is_verified`; rename `is_approved` → `approved` |
| `app/admin/page.jsx` | Rename all `base_price` → `price`; rename bucket `product-media` → `product-images`; remove `media_type` from product_media insert |
| `components/CartContext.jsx` | Fix all orders columns: `user_id`→`profile_id`, generate `order_number`, add `customer_email` from user, map shipping fields, rename total; fix order_items: remove non-existent columns |
