'use client';

import React, { useState } from 'react';
import { X, Scale, DollarSign, Plus } from 'lucide-react';
import { Product } from '../lib/supabase';

interface BulkPriceModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, unitName: string, price: number, qty: number, notes: string, weightGram: number) => void;
}

export default function BulkPriceModal({
  product,
  isOpen,
  onClose,
  onAddToCart,
}: BulkPriceModalProps) {
  if (!isOpen || !product) return null;

  const baseUnit = product.units && product.units.length > 0 ? product.units[0] : { unit_name: 'Kg', price: 44000 };
  const pricePerKg = baseUnit.price;

  const [mode, setMode] = useState<'WEIGHT' | 'NOMINAL'>('WEIGHT');
  const [gramInput, setGramInput] = useState<string>('500');
  const [nominalInput, setNominalInput] = useState<string>('5000');

  // Calculations
  const currentGrams = parseFloat(gramInput) || 0;
  const priceFromWeight = Math.round((currentGrams / 1000) * pricePerKg);

  const currentNominal = parseFloat(nominalInput) || 0;
  const calculatedWeightFromNominal = Math.round((currentNominal / pricePerKg) * 1000);

  const handleAdd = () => {
    if (mode === 'WEIGHT') {
      if (currentGrams <= 0) return;
      const weightKg = currentGrams / 1000;
      const notes = `${currentGrams} gram (@ Rp ${pricePerKg.toLocaleString('id-ID')}/kg)`;
      onAddToCart(product, `${currentGrams}g`, priceFromWeight, 1, notes, currentGrams);
    } else {
      if (currentNominal <= 0) return;
      const notes = `Beli Rp ${currentNominal.toLocaleString('id-ID')} (${calculatedWeightFromNominal} gram)`;
      onAddToCart(product, `Rp ${currentNominal.toLocaleString('id-ID')}`, currentNominal, 1, notes, calculatedWeightFromNominal);
    }
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Scale size={20} color="var(--color-secondary)" /> Kalkulator Timbangan / Curah
          </div>
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
            <div style={{ fontSize: '13px', color: '#34d399', fontWeight: '700' }}>
              Harga Dasar: Rp {pricePerKg.toLocaleString('id-ID')} / Kg
            </div>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
          <button
            type="button"
            className={`btn ${mode === 'WEIGHT' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '14px', padding: '10px' }}
            onClick={() => setMode('WEIGHT')}
          >
            <Scale size={16} /> Berdasarkan Berat (Gram)
          </button>
          <button
            type="button"
            className={`btn ${mode === 'NOMINAL' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '14px', padding: '10px' }}
            onClick={() => setMode('NOMINAL')}
          >
            <DollarSign size={16} /> Beli Nominal Rp
          </button>
        </div>

        {mode === 'WEIGHT' ? (
          <div>
            <label style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-muted)' }}>
              Pilih / Ketik Berat (Gram):
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', margin: '8px 0 14px 0' }}>
              {['100', '250', '500', '1000'].map((g) => (
                <button
                  type="button"
                  key={g}
                  onClick={() => setGramInput(g)}
                  className={`category-pill ${gramInput === g ? 'active' : ''}`}
                  style={{ textAlign: 'center', justifyContent: 'center' }}
                >
                  {g === '1000' ? '1 Kg' : `${g}g`}
                </button>
              ))}
            </div>

            <div className="form-group">
              <input
                type="number"
                className="form-control"
                style={{ fontSize: '20px', fontWeight: '800', textAlign: 'center' }}
                value={gramInput}
                onChange={(e) => setGramInput(e.target.value)}
                placeholder="Jumlah Gram"
              />
            </div>

            <div style={{ background: 'var(--bg-app)', padding: '14px', borderRadius: '12px', textAlign: 'center', marginTop: '10px' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Total Harga Dihitung:</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#34d399' }}>
                Rp {priceFromWeight.toLocaleString('id-ID')}
              </div>
            </div>
          </div>
        ) : (
          <div>
            <label style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-muted)' }}>
              Pilih / Ketik Nominal Rp (Misal 5.000):
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', margin: '8px 0 14px 0' }}>
              {['2000', '5000', '10000', '20000'].map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => setNominalInput(r)}
                  className={`category-pill ${nominalInput === r ? 'active' : ''}`}
                  style={{ textAlign: 'center', justifyContent: 'center' }}
                >
                  Rp {parseInt(r).toLocaleString('id-ID')}
                </button>
              ))}
            </div>

            <div className="form-group">
              <input
                type="number"
                className="form-control"
                style={{ fontSize: '20px', fontWeight: '800', textAlign: 'center', color: '#f59e0b' }}
                value={nominalInput}
                onChange={(e) => setNominalInput(e.target.value)}
                placeholder="Nominal Rp"
              />
            </div>

            <div style={{ background: 'var(--bg-app)', padding: '14px', borderRadius: '12px', textAlign: 'center', marginTop: '10px' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Estimasi Hasil Timbangan:</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#38bdf8' }}>
                {calculatedWeightFromNominal} Gram ({ (calculatedWeightFromNominal / 1000).toFixed(2) } Kg)
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>
            Batal
          </button>
          <button type="button" className="btn btn-primary" style={{ flex: 1.5 }} onClick={handleAdd}>
            <Plus size={18} /> Masukkan Ke Nota
          </button>
        </div>
      </div>
    </div>
  );
}
