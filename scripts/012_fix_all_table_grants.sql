-- =====================================================
-- Migration 012: Grant table privileges on ALL public tables
--
-- Migration 011 only granted on profiles + categories, and its
-- ALTER DEFAULT PRIVILEGES only affects FUTURE tables — so the
-- already-existing tables (products, product_media, orders,
-- order_items, product_variants, reviews, custom_orders) still
-- had no grants, causing "permission denied for table products"
-- (42501) for the same reason.
--
-- This grants table-level access to every table in the public
-- schema in one shot. RLS still controls which ROWS each role
-- can read/modify — these grants only control table access.
-- Idempotent and safe to re-run; supersedes migration 011.
-- =====================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Read access for anonymous visitors (RLS still filters rows,
-- e.g. only active products / approved reviews are returned)
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Full DML for signed-in users (RLS restricts to their own rows
-- or admin-gated writes)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- Service role bypasses RLS entirely (server-only)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- Sequences (harmless if all PKs are UUID; needed for any serial cols)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- Re-assert default privileges so any future tables are auto-granted
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT USAGE, SELECT ON SEQUENCES TO anon, authenticated, service_role;
