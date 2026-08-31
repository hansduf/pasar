'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, Plus, Trash2, Check, Sparkles, Scale, AlertTriangle, RefreshCw } from 'lucide-react';
import { compressImage, compressImageDataUrl } from '../lib/imageCompressor';
import { supabase } from '../lib/supabase';

interface UnitFormInput {
  id?: string;
  unit_name: string;
  price: string;
  conversion_factor: string;
}

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductCreated: (newProduct: any) => void;
  onProductUpdated?: (updatedProduct: any) => void;
  onProductDeleted?: (productId: string) => void;
  initialProduct?: any; // If provided, modal operates in Edit Mode
}

const CATEGORY_PRESETS = [
  'Bumbu & Bahan Dapur',
  'Sembako & Beras',
  'Camilan & Kerupuk',
  'Minuman & Susu',
  'Sabun & Kebersihan',
  'Umum',
];

const UNIT_PRESETS = ['Pcs', 'Renceng', 'Lembar', 'Pack', 'Dus', 'Kg', 'Gram'];

export default function AddProductModal({
  isOpen,
  onClose,
  onProductCreated,
  onProductUpdated,
  onProductDeleted,
  initialProduct,
}: AddProductModalProps) {
  if (!isOpen) return null;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Bumbu & Bahan Dapur');
  const [isBulk, setIsBulk] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [compressedFile, setCompressedFile] = useState<Blob | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Weight Tiers (50g, 100g, 250g, 500g, 1kg) for Bulk/Weighted items
  const [price1Kg, setPrice1Kg] = useState('44000');
  const [price500g, setPrice500g] = useState('23000');
  const [price250g, setPrice250g] = useState('12000');
  const [price100g, setPrice100g] = useState('5000');
  const [price50g, setPrice50g] = useState('3000');

  // Promo Setup
  const [promoBuyQty, setPromoBuyQty] = useState('0');
  const [promoGetQty, setPromoGetQty] = useState('0');
  const [promoInfo, setPromoInfo] = useState('');

  // Standard Multi-Units setup (for non-bulk items)
  const [units, setUnits] = useState<UnitFormInput[]>([
    { unit_name: 'Pcs', price: '5000', conversion_factor: '1' },
  ]);

  // Auto-calculate proportional weight tier prices from 1kg base price
  const handleAutoCalcWeightTiers = (baseKgStr: string) => {
    const baseKg = parseFloat(baseKgStr) || 0;
    setPrice1Kg(baseKgStr);
    setPrice500g(String(Math.round(baseKg * 0.5)));
    setPrice250g(String(Math.round(baseKg * 0.25)));
    setPrice100g(String(Math.round(baseKg * 0.1)));
    setPrice50g(String(Math.round(baseKg * 0.05)));
  };

  // Load initial product if editing
  useEffect(() => {
    if (initialProduct) {
      setName(initialProduct.name || '');
      setCategory(initialProduct.category || 'Bumbu & Bahan Dapur');
      const isBulkProd = !!initialProduct.is_bulk;
      setIsBulk(isBulkProd);
      setImagePreview(initialProduct.image_url || null);
      setPromoBuyQty(initialProduct.promo_buy_qty ? String(initialProduct.promo_buy_qty) : '0');
      setPromoGetQty(initialProduct.promo_get_qty ? String(initialProduct.promo_get_qty) : '0');
      setPromoInfo(initialProduct.promo_info || '');

      if (initialProduct.units && initialProduct.units.length > 0) {
        if (isBulkProd) {
          // Find matching weight tiers from product units if available
          const u1Kg = initialProduct.units.find((u: any) => u.unit_name === '1 Kg' || u.unit_name === 'Kg');
          const u500 = initialProduct.units.find((u: any) => u.unit_name === '500g');
          const u250 = initialProduct.units.find((u: any) => u.unit_name === '250g');
          const u100 = initialProduct.units.find((u: any) => u.unit_name === '100g');
          const u50 = initialProduct.units.find((u: any) => u.unit_name === '50g');

          const baseKg = u1Kg?.price || 44000;
          setPrice1Kg(String(baseKg));
          setPrice500g(String(u500?.price || Math.round(baseKg * 0.5)));
          setPrice250g(String(u250?.price || Math.round(baseKg * 0.25)));
          setPrice100g(String(u100?.price || Math.round(baseKg * 0.1)));
          setPrice50g(String(u50?.price || Math.round(baseKg * 0.05)));
        } else {
          setUnits(
            initialProduct.units.map((u: any) => ({
              id: u.id,
              unit_name: u.unit_name,
              price: String(u.price),
              conversion_factor: String(u.conversion_factor || 1),
            }))
          );
        }
      }
    } else {
      // Default reset
      setName('');
      setCategory('Bumbu & Bahan Dapur');
      setIsBulk(false);
      setImagePreview(null);
      setCompressedFile(null);
      setPromoBuyQty('0');
      setPromoGetQty('0');
      setPromoInfo('');
      setPrice1Kg('44000');
      setPrice500g('23000');
      setPrice250g('12000');
      setPrice100g('5000');
      setPrice50g('3000');
      setUnits([
        { unit_name: 'Pcs', price: '5000', conversion_factor: '1' },
        { unit_name: 'Renceng', price: '48000', conversion_factor: '10' },
      ]);
    }
  }, [initialProduct, isOpen]);

  const handleImageCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await compressImageDataUrl(file, 600, 600, 0.75);
      setImagePreview(dataUrl);
      const compressed = await compressImage(file, 800, 800, 0.8);
      setCompressedFile(compressed);
    } catch (err) {
      console.error('Compression error:', err);
    }
  };

  const handleAddUnitRow = (customUnitName?: string) => {
    const defaultName = customUnitName || 'Dus';
    const defaultPrice = '120000';
    setUnits([...units, { unit_name: defaultName, price: defaultPrice, conversion_factor: '1' }]);
  };

  const handleRemoveUnitRow = (index: number) => {
    if (units.length <= 1) {
      alert('Minimal harus ada 1 satuan harga!');
      return;
    }
    setUnits(units.filter((_, i) => i !== index));
  };

  const handleUnitChange = (index: number, field: keyof UnitFormInput, value: string) => {
    const updated = [...units];
    updated[index][field] = value;
    setUnits(updated);
  };

  const handleDeleteProduct = async () => {
    if (!initialProduct) return;
    setIsUploading(true);

    try {
      await supabase.from('products').delete().eq('id', initialProduct.id);
      await supabase.rpc('delete_product', { p_product_id: initialProduct.id });
    } catch (e) {
      console.warn('RPC delete fallback:', e);
    }

    if (onProductDeleted) {
      onProductDeleted(initialProduct.id);
    }
    setIsUploading(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Nama barang tidak boleh kosong!');
      return;
    }

    setIsUploading(true);
    let imageUrl =
      imagePreview ||
      'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&auto=format&fit=crop&q=80';

    // 1. Upload image to Supabase Storage if new compressed file
    if (compressedFile) {
      try {
        const filename = `prod-${Date.now()}-${Math.random().toString(36).substring(7)}.webp`;
        const { data, error } = await supabase.storage
          .from('product-images')
          .upload(filename, compressedFile, {
            contentType: 'image/webp',
            cacheControl: '3600',
            upsert: true,
          });

        if (!error && data) {
          const { data: publicUrlData } = supabase.storage
            .from('product-images')
            .getPublicUrl(filename);
          if (publicUrlData?.publicUrl) {
            imageUrl = publicUrlData.publicUrl;
          }
        }
      } catch (err) {
        console.warn('Storage upload warning:', err);
      }
    }

    const buyQty = parseInt(promoBuyQty) || 0;
    const getQty = parseInt(promoGetQty) || 0;
    const promoText = promoInfo || (buyQty > 0 ? `Beli ${buyQty} Gratis ${getQty}` : '');

    const parsedUnits = isBulk
      ? [
          {
            unit_name: '1 Kg',
            price: parseFloat(price1Kg) || 44000,
            conversion_factor: 1000,
            is_default: true,
          },
          {
            unit_name: '500g',
            price: parseFloat(price500g) || 23000,
            conversion_factor: 500,
          },
          {
            unit_name: '250g',
            price: parseFloat(price250g) || 12000,
            conversion_factor: 250,
          },
          {
            unit_name: '100g',
            price: parseFloat(price100g) || 5000,
            conversion_factor: 100,
          },
          {
            unit_name: '50g',
            price: parseFloat(price50g) || 3000,
            conversion_factor: 50,
          },
        ]
      : units.map((u, idx) => ({
          id: u.id,
          unit_name: u.unit_name,
          price: parseFloat(u.price) || 0,
          conversion_factor: parseFloat(u.conversion_factor) || 1,
          is_default: idx === 0,
        }));

    if (initialProduct) {
      // EDIT MODE
      const updatedProd = {
        ...initialProduct,
        name,
        category,
        image_url: imageUrl,
        is_bulk: isBulk,
        promo_buy_qty: buyQty,
        promo_get_qty: getQty,
        promo_info: promoText,
        units: parsedUnits,
      };

      // Call Supabase RPC
      try {
        await supabase.rpc('update_product_full', {
          p_product_id: initialProduct.id,
          p_name: name,
          p_category: category,
          p_image_url: imageUrl,
          p_is_bulk: isBulk,
          p_buy_qty: buyQty,
          p_get_qty: getQty,
          p_promo_info: promoText,
          p_units: parsedUnits,
        });
      } catch (e) {
        console.warn('RPC update fallback:', e);
      }

      if (onProductUpdated) {
        onProductUpdated(updatedProd);
      }
    } else {
      // CREATE MODE
      const newProd = {
        id: `prod-${Date.now()}`,
        name,
        category,
        image_url: imageUrl,
        is_bulk: isBulk,
        promo_buy_qty: buyQty,
        promo_get_qty: getQty,
        promo_info: promoText,
        units: parsedUnits,
      };

      // Call Supabase RPC
      try {
        await supabase.rpc('create_product_with_units', {
          p_name: name,
          p_category: category,
          p_image_url: imageUrl,
          p_is_bulk: isBulk,
          p_buy_qty: buyQty,
          p_get_qty: getQty,
          p_promo_info: promoText,
          p_units: parsedUnits,
        });
      } catch (e) {
        console.warn('RPC create fallback:', e);
      }

      onProductCreated(newProd);
    }

    setIsUploading(false);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Camera size={20} color="var(--color-primary)" />
            {initialProduct ? 'Edit Barang & Multi-Satuan' : '📸 Tambah Barang Baru + Foto'}
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={22} />
          </button>
        </div>

        {/* Delete Confirmation Card */}
        {showDeleteConfirm ? (
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fca5a5',
              padding: '14px',
              borderRadius: '12px',
              marginBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#dc2626', fontWeight: 800, marginBottom: '6px' }}>
              <AlertTriangle size={20} /> Yakin Hapus Produk Ini?
            </div>
            <div style={{ fontSize: '12px', color: '#7f1d1d', marginBottom: '12px' }}>
              Produk <strong>{initialProduct?.name}</strong> akan dihapus permanen dari katalog toko.
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1, fontSize: '12px', padding: '8px' }}
                onClick={() => setShowDeleteConfirm(false)}
              >
                Batal
              </button>
              <button
                type="button"
                className="btn"
                style={{ flex: 1, background: '#dc2626', color: '#fff', fontSize: '12px', padding: '8px' }}
                onClick={handleDeleteProduct}
              >
                Ya, Hapus Produk
              </button>
            </div>
          </div>
        ) : null}

        <form onSubmit={handleSubmit}>
          {/* Photo Picker Box */}
          <div className="form-group" style={{ alignItems: 'center', marginBottom: '16px' }}>
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: '100%',
                height: '140px',
                borderRadius: '12px',
                border: '2px dashed var(--color-primary)',
                background: imagePreview ? '#ffffff' : '#fff7ed',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                overflow: 'hidden',
                position: 'relative',
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              {imagePreview ? (
                <>
                  <img
                    src={imagePreview}
                    alt="Preview Barang"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '8px',
                      right: '8px',
                      background: 'rgba(15, 23, 42, 0.75)',
                      color: '#ffffff',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Camera size={14} /> Ganti Foto
                  </div>
                </>
              ) : (
                <>
                  <div
                    style={{
                      background: 'var(--color-primary)',
                      color: '#ffffff',
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '8px',
                    }}
                  >
                    <Camera size={22} />
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '13px', color: 'var(--color-primary)' }}>
                    Ambil Foto Barang (Kamera HP)
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Tap di sini untuk memotret atau pilih dari Galeri
                  </div>
                </>
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
              onChange={handleImageCapture}
            />
          </div>

          {/* Product Name */}
          <div className="form-group">
            <label>Nama Barang / Produk *</label>
            <input
              type="text"
              className="form-control"
              placeholder="Contoh: Kecap Bango 550ml / Beras C4"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Category Chips */}
          <div className="form-group">
            <label>Kategori Barang</label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '4px' }}>
              {CATEGORY_PRESETS.map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setCategory(cat)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '99px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: category === cat ? '1px solid var(--color-primary)' : '1px solid var(--border-color)',
                    background: category === cat ? 'var(--color-primary-light)' : '#ffffff',
                    color: category === cat ? 'var(--color-primary)' : 'var(--text-muted)',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Toggle Barang Timbangan / Curah */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid var(--border-color)',
              padding: '10px 12px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Scale size={18} color="var(--color-secondary)" />
              <div>
                <div style={{ fontSize: '12px', fontWeight: 800 }}>Barang Kiloan / Timbangan</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  Beras, kacang, kemiri, kanji (bisa atur harga beda per gram)
                </div>
              </div>
            </div>
            <input
              type="checkbox"
              style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
              checked={isBulk}
              onChange={(e) => setIsBulk(e.target.checked)}
            />
          </div>

          {/* Multi-Satuan / Weight Tiers Section */}
          <div className="form-group" style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontWeight: 800, color: 'var(--text-main)' }}>
                {isBulk ? '⚖️ Konfigurasi Harga Per-Ukuran Timbangan (Beda Gram Bisa Beda Harga)' : '🏷️ Pengaturan Multi-Satuan & Harga'}
              </label>
              {!isBulk && (
                <button
                  type="button"
                  onClick={() => handleAddUnitRow()}
                  style={{
                    background: 'var(--color-primary-light)',
                    color: 'var(--color-primary)',
                    border: '1px solid rgba(234, 88, 12, 0.3)',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Plus size={14} /> Tambah Satuan
                </button>
              )}
            </div>

            {/* If Bulk Item -> Show 5 Weight Tier Inputs (50g, 100g, 250g, 500g, 1kg) */}
            {isBulk ? (
              <div
                style={{
                  background: 'var(--color-secondary-light)',
                  border: '1px solid rgba(2, 132, 199, 0.2)',
                  padding: '12px',
                  borderRadius: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-secondary)' }}>
                    Atur Harga Khusus Tiap Ukuran Timbangan:
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAutoCalcWeightTiers(price1Kg)}
                    style={{
                      background: '#ffffff',
                      color: 'var(--color-secondary)',
                      border: '1px solid rgba(2, 132, 199, 0.3)',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontSize: '10px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <RefreshCw size={12} /> Hitung Proporsional
                  </button>
                </div>

                {/* 1 Kg */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ flex: '1', fontSize: '12px', fontWeight: 800 }}>1 Kg (1.000 gram):</div>
                  <div style={{ flex: '1.5', position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>Rp</span>
                    <input
                      type="number"
                      className="form-control"
                      style={{ paddingLeft: '28px', fontSize: '12px', fontWeight: 800, padding: '6px 8px 6px 28px' }}
                      value={price1Kg}
                      onChange={(e) => handleAutoCalcWeightTiers(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* 500 Gram */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ flex: '1', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>500 gram (Setengah Kg):</div>
                  <div style={{ flex: '1.5', position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>Rp</span>
                    <input
                      type="number"
                      className="form-control"
                      style={{ paddingLeft: '28px', fontSize: '12px', fontWeight: 800, padding: '6px 8px 6px 28px' }}
                      value={price500g}
                      onChange={(e) => setPrice500g(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* 250 Gram */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ flex: '1', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>250 gram (Seperempat):</div>
                  <div style={{ flex: '1.5', position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>Rp</span>
                    <input
                      type="number"
                      className="form-control"
                      style={{ paddingLeft: '28px', fontSize: '12px', fontWeight: 800, padding: '6px 8px 6px 28px' }}
                      value={price250g}
                      onChange={(e) => setPrice250g(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* 100 Gram */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ flex: '1', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>100 gram:</div>
                  <div style={{ flex: '1.5', position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>Rp</span>
                    <input
                      type="number"
                      className="form-control"
                      style={{ paddingLeft: '28px', fontSize: '12px', fontWeight: 800, padding: '6px 8px 6px 28px' }}
                      value={price100g}
                      onChange={(e) => setPrice100g(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* 50 Gram */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ flex: '1', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>50 gram:</div>
                  <div style={{ flex: '1.5', position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>Rp</span>
                    <input
                      type="number"
                      className="form-control"
                      style={{ paddingLeft: '28px', fontSize: '12px', fontWeight: 800, padding: '6px 8px 6px 28px' }}
                      value={price50g}
                      onChange={(e) => setPrice50g(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* Non-Bulk Multi Units Builder */
              <div>
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '8px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', alignSelf: 'center' }}>Preset:</span>
                  {UNIT_PRESETS.map((preset) => (
                    <button
                      type="button"
                      key={preset}
                      onClick={() => handleAddUnitRow(preset)}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '10px',
                        fontWeight: 700,
                        background: '#f1f5f9',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-main)',
                        cursor: 'pointer',
                      }}
                    >
                      + {preset}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {units.map((unit, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        gap: '6px',
                        alignItems: 'center',
                        background: '#f8fafc',
                        padding: '8px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      <input
                        type="text"
                        className="form-control"
                        style={{ flex: '1', fontSize: '12px', padding: '8px' }}
                        placeholder="Nama Satuan (Pcs/Renceng/Dus)"
                        value={unit.unit_name}
                        onChange={(e) => handleUnitChange(index, 'unit_name', e.target.value)}
                        required
                      />
                      <div style={{ flex: '1.2', position: 'relative' }}>
                        <span
                          style={{
                            position: 'absolute',
                            left: '8px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            fontSize: '11px',
                            color: 'var(--text-muted)',
                            fontWeight: 700,
                          }}
                        >
                          Rp
                        </span>
                        <input
                          type="number"
                          className="form-control"
                          style={{ paddingLeft: '28px', fontSize: '12px', fontWeight: 800, padding: '8px 8px 8px 28px' }}
                          placeholder="Harga (misal 5000)"
                          value={unit.price}
                          onChange={(e) => handleUnitChange(index, 'price', e.target.value)}
                          required
                        />
                      </div>
                      {units.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveUnitRow(index)}
                          style={{
                            background: '#fef2f2',
                            color: '#dc2626',
                            border: 'none',
                            padding: '6px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Promo Buy X Get Y Setup */}
          <div
            style={{
              background: '#fffbeb',
              border: '1px solid #fde68a',
              padding: '10px 12px',
              borderRadius: '10px',
              marginBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, fontSize: '12px', color: '#b45309', marginBottom: '6px' }}>
              <Sparkles size={16} /> Promo Buy X Get Y (Opsional)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ fontSize: '10px', fontWeight: 700, color: '#92400e' }}>Beli Berapa (Buy Qty):</label>
                <input
                  type="number"
                  className="form-control"
                  style={{ fontSize: '12px', padding: '6px 8px' }}
                  placeholder="0 (misal 5)"
                  value={promoBuyQty}
                  onChange={(e) => setPromoBuyQty(e.target.value)}
                />
              </div>
              <div>
                <label style={{ fontSize: '10px', fontWeight: 700, color: '#92400e' }}>Gratis Berapa (Get Qty):</label>
                <input
                  type="number"
                  className="form-control"
                  style={{ fontSize: '12px', padding: '6px 8px' }}
                  placeholder="0 (misal 1)"
                  value={promoGetQty}
                  onChange={(e) => setPromoGetQty(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
            {initialProduct && !showDeleteConfirm && (
              <button
                type="button"
                className="btn"
                style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5', padding: '10px' }}
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 size={16} /> Hapus
              </button>
            )}
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>
              Batal
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 2 }}
              disabled={isUploading}
            >
              {isUploading ? 'Menyimpan...' : initialProduct ? 'Simpan Perubahan' : '📸 Simpan Barang'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
