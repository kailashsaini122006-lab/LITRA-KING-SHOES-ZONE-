import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../components/Layout/AdminLayout';
import { Badge } from '../components/UI/Badge';
import { Search, AlertTriangle, Plus, Minus, CheckCircle, RefreshCw } from 'lucide-react';
import { fetchProducts, toggleProductStock } from '../api/productApi';

export const Stock = () => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  const loadStockData = async () => {
    setLoading(true);
    try {
      const data = await fetchProducts();
      setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStockData();
  }, []);

  const handleStockAdjust = async (prod, change) => {
    const currentStock = prod.stock || 0;
    const newStock = Math.max(0, currentStock + change);
    const newInStock = newStock > 0;
    await toggleProductStock(prod._id || prod.productId, newStock, newInStock);
    loadStockData();
  };

  const handleManualStockChange = async (prod, val) => {
    const newStock = Math.max(0, parseInt(val) || 0);
    const newInStock = newStock > 0;
    await toggleProductStock(prod._id || prod.productId, newStock, newInStock);
    loadStockData();
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name?.toLowerCase().includes(search.toLowerCase()) ||
                          p.productId?.toLowerCase().includes(search.toLowerCase());
    if (stockFilter === 'Low') return matchesSearch && (p.stock || 0) <= 5 && (p.stock || 0) > 0;
    if (stockFilter === 'Out') return matchesSearch && ((p.stock || 0) === 0 || !p.inStock);
    if (stockFilter === 'In') return matchesSearch && (p.stock || 0) > 5;
    return matchesSearch;
  });

  return (
    <AdminLayout title="Footwear Stock Inventory Control">
      {/* Toolbar */}
      <div className="page-toolbar">
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', flex: 1 }}>
          <div className="search-box">
            <Search size={18} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search product stock by name or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="form-control"
            style={{ width: 'auto', minWidth: '180px' }}
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
          >
            <option value="All">All Stock Levels</option>
            <option value="Low">Low Stock Warnings (≤ 5)</option>
            <option value="Out">Out of Stock (0)</option>
            <option value="In">Healthy Stock (&gt; 5)</option>
          </select>
        </div>

        <button className="btn btn-secondary" onClick={loadStockData}>
          <RefreshCw size={16} /> Sync Inventory
        </button>
      </div>

      {/* Stock Table */}
      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Product Details</th>
              <th>Category</th>
              <th>Price</th>
              <th>Available Stock</th>
              <th>Stock Condition</th>
              <th>Quick Stock Adjustment</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                  No stock items match your filter.
                </td>
              </tr>
            ) : (
              filteredProducts.map((prod) => {
                const stockCount = prod.stock || 0;
                const isOut = stockCount === 0 || !prod.inStock;
                const isLow = stockCount > 0 && stockCount <= 5;

                return (
                  <tr key={prod._id || prod.productId}>
                    <td>
                      <img
                        src={prod.images?.[0] || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=150&q=80'}
                        alt={prod.name}
                        style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                      />
                    </td>

                    <td>
                      <div style={{ fontWeight: 700 }}>{prod.name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--primary)' }}>ID: {prod.productId || 'N/A'}</div>
                    </td>

                    <td>{prod.category}</td>

                    <td style={{ fontWeight: 600 }}>₹{(prod.price || 0).toLocaleString()}</td>

                    <td>
                      <input
                        type="number"
                        className="form-control"
                        style={{ width: '80px', padding: '0.35rem 0.6rem', textAlign: 'center', fontWeight: 700 }}
                        value={stockCount}
                        onChange={(e) => handleManualStockChange(prod, e.target.value)}
                        min={0}
                      />
                    </td>

                    <td>
                      {isOut ? (
                        <span className="badge badge-cancelled" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                          <AlertTriangle size={12} /> Out of Stock
                        </span>
                      ) : isLow ? (
                        <span className="badge badge-pending" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                          <AlertTriangle size={12} /> Low Stock Warning
                        </span>
                      ) : (
                        <span className="badge badge-delivered" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                          <CheckCircle size={12} /> In Stock
                        </span>
                      )}
                    </td>

                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleStockAdjust(prod, -1)}
                          disabled={stockCount <= 0}
                        >
                          <Minus size={14} />
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleStockAdjust(prod, 1)}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
};
