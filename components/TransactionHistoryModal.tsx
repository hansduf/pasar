'use client';

import React, { useState } from 'react';
import { X, History, ChevronDown, ChevronUp, ShoppingBag, RotateCcw } from 'lucide-react';
import { Transaction } from '../lib/supabase';

interface TransactionHistoryModalProps {
  transactions: Transaction[];
  isOpen: boolean;
  onClose: () => void;
  onReopenTransaction: (tx: Transaction) => void;
}

export default function TransactionHistoryModal({
  transactions,
  isOpen,
  onClose,
  onReopenTransaction,
}: TransactionHistoryModalProps) {
  if (!isOpen) return null;

  const [expandedTxId, setExpandedTxId] = useState<string | null>(null);

  const totalSalesToday = transactions.reduce((sum, tx) => sum + tx.total_amount, 0);

  const toggleExpand = (txId: string) => {
    setExpandedTxId(expandedTxId === txId ? null : txId);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxHeight: '92vh' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History size={22} color="var(--color-primary)" /> Riwayat Penjualan / Struk
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Daily Summary Box */}
        <div
          style={{
            background: 'var(--color-primary)',
            padding: '14px',
            borderRadius: '14px',
            color: '#ffffff',
            marginBottom: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div>
            <div style={{ fontSize: '13px', opacity: 0.9 }}>Total Omset Penjualan:</div>
            <div style={{ fontSize: '24px', fontWeight: '800' }}>
              Rp {totalSalesToday.toLocaleString('id-ID')}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>Total Transaksi</div>
            <div style={{ fontSize: '20px', fontWeight: '800' }}>{transactions.length} Nota</div>
          </div>
        </div>

        {/* Transactions List */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {transactions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              Belum ada transaksi tersimpan hari ini.
            </div>
          ) : (
            transactions.map((tx) => {
              const isExpanded = expandedTxId === tx.id;
              const itemCount = tx.items ? tx.items.length : 0;

              return (
                <div
                  key={tx.id}
                  style={{
                    background: '#ffffff',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '12px',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <div
                    onClick={() => toggleExpand(tx.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontWeight: '800', fontSize: '14px', color: 'var(--color-secondary)' }}>
                        {tx.transaction_no}
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {new Date(tx.created_at || Date.now()).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-main)' }}>
                          {tx.customer_name || 'Pelanggan Umum'}
                        </div>
                        {tx.notes && (
                          <div style={{ fontSize: '11px', color: '#d97706', fontWeight: 700, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span>📝 Catatan Nota:</span> {tx.notes}
                          </div>
                        )}
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                          <ShoppingBag size={12} /> {itemCount} jenis barang
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </div>
                      </div>
                      <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--color-primary)' }}>
                        Rp {tx.total_amount.toLocaleString('id-ID')}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Detail Items Breakdown & Re-open Button */}
                  {isExpanded && (
                    <div
                      style={{
                        marginTop: '10px',
                        paddingTop: '10px',
                        borderTop: '1px dashed var(--border-color)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        background: 'var(--bg-app)',
                        padding: '10px',
                        borderRadius: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)' }}>
                          Rincian Belanjaan Nota Ini:
                        </span>
                        {/* Feature 2: Re-open / Add items to completed transaction */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onReopenTransaction(tx);
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: 'var(--color-primary)',
                            color: '#ffffff',
                            border: 'none',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '700',
                            cursor: 'pointer',
                          }}
                        >
                          <RotateCcw size={12} /> Tambah Belanja Lagi
                        </button>
                      </div>

                      {tx.items && tx.items.map((item, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '13px',
                            borderBottom: idx < tx.items!.length - 1 ? '1px solid #e2e8f0' : 'none',
                            paddingBottom: '4px',
                          }}
                        >
                          <div>
                            <span style={{ fontWeight: '600' }}>{item.product_name}</span>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '6px' }}>
                              ({item.qty} {item.unit_name})
                            </span>
                            {item.notes && (
                              <div style={{ fontSize: '11px', color: 'var(--color-accent)', fontStyle: 'italic' }}>
                                * {item.notes}
                              </div>
                            )}
                          </div>
                          <span style={{ fontWeight: '700', color: 'var(--text-main)' }}>
                            Rp {item.subtotal.toLocaleString('id-ID')}
                          </span>
                        </div>
                      ))}

                      {tx.cash_received && tx.cash_received > 0 && (
                        <div
                          style={{
                            marginTop: '6px',
                            paddingTop: '6px',
                            borderTop: '1px dashed #cbd5e1',
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '11px',
                            fontWeight: '700',
                            color: 'var(--text-muted)',
                          }}
                        >
                          <span>💵 Uang Diterima: Rp {tx.cash_received.toLocaleString('id-ID')}</span>
                          <span style={{ color: 'var(--color-primary-hover)', fontWeight: '800' }}>
                            Kembalian: Rp {(tx.change_amount || 0).toLocaleString('id-ID')}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <button
          type="button"
          className="btn btn-secondary"
          style={{ marginTop: '16px' }}
          onClick={onClose}
        >
          Tutup
        </button>
      </div>
    </div>
  );
}
