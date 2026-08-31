-- ====================================================================
-- PASAR POS: Combined Supabase Database Setup & Stored Procedures (RPCs)
-- Copy and paste this ENTIRE script into the Supabase SQL Editor and click RUN
-- ====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category TEXT DEFAULT 'Umum',
    image_url TEXT,
    is_bulk BOOLEAN DEFAULT FALSE, -- TRUE for weighted items like Beras, Kacang, Kemiri
    promo_buy_qty INT DEFAULT 0,   -- Buy X (e.g. 5)
    promo_get_qty INT DEFAULT 0,   -- Get Y Free (e.g. 1)
    promo_info TEXT,               -- Custom promo text e.g. "Beli 5 Gratis 1"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Product Units & Pricing Table (Multi-Tier Satuan)
CREATE TABLE IF NOT EXISTS public.product_units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    unit_name TEXT NOT NULL,       -- e.g. "Pcs", "Renceng", "Lembar", "Karton", "Kg", "Gram"
    price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    conversion_factor NUMERIC(10, 2) DEFAULT 1, -- Conversion multiplier
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Transactions Table (History Penjualan)
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_no TEXT UNIQUE NOT NULL,
    customer_name TEXT DEFAULT 'Pelanggan Umum',
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    payment_method TEXT DEFAULT 'Tunai',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Transaction Items Table (Detail Barang Terjual)
CREATE TABLE IF NOT EXISTS public.transaction_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    unit_name TEXT NOT NULL,
    price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    qty NUMERIC(10, 3) NOT NULL DEFAULT 1,
    discount_amount NUMERIC(12, 2) DEFAULT 0,
    is_bonus BOOLEAN DEFAULT FALSE,
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Indexes for Lightning Fast Search
CREATE INDEX IF NOT EXISTS idx_products_name ON public.products (name);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products (category);
CREATE INDEX IF NOT EXISTS idx_product_units_product ON public.product_units (product_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON public.transactions (created_at DESC);

-- 7. Supabase Storage Bucket Setup Script for Product Photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if re-running script to avoid ERROR 42710
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Manage Access" ON storage.objects;

-- Public Storage Policy (Allow Anyone to Read/Download)
CREATE POLICY "Public Read Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'product-images');

-- Public Upload Policy (Allow Anyone to Upload Product Photos)
CREATE POLICY "Public Upload Access" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'product-images');

-- Public Update/Delete Policy
CREATE POLICY "Public Manage Access" 
ON storage.objects FOR ALL 
USING (bucket_id = 'product-images');

-- ====================================================================
-- STORED PROCEDURES (RPCs)
-- ====================================================================

-- RPC 1: Get Products with All Units & Promos in a single query
CREATE OR REPLACE FUNCTION public.get_products_with_units(
    search_query TEXT DEFAULT '',
    category_filter TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', p.id,
            'name', p.name,
            'category', p.category,
            'image_url', p.image_url,
            'is_bulk', p.is_bulk,
            'promo_buy_qty', p.promo_buy_qty,
            'promo_get_qty', p.promo_get_qty,
            'promo_info', p.promo_info,
            'units', COALESCE(
                (
                    SELECT jsonb_agg(
                        jsonb_build_object(
                            'id', u.id,
                            'unit_name', u.unit_name,
                            'price', u.price,
                            'conversion_factor', u.conversion_factor,
                            'is_default', u.is_default
                        ) ORDER BY u.price ASC
                    )
                    FROM public.product_units u
                    WHERE u.product_id = p.id
                ),
                '[]'::jsonb
            )
        ) ORDER BY p.name ASC
    )
    INTO result
    FROM public.products p
    WHERE 
        (search_query = '' OR p.name ILIKE '%' || search_query || '%' OR p.category ILIKE '%' || search_query || '%')
        AND (category_filter = '' OR category_filter = 'Semua' OR p.category = category_filter);

    RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

