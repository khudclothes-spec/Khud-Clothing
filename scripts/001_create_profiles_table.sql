-- =====================================================
-- Migration 001: Profiles table RLS policies
-- The profiles table already exists in Supabase with columns:
--   id, role, full_name, phone, total_orders, total_spent,
--   is_active, created_at, updated_at
-- The CREATE TABLE below is a no-op if the table exists.
-- =====================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'customer'
        CHECK (role IN ('admin', 'customer')),
    full_name TEXT,
    phone TEXT,
    total_orders INTEGER NOT NULL DEFAULT 0,
    total_spent NUMERIC(10,2) NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Helper: reads current user's role without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own row
CREATE POLICY "Users read own profile"
ON public.profiles
FOR SELECT
USING (id = auth.uid());

-- Users can update their own row but cannot change their role
CREATE POLICY "Users update own profile"
ON public.profiles
FOR UPDATE
USING (id = auth.uid())
WITH CHECK (
    id = auth.uid()
    AND role = public.get_my_role()
);

-- Admins can read every row (uses function — no recursion)
CREATE POLICY "Admins read all profiles"
ON public.profiles
FOR SELECT
USING (public.get_my_role() = 'admin');
