-- =====================================================
-- Migration 006: Admin access policies for orders
-- and order_items
-- =====================================================

-- orders: admin SELECT (all orders)
CREATE POLICY "Admins read all orders"
ON public.orders
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
        AND p.role = 'admin'
    )
);

-- orders: admin UPDATE (e.g. change status)
CREATE POLICY "Admins update orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
        AND p.role = 'admin'
    )
);

-- order_items: admin SELECT (all order items)
CREATE POLICY "Admins read all order items"
ON public.order_items
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
        AND p.role = 'admin'
    )
);
