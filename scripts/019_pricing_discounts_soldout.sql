-- =====================================================
-- Migration 019: Per-product discounts, sold-out flag,
--                and order pricing breakdown columns
--
--   products.discount_percentage — 0..100, per-product discount. The selling
--     price is DERIVED from price + this % (charm-rounded) in lib/pricing.js
--     and, authoritatively, in the process_checkout RPC (migration 020). No
--     separate "sale price" column is stored, so the two can never drift.
--   products.is_sold_out — admin "Sold Out" toggle. Sold-out products stay
--     visible in the storefront but cannot be purchased (enforced in the RPC).
--   orders.discount_amount — the online-payment discount applied to the order.
--   orders.payment_method — 'cod' | 'online'.
--
-- Idempotent: safe to run more than once.
-- =====================================================

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS discount_percentage integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_sold_out boolean NOT NULL DEFAULT false;

-- Keep the discount in a sane range.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_discount_percentage_range'
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_discount_percentage_range
      CHECK (discount_percentage >= 0 AND discount_percentage <= 100);
  END IF;
END $$;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS discount_amount numeric(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'cod';
