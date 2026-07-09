-- =====================================================
-- Migration 023: Manual bank-transfer payments + order snapshot fields
--
-- Phases 5/6. Adds:
--   * order pricing/snapshot columns: tax, promo_code, promo_discount,
--     shipping_method, and full billing + shipping snapshots (so historical
--     orders never change when a profile is edited later).
--   * a widened orders.status set covering the new lifecycle.
--   * payment_verifications: one row per online (bank-transfer) order — an audit
--     trail of the screenshot + who approved/rejected it and when. Kept separate
--     from orders so a future real gateway can reuse the same table.
--   * a private 'payment-screenshots' storage bucket + policies.
--
-- Additive + idempotent.
-- =====================================================

-- ---------- order pricing + snapshot columns ----------
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS tax NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS promo_code TEXT,
  ADD COLUMN IF NOT EXISTS promo_discount NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shipping_method TEXT DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS shipping_state TEXT,
  ADD COLUMN IF NOT EXISTS shipping_postal_code TEXT,
  ADD COLUMN IF NOT EXISTS shipping_country TEXT DEFAULT 'Pakistan',
  ADD COLUMN IF NOT EXISTS billing_name TEXT,
  ADD COLUMN IF NOT EXISTS billing_phone TEXT,
  ADD COLUMN IF NOT EXISTS billing_address TEXT,
  ADD COLUMN IF NOT EXISTS billing_city TEXT,
  ADD COLUMN IF NOT EXISTS billing_state TEXT,
  ADD COLUMN IF NOT EXISTS billing_postal_code TEXT,
  ADD COLUMN IF NOT EXISTS billing_country TEXT;

-- ---------- widen the status lifecycle ----------
-- Existing rows use the legacy set; keep those values valid and add the new
-- lifecycle states used by the manual-payment flow.
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders
  ADD CONSTRAINT orders_status_check CHECK (status IN (
    'pending',               -- legacy / generic
    'pending_payment',       -- online: awaiting bank transfer + screenshot
    'pending_verification',  -- online: screenshot uploaded, awaiting admin
    'payment_received',      -- online: admin approved payment
    'confirmed',             -- queued for production
    'processing',            -- legacy alias for printing
    'printing',              -- in production
    'ready',                 -- ready to ship
    'shipped',
    'delivered',
    'cancelled'
  ));

-- ---------- payment verification (audit trail) ----------
CREATE TABLE IF NOT EXISTS public.payment_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
  payment_method TEXT NOT NULL DEFAULT 'online',
  payment_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'submitted', 'approved', 'rejected')),
  payment_screenshot_path TEXT,           -- path in the 'payment-screenshots' bucket
  uploaded_at TIMESTAMPTZ,
  verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_verifications_order ON public.payment_verifications(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_verifications_status ON public.payment_verifications(payment_status);

ALTER TABLE public.payment_verifications ENABLE ROW LEVEL SECURITY;

-- Owner (via order) may read + insert + update their own payment row (to upload
-- the screenshot). Admins may read + update all (approve/reject).
DROP POLICY IF EXISTS "Users read own payment verification" ON public.payment_verifications;
CREATE POLICY "Users read own payment verification"
ON public.payment_verifications FOR SELECT
USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.profile_id = auth.uid()));

DROP POLICY IF EXISTS "Users insert own payment verification" ON public.payment_verifications;
CREATE POLICY "Users insert own payment verification"
ON public.payment_verifications FOR INSERT
TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.profile_id = auth.uid()));

DROP POLICY IF EXISTS "Users update own payment verification" ON public.payment_verifications;
CREATE POLICY "Users update own payment verification"
ON public.payment_verifications FOR UPDATE
TO authenticated
USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.profile_id = auth.uid()));

DROP POLICY IF EXISTS "Admins read all payment verifications" ON public.payment_verifications;
CREATE POLICY "Admins read all payment verifications"
ON public.payment_verifications FOR SELECT USING (public.get_my_role() = 'admin');

DROP POLICY IF EXISTS "Admins update payment verifications" ON public.payment_verifications;
CREATE POLICY "Admins update payment verifications"
ON public.payment_verifications FOR UPDATE
USING (public.get_my_role() = 'admin')
WITH CHECK (public.get_my_role() = 'admin');

DROP TRIGGER IF EXISTS update_payment_verifications_updated_at ON public.payment_verifications;
CREATE TRIGGER update_payment_verifications_updated_at
BEFORE UPDATE ON public.payment_verifications
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

GRANT SELECT, INSERT, UPDATE ON public.payment_verifications TO authenticated;
GRANT ALL ON public.payment_verifications TO service_role;

-- ---------- private storage bucket for screenshots ----------
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-screenshots', 'payment-screenshots', false)
ON CONFLICT (id) DO NOTHING;

-- Customers upload/read under a folder named after their user id; admins read all.
DROP POLICY IF EXISTS "Users upload own payment screenshot" ON storage.objects;
CREATE POLICY "Users upload own payment screenshot"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'payment-screenshots' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users read own payment screenshot" ON storage.objects;
CREATE POLICY "Users read own payment screenshot"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'payment-screenshots'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.get_my_role() = 'admin'
  )
);

DROP POLICY IF EXISTS "Users update own payment screenshot" ON storage.objects;
CREATE POLICY "Users update own payment screenshot"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'payment-screenshots' AND (storage.foldername(name))[1] = auth.uid()::text);
