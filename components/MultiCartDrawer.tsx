'use client';

import React, { useState, useEffect } from 'react';
import { X, Trash2, Plus, Minus, Scissors, ShoppingBag, ArrowRight, Calculator, Scale, Gift } from 'lucide-react';
import { Cart, CartItem, Product } from '../lib/supabase';

interface MultiCartDrawerProps {
  cart: Cart;
  isOpen: boolean;
  onClose: () => void;
  onUpdateQty: (cartId: string, itemId: string, delta: number) => void;
  onRemoveItem: (cartId: string, itemId: string) => void;
  onOpenCustomPrice: (item: CartItem) => void;
  onOpenEditWeight: (item: CartItem) => void;
  onSwapChangeForProduct: (cartId: string, changeAmount: number) => void;
  onRenameCart: (cartId: string, newName: string) => void;
  onTogglePreparingStatus?: (cartId: string, isPreparing: boolean) => void;
  onCheckout: (cashReceived: number, changeAmount: number) => void;
}

export default function MultiCartDrawer({
  cart,
  isOpen,
  onClose,
  onUpdateQty,
  onRemoveItem,
  onOpenCustomPrice,
  onOpenEditWeight,
  onSwapChangeForProduct,
  onRenameCart,
  onTogglePreparingStatus,
  onCheckout,
}: MultiCartDrawerProps) {
  if (!isOpen) return null;

  const totalAmount = cart.items.reduce((sum, item) => sum + item.subtotal, 0);

  // Cash received & Change calculator state with dot formatting (e.g. 50.000)
  const [cashInput, setCashInput] = useState<string>(totalAmount.toString());

  useEffect(() => {
    setCashInput(totalAmount.toString());
  }, [totalAmount, isOpen]);

  // Clean raw digits for calculation
  const rawCashDigits = String(cashInput).replace(/\D/g, '');
  const cashReceived = parseFloat(rawCashDigits) || 0;
  const changeAmount = Math.max(0, cashReceived - totalAmount);

  // Formatted string display with dots (e.g. "50.000")
  const displayCashFormatted = cashReceived > 0 ? cashReceived.toLocaleString('id-ID') : '';

  const handleCashInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleanDigits = e.target.value.replace(/\D/g, '');
    setCashInput(cleanDigits);
  };

  const handleCheckoutClick = () => {
    if (cashReceived < totalAmount) {
      alert(`Uang tunai kurang! Tagihan: Rp ${totalAmount.toLocaleString('id-ID')}, Uang Diterima: Rp ${cashReceived.toLocaleString('id-ID')}`);
      return;
    }
    onCheckout(cashReceived, changeAmount);
  };

  const isPaidPreparing = cart.status === 'PAID_PREPARING';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxHeight: '95vh' }} onClick={(e) => e.stopPropagation()}>
        {/* Status Notification Banner if Paid/Preparing */}
        {isPaidPreparing && (
          <div
            style={{
              background: '#059669',
              color: '#ffffff',
              padding: '10px 14px',
              borderRadius: '10px 10px 0 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '12px',
              fontWeight: 800,
            }}
          >
            <span>🟢 SUDAH DIBAYAR — Barang Sedang Disiapkan</span>
            <button
              type="button"
              onClick={() => onTogglePreparingStatus?.(cart.id, false)}
              style={{
                background: '#ffffff',
                color: '#059669',
                border: 'none',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              ✅ Tandai Selesai Diambil
            </button>
          </div>
        )}

        {/* Cart Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingBag size={22} color="var(--color-primary)" />
            <div>
              <input
                type="text"
                value={cart.name}
                onChange={(e) => onRenameCart(cart.id, e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-main)',
                  fontSize: '18px',
                  fontWeight: '800',
                  outline: 'none',
                  borderBottom: '1px dashed var(--border-color)',
                  paddingBottom: '2px',
                  width: '180px',
                }}
              />
              {cart.notes && (
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', marginTop: '2px' }}>
                  📝 {cart.notes}
                </div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {cart.items.length > 0 && !isPaidPreparing && (
              <button
                type="button"
                onClick={() => onTogglePreparingStatus?.(cart.id, true)}
                style={{
                  background: '#fef3c7',
                  color: '#b45309',
                  border: '1px solid #fde68a',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                ⏳ Tandai Disiapkan
              </button>
            )}
            <button className="modal-close-btn" onClick={onClose}>
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Cart Items List */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px' }}>
          {cart.items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              <ShoppingBag size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
              <div style={{ fontWeight: '700', fontSize: '16px' }}>Nota ini masih kosong</div>
              <div style={{ fontSize: '13px', marginTop: '4px' }}>Pilih produk dari katalog di depan untuk menambah barang.</div>
            </div>
          ) : (
            cart.items.map((item) => (
              <div
                key={item.id}
                style={{
                  background: item.is_bonus ? 'var(--color-accent-light)' : '#ffffff',
                  border: item.is_bonus ? '1px solid rgba(217, 119, 6, 0.4)' : '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-main)' }}>{item.product_name}</div>
                    <div style={{ fontSize: '13px', color: item.is_bonus ? 'var(--color-accent)' : 'var(--text-muted)' }}>
                      {item.unit_name} {item.is_bonus ? '🎁 [BONUS GRATIS]' : `@ Rp ${item.price.toLocaleString('id-ID')}`}
                    </div>
                    {item.notes && (
                      <div style={{ fontSize: '12px', color: 'var(--color-secondary)', fontStyle: 'italic', marginTop: '2px' }}>
                        * {item.notes}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => onRemoveItem(cart.id, item.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                {/* Controls & Price */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', flexWrap: 'wrap', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    {/* Qty modifier buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                      <button
                        onClick={() => onUpdateQty(cart.id, item.id, -1)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-main)', padding: '6px 10px', cursor: 'pointer' }}
                      >
                        <Minus size={14} />
                      </button>
                      <span style={{ fontWeight: '800', fontSize: '14px', padding: '0 8px' }}>{item.qty}</span>
                      <button
                        onClick={() => onUpdateQty(cart.id, item.id, 1)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-main)', padding: '6px 10px', cursor: 'pointer' }}
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    {/* Edit Weight Button if Timbangan item */}
                    {item.is_bulk && (
                      <button
                        onClick={() => onOpenEditWeight(item)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: 'var(--color-secondary-light)',
                          color: 'var(--color-secondary)',
                          border: '1px solid rgba(2, 132, 199, 0.3)',
                          borderRadius: '8px',
                          padding: '6px 10px',
                          fontSize: '12px',
                          fontWeight: '700',
                          cursor: 'pointer',
                        }}
                      >
                        <Scale size={14} /> Ubah Berat
                      </button>
                    )}

                    {/* Custom price / discount button */}
                    <button
                      onClick={() => onOpenCustomPrice(item)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: 'var(--color-accent-light)',
                        color: 'var(--color-accent)',
                        border: '1px solid rgba(217, 119, 6, 0.3)',
                        borderRadius: '8px',
                        padding: '6px 10px',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                      }}
                    >
                      <Scissors size={14} /> Ubah/Diskon
                    </button>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--color-primary)' }}>
                      Rp {item.subtotal.toLocaleString('id-ID')}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Kalkulator Uang Kembalian & Swap Change for Item */}
        {cart.items.length > 0 && (
          <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '2px dashed var(--border-color)' }}>
            {/* Total Belanja */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '15px', color: 'var(--text-muted)', fontWeight: '700' }}>Total Belanja:</span>
              <span style={{ fontSize: '22px', fontWeight: '800', color: 'var(--color-primary)' }}>
                Rp {totalAmount.toLocaleString('id-ID')}
              </span>
            </div>

            {/* Cash & Change Calculator Box */}
            <div style={{ background: 'var(--bg-app)', padding: '12px', borderRadius: '12px', marginBottom: '12px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '6px' }}>
                <Calculator size={16} color="var(--color-secondary)" /> Kalkulator Uang & Kembalian:
              </div>

              {/* Quick Cash Presets */}
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '6px', marginBottom: '8px', scrollbarWidth: 'none' }}>
                <button
                  type="button"
                  onClick={() => setCashInput(totalAmount.toString())}
                  className="category-pill"
                  style={{ fontSize: '12px', padding: '4px 10px' }}
                >
                  Uang Pas (Rp {totalAmount.toLocaleString('id-ID')})
                </button>
                {[50000, 100000, 150000, 200000].map((nominal) => (
                  <button
                    type="button"
                    key={nominal}
                    onClick={() => setCashInput(nominal.toString())}
                    className="category-pill"
                    style={{ fontSize: '12px', padding: '4px 10px' }}
                  >
                    Rp {nominal.toLocaleString('id-ID')}
                  </button>
                ))}
              </div>

              {/* Input Uang Diterima & Kembalian Display */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Uang Diterima (Rp):</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="form-control"
                    style={{ fontSize: '17px', fontWeight: '800', padding: '8px 10px', color: 'var(--color-secondary)' }}
                    placeholder="0"
                    value={displayCashFormatted}
                    onChange={handleCashInputChange}
                  />
                </div>

                <div style={{ textAlign: 'right', background: 'var(--color-primary-light)', padding: '8px 10px', borderRadius: '8px', border: '1px solid rgba(5,150,105,0.2)' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--color-primary-hover)' }}>Uang Kembalian:</div>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--color-primary-hover)' }}>
                    Rp {changeAmount.toLocaleString('id-ID')}
                  </div>
                </div>
              </div>

              {/* Feature 3: Swap Change for Item (e.g. Royco 1 Pcs) */}
              {changeAmount > 0 && (
                <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', color: 'var(--color-accent)', fontWeight: '700' }}>
                    💡 Kembalian Rp {changeAmount.toLocaleString('id-ID')} mau diganti barang?
                  </span>
                  <button
                    type="button"
                    onClick={() => onSwapChangeForProduct(cart.id, changeAmount)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: 'var(--color-accent)',
                      color: '#ffffff',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '800',
                      cursor: 'pointer',
                    }}
                  >
                    <Gift size={14} /> Ganti Royco / Barang
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={handleCheckoutClick}
              className="btn btn-primary"
              style={{ width: '100%', padding: '14px', fontSize: '16px', borderRadius: '12px' }}
            >
              Proses Bayar & Simpan Nota <ArrowRight size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
