'use client';

import React, { useState, useRef } from 'react';
import { X, Camera, Plus, Trash2, Check, Sparkles } from 'lucide-react';
import { compressImage } from '../lib/imageCompressor';
import { supabase } from '../lib/supabase';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductCreated: (newProduct: any) => void;
}

interface UnitFormInput {
  unit_name: string;
  price: string;
  conversion_factor: string;
}

export default function AddProductModal({
  isOpen,
  onClose,
  onProductCreated,
}: AddProductModalProps) {
  if (!isOpen) return null;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Bumbu & Bahan Dapur');
  const [isBulk, setIsBulk] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [compressedFile, setCompressedFile] = useState<Blob | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Promo Setup
  const [promoBuyQty, setPromoBuyQty] = useState('0');
  const [promoGetQty, setPromoGetQty] = useState('0');
  const [promoInfo, setPromoInfo] = useState('');

  // Units setup
  const [units, setUnits] = useState<UnitFormInput[]>([
    { unit_name: 'Pcs', price: '5000', conversion_factor: '1' },
    { unit_name: 'Renceng', price: '48000', conversion_factor: '10' },
  ]);

  const handleImageCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file, 1000, 1000, 0.8);
      setCompressedFile(compressed);
      setImagePreview(URL.createObjectURL(compressed));
    } catch (err) {
      console.error('Compression error:', err);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleAddUnitRow = () => {
    setUnits([...units, { unit_name: 'Dus', price: '120000', conversion_factor: '40' }]);
  };

  const handleRemoveUnitRow = (index: number) => {
    if (units.length <= 1) return;
    setUnits(units.filter((_, i) => i !== index));
  };

  const handleUnitChange = (index: number, field: keyof UnitFormInput, value: string) => {
    const updated = [...units];
    updated[index][field] = value;
    setUnits(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Nama barang tidak boleh kosong!');
      return;
    }

    setIsUploading(true);
    let imageUrl = imagePreview || 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&auto=format&fit=crop&q=80';

    // 1. Upload to Supabase Storage if file present
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
          const { data: publicUrlData } = supabase.storage.from('product-images').getPublicUrl(filename);
          if (publicUrlData?.publicUrl) {
            imageUrl = publicUrlData.publicUrl;
          }
        }
      } catch (err) {
        console.warn('Storage upload warning, using local preview image:', err);
      }
    }

    const buyQty = parseInt(promoBuyQty) || 0;
    const getQty = parseInt(promoGetQty) || 0;
    const promoText = promoInfo || (buyQty > 0 ? `Beli ${buyQty} Gratis ${getQty}` : '');

    const parsedUnits = isBulk
      ? [{ unit_name: 'Kg', price: parseFloat(units[0]?.price || '44000'), conversion_factor: 1, is_default: true }]
      : units.map((u, idx) => ({
          unit_name: u.unit_name,
          price: parseFloat(u.price) || 0,
          conversion_factor: parseFloat(u.conversion_factor) || 1,
          is_default: idx === 0,
        }));

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

    onProductCreated(newProd);
    setIsUploading(false);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">📸 Tambah Barang Baru + Foto</div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Camera Photo Picker */}
          <div className="form-group" style={{ alignItems: 'center' }}>
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: '100%',
                height: '140px',
                background: 'var(--bg-input)',
                border: '2px dashed var(--border-color)',
                borderRadius: '14px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <>
                  <Camera size={36} color="var(--color-primary)" />
                  <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)', marginTop: '6px' }}>
                    Tap untuk Ambil Foto Kamera HP
                  </span>
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
              placeholder="Contoh: Royco Ayam / Mie 3 Ayam / Kemiri"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Category & Type */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div className="form-group">
              <label>Kategori</label>
              <select className="form-control" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="Bumbu & Bahan Dapur">Bumbu & Bahan Dapur</option>
                <option value="Mie & Instant">Mie & Instant</option>
                <option value="Sembako & Timbangan">Sembako & Timbangan</option>
                <option value="Sabun & Kebersihan">Sabun & Kebersihan</option>
                <option value="Minuman & Snack">Minuman & Snack</option>
                <option value="Umum">Umum</option>
              </select>
            </div>

            <div className="form-group">
              <label>Tipe Penjualan</label>
              <select className="form-control" value={isBulk ? 'BULK' : 'FIXED'} onChange={(e) => setIsBulk(e.target.value === 'BULK')}>
                <option value="FIXED">Unit Tetap (Pcs/Dus)</option>
                <option value="BULK">Timbangan / Curah (Kg)</option>
              </select>
            </div>
          </div>

          {/* Dynamic Units / Price Setup */}
          {isBulk ? (
            <div className="form-group" style={{ background: 'rgba(15,23,42,0.6)', padding: '12px', borderRadius: '12px' }}>
              <label style={{ color: '#38bdf8' }}>Harga Dasar per 1 Kg (Rp):</label>
              <input
                type="number"
                className="form-control"
                style={{ fontSize: '18px', fontWeight: '800' }}
                value={units[0]?.price || '44000'}
                onChange={(e) => handleUnitChange(0, 'price', e.target.value)}
                required
              />
            </div>
          ) : (
            <div className="form-group">
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Multi-Satuan & Harga:</span>
                <button type="button" onClick={handleAddUnitRow} style={{ color: 'var(--color-primary)', background: 'none', border: 'none', fontWeight: '700', cursor: 'pointer' }}>
                  + Tambah Satuan
                </button>
              </label>

              {units.map((unit, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 40px', gap: '8px', marginBottom: '8px' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Nama (Pcs/Renceng)"
                    value={unit.unit_name}
                    onChange={(e) => handleUnitChange(idx, 'unit_name', e.target.value)}
                    required
                  />
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Harga Rp"
                    value={unit.price}
                    onChange={(e) => handleUnitChange(idx, 'price', e.target.value)}
                    required
                  />
                  {units.length > 1 ? (
                    <button type="button" onClick={() => handleRemoveUnitRow(idx)} style={{ background: 'var(--color-danger-light)', border: 'none', borderRadius: '8px', color: 'var(--color-danger)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Trash2 size={16} />
                    </button>
                  ) : (
                    <div></div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Promo Buy X Get Y */}
          <div className="form-group" style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f59e0b', fontWeight: '800' }}>
              <Sparkles size={16} /> Pengaturan Promo (Opsional Buy X Get Y)
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '6px' }}>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Beli Qty (X):</span>
                <input
                  type="number"
                  className="form-control"
                  placeholder="5"
                  value={promoBuyQty}
                  onChange={(e) => setPromoBuyQty(e.target.value)}
                />
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Gratis Qty (Y):</span>
                <input
                  type="number"
                  className="form-control"
                  placeholder="1"
                  value={promoGetQty}
                  onChange={(e) => setPromoGetQty(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1.5 }} disabled={isUploading}>
              <Check size={18} /> {isUploading ? 'Menyimpan...' : 'Simpan Barang'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
