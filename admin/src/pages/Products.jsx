import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../components/Layout/AdminLayout';
import { Modal } from '../components/UI/Modal';
import { Badge } from '../components/UI/Badge';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Image,
  Tag,
  Boxes,
  CheckCircle,
  XCircle,
  Upload
} from 'lucide-react';
import { fetchProducts, createProduct, updateProduct, deleteProduct, toggleProductStock } from '../api/productApi';

export const Products = () => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form State
  const initialForm = {
    productId: '',
    name: '',
    brand: 'LITRA KING',
    category: 'Sports Shoes',
    price: '',
    originalPrice: '',
    stock: 25,
    inStock: true,
    description: '',
    images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80'],
    sizes: [6, 7, 8, 9, 10],
    colors: ['Black', 'White']
  };

  const [form, setForm] = useState(initialForm);

  const categories = [
    'Sports Shoes',
    'Casual Shoes',
    'Sneakers',
    'Running Shoes',
    'Formal Shoes',
    'Slippers',
    'Sandals',
    'Kids Footwear'
  ];

  const availableSizes = [5, 6, 7, 8, 9, 10, 11, 12];

  const loadProducts = async () => {
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
    loadProducts();
  }, []);

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setForm({
      ...initialForm,
      productId: 'LK-' + Math.floor(1000 + Math.random() * 9000)
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (prod) => {
    setEditingProduct(prod);
    setForm({
      productId: prod.productId || '',
      name: prod.name || '',
      brand: prod.brand || 'LITRA KING',
      category: prod.category || 'Sports Shoes',
      price: prod.price || '',
      originalPrice: prod.originalPrice || '',
      stock: prod.stock ?? 25,
      inStock: prod.inStock ?? true,
      description: prod.description || '',
      images: prod.images && prod.images.length > 0 ? prod.images : ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80'],
      sizes: prod.sizes || [6, 7, 8, 9, 10],
      colors: prod.colors || ['Black', 'White']
    });
    setIsModalOpen(true);
  };

  const handleToggleSize = (sizeNum) => {
    setForm((prev) => {
      const exists = prev.sizes.includes(sizeNum);
      const updated = exists ? prev.sizes.filter((s) => s !== sizeNum) : [...prev.sizes, sizeNum].sort((a, b) => a - b);
      return { ...prev, sizes: updated };
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      price: Number(form.price),
      originalPrice: form.originalPrice ? Number(form.originalPrice) : Math.round(Number(form.price) * 1.3),
      stock: Number(form.stock),
      inStock: Number(form.stock) > 0 && form.inStock
    };

    if (editingProduct) {
      await updateProduct(editingProduct._id || editingProduct.productId, payload);
    } else {
      await createProduct(payload);
    }

    setIsModalOpen(false);
    loadProducts();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      await deleteProduct(id);
      loadProducts();
    }
  };

  const handleStockToggle = async (prod) => {
    const newStock = prod.inStock ? 0 : 15;
    const newInStock = !prod.inStock;
    await toggleProductStock(prod._id || prod.productId, newStock, newInStock);
    loadProducts();
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name?.toLowerCase().includes(search.toLowerCase()) ||
                          p.productId?.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <AdminLayout title="Products Inventory Management">
      {/* Top Toolbar */}
      <div className="page-toolbar">
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', flex: 1 }}>
          <div className="search-box">
            <Search size={18} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search shoes by name or Product ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="form-control"
            style={{ width: 'auto', minWidth: '160px' }}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="All">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <button className="btn btn-primary" onClick={handleOpenAddModal}>
          <Plus size={18} /> Add New Shoe Product
        </button>
      </div>

      {/* Products Table */}
      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Product ID</th>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Sizes</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No footwear products found matching criteria.
                </td>
              </tr>
            ) : (
              filteredProducts.map((prod) => (
                <tr key={prod._id || prod.productId}>
                  <td>
                    <img
                      src={prod.images?.[0] || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=150&q=80'}
                      alt={prod.name}
                      style={{ width: '45px', height: '45px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                    />
                  </td>
                  <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{prod.productId || 'N/A'}</td>
                  <td style={{ fontWeight: 600 }}>{prod.name}</td>
                  <td>{prod.category}</td>
                  <td style={{ fontWeight: 700 }}>
                    ₹{prod.price?.toLocaleString()}{' '}
                    {prod.originalPrice && prod.originalPrice > prod.price && (
                      <span style={{ fontSize: '0.75rem', textDecoration: 'line-through', color: 'var(--text-muted)' }}>
                        ₹{prod.originalPrice}
                      </span>
                    )}
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    {prod.stock || 0} pcs
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.2rem', flexWrap: 'wrap' }}>
                      {(prod.sizes || [6, 7, 8, 9, 10]).map((sz) => (
                        <span
                          key={sz}
                          style={{
                            fontSize: '0.7rem',
                            background: 'var(--bg-input)',
                            padding: '0.1rem 0.35rem',
                            borderRadius: '4px',
                            border: '1px solid var(--border-color)'
                          }}
                        >
                          UK{sz}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <button
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
                      onClick={() => handleStockToggle(prod)}
                      title="Click to toggle In Stock / Out of Stock"
                    >
                      <Badge text={prod.inStock && prod.stock > 0 ? 'In Stock' : 'Out of Stock'} />
                    </button>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleOpenEditModal(prod)}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(prod._id || prod.productId)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Product Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? 'Edit Product Information' : 'Add New Shoe Product'}
        maxWidth="680px"
      >
        <form onSubmit={handleFormSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Product ID</label>
              <input
                type="text"
                className="form-control"
                value={form.productId}
                onChange={(e) => setForm({ ...form, productId: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Product Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. LITRA KING Air Speed Sneaker"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-control"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Price (₹)</label>
              <input
                type="number"
                className="form-control"
                placeholder="2499"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Original Price / MRP (₹)</label>
              <input
                type="number"
                className="form-control"
                placeholder="3499"
                value={form.originalPrice}
                onChange={(e) => setForm({ ...form, originalPrice: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Available Stock</label>
              <input
                type="number"
                className="form-control"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">In Stock Status</label>
              <select
                className="form-control"
                value={form.inStock ? 'true' : 'false'}
                onChange={(e) => setForm({ ...form, inStock: e.target.value === 'true' })}
              >
                <option value="true">In Stock</option>
                <option value="false">Out of Stock</option>
              </select>
            </div>
          </div>

          {/* Shoe Sizes Selection */}
          <div className="form-group">
            <label className="form-label">Select Available Shoe Sizes (UK/India)</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.3rem' }}>
              {availableSizes.map((sz) => {
                const isSelected = form.sizes.includes(sz);
                return (
                  <button
                    key={sz}
                    type="button"
                    style={{
                      padding: '0.4rem 0.75rem',
                      borderRadius: '6px',
                      border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border-color)'}`,
                      backgroundColor: isSelected ? 'var(--primary-light)' : 'var(--bg-input)',
                      color: isSelected ? 'var(--primary)' : 'var(--text-main)',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                    onClick={() => handleToggleSize(sz)}
                  >
                    UK {sz}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Product Image URL</label>
            <input
              type="text"
              className="form-control"
              placeholder="https://..."
              value={form.images[0] || ''}
              onChange={(e) => setForm({ ...form, images: [e.target.value] })}
              required
            />
            {form.images[0] && (
              <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <img
                  src={form.images[0]}
                  alt="Preview"
                  style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                  onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=150&q=80'; }}
                />
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Image Preview</span>
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-control"
              rows={3}
              placeholder="Describe footwear features, material, sole type..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingProduct ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
};
