-- =====================================================
-- Migration 021: Profile address fields + student verification
--
-- Phase 1 (dashboard autofill) + Phase 4 (student verification).
--
--   * profiles: address/contact fields for checkout autofill + the
--     account-based student-verification flags.
--   * student_email_domains: admin-managed allow-list of university domains.
--   * student_verification_tokens: issued tokens (server writes, definer consumes).
--   * A BEFORE UPDATE trigger locks privileged columns (role, student_*,
--     total_*) against direct client writes — they may only change via the
--     service-role admin client or SECURITY DEFINER functions. This also closes
--     the pre-existing hole where the broad "update own profile" policy let a
--     client edit total_spent / total_orders.
--
-- Additive + idempotent. Safe to run more than once. Run AFTER scripts/020.
-- =====================================================

-- ---------- profiles: address + student columns ----------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS address_line1 TEXT,
  ADD COLUMN IF NOT EXISTS address_line2 TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS postal_code TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Pakistan',
  ADD COLUMN IF NOT EXISTS student_verified BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS student_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS student_email TEXT;

-- ---------- allowed university domains (admin managed) ----------
CREATE TABLE IF NOT EXISTS public.student_email_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL UNIQUE,          -- e.g. 'nu.edu.pk' (no @)
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.student_email_domains ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read active student domains" ON public.student_email_domains;
CREATE POLICY "Public read active student domains"
ON public.student_email_domains FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins manage student domains" ON public.student_email_domains;
CREATE POLICY "Admins manage student domains"
ON public.student_email_domains FOR ALL
USING (public.get_my_role() = 'admin')
WITH CHECK (public.get_my_role() = 'admin');

-- ---------- verification tokens (server writes, definer consumes) ----------
CREATE TABLE IF NOT EXISTS public.student_verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_tokens_profile ON public.student_verification_tokens(profile_id);

ALTER TABLE public.student_verification_tokens ENABLE ROW LEVEL SECURITY;

-- Owners may read their own token rows; all writes go through the service role
-- / SECURITY DEFINER functions (no client INSERT/UPDATE policy on purpose).
DROP POLICY IF EXISTS "Users read own verification tokens" ON public.student_verification_tokens;
CREATE POLICY "Users read own verification tokens"
ON public.student_verification_tokens FOR SELECT
USING (profile_id = auth.uid());

-- ---------- protect privileged profile columns ----------
CREATE OR REPLACE FUNCTION public.protect_profile_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Direct end-user sessions (PostgREST sets role to authenticated/anon) may
  -- never change these. Service role + SECURITY DEFINER functions (which run as
  -- the table owner) bypass this and remain able to update them.
  IF current_user IN ('authenticated', 'anon') THEN
    NEW.role                := OLD.role;
    NEW.student_verified    := OLD.student_verified;
    NEW.student_verified_at := OLD.student_verified_at;
    NEW.student_email       := OLD.student_email;
    NEW.total_orders        := OLD.total_orders;
    NEW.total_spent         := OLD.total_spent;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_columns ON public.profiles;
CREATE TRIGGER trg_protect_profile_columns
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_profile_columns();

-- ---------- consume a verification token (definer) ----------
-- Validates the token for the current user and, if valid + unexpired + unused,
-- flips the student flags. Verification only ever happens once.
CREATE OR REPLACE FUNCTION public.verify_student_token(p_token TEXT)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_row student_verification_tokens%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'NOT_AUTHENTICATED');
  END IF;

  SELECT * INTO v_row
  FROM student_verification_tokens
  WHERE token = p_token AND profile_id = v_uid
  ORDER BY created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'INVALID_TOKEN');
  END IF;
  IF v_row.consumed_at IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'ALREADY_USED');
  END IF;
  IF v_row.expires_at < NOW() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'EXPIRED');
  END IF;

  UPDATE student_verification_tokens SET consumed_at = NOW() WHERE id = v_row.id;

  UPDATE profiles
     SET student_verified = true,
         student_verified_at = NOW(),
         student_email = v_row.email
   WHERE id = v_uid;

  RETURN jsonb_build_object('ok', true, 'student_email', v_row.email);
END;
$$;

REVOKE ALL ON FUNCTION public.verify_student_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_student_token(text) TO authenticated;

-- ---------- grants ----------
GRANT SELECT ON public.student_email_domains TO anon, authenticated;
GRANT ALL ON public.student_email_domains TO service_role;
GRANT SELECT ON public.student_verification_tokens TO authenticated;
GRANT ALL ON public.student_verification_tokens TO service_role;
