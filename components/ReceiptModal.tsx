'use client';

import React, { useState } from 'react';
import { X, Printer, Share2, CheckCircle2, Store, ShoppingBag } from 'lucide-react';
import { Transaction } from '../lib/supabase';
import { generateReceiptText, printViaBluetooth } from '../lib/printer';

interface ReceiptModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ReceiptModal({
  transaction,
  isOpen,
  onClose,
}: ReceiptModalProps) {
  if (!isOpen || !transaction) return null;

  const [isPrinting, setIsPrinting] = useState(false);
  const thermalReceiptText = generateReceiptText(transaction);

  const handlePrintBluetooth = async () => {
    setIsPrinting(true);
    const success = await printViaBluetooth(transaction);
    setIsPrinting(false);
    if (success) {
      alert('Struk berhasil dikirim ke Printer Thermal Bluetooth!');
    }
  };

  const handleShareWhatsApp = () => {
    const encodedText = encodeURIComponent(thermalReceiptText);
    window.open(`https://wa.me/?text=${encodedText}`, '_blank');
  };

  const handleBrowserPrint = () => {
    window.print();
  };

  const dateFormatted = new Date(transaction.created_at || Date.now()).toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxHeight: '95vh' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary)' }}>
            <CheckCircle2 size={24} /> Transaksi Berhasil Disimpan!
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* 1. Stylish Web Digital Receipt Card (Tampilan Layar HP yang Cantik) */}
        <div className="web-receipt-card">
          <div className="web-receipt-header">
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', color: 'var(--color-primary)', fontWeight: '800', fontSize: '18px' }}>
              <Store size={22} /> TOKO PASAR GROSIR
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              No. Nota: <strong>{transaction.transaction_no}</strong>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {dateFormatted} • Pelanggan: <strong>{transaction.customer_name || 'Umum'}</strong>
            </div>
          </div>

          {/* Item Rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', margin: '10px 0' }}>
            {transaction.items && transaction.items.map((item, idx) => (
              <div key={idx} className="web-receipt-item-row">
                <div>
                  <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-main)' }}>
                    {item.product_name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {item.qty} {item.unit_name} {item.is_bonus ? '🎁 [BONUS GRATIS]' : `@ Rp ${item.price.toLocaleString('id-ID')}`}
                  </div>
                  {item.notes && (
                    <div style={{ fontSize: '11px', color: 'var(--color-secondary)', fontStyle: 'italic' }}>
                      * {item.notes}
                    </div>
                  )}
                </div>
                <div style={{ fontWeight: '800', fontSize: '14px', color: 'var(--text-main)' }}>
                  Rp {item.subtotal.toLocaleString('id-ID')}
                </div>
              </div>
            ))}
          </div>

          {/* Total Summary & Change Calculator */}
          <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '2px dashed var(--border-color)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-muted)' }}>Total Belanja:</span>
              <span style={{ fontSize: '20px', fontWeight: '800', color: 'var(--color-primary)' }}>
                Rp {transaction.total_amount.toLocaleString('id-ID')}
              </span>
            </div>

            {transaction.cash_received && transaction.cash_received > 0 && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Uang Diterima:</span>
                  <span style={{ fontWeight: '700', color: 'var(--text-main)' }}>
                    Rp {transaction.cash_received.toLocaleString('id-ID')}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', fontWeight: '800', color: 'var(--color-primary-hover)', background: 'var(--color-primary-light)', padding: '6px 10px', borderRadius: '8px', marginTop: '4px' }}>
                  <span>Uang Kembalian:</span>
                  <span>
                    Rp {(transaction.change_amount || 0).toLocaleString('id-ID')}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Hidden Monospace Plain Text Block specifically for Paper Thermal Print fallback */}
        <div id="printable-thermal-receipt" style={{ display: 'none' }}>
          {thermalReceiptText}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
          <button
            type="button"
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: '15px' }}
            onClick={handlePrintBluetooth}
            disabled={isPrinting}
          >
            <Printer size={18} /> {isPrinting ? 'Mencetak Bluetooth...' : 'Cetak Thermal Bluetooth'}
          </button>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ background: '#25D366', color: '#ffffff', border: 'none' }}
              onClick={handleShareWhatsApp}
            >
              <Share2 size={16} /> Kirim Struk WA
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleBrowserPrint}
            >
              Cetak Layar / PDF
            </button>
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            style={{ marginTop: '4px' }}
            onClick={onClose}
          >
            Tutup & Buka Nota Baru
          </button>
        </div>
      </div>
    </div>
  );
}
