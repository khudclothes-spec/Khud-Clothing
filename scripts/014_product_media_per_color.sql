-- =====================================================
-- Migration 014: Per-colour product images
--
-- The storefront product page now shows MULTIPLE images per
-- colour, switching the gallery when the customer picks a colour.
-- The admin can:
--   * mark ONE image as the product's main display image
--     (used on the home/featured grid and on category cards)   -> is_primary
--   * mark ONE image per colour as that colour's cover image
--     (the first image shown when that colour is selected)      -> is_color_cover
--
-- Each media row belongs to exactly ONE colour, so a single image
-- can never be the cover of two different colours. The main display
-- image and a colour's cover MAY be the same row (both flags true).
--
-- Existing rows (no colour set) keep working as a generic gallery.
-- Images are still stored in the single 'product-images' bucket; we
-- just store more rows per product and tag each with its colour.
-- =====================================================

-- 1. Which colour each image belongs to (matches product_variants.color).
--    NULL = legacy / colour-agnostic image.
ALTER TABLE public.product_media
ADD COLUMN IF NOT EXISTS color TEXT;

-- 2. The cover (first-shown) image for its colour on the product page.
ALTER TABLE public.product_media
ADD COLUMN IF NOT EXISTS is_color_cover BOOLEAN NOT NULL DEFAULT FALSE;

-- 3. At most ONE main display image per product.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_product_media_primary
ON public.product_media (product_id)
WHERE is_primary = TRUE;

-- 4. At most ONE cover image per (product, colour).
CREATE UNIQUE INDEX IF NOT EXISTS uniq_product_media_color_cover
ON public.product_media (product_id, color)
WHERE is_color_cover = TRUE;

-- 5. Faster colour-grouped lookups for the gallery.
CREATE INDEX IF NOT EXISTS idx_product_media_product_color
ON public.product_media (product_id, color, sort_order);

-- Note: admin INSERT/UPDATE/DELETE policies on product_media already
-- exist (migration 004) and cover the new columns automatically.
