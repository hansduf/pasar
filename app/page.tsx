'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  ShoppingBag,
  History,
  Camera,
  Edit2,
  Sparkles,
  Scale,
  CheckCircle,
  Store,
  ChevronRight,
  LayoutGrid,
  List,
} from 'lucide-react';
import {
  Product,
  ProductUnit,
  Cart,
  CartItem,
  Transaction,
  INITIAL_MOCK_PRODUCTS,
  supabase,
} from '../lib/supabase';

// Components
import AddProductModal from '../components/AddProductModal';
import QuickPriceEditModal from '../components/QuickPriceEditModal';
import BulkPriceModal from '../components/BulkPriceModal';
import CartItemCustomPriceModal from '../components/CartItemCustomPriceModal';
import MultiCartDrawer from '../components/MultiCartDrawer';
import ReceiptModal from '../components/ReceiptModal';
import TransactionHistoryModal from '../components/TransactionHistoryModal';

export default function POSDashboard() {
  // Products & Categories
  const [products, setProducts] = useState<Product[]>(INITIAL_MOCK_PRODUCTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');

  // View Mode: GRID vs LIST (File Manager Style)
  const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('GRID');

  // Multi-Cart State (Tabs: Nota 1, Nota 2, etc.)
  const [carts, setCarts] = useState<Cart[]>([
    { id: 'nota-1', name: 'Nota 1', items: [] },
    { id: 'nota-2', name: 'Nota 2', items: [] },
  ]);
  const [activeCartId, setActiveCartId] = useState<string>('nota-1');

  // Transaction History State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [latestTransaction, setLatestTransaction] = useState<Transaction | null>(null);

  // Modals state
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingPriceProduct, setEditingPriceProduct] = useState<Product | null>(null);
  const [bulkProduct, setBulkProduct] = useState<Product | null>(null);
  const [customPriceCartItem, setCustomPriceCartItem] = useState<CartItem | null>(null);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Load / Sync from LocalStorage or Supabase
  useEffect(() => {
    const savedCarts = localStorage.getItem('pasar_pos_carts');
    if (savedCarts) {
      try {
        setCarts(JSON.parse(savedCarts));
      } catch (e) {}
    }

    const savedProds = localStorage.getItem('pasar_pos_products');
    if (savedProds) {
      try {
        const parsed = JSON.parse(savedProds);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge missing initial mock products if not present
          const existingIds = new Set(parsed.map((p: Product) => p.id));
          const missingMocks = INITIAL_MOCK_PRODUCTS.filter((m) => !existingIds.has(m.id));
          setProducts([...parsed, ...missingMocks]);
        }
      } catch (e) {}
    }

    const savedTx = localStorage.getItem('pasar_pos_transactions');
    if (savedTx) {
      try {
        setTransactions(JSON.parse(savedTx));
      } catch (e) {}
    }

    // Attempt Supabase fetch if available
    fetchProductsFromSupabase();
  }, []);

  // Save carts to localStorage whenever updated
  useEffect(() => {
    localStorage.setItem('pasar_pos_carts', JSON.stringify(carts));
  }, [carts]);

  // Save products to localStorage
  useEffect(() => {
    localStorage.setItem('pasar_pos_products', JSON.stringify(products));
  }, [products]);

  // Save transactions to localStorage
  useEffect(() => {
    localStorage.setItem('pasar_pos_transactions', JSON.stringify(transactions));
  }, [transactions]);

  const fetchProductsFromSupabase = async () => {
    try {
      const { data, error } = await supabase.rpc('get_products_with_units', {
        search_query: '',
        category_filter: 'Semua',
      });
      if (!error && data && Array.isArray(data) && data.length > 0) {
        setProducts(data);
      }
    } catch (err) {
      // Fallback to local mock data
    }
  };

  const activeCart = carts.find((c) => c.id === activeCartId) || carts[0];
  const activeCartItemCount = activeCart.items.reduce((sum, item) => sum + item.qty, 0);
  const activeCartTotal = activeCart.items.reduce((sum, item) => sum + item.subtotal, 0);

  // Tab Multi-Nota Handlers
  const handleAddCartTab = () => {
    const nextNum = carts.length + 1;
    const newCartId = `nota-${Date.now()}`;
    const newCart: Cart = { id: newCartId, name: `Nota ${nextNum}`, items: [] };
    setCarts([...carts, newCart]);
    setActiveCartId(newCartId);
  };

  const handleRenameCart = (cartId: string, newName: string) => {
    setCarts(
      carts.map((c) => (c.id === cartId ? { ...c, name: newName } : c))
    );
  };

  // Editing Cart Item ID for Ubah Berat replacement
  const [editingCartItemId, setEditingCartItemId] = useState<string | null>(null);

  // Add Item to Active Cart with Automatic Buy X Get Y Promo logic
  const handleAddToCart = (
    product: Product,
    unitName: string,
    rawUnitPrice: number,
    rawAddQty = 1,
    notes = '',
    weightGram?: number
  ) => {
    const unitPrice = Number(rawUnitPrice) || 0;
    const addQty = Number(rawAddQty) || 1;

    setCarts((prevCarts) => {
      return prevCarts.map((cart) => {
        if (cart.id !== activeCartId) return cart;

        // If editing an existing item from cart (e.g. Ubah Berat), remove old line item first
        let updatedItems = editingCartItemId
          ? cart.items.filter((i) => i.id !== editingCartItemId)
          : [...cart.items];

        const lineId = `${product.id}-${unitName}`;
        const existingItemIndex = updatedItems.findIndex((i) => i.id === lineId);

        let targetQty = addQty;
        if (existingItemIndex >= 0) {
          targetQty = Number(updatedItems[existingItemIndex].qty) + addQty;
        }

        // Apply Buy X Get Y Promo calculation
        let paidQty = targetQty;
        let isBonus = false;
        let finalSubtotal = targetQty * unitPrice;

        const buyQty = Number(product.promo_buy_qty) || 0;
        const getQty = Number(product.promo_get_qty) || 0;

        if (buyQty > 0 && getQty > 0) {
          const promoSetSize = buyQty + getQty; // e.g. 5 + 1 = 6
          const fullPromoSets = Math.floor(targetQty / promoSetSize);
          const freeItemsCount = fullPromoSets * getQty;
          paidQty = Math.max(0, targetQty - freeItemsCount);
          finalSubtotal = paidQty * unitPrice;

          if (freeItemsCount > 0) {
            notes = notes
              ? `${notes} | 🎁 Dapat ${freeItemsCount} Bonus Gratis`
              : `🎁 Free ${freeItemsCount} pcs (Promo ${product.promo_info || 'Buy 5 Get 1'})`;
          }
        }

        const newCartItem: CartItem = {
          id: lineId,
          product_id: product.id,
          product_name: product.name,
          unit_name: unitName,
          price: unitPrice,
          qty: targetQty,
          discount_amount: 0,
          is_bonus: isBonus,
          subtotal: Math.round(finalSubtotal),
          notes: notes,
          image_url: product.image_url,
          is_bulk: product.is_bulk,
          bulk_weight_gram: weightGram,
        };

        if (existingItemIndex >= 0) {
          updatedItems[existingItemIndex] = newCartItem;
        } else {
          updatedItems.push(newCartItem);
        }

        return { ...cart, items: updatedItems };
      });
    });

    setEditingCartItemId(null);
  };

  const handleUpdateQty = (cartId: string, itemId: string, delta: number) => {
    setCarts((prevCarts) =>
      prevCarts.map((cart) => {
        if (cart.id !== cartId) return cart;

        const updatedItems = cart.items
          .map((item) => {
            if (item.id !== itemId) return item;
            const newQty = Number(item.qty) + Number(delta);
            if (newQty <= 0) return null;

            const unitPrice = Number(item.price) || 0;
            const discount = Number(item.discount_amount) || 0;
            const newSubtotal = Math.round(newQty * unitPrice - discount);
            return { ...item, qty: newQty, subtotal: Math.max(0, newSubtotal) };
          })
          .filter(Boolean) as CartItem[];

        return { ...cart, items: updatedItems };
      })
    );
  };

  const handleRemoveItem = (cartId: string, itemId: string) => {
    setCarts((prevCarts) =>
      prevCarts.map((cart) => {
        if (cart.id !== cartId) return cart;
        return { ...cart, items: cart.items.filter((i) => i.id !== itemId) };
      })
    );
  };

  // Custom Item Price Override / Diskon (for damaged goods / negotiated price)
  const handleSaveCustomPrice = (
    itemId: string,
    rawNewPrice: number,
    rawDiscountAmount: number,
    notes: string
  ) => {
    const newPrice = Number(rawNewPrice) || 0;
    const discountAmount = Number(rawDiscountAmount) || 0;

    setCarts((prevCarts) =>
      prevCarts.map((cart) => {
        if (cart.id !== activeCartId) return cart;

        const updatedItems = cart.items.map((item) => {
          if (item.id !== itemId) return item;
          const subtotal = Math.max(0, Math.round(Number(item.qty) * newPrice - discountAmount));
          return {
            ...item,
            price: newPrice,
            discount_amount: discountAmount,
            notes: notes || 'Harga Khusus',
            subtotal,
          };
        });

        return { ...cart, items: updatedItems };
      })
    );
  };

  // 1-Tap Quick Price Update on Catalog Card (UX Ayah/Toko)
  const handleSaveProductPrice = async (productId: string, unitId: string, newPrice: number) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        const updatedUnits = p.units.map((u) => (u.id === unitId ? { ...u, price: newPrice } : u));
        return { ...p, units: updatedUnits };
      })
    );

    // Call Supabase RPC
    try {
      await supabase.rpc('update_product_unit_price', {
        p_unit_id: unitId,
        p_new_price: newPrice,
      });
    } catch (e) {}
  };

  // Product Created Handler
  const handleProductCreated = (newProd: Product) => {
    setProducts([newProd, ...products]);
  };

  // Product Updated Handler (Multi-Satuan & Photo Update)
  const handleProductUpdated = (updatedProd: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === updatedProd.id ? updatedProd : p)));
    setEditingProduct(null);
  };

  // Product Deleted Handler
  const handleProductDeleted = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    setEditingProduct(null);
  };

  // Feature 1: Edit Weight from cart line item
  const handleEditWeightFromCart = (item: CartItem) => {
    const matchedProduct = products.find((p) => p.id === item.product_id);
    if (matchedProduct) {
      setEditingCartItemId(item.id);
      setBulkProduct(matchedProduct);
      setIsCartDrawerOpen(false);
    }
  };

  // Feature 2: Re-open completed transaction to add more items
  const handleReopenTransaction = (tx: Transaction) => {
    if (!tx.items || tx.items.length === 0) return;
    const newCartId = `nota-reopen-${Date.now()}`;
    const reopenedCart: Cart = {
      id: newCartId,
      name: `Lanjutan ${tx.transaction_no.slice(-7)}`,
      items: [...tx.items],
    };

    setCarts([...carts, reopenedCart]);
    setActiveCartId(newCartId);
    setIsHistoryOpen(false);
    setIsCartDrawerOpen(true);
  };

  // Feature 3: Swap change for product (e.g. Royco 1 Pcs - Rp 500)
  const handleSwapChangeForProduct = (cartId: string, rawChangeAmount: number) => {
    const numericChange = Number(rawChangeAmount) || 0;
    if (numericChange <= 0) return;

    // Find Royco or small product
    const roycoProduct = products.find((p) => p.name.toLowerCase().includes('royco')) || products[0];
    if (roycoProduct) {
      const smallestUnit = roycoProduct.units[0] || { unit_name: 'Pcs', price: 500 };
      const unitPrice = Number(smallestUnit.price) || 500;
      const itemsToBuy = Math.max(1, Math.floor(numericChange / unitPrice));
      handleAddToCart(roycoProduct, smallestUnit.unit_name, unitPrice, Number(itemsToBuy), '🎁 Penukaran Kembalian');
    }
  };

  // Checkout Handler
  const handleCheckout = async (cashReceived = 0, changeAmount = 0) => {
    if (activeCart.items.length === 0) return;

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      transaction_no: `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(
        Math.random() * 900 + 100
      )}`,
      customer_name: activeCart.name,
      total_amount: activeCartTotal,
      cash_received: cashReceived,
      change_amount: changeAmount,
      payment_method: 'Tunai',
      created_at: new Date().toISOString(),
      items: [...activeCart.items],
    };

    setTransactions([newTx, ...transactions]);
    setLatestTransaction(newTx);

    // Clear active cart items
    setCarts((prev) =>
      prev.map((c) => (c.id === activeCartId ? { ...c, items: [] } : c))
    );

    setIsCartDrawerOpen(false);
    setIsReceiptOpen(true);
  };

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Semua' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categoriesList = [
    'Semua',
    'Bumbu & Bahan Dapur',
    'Mie & Instant',
    'Sembako & Timbangan',
    'Sabun & Kebersihan',
    'Minuman & Snack',
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      {/* 1. Header & Multi-Nota Switcher */}
      <header className="app-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Store size={24} color="var(--color-primary)" />
            <div>
              <h1 style={{ fontSize: '18px', fontWeight: '800', lineHeight: 1.1 }}>TOKO PASAR POS</h1>
              <span style={{ fontSize: '11px', color: '#34d399', fontWeight: '600' }}>● Katalog & Multi-Nota Active</span>
            </div>
          </div>

          <button
            onClick={() => setIsHistoryOpen(true)}
            className="btn btn-secondary"
            style={{ padding: '8px 12px', fontSize: '13px', borderRadius: '10px' }}
          >
            <History size={16} /> Riwayat ({transactions.length})
          </button>
        </div>

        {/* Tab Nota Switcher */}
        <div className="tab-switcher">
          {carts.map((cart) => {
            const count = cart.items.reduce((s, i) => s + i.qty, 0);
            return (
              <button
                key={cart.id}
                onClick={() => setActiveCartId(cart.id)}
                className={`tab-btn ${activeCartId === cart.id ? 'active' : ''}`}
              >
                <span>{cart.name}</span>
                {count > 0 && <span className="badge-count">{count}</span>}
              </button>
            );
          })}

          <button onClick={handleAddCartTab} className="tab-btn" style={{ borderStyle: 'dashed' }}>
            <Plus size={14} /> Nota Baru
          </button>
        </div>
      </header>

      {/* 2. Search & Category Filters & View Switcher */}
      <div className="search-container">
        <div className="search-row">
          <div className="search-input-wrapper">
            <Search className="search-icon" size={20} />
            <input
              type="text"
              placeholder="Cari produk... (Royco, Mie 3, Kemiri)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* View Mode Toggle Button */}
          <button
            type="button"
            className={`view-toggle-btn ${viewMode === 'GRID' ? 'active' : ''}`}
            onClick={() => setViewMode(viewMode === 'GRID' ? 'LIST' : 'GRID')}
            title={viewMode === 'GRID' ? 'Ubah ke Tampilan List' : 'Ubah ke Tampilan Grid'}
          >
            {viewMode === 'GRID' ? <List size={20} /> : <LayoutGrid size={20} />}
          </button>
        </div>

        <div className="category-pills">
          {categoriesList.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`category-pill ${selectedCategory === cat ? 'active' : ''}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Visual Product Catalog Grid or List View */}
      {filteredProducts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <p style={{ fontSize: '16px', fontWeight: '700' }}>Produk tidak ditemukan</p>
          <p style={{ fontSize: '13px', marginTop: '4px' }}>Coba ubah kata kunci pencarian atau tambah barang baru.</p>
        </div>
      ) : viewMode === 'GRID' ? (
        <main className="product-grid">
          {filteredProducts.map((prod) => (
            <div key={prod.id} className="product-card">
              {/* Image Box & Badges */}
              <div className="product-image-box">
                <img src={prod.image_url} alt={prod.name} loading="lazy" />

                {prod.promo_info && (
                  <div className="product-badge-promo">
                    🎁 {prod.promo_info}
                  </div>
                )}

                {prod.is_bulk && (
                  <div className="product-badge-bulk">
                    ⚖️ Timbangan
                  </div>
                )}

                {/* Edit Barang & Multi-Satuan Button ✏️ */}
                <button
                  type="button"
                  title="Edit Barang & Multi-Satuan"
                  className="quick-edit-price-btn"
                  onClick={() => setEditingProduct(prod)}
                >
                  <Edit2 size={15} />
                </button>
              </div>

              {/* Product Info */}
              <div className="product-info">
                <div className="product-title">{prod.name}</div>

                {/* Unit Action Pills */}
                <div className="product-units-list">
                  {prod.is_bulk ? (
                    <button
                      type="button"
                      className="unit-pill-add-btn"
                      onClick={() => setBulkProduct(prod)}
                      style={{ background: 'var(--color-secondary-light)', borderColor: 'rgba(2, 132, 199, 0.3)' }}
                    >
                      <span className="unit-name-lbl" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-secondary)' }}>
                        <Scale size={14} /> Hitung Gram/Rp
                      </span>
                      <span className="unit-price-lbl" style={{ color: 'var(--color-secondary)' }}>
                        Rp {prod.units[0]?.price.toLocaleString('id-ID')}/kg
                      </span>
                    </button>
                  ) : (
                    prod.units.map((unit) => (
                      <button
                        type="button"
                        key={unit.id}
                        className="unit-pill-add-btn"
                        onClick={() => handleAddToCart(prod, unit.unit_name, unit.price)}
                      >
                        <span className="unit-name-lbl">+ {unit.unit_name}</span>
                        <span className="unit-price-lbl">Rp {unit.price.toLocaleString('id-ID')}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          ))}
        </main>
      ) : (
        /* File Manager Style List View */
        <main className="product-list-container">
          {filteredProducts.map((prod) => (
            <div key={prod.id} className="product-list-row">
              <div className="product-list-header">
                <img src={prod.image_url} alt={prod.name} className="product-list-thumb" />

                <div className="product-list-main">
                  <div className="product-list-title">{prod.name}</div>
                  <div className="product-list-badges">
                    {prod.promo_info && (
                      <span style={{ fontSize: '11px', background: 'var(--color-danger-light)', color: 'var(--color-danger)', fontWeight: '800', padding: '2px 6px', borderRadius: '4px' }}>
                        🎁 {prod.promo_info}
                      </span>
                    )}
                    {prod.is_bulk && (
                      <span style={{ fontSize: '11px', background: 'var(--color-secondary-light)', color: 'var(--color-secondary)', fontWeight: '700', padding: '2px 6px', borderRadius: '4px' }}>
                        ⚖️ Timbangan
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setEditingProduct(prod)}
                      style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '2px', fontSize: '12px', fontWeight: '800' }}
                    >
                      <Edit2 size={13} /> Edit Barang & Multi-Satuan
                    </button>
                  </div>
                </div>
              </div>

              {/* Units Pills */}
              <div className="product-list-units">
                {prod.is_bulk ? (
                  <button
                    type="button"
                    className="unit-pill-add-btn"
                    onClick={() => setBulkProduct(prod)}
                    style={{ background: 'var(--color-secondary-light)', borderColor: 'rgba(2, 132, 199, 0.3)' }}
                  >
                    <Scale size={14} color="var(--color-secondary)" />
                    <span className="unit-price-lbl" style={{ color: 'var(--color-secondary)' }}>
                      Rp {prod.units[0]?.price.toLocaleString('id-ID')}/kg
                    </span>
                  </button>
                ) : (
                  prod.units.map((unit) => (
                    <button
                      type="button"
                      key={unit.id}
                      className="unit-pill-add-btn"
                      onClick={() => handleAddToCart(prod, unit.unit_name, unit.price)}
                    >
                      <span className="unit-name-lbl">+ {unit.unit_name}</span>
                      <span className="unit-price-lbl">Rp {unit.price.toLocaleString('id-ID')}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          ))}
        </main>
      )}

      {/* 4. Floating Action Button (FAB) for Camera Add */}
      <button
        className="fab-add-product"
        title="Foto & Tambah Barang Baru"
        onClick={() => setIsAddProductOpen(true)}
      >
        <Camera size={26} />
      </button>

      {/* 5. Floating Cart Bar (Bottom Mobile) */}
      {activeCartItemCount > 0 && (
        <div className="floating-cart-bar" onClick={() => setIsCartDrawerOpen(true)}>
          <div className="cart-bar-info">
            <div className="cart-bar-badge">{activeCartItemCount}</div>
            <div>
              <div className="cart-bar-price">Rp {activeCartTotal.toLocaleString('id-ID')}</div>
              <div className="cart-bar-subtitle">{activeCart.name} • {activeCart.items.length} jenis barang</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '800', fontSize: '15px' }}>
            Lihat Nota <ChevronRight size={20} />
          </div>
        </div>
      )}

      {/* 6. Modals */}
      <AddProductModal
        isOpen={isAddProductOpen || !!editingProduct}
        initialProduct={editingProduct}
        onClose={() => {
          setIsAddProductOpen(false);
          setEditingProduct(null);
        }}
        onProductCreated={handleProductCreated}
        onProductUpdated={handleProductUpdated}
        onProductDeleted={handleProductDeleted}
      />

      <QuickPriceEditModal
        product={editingPriceProduct}
        isOpen={!!editingPriceProduct}
        onClose={() => setEditingPriceProduct(null)}
        onSavePrice={handleSaveProductPrice}
      />

      <BulkPriceModal
        product={bulkProduct}
        isOpen={!!bulkProduct}
        onClose={() => setBulkProduct(null)}
        onAddToCart={handleAddToCart}
      />

      <CartItemCustomPriceModal
        item={customPriceCartItem}
        isOpen={!!customPriceCartItem}
        onClose={() => setCustomPriceCartItem(null)}
        onSave={handleSaveCustomPrice}
      />

      <MultiCartDrawer
        cart={activeCart}
        isOpen={isCartDrawerOpen}
        onClose={() => setIsCartDrawerOpen(false)}
        onUpdateQty={handleUpdateQty}
        onRemoveItem={handleRemoveItem}
        onOpenCustomPrice={(item) => setCustomPriceCartItem(item)}
        onOpenEditWeight={handleEditWeightFromCart}
        onSwapChangeForProduct={handleSwapChangeForProduct}
        onRenameCart={handleRenameCart}
        onCheckout={handleCheckout}
      />

      <ReceiptModal
        transaction={latestTransaction}
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
      />

      <TransactionHistoryModal
        transactions={transactions}
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onReopenTransaction={handleReopenTransaction}
      />
    </div>
  );
}
