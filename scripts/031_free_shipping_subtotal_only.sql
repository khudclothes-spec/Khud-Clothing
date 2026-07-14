-- =====================================================
-- Migration 031: free shipping on orders over Rs 3499 (subtotal only)
--
-- process_checkout v6 — identical to v5 (030) except free shipping no longer
-- requires an item count: any order with a pre-promo subtotal strictly over
-- Rs 3499 ships free. Mirrors lib/pricing.js (FREE_SHIPPING_OVER = 3499).
-- Additive + idempotent (CREATE OR REPLACE).
-- =====================================================

CREATE OR REPLACE FUNCTION public.process_checkout(
    p_items    jsonb,
    p_customer jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid          uuid := auth.uid();
    v_email        text;
    v_order_id     uuid;
    v_order_number text;
    v_subtotal     numeric(10,2) := 0;
    v_item_count   integer := 0;
    v_item         record;
    v_stock        integer;
    v_price        numeric(10,2);
    v_discount     integer;
    v_soldout      boolean;
    v_eff          numeric(10,2);
    v_product_id   uuid;
    v_color        text;
    v_size         text;
    v_name         text;
    v_payment      text;
    v_online_disc  numeric(10,2) := 0;
    v_shipping     numeric(10,2) := 0;
    v_tax          numeric(10,2) := 0;    -- tax removed; column kept at 0
    v_total        numeric(10,2) := 0;
    v_promo_in     text;
    v_promo        promo_codes%ROWTYPE;
    v_promo_code   text := NULL;
    v_promo_disc   numeric(10,2) := 0;
    v_after_promo  numeric(10,2) := 0;
    v_student      boolean := false;
    v_status       text;
    v_is_cod       boolean;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'NOT_AUTHENTICATED' USING ERRCODE = 'P0001';
    END IF;
    IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'EMPTY_CART' USING ERRCODE = 'P0001';
    END IF;

    v_payment := lower(COALESCE(p_customer->>'payment_method', 'cod'));
    IF v_payment NOT IN ('cod', 'online') THEN v_payment := 'cod'; END IF;
    v_is_cod := (v_payment = 'cod');

    SELECT email INTO v_email FROM auth.users WHERE id = v_uid;

    -- ---- Phase 1: lock variants, verify stock, sum effective price ----
    FOR v_item IN
        SELECT (value->>'variant_id')::uuid AS variant_id,
               (value->>'quantity')::int    AS quantity
        FROM jsonb_array_elements(p_items) ORDER BY 1
    LOOP
        IF v_item.quantity IS NULL OR v_item.quantity <= 0 THEN
            RAISE EXCEPTION 'INVALID_QUANTITY' USING ERRCODE = 'P0001';
        END IF;

        SELECT pv.stock_quantity, pv.product_id, pv.color, pv.size,
               p.price, p.name, COALESCE(p.discount_percentage, 0), COALESCE(p.is_sold_out, false)
          INTO v_stock, v_product_id, v_color, v_size,
               v_price, v_name, v_discount, v_soldout
          FROM product_variants pv
          JOIN products p ON p.id = pv.product_id
         WHERE pv.id = v_item.variant_id
         FOR UPDATE OF pv;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'VARIANT_NOT_FOUND|%', v_item.variant_id USING ERRCODE = 'P0001';
        END IF;
        IF v_soldout THEN
            RAISE EXCEPTION 'SOLD_OUT|%', v_name USING ERRCODE = 'P0001';
        END IF;
        IF v_stock < v_item.quantity THEN
            RAISE EXCEPTION 'OUT_OF_STOCK|%|%|%|%|%',
                v_name, v_color, v_size, v_stock, v_item.quantity USING ERRCODE = 'P0001';
        END IF;

        IF v_discount > 0 THEN
            v_eff := round(v_price * (1 - v_discount::numeric / 100) / 100) * 100 - 1;
            IF v_eff < 0 THEN v_eff := 0; END IF;
        ELSE
            v_eff := v_price;
        END IF;

        v_subtotal   := v_subtotal + (v_eff * v_item.quantity);
        v_item_count := v_item_count + v_item.quantity;
    END LOOP;

    -- ---- Promo code ----
    v_promo_in := upper(trim(COALESCE(p_customer->>'promo_code', '')));
    IF v_promo_in <> '' THEN
        SELECT * INTO v_promo FROM promo_codes WHERE code = v_promo_in FOR UPDATE;
        IF FOUND
           AND v_promo.is_enabled
           AND (v_promo.expires_at IS NULL OR v_promo.expires_at >= NOW())
           AND (v_promo.max_uses IS NULL OR v_promo.current_uses < v_promo.max_uses)
           AND v_subtotal >= v_promo.min_subtotal
        THEN
            IF v_promo.requires_student OR v_promo.discount_type = 'student' THEN
                SELECT student_verified INTO v_student FROM profiles WHERE id = v_uid;
            ELSE
                v_student := true;
            END IF;

            IF v_student THEN
                IF v_promo.discount_type = 'fixed' THEN
                    v_promo_disc := LEAST(v_promo.discount_value, v_subtotal);
                ELSE
                    v_promo_disc := round(v_subtotal * (v_promo.discount_value / 100.0));
                END IF;
                v_promo_code := v_promo.code;
                UPDATE promo_codes SET current_uses = current_uses + 1 WHERE id = v_promo.id;
            END IF;
        END IF;
    END IF;

    -- ---- Totals (free shipping when the pre-promo subtotal is over 3499) ----
    v_after_promo := v_subtotal - v_promo_disc;
    IF v_after_promo < 0 THEN v_after_promo := 0; END IF;
    IF v_payment = 'online' THEN
        v_online_disc := round(v_after_promo * 0.05);
    END IF;
    v_shipping := CASE WHEN v_subtotal > 3499 THEN 0 ELSE 230 END;
    v_total := v_after_promo - v_online_disc + v_shipping;   -- no tax

    v_status := CASE WHEN v_is_cod THEN 'confirmed' ELSE 'pending_payment' END;

    -- ---- Create the order (with snapshots) ----
    v_order_number := 'KHD-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

    INSERT INTO orders (
        profile_id, order_number, status,
        customer_name, customer_phone, customer_email,
        shipping_address, city, shipping_state, shipping_postal_code, shipping_country, shipping_method,
        billing_name, billing_phone, billing_address, billing_city, billing_state, billing_postal_code, billing_country,
        notes,
        subtotal, promo_code, promo_discount, discount_amount, shipping_cost, tax, payment_method, total_amount,
        stock_committed
    )
    VALUES (
        v_uid, v_order_number, v_status,
        COALESCE(p_customer->>'full_name', ''),
        COALESCE(p_customer->>'phone', ''),
        COALESCE(v_email, p_customer->>'email', ''),
        COALESCE(p_customer->>'address', ''),
        COALESCE(p_customer->>'city', ''),
        p_customer->>'state', p_customer->>'postal_code', COALESCE(p_customer->>'country', 'Pakistan'),
        COALESCE(p_customer->>'shipping_method', 'standard'),
        COALESCE(p_customer->>'billing_name', p_customer->>'full_name', ''),
        COALESCE(p_customer->>'billing_phone', p_customer->>'phone'),
        COALESCE(p_customer->>'billing_address', p_customer->>'address'),
        COALESCE(p_customer->>'billing_city', p_customer->>'city'),
        COALESCE(p_customer->>'billing_state', p_customer->>'state'),
        COALESCE(p_customer->>'billing_postal_code', p_customer->>'postal_code'),
        COALESCE(p_customer->>'billing_country', p_customer->>'country', 'Pakistan'),
        p_customer->>'notes',
        v_subtotal, v_promo_code, v_promo_disc, v_online_disc, v_shipping, v_tax, v_payment, v_total,
        v_is_cod
    )
    RETURNING id INTO v_order_id;

    -- ---- Line items (+ decrement stock for COD only) ----
    FOR v_item IN
        SELECT (value->>'variant_id')::uuid AS variant_id,
               (value->>'quantity')::int    AS quantity
        FROM jsonb_array_elements(p_items) ORDER BY 1
    LOOP
        SELECT pv.product_id, pv.color, pv.size, p.price, COALESCE(p.discount_percentage, 0)
          INTO v_product_id, v_color, v_size, v_price, v_discount
          FROM product_variants pv JOIN products p ON p.id = pv.product_id
         WHERE pv.id = v_item.variant_id;

        IF v_discount > 0 THEN
            v_eff := round(v_price * (1 - v_discount::numeric / 100) / 100) * 100 - 1;
            IF v_eff < 0 THEN v_eff := 0; END IF;
        ELSE
            v_eff := v_price;
        END IF;

        IF v_is_cod THEN
            UPDATE product_variants SET stock_quantity = stock_quantity - v_item.quantity
             WHERE id = v_item.variant_id;
        END IF;

        INSERT INTO order_items (order_id, product_id, variant_id, quantity, unit_price, size, color)
        VALUES (v_order_id, v_product_id, v_item.variant_id, v_item.quantity, v_eff, v_size, v_color);
    END LOOP;

    -- ---- Payment verification row for online (bank transfer) orders ----
    IF v_payment = 'online' THEN
        INSERT INTO payment_verifications (order_id, payment_method, payment_status)
        VALUES (v_order_id, 'online', 'pending')
        ON CONFLICT (order_id) DO NOTHING;
    END IF;

    RETURN jsonb_build_object(
        'order_id',      v_order_id,
        'order_number',  v_order_number,
        'status',        v_status,
        'payment_method', v_payment,
        'subtotal',      v_subtotal,
        'promo_discount', v_promo_disc,
        'discount',      v_online_disc,
        'shipping',      v_shipping,
        'tax',           v_tax,
        'total',         v_total
    );

EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'checkout.rollback uid=% sqlstate=% message=%', v_uid, SQLSTATE, SQLERRM;
        RAISE;
END;
$$;

REVOKE ALL ON FUNCTION public.process_checkout(jsonb, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.process_checkout(jsonb, jsonb) TO authenticated;
