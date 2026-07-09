-- =====================================================
-- Migration 026: submit_payment_proof() — customer uploads bank-transfer proof
--
-- Customers cannot UPDATE orders directly (admin-only RLS), so this definer
-- function verifies ownership and, in one step, records the screenshot path on
-- payment_verifications and advances the order to 'pending_verification'.
-- =====================================================

CREATE OR REPLACE FUNCTION public.submit_payment_proof(p_order_id uuid, p_path text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid   uuid := auth.uid();
  v_owner uuid;
  v_status text;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'NOT_AUTHENTICATED');
  END IF;

  SELECT profile_id, status INTO v_owner, v_status FROM orders WHERE id = p_order_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'ORDER_NOT_FOUND');
  END IF;
  IF v_owner <> v_uid THEN
    RETURN jsonb_build_object('ok', false, 'error', 'FORBIDDEN');
  END IF;

  -- Ensure a payment row exists (older/edge orders), then record the proof.
  INSERT INTO payment_verifications (order_id, payment_method, payment_status)
  VALUES (p_order_id, 'online', 'pending')
  ON CONFLICT (order_id) DO NOTHING;

  UPDATE payment_verifications
     SET payment_screenshot_path = p_path,
         uploaded_at = NOW(),
         payment_status = 'submitted'
   WHERE order_id = p_order_id;

  -- Advance the order only from the pre-verification states.
  UPDATE orders
     SET status = 'pending_verification'
   WHERE id = p_order_id
     AND status IN ('pending_payment', 'pending_verification');

  RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE ALL ON FUNCTION public.submit_payment_proof(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_payment_proof(uuid, text) TO authenticated;
