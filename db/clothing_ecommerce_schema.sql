-- =====================================================
-- EXTENSIONS
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- Profiles
-- =====================================================
1. profiles

Stores users and their metadata.

Column	Type	Notes
id	UUID	PK, references auth.users(id)
role	TEXT	admin/customer
full_name	TEXT	
phone	TEXT	nullable
total_orders	INTEGER	default 0
total_spent	NUMERIC(10,2)	default 0
is_active	BOOLEAN	default true
created_at	TIMESTAMPTZ	
updated_at	TIMESTAMPTZ	
Role constraint
CHECK (role IN ('admin', 'customer'))

-- =====================================================
-- Categories
-- =====================================================


2. categories

Product categories.

Examples:

Oversized Tees
Hoodies
Sweatshirts
Column	Type
id	UUID
name	TEXT
slug	TEXT UNIQUE
description	TEXT
image_url	TEXT
is_active	BOOLEAN
created_at	TIMESTAMPTZ

-- =====================================================
-- PRODUCTS
-- =====================================================

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    category_id UUID
        REFERENCES categories(id)
        ON DELETE SET NULL,

    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,

    short_description TEXT,
    description TEXT,

    price NUMERIC(10,2) NOT NULL,
    compare_at_price NUMERIC(10,2),

    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    sku TEXT UNIQUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- PRODUCT VARIANTS
-- Stores available sizes/colors + stock
-- =====================================================

CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    product_id UUID NOT NULL
        REFERENCES products(id)
        ON DELETE CASCADE,

    color TEXT NOT NULL,
    size TEXT NOT NULL,

    stock_quantity INTEGER NOT NULL DEFAULT 0
        CHECK (stock_quantity >= 0),

    sku TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(product_id, color, size)
);

-- =====================================================
-- PRODUCT MEDIA
-- =====================================================

CREATE TABLE product_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    product_id UUID NOT NULL
        REFERENCES products(id)
        ON DELETE CASCADE,

    storage_path TEXT NOT NULL,
    alt_text TEXT,

    sort_order INTEGER NOT NULL DEFAULT 0,

    is_primary BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- ORDERS
-- =====================================================

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    profile_id UUID NOT NULL
        REFERENCES profiles(id)
        ON DELETE CASCADE,

    order_number TEXT NOT NULL UNIQUE,

    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (
            status IN (
                'pending',
                'confirmed',
                'processing',
                'shipped',
                'delivered',
                'cancelled'
            )
        ),

    subtotal NUMERIC(10,2) NOT NULL,
    shipping_cost NUMERIC(10,2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(10,2) NOT NULL,

    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT NOT NULL,

    shipping_address TEXT NOT NULL,
    city TEXT NOT NULL,

    notes TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- ORDER ITEMS
-- =====================================================

CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    order_id UUID NOT NULL
        REFERENCES orders(id)
        ON DELETE CASCADE,

    product_id UUID
        REFERENCES products(id)
        ON DELETE SET NULL,

    variant_id UUID
        REFERENCES product_variants(id)
        ON DELETE SET NULL,

    quantity INTEGER NOT NULL CHECK (quantity > 0),

    unit_price NUMERIC(10,2) NOT NULL,

    size TEXT,
    color TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- REVIEWS
-- =====================================================

CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    product_id UUID NOT NULL
        REFERENCES products(id)
        ON DELETE CASCADE,

    profile_id UUID NOT NULL
        REFERENCES profiles(id)
        ON DELETE CASCADE,

    rating INTEGER NOT NULL
        CHECK (rating BETWEEN 1 AND 5),

    comment TEXT,

    approved BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(product_id, profile_id)
);

-- =====================================================
-- CUSTOM ORDERS
-- =====================================================

CREATE TABLE custom_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    profile_id UUID
        REFERENCES profiles(id)
        ON DELETE SET NULL,

    garment_type TEXT NOT NULL,
    size TEXT,
    garment_color TEXT,

    placement TEXT,

    artwork_url TEXT,

    print_notes TEXT,

    estimated_price NUMERIC(10,2),

    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (
            status IN (
                'pending',
                'reviewing',
                'proof_sent',
                'approved',
                'printing',
                'completed',
                'cancelled'
            )
        ),

    admin_notes TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_products_category
