-- =====================================================
-- Migration 005: Add INSERT policy to order_items
-- The base schema only has a SELECT policy for order_items.
-- Without an INSERT policy, authenticated users cannot
-- insert order items when placing orders (RLS blocks it).
-- =====================================================

CREATE POLICY "Users insert own order items"
ON public.order_items
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.orders o
        WHERE o.id = order_items.order_id
        AND o.profile_id = auth.uid()
    )
);
