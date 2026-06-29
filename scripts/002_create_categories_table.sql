-- =====================================================
-- Migration 002: Categories table RLS policies + seed
-- The categories table already exists in Supabase with columns:
--   id, name, slug, description, image_url, is_active, created_at
-- The CREATE TABLE below is a no-op if the table exists.
-- The important parts are the RLS policies and the seed data.
-- =====================================================

CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    description TEXT,
    image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS (safe to run even if already enabled)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Public read (only active categories)
CREATE POLICY "Public categories read"
ON public.categories
FOR SELECT
USING (is_active = true);

-- Admins can insert
CREATE POLICY "Admins insert categories"
ON public.categories
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

-- Admins can update
CREATE POLICY "Admins update categories"
ON public.categories
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

-- Admins can delete
CREATE POLICY "Admins delete categories"
ON public.categories
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

-- Seed default categories matching the frontend filter options.
-- ON CONFLICT on slug means re-running this migration is safe.
INSERT INTO public.categories (name, slug, is_active) VALUES
    ('Oversized',    'oversized',    true),
    ('Classic',      'classic',      true),
    ('Graphic',      'graphic',      true),
    ('Hoodies',      'hoodies',      true),
    ('Sweatshirts',  'sweatshirts',  true),
    ('Custom',       'custom',       true)
ON CONFLICT (slug) DO NOTHING;
