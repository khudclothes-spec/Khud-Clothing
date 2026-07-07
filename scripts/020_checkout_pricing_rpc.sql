-- =====================================================
-- Migration 020: process_checkout — discounts, sold-out, shipping, payment
--
-- Extends the concurrency-safe checkout RPC (migration 015) with the pricing
-- rules. The maths here MIRRORS lib/pricing.js exactly so the DB charges what
-- the UI shows:
--   * Per-product discount:  effective = round(price*(1-pct/100)/100)*100 - 1
--                            (charm rounding to a …99 ending)  [pct > 0 only]
--   * Sold-out guard:        products with is_sold_out cannot be purchased.
--   * Free shipping:         Rs 0 when the bag holds 3+ items, else Rs 230.
--   * Online payment:        5% off the (already per-product discounted)
--                            subtotal. COD gets no extra discount.
--
-- payment_method is passed inside p_customer ('cod' | 'online') so the function
-- signature — and its grant — stay unchanged. Row-locking / rollback behaviour
-- from migration 015 is preserved.
-- =====================================================

CREATE OR REPLACE FUNCTION public.process_checkout(
    p_items    jsonb,   -- [{ "variant_id": uuid, "quantity": int }, ...]
    p_customer jsonb    -- { full_name, phone, address, city, notes, payment_method }
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
    v_total        numeric(10,2) := 0;
BEGIN
    RAISE LOG 'checkout.start uid=% items=%', v_uid, p_items;

    -- ---- Guards ----
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'NOT_AUTHENTICATED' USING ERRCODE = 'P0001';
    END IF;

    IF p_items IS NULL
       OR jsonb_typeof(p_items) <> 'array'
       OR jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'EMPTY_CART' USING ERRCODE = 'P0001';
    END IF;

    -- Normalise the payment method (defaults to COD).
    v_payment := lower(COALESCE(p_customer->>'payment_method', 'cod'));
    IF v_payment NOT IN ('cod', 'online') THEN
        v_payment := 'cod';
    END IF;

    -- Authoritative email comes from the auth record, never the client.
    SELECT email INTO v_email FROM auth.users WHERE id = v_uid;

    -- ---- Phase 1: lock each variant row, verify stock, price from DB ----
    FOR v_item IN
        SELECT (value->>'variant_id')::uuid AS variant_id,
               (value->>'quantity')::int    AS quantity
        FROM jsonb_array_elements(p_items)
        ORDER BY 1
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
         FOR UPDATE OF pv;            -- row-level lock held until commit/rollback

        IF NOT FOUND THEN
            RAISE EXCEPTION 'VARIANT_NOT_FOUND|%', v_item.variant_id USING ERRCODE = 'P0001';
        END IF;

        -- Sold-out products can never be purchased.
        IF v_soldout THEN
            RAISE EXCEPTION 'SOLD_OUT|%', v_name USING ERRCODE = 'P0001';
        END IF;

        IF v_stock < v_item.quantity THEN
            RAISE LOG 'checkout.insufficient_stock uid=% variant=% available=% requested=%',
                v_uid, v_item.variant_id, v_stock, v_item.quantity;
            RAISE EXCEPTION 'OUT_OF_STOCK|%|%|%|%|%',
                v_name, v_color, v_size, v_stock, v_item.quantity
                USING ERRCODE = 'P0001';
        END IF;

        -- Effective (charm-rounded) selling price for this product.
        IF v_discount > 0 THEN
            v_eff := round(v_price * (1 - v_discount::numeric / 100) / 100) * 100 - 1;
            IF v_eff < 0 THEN v_eff := 0; END IF;
        ELSE
            v_eff := v_price;
        END IF;

        v_subtotal   := v_subtotal + (v_eff * v_item.quantity);
        v_item_count := v_item_count + v_item.quantity;
    END LOOP;

    -- ---- Pricing: online discount + shipping + grand total ----
    IF v_payment = 'online' THEN
        v_online_disc := round(v_subtotal * 0.05);
    END IF;
    IF v_item_count >= 3 THEN
        v_shipping := 0;
    ELSE
        v_shipping := 230;
    END IF;
    v_total := v_subtotal - v_online_disc + v_shipping;

    -- ---- Phase 2: create the order ----
    v_order_number := 'KHD-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

    INSERT INTO orders (
        profile_id, order_number, status,
        customer_name, customer_phone, customer_email,
        shipping_address, city, notes,
        subtotal, shipping_cost, discount_amount, payment_method, total_amount
    )
    VALUES (
        v_uid, v_order_number, 'pending',
        COALESCE(p_customer->>'full_name', ''),
        COALESCE(p_customer->>'phone', ''),
        COALESCE(v_email, p_customer->>'email', ''),
        COALESCE(p_customer->>'address', ''),
        COALESCE(p_customer->>'city', ''),
        p_customer->>'notes',
        v_subtotal, v_shipping, v_online_disc, v_payment, v_total
    )
    RETURNING id INTO v_order_id;

    -- ---- Phase 2b: decrement stock + write line items (effective prices) ----
    FOR v_item IN
        SELECT (value->>'variant_id')::uuid AS variant_id,
               (value->>'quantity')::int    AS quantity
        FROM jsonb_array_elements(p_items)
        ORDER BY 1
    LOOP
        SELECT pv.product_id, pv.color, pv.size,
               p.price, COALESCE(p.discount_percentage, 0)
          INTO v_product_id, v_color, v_size, v_price, v_discount
          FROM product_variants pv
          JOIN products p ON p.id = pv.product_id
         WHERE pv.id = v_item.variant_id;

        IF v_discount > 0 THEN
            v_eff := round(v_price * (1 - v_discount::numeric / 100) / 100) * 100 - 1;
            IF v_eff < 0 THEN v_eff := 0; END IF;
        ELSE
            v_eff := v_price;
        END IF;

        UPDATE product_variants
           SET stock_quantity = stock_quantity - v_item.quantity
         WHERE id = v_item.variant_id;

        INSERT INTO order_items (
            order_id, product_id, variant_id, quantity, unit_price, size, color
        )
        VALUES (
            v_order_id, v_product_id, v_item.variant_id, v_item.quantity, v_eff, v_size, v_color
        );
    END LOOP;

    RAISE LOG 'checkout.commit uid=% order=% number=% subtotal=% discount=% shipping=% total=%',
        v_uid, v_order_id, v_order_number, v_subtotal, v_online_disc, v_shipping, v_total;

    RETURN jsonb_build_object(
        'order_id',     v_order_id,
        'order_number', v_order_number,
        'subtotal',     v_subtotal,
        'discount',     v_online_disc,
        'shipping',     v_shipping,
        'total',        v_total
    );

EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'checkout.rollback uid=% sqlstate=% message=%', v_uid, SQLSTATE, SQLERRM;
        RAISE;
END;
$$;

REVOKE ALL ON FUNCTION public.process_checkout(jsonb, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.process_checkout(jsonb, jsonb) TO authenticated;