-- RPC 2: Create Product with Multi-Tier Units in an Atomic Transaction
CREATE OR REPLACE FUNCTION public.create_product_with_units(
    p_name TEXT,
    p_category TEXT,
    p_image_url TEXT,
    p_is_bulk BOOLEAN,
    p_buy_qty INT,
    p_get_qty INT,
    p_promo_info TEXT,
    p_units JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_product_id UUID;
    v_unit_elem JSONB;
BEGIN
    INSERT INTO public.products (
        name, category, image_url, is_bulk, promo_buy_qty, promo_get_qty, promo_info
    ) VALUES (
        p_name, COALESCE(NULLIF(p_category, ''), 'Umum'), p_image_url, COALESCE(p_is_bulk, FALSE),
        COALESCE(p_buy_qty, 0), COALESCE(p_get_qty, 0), p_promo_info
    ) RETURNING id INTO v_product_id;

    FOR v_unit_elem IN SELECT * FROM jsonb_array_elements(p_units)
    LOOP
        INSERT INTO public.product_units (
            product_id, unit_name, price, conversion_factor, is_default
        ) VALUES (
            v_product_id,
            v_unit_elem->>'unit_name',
            (v_unit_elem->>'price')::NUMERIC,
            COALESCE((v_unit_elem->>'conversion_factor')::NUMERIC, 1),
            COALESCE((v_unit_elem->>'is_default')::BOOLEAN, FALSE)
        );
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'product_id', v_product_id
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$;

-- RPC 3: Quick 1-Tap Update Unit Price
CREATE OR REPLACE FUNCTION public.update_product_unit_price(
    p_unit_id UUID,
    p_new_price NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE public.product_units
    SET price = p_new_price
    WHERE id = p_unit_id;

    RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- RPC 4: Atomic Transaction Checkout
CREATE OR REPLACE FUNCTION public.checkout_transaction(
    p_customer_name TEXT,
    p_total_amount NUMERIC,
    p_payment_method TEXT,
    p_notes TEXT,
    p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_transaction_id UUID;
    v_transaction_no TEXT;
    v_item JSONB;
BEGIN
    v_transaction_no := 'INV-' || to_char(NOW(), 'YYYYMMDD-HH24MISS') || '-' || floor(random() * 900 + 100)::text;

    INSERT INTO public.transactions (
        transaction_no, customer_name, total_amount, payment_method, notes
    ) VALUES (
        v_transaction_no, COALESCE(NULLIF(p_customer_name, ''), 'Pelanggan Umum'),
        p_total_amount, COALESCE(p_payment_method, 'Tunai'), p_notes
    ) RETURNING id INTO v_transaction_id;

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO public.transaction_items (
            transaction_id, product_name, unit_name, price, qty, discount_amount, is_bonus, subtotal, notes
        ) VALUES (
            v_transaction_id,
            v_item->>'product_name',
            v_item->>'unit_name',
            (v_item->>'price')::NUMERIC,
            (v_item->>'qty')::NUMERIC,
            COALESCE((v_item->>'discount_amount')::NUMERIC, 0),
            COALESCE((v_item->>'is_bonus')::BOOLEAN, FALSE),
            (v_item->>'subtotal')::NUMERIC,
            v_item->>'notes'
        );
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'transaction_id', v_transaction_id,
        'transaction_no', v_transaction_no
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$;

-- RPC 5: Update Full Product Details & Multi-Satuan Units
CREATE OR REPLACE FUNCTION public.update_product_full(
    p_product_id UUID,
    p_name TEXT,
    p_category TEXT,
    p_image_url TEXT,
    p_is_bulk BOOLEAN,
    p_buy_qty INT,
    p_get_qty INT,
    p_promo_info TEXT,
    p_units JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_unit_elem JSONB;
BEGIN
    UPDATE public.products
    SET name = p_name,
        category = COALESCE(NULLIF(p_category, ''), 'Umum'),
        image_url = p_image_url,
        is_bulk = COALESCE(p_is_bulk, FALSE),
        promo_buy_qty = COALESCE(p_buy_qty, 0),
        promo_get_qty = COALESCE(p_get_qty, 0),
        promo_info = p_promo_info,
        updated_at = NOW()
    WHERE id = p_product_id;

    -- Delete existing units and re-insert updated multi-tier units
    DELETE FROM public.product_units WHERE product_id = p_product_id;

    FOR v_unit_elem IN SELECT * FROM jsonb_array_elements(p_units)
    LOOP
        INSERT INTO public.product_units (
            product_id, unit_name, price, conversion_factor, is_default
        ) VALUES (
            p_product_id,
            v_unit_elem->>'unit_name',
            (v_unit_elem->>'price')::NUMERIC,
            COALESCE((v_unit_elem->>'conversion_factor')::NUMERIC, 1),
            COALESCE((v_unit_elem->>'is_default')::BOOLEAN, FALSE)
        );
    END LOOP;

    RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- RPC 6: Delete Product and Multi-Satuan Units
CREATE OR REPLACE FUNCTION public.delete_product(
    p_product_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
BEGIN
    DELETE FROM public.products WHERE id = p_product_id;
    RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
