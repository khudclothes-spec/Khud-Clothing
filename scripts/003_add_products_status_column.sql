-- =====================================================
-- Migration 003: Add status column to products
-- The application code and admin dashboard use a text
-- status field with values 'draft' | 'active' | 'archived'.
-- The base schema only has is_active (boolean).
-- This migration adds the status column, backfills data,
-- and updates the public RLS policy to use status.
-- =====================================================

-- Add the status column
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('draft', 'active', 'archived'));

-- Backfill existing rows from is_active
UPDATE public.products
SET status = CASE
    WHEN is_active = true THEN 'active'
    ELSE 'draft'
END;

-- Drop the old public read policy (uses is_active = true)
DROP POLICY IF EXISTS "Public products read" ON public.products;

-- Replace with a policy that uses the new status column
CREATE POLICY "Public products read"
ON public.products
FOR SELECT
USING (status = 'active');

-- Add a trigger to keep is_active in sync with status
-- so any direct is_active writes stay consistent
CREATE OR REPLACE FUNCTION sync_product_is_active()
RETURNS TRIGGER AS $$
BEGIN
    NEW.is_active := (NEW.status = 'active');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_products_is_active
BEFORE INSERT OR UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION sync_product_is_active();
