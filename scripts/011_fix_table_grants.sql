-- =====================================================
-- Migration 011: Fix "permission denied for table" (42501)
--
-- Root cause: RLS policies only run AFTER Postgres checks
-- table-level GRANT privileges. When a table is created
-- (or re-created) without Supabase's default privileges,
-- the anon/authenticated roles have NO grant on it, so
-- every query fails with 42501 — before RLS is evaluated.
--
-- This commonly happens when profiles/categories were
-- dropped and re-created with new columns.
--
-- Fix: explicitly grant DML to the Supabase roles. RLS
-- still controls which ROWS each role can see/modify;
-- these grants only control table-level access. Safe and
-- idempotent — re-running causes no harm.
-- =====================================================

-- Make sure the roles can use the schema at all
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- profiles
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;

-- categories
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;

-- Re-assert default privileges so any FUTURE tables created
-- by the postgres role are auto-granted (prevents this class
-- of error from recurring).
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT ALL ON TABLES TO service_role;
