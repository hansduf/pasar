'use client';

import React, { useState } from 'react';
import { X, Scale, DollarSign, Plus } from 'lucide-react';
import { Product } from '../lib/supabase';

interface BulkPriceModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (
    product: Product,
    unitName: string,
    price: number,
    qty: number,
    notes: string,
    weightGram: number
  ) => void;
}

export default function BulkPriceModal({
  product,
  isOpen,
  onClose,
  onAddToCart,
}: BulkPriceModalProps) {
  if (!isOpen || !product) return null;

  // Find units if configured
  const unitsList = product.units || [];
  const u1Kg = unitsList.find((u) => u.unit_name === '1 Kg' || u.unit_name === 'Kg') || unitsList[0];
  const pricePerKg = u1Kg?.price || 44000;

  // Find weight tier custom prices if set
  const u500 = unitsList.find((u) => u.unit_name === '500g');
  const u250 = unitsList.find((u) => u.unit_name === '250g');
  const u100 = unitsList.find((u) => u.unit_name === '100g');
  const u50 = unitsList.find((u) => u.unit_name === '50g');

  const price500g = u500?.price || Math.round(pricePerKg * 0.5);
  const price250g = u250?.price || Math.round(pricePerKg * 0.25);
  const price100g = u100?.price || Math.round(pricePerKg * 0.1);
  const price50g = u50?.price || Math.round(pricePerKg * 0.05);

  const [mode, setMode] = useState<'WEIGHT' | 'NOMINAL'>('WEIGHT');
  const [gramInput, setGramInput] = useState<string>('500');
  const [nominalInput, setNominalInput] = useState<string>('5000');

  const currentGrams = parseFloat(gramInput) || 0;

  // Exact tier price lookup if matching standard weight size
  let calculatedPriceFromWeight = 0;
  if (currentGrams === 1000) {
    calculatedPriceFromWeight = pricePerKg;
  } else if (currentGrams === 500) {
    calculatedPriceFromWeight = price500g;
  } else if (currentGrams === 250) {
    calculatedPriceFromWeight = price250g;
  } else if (currentGrams === 100) {
    calculatedPriceFromWeight = price100g;
  } else if (currentGrams === 50) {
    calculatedPriceFromWeight = price50g;
  } else {
    // Proportional calculation for arbitrary custom gram input (e.g. 400g)
    calculatedPriceFromWeight = Math.round((currentGrams / 1000) * pricePerKg);
  }

  const currentNominal = parseFloat(nominalInput) || 0;
  const calculatedWeightFromNominal = Math.round((currentNominal / pricePerKg) * 1000);

  const handleSelectPresetGram = (grams: number) => {
    setGramInput(String(grams));
  };

  const handleAdd = () => {
    if (mode === 'WEIGHT') {
      if (currentGrams <= 0) return;
      const notes = `${currentGrams} gram`;
      onAddToCart(product, `${currentGrams}g`, calculatedPriceFromWeight, 1, notes, currentGrams);
    } else {
      if (currentNominal <= 0) return;
      const notes = `Beli Rp ${currentNominal.toLocaleString('id-ID')} (${calculatedWeightFromNominal} gram)`;
      onAddToCart(
        product,
        `Rp ${currentNominal.toLocaleString('id-ID')}`,
        currentNominal,
        1,
        notes,
        calculatedWeightFromNominal
      );
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
            <X size={22} />
          </button>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '14px',
            background: 'var(--color-secondary-light)',
            border: '1px solid rgba(2, 132, 199, 0.2)',
            padding: '10px 12px',
            borderRadius: '12px',
          }}
        >
          <img
            src={product.image_url || 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=200&auto=format&fit=crop&q=80'}
            alt={product.name}
            style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '8px' }}
          />
          <div>
            <div style={{ fontWeight: '800', fontSize: '14px' }}>{product.name}</div>
            <div style={{ fontSize: '12px', color: 'var(--color-secondary)', fontWeight: '800' }}>
              Harga 1 Kg: Rp {pricePerKg.toLocaleString('id-ID')}
            </div>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
          <button
            type="button"
            className={`btn ${mode === 'WEIGHT' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '13px', padding: '8px 10px' }}
            onClick={() => setMode('WEIGHT')}
          >
            <Scale size={16} /> Berdasarkan Berat (Gram)
          </button>
          <button
            type="button"
            className={`btn ${mode === 'NOMINAL' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '13px', padding: '8px 10px' }}
            onClick={() => setMode('NOMINAL')}
          >
            <DollarSign size={16} /> Beli Nominal Rp
          </button>
        </div>

        {mode === 'WEIGHT' ? (
          <div>
            <label style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
              ⚡ Pilih Ukuran Timbangan Paling Sering (1-Tap):
            </label>

            {/* 5 Preset Weight Tier Buttons with Configured Tier Prices */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '12px' }}>
              <button
                type="button"
                onClick={() => handleSelectPresetGram(50)}
                style={{
                  padding: '8px 4px',
                  borderRadius: '8px',
                  border: currentGrams === 50 ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
                  background: currentGrams === 50 ? 'var(--color-primary-light)' : '#ffffff',
                  textAlign: 'center',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 800 }}>50 gram</div>
                <div style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: 800 }}>
                  Rp {price50g.toLocaleString('id-ID')}
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPresetGram(100)}
                style={{
                  padding: '8px 4px',
                  borderRadius: '8px',
                  border: currentGrams === 100 ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
                  background: currentGrams === 100 ? 'var(--color-primary-light)' : '#ffffff',
                  textAlign: 'center',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 800 }}>100 gram</div>
                <div style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: 800 }}>
                  Rp {price100g.toLocaleString('id-ID')}
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPresetGram(250)}
                style={{
                  padding: '8px 4px',
                  borderRadius: '8px',
                  border: currentGrams === 250 ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
                  background: currentGrams === 250 ? 'var(--color-primary-light)' : '#ffffff',
                  textAlign: 'center',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 800 }}>250g (1/4 kg)</div>
                <div style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: 800 }}>
                  Rp {price250g.toLocaleString('id-ID')}
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPresetGram(500)}
                style={{
                  padding: '8px 4px',
                  borderRadius: '8px',
                  border: currentGrams === 500 ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
                  background: currentGrams === 500 ? 'var(--color-primary-light)' : '#ffffff',
                  textAlign: 'center',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 800 }}>500g (1/2 kg)</div>
                <div style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: 800 }}>
                  Rp {price500g.toLocaleString('id-ID')}
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPresetGram(1000)}
                style={{
                  padding: '8px 4px',
                  borderRadius: '8px',
                  border: currentGrams === 1000 ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
                  background: currentGrams === 1000 ? 'var(--color-primary-light)' : '#ffffff',
                  textAlign: 'center',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 800 }}>1 Kg (1000g)</div>
                <div style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: 800 }}>
                  Rp {pricePerKg.toLocaleString('id-ID')}
                </div>
              </button>
            </div>

            {/* Custom Input Gram */}
            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label>Atau Ketik Berat Khusus (Gram):</label>
              <input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                className="form-control"
                style={{ fontSize: '16px', fontWeight: '800', padding: '10px 12px' }}
                placeholder="Contoh: 350"
                value={gramInput}
                onChange={(e) => setGramInput(e.target.value)}
              />
            </div>

            {/* Calculated Result Card */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid var(--border-color)',
                padding: '12px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Harga Berat Ini:</div>
                <div style={{ fontSize: '20px', fontWeight: '900', color: 'var(--color-primary)' }}>
                  Rp {calculatedPriceFromWeight.toLocaleString('id-ID')}
                </div>
              </div>
              <div style={{ fontSize: '11px', textAlign: 'right', color: 'var(--text-muted)' }}>
                {currentGrams} gram
              </div>
            </div>
          </div>
        ) : (
          <div>
            {/* Nominal Rp Mode */}
            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label>Ketik Uang Pelanggan (Rp):</label>
              <input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                className="form-control"
                style={{ fontSize: '16px', fontWeight: '800', padding: '10px 12px' }}
                placeholder="Contoh: 5000"
                value={nominalInput}
                onChange={(e) => setNominalInput(e.target.value)}
              />
            </div>

            {/* Preset Nominal Quick Pills */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
              {['2000', '3000', '5000', '10000', '15000', '20000'].map((nom) => (
                <button
                  type="button"
                  key={nom}
                  onClick={() => setNominalInput(nom)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '700',
                    background: nominalInput === nom ? 'var(--color-primary-light)' : '#ffffff',
                    border: nominalInput === nom ? '1px solid var(--color-primary)' : '1px solid var(--border-color)',
                    color: nominalInput === nom ? 'var(--color-primary)' : 'var(--text-main)',
                    cursor: 'pointer',
                  }}
                >
                  Rp {parseInt(nom).toLocaleString('id-ID')}
                </button>
              ))}
            </div>

            {/* Calculated Result Card */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid var(--border-color)',
                padding: '12px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Dapat Timbangan:</div>
                <div style={{ fontSize: '20px', fontWeight: '900', color: 'var(--color-secondary)' }}>
                  {calculatedWeightFromNominal} Gram
                </div>
              </div>
              <div style={{ fontSize: '11px', textAlign: 'right', color: 'var(--text-muted)' }}>
                Rp {currentNominal.toLocaleString('id-ID')}
              </div>
            </div>
          </div>
        )}

        <button type="button" className="btn btn-primary" style={{ width: '100%', padding: '12px' }} onClick={handleAdd}>
          <Plus size={18} /> Masukkan Ke Nota
        </button>
      </div>
    </div>
  );
}
