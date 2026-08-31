'use client';

import React, { useState } from 'react';
import { X, Scissors, Check } from 'lucide-react';
import { CartItem } from '../lib/supabase';

interface CartItemCustomPriceModalProps {
  item: CartItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (itemId: string, newPrice: number, discountAmount: number, notes: string) => void;
}

export default function CartItemCustomPriceModal({
  item,
  isOpen,
  onClose,
  onSave,
}: CartItemCustomPriceModalProps) {
  if (!isOpen || !item) return null;

  const [priceInput, setPriceInput] = useState<string>(item.price.toString());
  const [discountInput, setDiscountInput] = useState<string>(item.discount_amount.toString());
  const [notesInput, setNotesInput] = useState<string>(item.notes || 'Potongan / Kemasan Robek');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newPrice = parseFloat(priceInput) || 0;
    const discount = parseFloat(discountInput) || 0;
    onSave(item.id, newPrice, discount, notesInput);
    onClose();
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 120 }} onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Scissors size={20} color="var(--color-accent)" /> Ubah Harga Khusus / Potongan Item
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div style={{ background: 'rgba(15,23,42,0.6)', padding: '12px', borderRadius: '12px', marginBottom: '16px' }}>
          <div style={{ fontWeight: '700', fontSize: '15px' }}>{item.product_name} ({item.unit_name})</div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Harga Asli: Rp {item.price.toLocaleString('id-ID')}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Ubah Harga per Satuan (Rp):</label>
            <input
              type="number"
              className="form-control"
              style={{ fontSize: '18px', fontWeight: '800', color: '#34d399' }}
              value={priceInput}
              onChange={(e) => setPriceInput(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Atau Beri Potongan Diskon (Rp):</label>
            <input
              type="number"
              className="form-control"
              style={{ fontSize: '16px', fontWeight: '700', color: '#f59e0b' }}
              value={discountInput}
              onChange={(e) => setDiscountInput(e.target.value)}
              placeholder="0"
            />
          </div>

          <div className="form-group">
            <label>Alasan / Catatan Khusus:</label>
            <input
              type="text"
              className="form-control"
              value={notesInput}
              onChange={(e) => setNotesInput(e.target.value)}
              placeholder="Contoh: Kemasan robek / Nego langganan"
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1.5 }}>
              <Check size={18} /> Terapkan Harga Khusus
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
