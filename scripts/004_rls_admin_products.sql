-- =====================================================
-- Migration 004: Admin write policies for products,
-- product_variants, and product_media
-- The base schema only defines public SELECT policies.
-- Without these, the admin dashboard cannot create,
-- update, or delete products or media.
-- =====================================================

-- products: admin INSERT
CREATE POLICY "Admins insert products"
ON public.products
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
        AND p.role = 'admin'
    )
);

-- products: admin UPDATE
CREATE POLICY "Admins update products"
ON public.products
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

-- products: admin DELETE
CREATE POLICY "Admins delete products"
ON public.products
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

-- product_variants: admin INSERT
CREATE POLICY "Admins insert product variants"
ON public.product_variants
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
        AND p.role = 'admin'
    )
);

-- product_variants: admin UPDATE
CREATE POLICY "Admins update product variants"
ON public.product_variants
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

-- product_variants: admin DELETE
CREATE POLICY "Admins delete product variants"
ON public.product_variants
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

-- product_media: admin INSERT
CREATE POLICY "Admins insert product media"
ON public.product_media
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
        AND p.role = 'admin'
    )
);

-- product_media: admin UPDATE
CREATE POLICY "Admins update product media"
ON public.product_media
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

-- product_media: admin DELETE
CREATE POLICY "Admins delete product media"
ON public.product_media
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
