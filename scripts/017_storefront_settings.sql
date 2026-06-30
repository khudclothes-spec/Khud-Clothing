-- =====================================================
-- Migration 017: Storefront display settings
--
-- Adds:
--   1. products.is_hero        — the single "best product" shown in the
--                                homepage hero (admin picks one).
--   2. categories.show_in_footer — up to 3 categories listed in the footer
--                                Shop column (enforced in the admin UI).
--
-- Idempotent and non-destructive. How to run: paste into the Supabase SQL
-- editor (or psql) and execute. Existing admin read/update policies from
-- migrations 002/004/016 already cover these columns.
-- =====================================================

ALTER TABLE public.products
    ADD COLUMN IF NOT EXISTS is_hero BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.categories
    ADD COLUMN IF NOT EXISTS show_in_footer BOOLEAN NOT NULL DEFAULT FALSE;

-- Fast lookup of the (at most one) hero product.
CREATE INDEX IF NOT EXISTS idx_products_hero ON public.products(is_hero) WHERE is_hero;
