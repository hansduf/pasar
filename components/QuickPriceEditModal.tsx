'use client';

import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { Product, ProductUnit } from '../lib/supabase';

interface QuickPriceEditModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSavePrice: (productId: string, unitId: string, newPrice: number) => void;
}

export default function QuickPriceEditModal({
  product,
  isOpen,
  onClose,
  onSavePrice,
}: QuickPriceEditModalProps) {
  if (!isOpen || !product) return null;

  const [selectedUnitId, setSelectedUnitId] = useState<string>(
    product.units && product.units.length > 0 ? product.units[0].id : ''
  );
  const selectedUnit = product.units.find((u) => u.id === selectedUnitId) || product.units[0];
  const [priceInput, setPriceInput] = useState<string>(selectedUnit ? selectedUnit.price.toString() : '0');

  const handleUnitSelect = (unit: ProductUnit) => {
    setSelectedUnitId(unit.id);
    setPriceInput(unit.price.toString());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericPrice = parseFloat(priceInput);
    if (!isNaN(numericPrice) && numericPrice >= 0 && selectedUnit) {
      onSavePrice(product.id, selectedUnit.id, numericPrice);
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">✏️ Update Harga Cepat</div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', background: 'rgba(15,23,42,0.6)', padding: '10px', borderRadius: '12px' }}>
          <img
            src={product.image_url || 'https://via.placeholder.com/80'}
            alt={product.name}
            style={{ width: '54px', height: '54px', objectFit: 'cover', borderRadius: '8px' }}
          />
          <div>
            <div style={{ fontWeight: '700', fontSize: '15px' }}>{product.name}</div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{product.category}</div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Unit Selector */}
          <div className="form-group">
            <label>Pilih Satuan yang Ingin Diubah:</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {product.units.map((unit) => (
                <button
                  type="button"
                  key={unit.id}
                  onClick={() => handleUnitSelect(unit)}
                  className={`category-pill ${selectedUnitId === unit.id ? 'active' : ''}`}
                  style={{ fontSize: '14px', padding: '8px 14px' }}
                >
                  {unit.unit_name} (Rp {unit.price.toLocaleString('id-ID')})
                </button>
              ))}
            </div>
          </div>

          {/* New Price Input */}
          <div className="form-group" style={{ marginTop: '14px' }}>
            <label style={{ fontSize: '15px', fontWeight: '700', color: '#f59e0b' }}>
              Harga Baru untuk [{selectedUnit?.unit_name || 'Satuan'}]:
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontWeight: '700', color: 'var(--text-muted)' }}>
                Rp
              </span>
              <input
                type="number"
                className="form-control"
                style={{ paddingLeft: '44px', fontSize: '20px', fontWeight: '800', color: '#34d399' }}
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value)}
                autoFocus
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
              <Check size={18} /> Simpan Harga
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
