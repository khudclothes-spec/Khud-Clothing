-- =====================================================
-- Migration 007: Admin moderation policies for reviews
-- Admins need to approve and delete reviews.
-- The base schema only has public SELECT (approved=true)
-- and authenticated INSERT policies.
-- =====================================================

-- admins can read all reviews (including unapproved)
CREATE POLICY "Admins read all reviews"
ON public.reviews
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
        AND p.role = 'admin'
    )
);

-- admins can update reviews (approve/reject)
CREATE POLICY "Admins update reviews"
ON public.reviews
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

-- admins can delete reviews
CREATE POLICY "Admins delete reviews"
ON public.reviews
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
