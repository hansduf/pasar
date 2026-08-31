-- ====================================================================
-- PASAR POS: Optional Seed Script (Isi Data Barang Awal Ke Supabase)
-- Copy & Paste script ini ke Supabase SQL Editor jika ingin memasukkan
-- data barang awal (Royco, Mie 3 Ayam, Kacang, Kemiri, Kerupuk) ke Supabase.
-- ====================================================================

-- 1. Insert Royco Perasa Ayam
SELECT public.create_product_with_units(
    'Royco Perasa Ayam 8g',
    'Bumbu & Bahan Dapur',
    'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&auto=format&fit=crop&q=80',
    false,
    5,
    1,
    'Beli 5 Gratis 1',
    '[
        {"unit_name": "Pcs", "price": 500, "conversion_factor": 1, "is_default": true},
        {"unit_name": "Renceng (10 pcs)", "price": 5000, "conversion_factor": 10},
        {"unit_name": "Lembar (3 renceng)", "price": 14000, "conversion_factor": 30},
        {"unit_name": "Karton (20 lembar)", "price": 270000, "conversion_factor": 600}
    ]'::jsonb
);

-- 2. Insert Mie 3 Ayam Telur
SELECT public.create_product_with_units(
    'Mie 3 Ayam Telur',
    'Mie & Instant',
    'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=400&auto=format&fit=crop&q=80',
    false,
    0,
    0,
    '',
    '[
        {"unit_name": "Pcs", "price": 3500, "conversion_factor": 1, "is_default": true},
        {"unit_name": "Bungkus (10 pcs)", "price": 33000, "conversion_factor": 10},
        {"unit_name": "Dus (40 pcs)", "price": 120000, "conversion_factor": 40}
    ]'::jsonb
);

-- 3. Insert Kacang Tanah Kupas (Timbangan Tiers)
SELECT public.create_product_with_units(
    'Kacang Tanah Kupas (Curah/Timbangan)',
    'Sembako & Timbangan',
    'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=400&auto=format&fit=crop&q=80',
    true,
    0,
    0,
    '',
    '[
        {"unit_name": "1 Kg", "price": 44000, "conversion_factor": 1000, "is_default": true},
        {"unit_name": "500g", "price": 23000, "conversion_factor": 500},
        {"unit_name": "250g", "price": 12000, "conversion_factor": 250},
        {"unit_name": "100g", "price": 5000, "conversion_factor": 100},
        {"unit_name": "50g", "price": 3000, "conversion_factor": 50}
    ]'::jsonb
);

-- 4. Insert Kemiri Utuh Super (Timbangan Tiers)
SELECT public.create_product_with_units(
    'Kemiri Utuh Super (Curah/Timbangan)',
    'Sembako & Timbangan',
    'https://images.unsplash.com/photo-1608686207856-001b95cf60ca?w=400&auto=format&fit=crop&q=80',
    true,
    0,
    0,
    '',
    '[
        {"unit_name": "1 Kg", "price": 55000, "conversion_factor": 1000, "is_default": true},
        {"unit_name": "500g", "price": 28000, "conversion_factor": 500},
        {"unit_name": "250g", "price": 14000, "conversion_factor": 250},
        {"unit_name": "100g", "price": 6000, "conversion_factor": 100},
        {"unit_name": "50g", "price": 3500, "conversion_factor": 50}
    ]'::jsonb
);

-- 5. Insert Kerupuk Bawang Super
SELECT public.create_product_with_units(
    'Kerupuk Bawang Super (Bal & Eceran)',
    'Camilan & Kerupuk',
    'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=400&auto=format&fit=crop&q=80',
    true,
    0,
    0,
    '',
    '[
        {"unit_name": "1 Kg", "price": 26000, "conversion_factor": 1000, "is_default": true},
        {"unit_name": "Bal (2.5 kg)", "price": 60000, "conversion_factor": 2500},
        {"unit_name": "500g", "price": 13500, "conversion_factor": 500},
        {"unit_name": "250g", "price": 7000, "conversion_factor": 250}
    ]'::jsonb
);
