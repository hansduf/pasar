-- ====================================================================
-- PASAR POS: Supabase Stored Procedures (RPC Functions)
-- Run this script in the Supabase SQL Editor AFTER schema.sql
-- ====================================================================

-- 1. RPC: Get Products with All Units & Promos in a single query
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
            'units', (
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
            )
        )
    )
    INTO result
    FROM public.products p
    WHERE 
        (search_query = '' OR p.name ILIKE '%' || search_query || '%' OR p.category ILIKE '%' || search_query || '%')
        AND (category_filter = '' OR category_filter = 'Semua' OR p.category = category_filter)
    ORDER BY p.name ASC;

    RETURN COALESCE(result, '[]'::jsonb);
END;
$$;


-- 2. RPC: Create Product with Multi-Tier Units in an Atomic Transaction
CREATE OR REPLACE FUNCTION public.create_product_with_units(
    p_name TEXT,
    p_category TEXT,
    p_image_url TEXT,
    p_is_bulk BOOLEAN,
    p_buy_qty INT,
    p_get_qty INT,
    p_promo_info TEXT,
    p_units JSONB -- Array of JSON objects: [{"unit_name": "Pcs", "price": 500, "conversion_factor": 1, "is_default": true}]
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_product_id UUID;
    v_unit_elem JSONB;
BEGIN
    -- Insert Product
    INSERT INTO public.products (
        name, category, image_url, is_bulk, promo_buy_qty, promo_get_qty, promo_info
    ) VALUES (
        p_name, COALESCE(NULLIF(p_category, ''), 'Umum'), p_image_url, COALESCE(p_is_bulk, FALSE),
        COALESCE(p_buy_qty, 0), COALESCE(p_get_qty, 0), p_promo_info
    ) RETURNING id INTO v_product_id;

    -- Insert Units
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


-- 3. RPC: Quick 1-Tap Update Unit Price (UX Ayah/Toko Super Cepat)
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


-- 4. RPC: Atomic Transaction Checkout (Save Invoice & Line Items)
CREATE OR REPLACE FUNCTION public.checkout_transaction(
    p_customer_name TEXT,
    p_total_amount NUMERIC,
    p_payment_method TEXT,
    p_notes TEXT,
    p_items JSONB -- Array of JSON objects: [{"product_name": "...", "unit_name": "...", "price": 5000, "qty": 1, "discount_amount": 0, "is_bonus": false, "subtotal": 5000, "notes": "..."}]
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_transaction_id UUID;
    v_transaction_no TEXT;
    v_item JSONB;
BEGIN
    -- Generate Transaction Number INV-YYYYMMDD-XXXX
    v_transaction_no := 'INV-' || to_char(NOW(), 'YYYYMMDD-HH24MISS') || '-' || floor(random() * 900 + 100)::text;

    -- Insert Transaction Record
    INSERT INTO public.transactions (
        transaction_no, customer_name, total_amount, payment_method, notes
    ) VALUES (
        v_transaction_no, COALESCE(NULLIF(p_customer_name, ''), 'Pelanggan Umum'),
        p_total_amount, COALESCE(p_payment_method, 'Tunai'), p_notes
    ) RETURNING id INTO v_transaction_id;

    -- Insert Transaction Items
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
