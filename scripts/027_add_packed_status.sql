-- =====================================================
-- Migration 027: add the 'packed' order status
--
-- The order lifecycle now distinguishes Processing → Printing → Packed as three
-- separate steps (previously the fulfilment step was "ready"). This widens the
-- orders.status check constraint to include 'packed' while keeping every legacy
-- value valid. Additive + idempotent.
-- =====================================================

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders
  ADD CONSTRAINT orders_status_check CHECK (status IN (
    'pending',               -- legacy / generic
    'pending_payment',       -- online: awaiting bank transfer + screenshot upload
    'pending_verification',  -- online: screenshot uploaded, awaiting admin review
    'payment_received',      -- online: admin approved payment
    'confirmed',             -- queued for production
    'processing',            -- being prepared for production
    'printing',              -- in production (printing/finishing)
    'ready',                 -- legacy alias (superseded by 'packed')
    'packed',                -- packed, ready to hand to the courier
    'shipped',
    'delivered',
    'cancelled'
  ));
