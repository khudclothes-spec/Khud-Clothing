-- =====================================================
-- Migration 018: Order email idempotency
--
-- Adds orders.confirmation_sent_at so the order-confirmation email
-- (customer + owner notifications) is sent exactly once per order even if
-- the confirm endpoint is retried.
--
-- Idempotent and non-destructive. Run in the Supabase SQL editor.
-- =====================================================

ALTER TABLE public.orders
    ADD COLUMN IF NOT EXISTS confirmation_sent_at TIMESTAMPTZ;
