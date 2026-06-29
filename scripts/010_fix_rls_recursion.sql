-- =====================================================
-- Migration 010: Fix infinite recursion in profiles RLS
--
-- Root cause: policies ON the profiles table that do
--   SELECT FROM profiles WHERE id = auth.uid()
-- cause Postgres to re-evaluate the same policy, looping
-- forever (error code 42P17).
--
-- Fix: a SECURITY DEFINER function that reads the role
-- for the current user without triggering RLS, because
-- the function runs as its owner (bypasses row policies).
-- =====================================================

-- Step 1: Create the helper function
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Step 2: Drop the two recursive policies
DROP POLICY IF EXISTS "Admins read all profiles"  ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile"  ON public.profiles;

-- Step 3: Re-create them using the function (no recursion)

CREATE POLICY "Admins read all profiles"
ON public.profiles
FOR SELECT
USING (public.get_my_role() = 'admin');

CREATE POLICY "Users update own profile"
ON public.profiles
FOR UPDATE
USING (id = auth.uid())
WITH CHECK (
    id = auth.uid()
    -- Prevent role escalation: the user cannot change their own role
    AND role = public.get_my_role()
);
