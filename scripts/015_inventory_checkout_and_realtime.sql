-- =====================================================
-- Migration 015: Concurrency-safe checkout + realtime stock
--
-- Part A — process_checkout(p_items, p_customer):
--   An ACID, row-locking RPC that verifies stock, decrements it, and
--   creates the order + order_items inside a SINGLE transaction (a
--   plpgsql function runs in one implicit transaction; any raised
--   exception rolls the whole thing back). FOR UPDATE serialises
--   concurrent buyers of the same variant — the loser receives
--   OUT_OF_STOCK and its transaction rolls back, so stock can never
--   be oversold or go negative. Stock is reserved ONLY here, at
--   checkout — never when an item is added to the cart.
--
-- Part B — Adds product_variants to the supabase_realtime publication
--   so every stock change (this RPC's decrement AND admin edits) is
--   broadcast to subscribed clients over websockets automatically.
--   No manual emit code is required: the DB change IS the event.
-- =====================================================


-- =====================================================
-- Part A — Checkout transaction RPC
-- =====================================================

CREATE OR REPLACE FUNCTION public.process_checkout(
    p_items    jsonb,   -- [{ "variant_id": uuid, "quantity": int }, ...]
    p_customer jsonb    -- { full_name, phone, address, city, notes }
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
    v_item         record;
    v_stock        integer;
    v_price        numeric(10,2);
    v_product_id   uuid;
    v_color        text;
    v_size         text;
    v_name         text;
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

    -- Authoritative email comes from the auth record, never the client.
    SELECT email INTO v_email FROM auth.users WHERE id = v_uid;

    -- ---- Phase 1: lock each variant row, verify stock, price from DB ----
    -- Deterministic lock order (ORDER BY variant_id) avoids deadlocks
    -- between concurrent checkouts that share variants. The cart is never
    -- trusted: quantity is validated and unit price is read from the DB.
    FOR v_item IN
        SELECT (value->>'variant_id')::uuid AS variant_id,
               (value->>'quantity')::int    AS quantity
        FROM jsonb_array_elements(p_items)
        ORDER BY 1
    LOOP
        IF v_item.quantity IS NULL OR v_item.quantity <= 0 THEN
            RAISE EXCEPTION 'INVALID_QUANTITY' USING ERRCODE = 'P0001';
        END IF;

        SELECT pv.stock_quantity, pv.product_id, pv.color, pv.size, p.price, p.name
          INTO v_stock, v_product_id, v_color, v_size, v_price, v_name
          FROM product_variants pv
          JOIN products p ON p.id = pv.product_id
         WHERE pv.id = v_item.variant_id
         FOR UPDATE OF pv;            -- row-level lock held until commit/rollback

        IF NOT FOUND THEN
            RAISE EXCEPTION 'VARIANT_NOT_FOUND|%', v_item.variant_id USING ERRCODE = 'P0001';
        END IF;

        IF v_stock < v_item.quantity THEN
            RAISE LOG 'checkout.insufficient_stock uid=% variant=% available=% requested=%',
                v_uid, v_item.variant_id, v_stock, v_item.quantity;
            -- Pipe-delimited so the client can show a precise message.
            RAISE EXCEPTION 'OUT_OF_STOCK|%|%|%|%|%',
                v_name, v_color, v_size, v_stock, v_item.quantity
                USING ERRCODE = 'P0001';
        END IF;

        v_subtotal := v_subtotal + (v_price * v_item.quantity);
    END LOOP;

    -- ---- Phase 2: create the order ----
    v_order_number := 'KHD-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

    INSERT INTO orders (
        profile_id, order_number, status,
        customer_name, customer_phone, customer_email,
        shipping_address, city, notes,
        subtotal, shipping_cost, total_amount
    )
    VALUES (
        v_uid, v_order_number, 'pending',
        COALESCE(p_customer->>'full_name', ''),
        COALESCE(p_customer->>'phone', ''),
        COALESCE(v_email, p_customer->>'email', ''),
        COALESCE(p_customer->>'address', ''),
        COALESCE(p_customer->>'city', ''),
        p_customer->>'notes',
        v_subtotal, 0, v_subtotal
    )
    RETURNING id INTO v_order_id;

    -- ---- Phase 2b: decrement stock + write line items ----
    -- Variant rows are already locked from Phase 1, so these updates are safe.
    FOR v_item IN
        SELECT (value->>'variant_id')::uuid AS variant_id,
               (value->>'quantity')::int    AS quantity
        FROM jsonb_array_elements(p_items)
        ORDER BY 1
    LOOP
        SELECT pv.product_id, pv.color, pv.size, p.price
          INTO v_product_id, v_color, v_size, v_price
          FROM product_variants pv
          JOIN products p ON p.id = pv.product_id
         WHERE pv.id = v_item.variant_id;

        UPDATE product_variants
           SET stock_quantity = stock_quantity - v_item.quantity
         WHERE id = v_item.variant_id;

        INSERT INTO order_items (
            order_id, product_id, variant_id, quantity, unit_price, size, color
        )
        VALUES (
            v_order_id, v_product_id, v_item.variant_id, v_item.quantity, v_price, v_size, v_color
        );
    END LOOP;

    RAISE LOG 'checkout.commit uid=% order=% number=% total=%',
        v_uid, v_order_id, v_order_number, v_subtotal;

    RETURN jsonb_build_object(
        'order_id',     v_order_id,
        'order_number', v_order_number,
        'total',        v_subtotal
    );

EXCEPTION
    WHEN OTHERS THEN
        -- Any error (including OUT_OF_STOCK / concurrent-purchase conflict)
        -- aborts the transaction → full rollback, no partial order. The
        -- original error is re-raised so the client gets the exact reason.
        RAISE LOG 'checkout.rollback uid=% sqlstate=% message=%', v_uid, SQLSTATE, SQLERRM;
        RAISE;
END;
$$;

-- Only signed-in users may run a checkout.
REVOKE ALL ON FUNCTION public.process_checkout(jsonb, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.process_checkout(jsonb, jsonb) TO authenticated;


-- =====================================================
-- Part B — Realtime broadcasts on stock changes
-- =====================================================

-- REPLICA IDENTITY FULL makes UPDATE/DELETE payloads include the full
-- old row, so subscribers can filter reliably (e.g. by product_id).
ALTER TABLE public.product_variants REPLICA IDENTITY FULL;

-- Add product_variants to the realtime publication (idempotent, and
-- creates the publication if a fresh project somehow lacks it).
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables
             WHERE pubname = 'supabase_realtime'
               AND schemaname = 'public'
               AND tablename = 'product_variants'
        ) THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.product_variants;
        END IF;
    ELSE
        CREATE PUBLICATION supabase_realtime FOR TABLE public.product_variants;
    END IF;
END $$;
