-- =====================================================
-- Migration 008: Admin access and user update policies
-- for custom_orders
-- The base schema only has user INSERT and SELECT.
-- =====================================================

-- admins can read all custom orders
CREATE POLICY "Admins read all custom orders"
ON public.custom_orders
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
        AND p.role = 'admin'
    )
);

-- admins can update custom orders (e.g. set status, add notes)
CREATE POLICY "Admins update custom orders"
ON public.custom_orders
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

-- admins can delete custom orders
CREATE POLICY "Admins delete custom orders"
ON public.custom_orders
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
        AND p.role = 'admin'
    )
);
