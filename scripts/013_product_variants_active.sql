-- =====================================================
-- Migration 013: Auto-archive product variants on zero stock
--
-- Adds an is_active flag to product_variants and a trigger that
-- keeps it in sync with stock:
--   stock_quantity = 0  ->  is_active = false  (archived/sold out)
--   stock_quantity > 0  ->  is_active = true   (available)
--
-- This gives each size+color combo its own visible availability
-- state, driven automatically by stock.
-- =====================================================

ALTER TABLE public.product_variants
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- Backfill existing rows
UPDATE public.product_variants
SET is_active = (stock_quantity > 0);

-- Keep is_active in sync with stock on every insert/update
CREATE OR REPLACE FUNCTION sync_variant_is_active()
RETURNS TRIGGER AS $$
BEGIN
    NEW.is_active := (NEW.stock_quantity > 0);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_product_variants_is_active ON public.product_variants;

CREATE TRIGGER sync_product_variants_is_active
BEFORE INSERT OR UPDATE ON public.product_variants
FOR EACH ROW
EXECUTE FUNCTION sync_variant_is_active();
