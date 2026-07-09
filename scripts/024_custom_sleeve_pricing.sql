-- =====================================================
-- Migration 024: Custom garment sleeve pricing (Phase 3)
--
-- Each customizable category (garment) gets an optional base price and
-- optional half/full-sleeve prices with independent availability toggles. The
-- customize studio shows only the sleeve options the admin enables and prices
-- the garment from these columns (falling back to the static studio price when
-- custom_base_price is NULL).
--
-- The admin "Admins update categories" policy already exists (scripts/002).
-- Additive + idempotent.
-- =====================================================

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS custom_base_price NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS custom_half_sleeve_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS custom_full_sleeve_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS custom_half_sleeve_price NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS custom_full_sleeve_price NUMERIC(10,2);
