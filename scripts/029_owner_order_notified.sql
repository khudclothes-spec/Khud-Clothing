-- =====================================================
-- Migration 029: owner "new order" notification flag
--
-- The four owners get one "new order placed" email per order, at placement,
-- for BOTH payment methods. This column makes that send idempotent (the
-- confirmation email that goes to the customer uses its own confirmation_sent_at
-- flag, so the two are tracked separately). Additive + idempotent.
-- =====================================================

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS owner_notified_at TIMESTAMPTZ;
