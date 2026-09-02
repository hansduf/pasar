import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface ProductUnit {
  id: string;
  product_id?: string;
  unit_name: string;
  price: number;
  conversion_factor?: number;
  is_default?: boolean;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  image_url: string;
  is_bulk?: boolean;
  promo_buy_qty?: number;
  promo_get_qty?: number;
  promo_unit_name?: string;
  promo_info?: string;
  units: ProductUnit[];
}

export interface CartItem {
  id: string;
  product_id: string;
  product_name: string;
  unit_name: string;
  price: number;
  qty: number;
  discount_amount: number;
  is_bonus?: boolean;
  subtotal: number;
  notes?: string;
  image_url?: string;
  is_bulk?: boolean;
  bulk_weight_gram?: number;
}

export interface Cart {
  id: string;
  name: string;
  notes?: string;
  status?: 'DRAFT' | 'PAID_PREPARING' | 'COMPLETED';
  items: CartItem[];
}

export interface Transaction {
  id: string;
  transaction_no: string;
  customer_name: string;
  total_amount: number;
  payment_method: string;
  cash_received?: number;
  change_amount?: number;
  notes?: string;
  created_at: string;
  items?: CartItem[];
}

// Initial Mock Data (used for seamless instant preview before connecting real Supabase project)
export const INITIAL_MOCK_PRODUCTS: Product[] = [
  {
    id: 'mock-1',
    name: 'Royco Perasa Ayam 8g',
    category: 'Bumbu & Bahan Dapur',
    image_url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&auto=format&fit=crop&q=80',
    is_bulk: false,
    promo_buy_qty: 5,
    promo_get_qty: 1,
    promo_info: 'Beli 5 Gratis 1',
    units: [
      { id: 'u1-1', unit_name: 'Pcs', price: 500, conversion_factor: 1, is_default: true },
      { id: 'u1-2', unit_name: 'Renceng (10 pcs)', price: 5000, conversion_factor: 10 },
      { id: 'u1-3', unit_name: 'Lembar (3 renceng)', price: 14000, conversion_factor: 30 },
      { id: 'u1-4', unit_name: 'Karton (20 lembar)', price: 270000, conversion_factor: 600 },
    ],
  },
  {
    id: 'mock-2',
    name: 'Mie 3 Ayam Telur',
    category: 'Mie & Instant',
    image_url: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=400&auto=format&fit=crop&q=80',
    is_bulk: false,
    units: [
      { id: 'u2-1', unit_name: 'Pcs', price: 3500, conversion_factor: 1, is_default: true },
      { id: 'u2-2', unit_name: 'Bungkus (10 pcs)', price: 33000, conversion_factor: 10 },
      { id: 'u2-3', unit_name: 'Dus (40 pcs)', price: 120000, conversion_factor: 40 },
    ],
  },
  {
    id: 'mock-3',
    name: 'Kacang Tanah Kupas (Curah/Timbangan)',
    category: 'Sembako & Timbangan',
    image_url: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=400&auto=format&fit=crop&q=80',
    is_bulk: true,
    units: [
      { id: 'u3-1', unit_name: 'Kg', price: 44000, conversion_factor: 1, is_default: true },
    ],
  },
  {
    id: 'mock-4',
    name: 'Kemiri Utuh Super (Curah/Timbangan)',
    category: 'Sembako & Timbangan',
    image_url: 'https://images.unsplash.com/photo-1608686207856-001b95cf60ca?w=400&auto=format&fit=crop&q=80',
    is_bulk: true,
    units: [
      { id: 'u4-1', unit_name: 'Kg', price: 55000, conversion_factor: 1, is_default: true },
    ],
  },
  {
    id: 'mock-6',
    name: 'Kerupuk Bawang Super (Bal & Eceran)',
    category: 'Minuman & Snack',
    image_url: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=400&auto=format&fit=crop&q=80',
    is_bulk: true,
    units: [
      { id: 'u6-1', unit_name: 'Bal (2.5 kg)', price: 60000, conversion_factor: 2.5 },
      { id: 'u6-2', unit_name: 'Kg', price: 26000, conversion_factor: 1, is_default: true },
    ],
  },
];
