-- =====================================================
-- Migration 016: Product customization module
--
-- Adds:
--   1. categories.is_customizable  — which categories appear in the studio
--   2. categories.mockup_key       — which /public/mockups/<key> set to use
--   3. categories admin read-all policy (so admins can manage hidden ones)
--   4. design_templates table      — reusable artwork shown under "Choose Design"
--
-- Idempotent: safe to run more than once.
-- How to run: open the Supabase SQL editor (or psql) for your project and
-- execute this whole file. It does not drop or rewrite existing data.
-- =====================================================

-- ---------- 1 + 2: customizable categories --------------------------------
ALTER TABLE public.categories
    ADD COLUMN IF NOT EXISTS is_customizable BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.categories
    ADD COLUMN IF NOT EXISTS mockup_key TEXT;   -- 'classic' | 'oversized' | NULL

-- ---------- 3: let admins SELECT every category ---------------------------
-- The base "Public categories read" policy only exposes is_active = true rows.
-- Admins need to see (and toggle) every category in the customization manager.
-- get_my_role() (migration 010) reads the role without RLS recursion.
DROP POLICY IF EXISTS "Admins read all categories" ON public.categories;
CREATE POLICY "Admins read all categories"
ON public.categories
FOR SELECT
USING (public.get_my_role() = 'admin');

-- ---------- 4: design templates -------------------------------------------
CREATE TABLE IF NOT EXISTS public.design_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    storage_path TEXT NOT NULL,          -- path inside the 'product-images' bucket
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_design_templates_active
ON public.design_templates(is_active);

ALTER TABLE public.design_templates ENABLE ROW LEVEL SECURITY;

-- Public can read only enabled designs (shown on the customer studio).
DROP POLICY IF EXISTS "Public read active designs" ON public.design_templates;
CREATE POLICY "Public read active designs"
ON public.design_templates
FOR SELECT
USING (is_active = true);

-- Admins can read every design (incl. disabled) to manage them.
DROP POLICY IF EXISTS "Admins read all designs" ON public.design_templates;
CREATE POLICY "Admins read all designs"
ON public.design_templates
FOR SELECT
USING (public.get_my_role() = 'admin');

-- Admins manage designs.
DROP POLICY IF EXISTS "Admins insert designs" ON public.design_templates;
CREATE POLICY "Admins insert designs"
ON public.design_templates
FOR INSERT
TO authenticated
WITH CHECK (public.get_my_role() = 'admin');

DROP POLICY IF EXISTS "Admins update designs" ON public.design_templates;
CREATE POLICY "Admins update designs"
ON public.design_templates
FOR UPDATE
TO authenticated
USING (public.get_my_role() = 'admin');

DROP POLICY IF EXISTS "Admins delete designs" ON public.design_templates;
CREATE POLICY "Admins delete designs"
ON public.design_templates
FOR DELETE
TO authenticated
USING (public.get_my_role() = 'admin');

-- Table grants (migration 012 already set default privileges for new tables,
-- but assert them explicitly so this migration is self-contained).
GRANT SELECT ON public.design_templates TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.design_templates TO authenticated;
GRANT ALL ON public.design_templates TO service_role;

-- Design images live in the existing public 'product-images' bucket under the
-- 'designs/' prefix. Its storage policies (base schema) already allow public
-- read + admin write, so no new storage policy is required.

-- ---------- Seed: enable the two tee categories ---------------------------
-- Matches the seed slugs from migration 002. Re-running is harmless.
UPDATE public.categories SET is_customizable = true, mockup_key = 'oversized'
WHERE slug = 'oversized' OR name ILIKE '%oversized%';

UPDATE public.categories SET is_customizable = true, mockup_key = 'classic'
WHERE slug = 'classic' OR (name ILIKE '%classic%' AND name ILIKE '%t%shirt%');
