'use client';

import React, { useState } from 'react';
import {
  TrendingUp,
  ShoppingBag,
  DollarSign,
  Calendar,
  Search,
  Printer,
  RotateCcw,
  Award,
  ChevronRight,
  FileText,
} from 'lucide-react';
import { Transaction, CartItem } from '../lib/supabase';

interface SalesReportViewProps {
  transactions: Transaction[];
  onReprintReceipt: (tx: Transaction) => void;
  onReopenTransaction: (tx: Transaction) => void;
}

export default function SalesReportView({
  transactions,
  onReprintReceipt,
  onReopenTransaction,
}: SalesReportViewProps) {
  const [timeFilter, setTimeFilter] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH'>('TODAY');
  const [searchQuery, setSearchQuery] = useState('');

  // Date filtering logic
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  const filteredTransactions = transactions.filter((tx) => {
    const txDateStr = tx.created_at ? tx.created_at.slice(0, 10) : '';

    if (timeFilter === 'TODAY' && txDateStr !== todayStr) return false;

    if (timeFilter === 'WEEK') {
      const txDate = new Date(tx.created_at);
      const diffTime = Math.abs(now.getTime() - txDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 7) return false;
    }

    if (timeFilter === 'MONTH') {
      const txDateStrMonth = tx.created_at ? tx.created_at.slice(0, 7) : '';
      const currentMonthStr = now.toISOString().slice(0, 7);
      if (txDateStrMonth !== currentMonthStr) return false;
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchCustomer = tx.customer_name?.toLowerCase().includes(query);
      const matchNo = tx.transaction_no?.toLowerCase().includes(query);
      const matchItem = tx.items?.some((i) => i.product_name?.toLowerCase().includes(query));
      return matchCustomer || matchNo || matchItem;
    }

    return true;
  });

  // Calculate Metrics
  const totalOmset = filteredTransactions.reduce((sum, tx) => sum + tx.total_amount, 0);
  const totalNotaCount = filteredTransactions.length;

  let totalItemsSold = 0;
  const productSalesMap: Record<string, { name: string; qty: number; total: number }> = {};

  filteredTransactions.forEach((tx) => {
    if (tx.items) {
      tx.items.forEach((item: CartItem) => {
        totalItemsSold += item.qty;
        if (!productSalesMap[item.product_name]) {
          productSalesMap[item.product_name] = { name: item.product_name, qty: 0, total: 0 };
        }
        productSalesMap[item.product_name].qty += item.qty;
        productSalesMap[item.product_name].total += item.subtotal;
      });
    }
  });

  const avgBasketSize = totalNotaCount > 0 ? Math.round(totalOmset / totalNotaCount) : 0;

  // Rank Top Products
  const topProducts = Object.values(productSalesMap)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  return (
    <div style={{ paddingBottom: '80px' }}>
      {/* Header & Date Filter Switcher */}
      <div style={{ background: '#ffffff', border: '1px solid var(--border-color)', padding: '12px', borderRadius: '12px', marginBottom: '14px', boxShadow: 'var(--shadow-xs)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '900', fontSize: '15px' }}>
            <TrendingUp size={20} color="var(--color-primary)" /> Laporan Penjualan & Omset
          </div>
          <span style={{ fontSize: '11px', background: 'var(--color-primary-light)', color: 'var(--color-primary)', padding: '4px 8px', borderRadius: '6px', fontWeight: '800' }}>
            {filteredTransactions.length} Transaksi
          </span>
        </div>

        {/* Time Pills */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
          {[
            { key: 'TODAY', label: 'Hari Ini' },
            { key: 'WEEK', label: '7 Hari' },
            { key: 'MONTH', label: 'Bulan Ini' },
            { key: 'ALL', label: 'Semua' },
          ].map((pill) => (
            <button
              key={pill.key}
              type="button"
              onClick={() => setTimeFilter(pill.key as any)}
              style={{
                padding: '6px 4px',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: '800',
                border: timeFilter === pill.key ? '1px solid var(--color-primary)' : '1px solid var(--border-color)',
                background: timeFilter === pill.key ? 'var(--color-primary-light)' : '#ffffff',
                color: timeFilter === pill.key ? 'var(--color-primary)' : 'var(--text-main)',
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
        <div
          style={{
            background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
            color: '#ffffff',
            padding: '12px',
            borderRadius: '12px',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <div style={{ fontSize: '11px', opacity: 0.9, fontWeight: '700' }}>💰 Total Pendapatan / Omset</div>
          <div style={{ fontSize: '18px', fontWeight: '900', marginTop: '4px' }}>
            Rp {totalOmset.toLocaleString('id-ID')}
          </div>
          <div style={{ fontSize: '10px', opacity: 0.8, marginTop: '2px' }}>
            Dari {totalNotaCount} nota selesai
          </div>
        </div>

        <div
          style={{
            background: '#ffffff',
            border: '1px solid var(--border-color)',
            padding: '12px',
            borderRadius: '12px',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700' }}>🛒 Total Barang Terjual</div>
          <div style={{ fontSize: '18px', fontWeight: '900', color: 'var(--color-secondary)', marginTop: '4px' }}>
            {totalItemsSold} Unit / Item
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Rata-rata: Rp {avgBasketSize.toLocaleString('id-ID')} / Nota
          </div>
        </div>
      </div>

      {/* Top 5 Products Ranking Section */}
      {topProducts.length > 0 && (
        <div
          style={{
            background: '#ffffff',
            border: '1px solid var(--border-color)',
            padding: '12px',
            borderRadius: '12px',
            marginBottom: '14px',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '800', fontSize: '13px', marginBottom: '10px' }}>
            <Award size={16} color="#eab308" /> 🏆 Barang Paling Laris
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {topProducts.map((prod, idx) => (
              <div
                key={prod.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 8px',
                  background: 'var(--color-secondary-light)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      fontWeight: '900',
                      color: idx === 0 ? '#ea580c' : 'var(--text-muted)',
                      fontSize: '12px',
                      width: '18px',
                    }}
                  >
                    #{idx + 1}
                  </span>
                  <span style={{ fontWeight: '700' }}>{prod.name}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontWeight: '800', color: 'var(--color-secondary)' }}>{prod.qty} Terjual</span>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Rp {prod.total.toLocaleString('id-ID')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search & Transaction History List */}
      <div style={{ background: '#ffffff', border: '1px solid var(--border-color)', padding: '12px', borderRadius: '12px', boxShadow: 'var(--shadow-xs)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ fontWeight: '800', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FileText size={16} color="var(--color-primary)" /> Rincian Nota Penjualan
          </div>
        </div>

        {/* Search input */}
        <div className="search-input-wrapper" style={{ marginBottom: '10px' }}>
          <Search className="search-icon" size={16} />
          <input
            type="text"
            placeholder="Cari nama pelanggan (Pak Joko), no nota, barang..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ fontSize: '12px', padding: '8px 10px 8px 34px' }}
          />
        </div>

        {filteredTransactions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)', fontSize: '13px' }}>
            Belum ada nota penjualan dalam rentang waktu ini.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredTransactions.map((tx) => (
              <div
                key={tx.id}
                style={{
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  background: '#ffffff',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                  <div>
                    <div style={{ fontWeight: '900', fontSize: '13px', color: 'var(--text-main)' }}>
                      👤 {tx.customer_name || 'Pelanggan Umum'}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      {tx.transaction_no} • {tx.created_at ? new Date(tx.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : ''}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '14px', fontWeight: '900', color: 'var(--color-primary)' }}>
                      Rp {tx.total_amount.toLocaleString('id-ID')}
                    </div>
                    <span style={{ fontSize: '10px', background: '#dcfce7', color: '#15803d', padding: '2px 6px', borderRadius: '4px', fontWeight: '800' }}>
                      Lunas ({tx.payment_method || 'Tunai'})
                    </span>
                  </div>
                </div>

                {/* Item List Preview */}
                {tx.items && tx.items.length > 0 && (
                  <div style={{ background: 'var(--bg-app)', padding: '6px 8px', borderRadius: '6px', fontSize: '11px', marginBottom: '8px', color: 'var(--text-muted)' }}>
                    {tx.items.map((item, idx) => (
                      <span key={idx}>
                        {item.product_name} ({item.unit_name} x{item.qty})
                        {idx < (tx.items?.length || 0) - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => onReopenTransaction(tx)}
                    className="btn btn-secondary"
                    style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '6px' }}
                  >
                    <RotateCcw size={12} /> Buka / Tambah Belanja
                  </button>
                  <button
                    type="button"
                    onClick={() => onReprintReceipt(tx)}
                    className="btn btn-primary"
                    style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '6px' }}
                  >
                    <Printer size={12} /> Struk
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
