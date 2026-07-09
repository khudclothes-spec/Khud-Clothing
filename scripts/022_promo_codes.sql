-- =====================================================
-- Migration 022: Promo code system (Phase 4)
--
--   promo_codes: admin-managed discount codes. Types:
--     'percentage' — discount_value is a % (0..100)
--     'fixed'      — discount_value is a flat Rs amount
--     'student'    — student-only code (requires profiles.student_verified);
--                    discount_value is the % it grants.
--
-- Codes are NOT publicly listable. Validation happens server-side through the
-- SECURITY DEFINER validate_promo_code() so a client can never enumerate codes
-- or fabricate a discount. Usage is incremented atomically at checkout by the
-- process_checkout RPC (see the checkout migration), never here.
--
-- Additive + idempotent.
-- =====================================================

CREATE TABLE IF NOT EXISTS public.promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,                    -- stored UPPERCASE
  description TEXT,
  discount_type TEXT NOT NULL DEFAULT 'percentage'
    CHECK (discount_type IN ('percentage', 'fixed', 'student')),
  discount_value NUMERIC(10,2) NOT NULL DEFAULT 0,
  min_subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  max_uses INTEGER,                             -- NULL = unlimited
  current_uses INTEGER NOT NULL DEFAULT 0,
  requires_student BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at TIMESTAMPTZ,                       -- NULL = never expires
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON public.promo_codes(code);

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

-- Admins fully manage codes. No anon/authenticated SELECT policy — customers
-- reach codes only through validate_promo_code().
DROP POLICY IF EXISTS "Admins manage promo codes" ON public.promo_codes;
CREATE POLICY "Admins manage promo codes"
ON public.promo_codes FOR ALL
USING (public.get_my_role() = 'admin')
WITH CHECK (public.get_my_role() = 'admin');

DROP TRIGGER IF EXISTS update_promo_codes_updated_at ON public.promo_codes;
CREATE TRIGGER update_promo_codes_updated_at
BEFORE UPDATE ON public.promo_codes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- validation (definer) ----------
-- Returns { valid, code, discount_type, discount_value, discount_amount,
--           requires_student, message }. discount_amount is capped at subtotal.
CREATE OR REPLACE FUNCTION public.validate_promo_code(p_code TEXT, p_subtotal NUMERIC)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid       UUID := auth.uid();
  v_row       promo_codes%ROWTYPE;
  v_student   BOOLEAN := FALSE;
  v_amount    NUMERIC(10,2) := 0;
  v_code      TEXT := upper(trim(COALESCE(p_code, '')));
BEGIN
  IF v_code = '' THEN
    RETURN jsonb_build_object('valid', false, 'message', 'Enter a promo code.');
  END IF;

  SELECT * INTO v_row FROM promo_codes WHERE code = v_code;
  IF NOT FOUND OR NOT v_row.is_enabled THEN
    RETURN jsonb_build_object('valid', false, 'message', 'This code is not valid.');
  END IF;
  IF v_row.expires_at IS NOT NULL AND v_row.expires_at < NOW() THEN
    RETURN jsonb_build_object('valid', false, 'message', 'This code has expired.');
  END IF;
  IF v_row.max_uses IS NOT NULL AND v_row.current_uses >= v_row.max_uses THEN
    RETURN jsonb_build_object('valid', false, 'message', 'This code has reached its usage limit.');
  END IF;
  IF COALESCE(p_subtotal, 0) < v_row.min_subtotal THEN
    RETURN jsonb_build_object('valid', false,
      'message', 'Order does not meet the minimum for this code.');
  END IF;

  IF v_row.requires_student OR v_row.discount_type = 'student' THEN
    IF v_uid IS NULL THEN
      RETURN jsonb_build_object('valid', false, 'message', 'Sign in to use this code.');
    END IF;
    SELECT student_verified INTO v_student FROM profiles WHERE id = v_uid;
    IF NOT COALESCE(v_student, false) THEN
      RETURN jsonb_build_object('valid', false, 'requires_student', true,
        'message', 'This code is for verified students only.');
    END IF;
  END IF;

  IF v_row.discount_type = 'fixed' THEN
    v_amount := LEAST(v_row.discount_value, COALESCE(p_subtotal, 0));
  ELSE
    -- percentage or student (both are % based)
    v_amount := round(COALESCE(p_subtotal, 0) * (v_row.discount_value / 100.0));
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'code', v_row.code,
    'discount_type', v_row.discount_type,
    'discount_value', v_row.discount_value,
    'discount_amount', v_amount,
    'requires_student', v_row.requires_student OR v_row.discount_type = 'student',
    'message', 'Code applied.'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.validate_promo_code(text, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_promo_code(text, numeric) TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.promo_codes TO authenticated;
GRANT ALL ON public.promo_codes TO service_role;
