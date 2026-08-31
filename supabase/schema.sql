-- ====================================================================
-- PASAR POS: Supabase Database Schema
-- Run this script in the Supabase SQL Editor
-- ====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category TEXT DEFAULT 'Umum',
    image_url TEXT,
    is_bulk BOOLEAN DEFAULT FALSE, -- TRUE for items like Beras, Kacang, Kemiri (Timbangan/Curah)
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
    conversion_factor NUMERIC(10, 2) DEFAULT 1, -- Conversion multiplier (e.g., Karton = 60, Renceng = 10, Pcs = 1)
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
    qty NUMERIC(10, 3) NOT NULL DEFAULT 1, -- Supports decimal for timbangan (e.g. 0.400 kg)
    discount_amount NUMERIC(12, 2) DEFAULT 0,
    is_bonus BOOLEAN DEFAULT FALSE,
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
    notes TEXT, -- e.g. "Kemasan Robek / Diskon Rp 1.000"
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