ON products(category_id);

CREATE INDEX idx_variants_product
ON product_variants(product_id);

CREATE INDEX idx_product_media_product
ON product_media(product_id);

CREATE INDEX idx_orders_profile
ON orders(profile_id);

CREATE INDEX idx_order_items_order
ON order_items(order_id);

CREATE INDEX idx_reviews_product
ON reviews(product_id);

CREATE INDEX idx_custom_orders_profile
ON custom_orders(profile_id);

-- =====================================================
-- UPDATED_AT FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- UPDATED_AT TRIGGERS
-- =====================================================

CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- AUTO CREATE PROFILE ON SIGNUP
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        full_name
    )
    VALUES (
        NEW.id,
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            ''
        )
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created
ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- ENABLE RLS
-- =====================================================

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_orders ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PUBLIC READ
-- =====================================================

CREATE POLICY "Public products read"
ON products
FOR SELECT
USING (is_active = true);

CREATE POLICY "Public variants read"
ON product_variants
FOR SELECT
USING (true);

CREATE POLICY "Public product media read"
ON product_media
FOR SELECT
USING (true);

-- =====================================================
-- ORDERS
-- =====================================================

CREATE POLICY "Users read own orders"
ON orders
FOR SELECT
USING (profile_id = auth.uid());

CREATE POLICY "Users insert own orders"
ON orders
FOR INSERT
WITH CHECK (profile_id = auth.uid());

-- =====================================================
-- ORDER ITEMS
-- =====================================================

CREATE POLICY "Users read own order items"
ON order_items
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM orders o
        WHERE o.id = order_items.order_id
        AND o.profile_id = auth.uid()
    )
);

-- =====================================================
-- REVIEWS
-- =====================================================

CREATE POLICY "Public approved reviews"
ON reviews
FOR SELECT
USING (approved = true);

CREATE POLICY "Authenticated users insert reviews"
ON reviews
FOR INSERT
TO authenticated
WITH CHECK (profile_id = auth.uid());

-- =====================================================
-- CUSTOM ORDERS
-- =====================================================

CREATE POLICY "Users insert custom orders"
ON custom_orders
FOR INSERT
TO authenticated
WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users read own custom orders"
ON custom_orders
FOR SELECT
USING (profile_id = auth.uid());



-- =====================================================
-- STORAGE BUCKETS
-- =====================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('custom-order-artwork', 'custom-order-artwork', false)
ON CONFLICT (id) DO NOTHING;


-- =====================================================
-- PRODUCT IMAGES POLICIES
-- =====================================================

CREATE POLICY "Public can view product images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "Admins can upload product images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'product-images'
    AND EXISTS (
        SELECT 1
        FROM profiles p
        WHERE p.id = auth.uid()
        AND p.role = 'admin'
    )
);

CREATE POLICY "Admins can update product images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'product-images'
    AND EXISTS (
        SELECT 1
        FROM profiles p
        WHERE p.id = auth.uid()
        AND p.role = 'admin'
    )
);

CREATE POLICY "Admins can delete product images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'product-images'
    AND EXISTS (
        SELECT 1
        FROM profiles p
        WHERE p.id = auth.uid()
        AND p.role = 'admin'
    )
);


-- =====================================================
-- CUSTOM ORDER ARTWORK POLICIES
-- =====================================================

CREATE POLICY "Users upload own artwork"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'custom-order-artwork'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users view own artwork"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'custom-order-artwork'
    AND (
        (storage.foldername(name))[1] = auth.uid()::text
        OR EXISTS (
            SELECT 1
            FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'admin'
        )
    )
);

CREATE POLICY "Users update own artwork"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'custom-order-artwork'
    AND (
        (storage.foldername(name))[1] = auth.uid()::text
        OR EXISTS (
            SELECT 1
            FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'admin'
        )
    )
);

CREATE POLICY "Users delete own artwork"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'custom-order-artwork'
    AND (
        (storage.foldername(name))[1] = auth.uid()::text
        OR EXISTS (
            SELECT 1
            FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'admin'
        )
    )
);


