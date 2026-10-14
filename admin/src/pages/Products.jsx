import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../components/Layout/AdminLayout';
import { Modal } from '../components/UI/Modal';
import { Badge } from '../components/UI/Badge';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Video,
  Sparkles,
  Play,
  RotateCw,
  Check,
  AlertCircle
} from 'lucide-react';
import { fetchProducts, createProduct, updateProduct, deleteProduct, toggleProductStock } from '../api/productApi';
import AIVideoGeneratorModal from '../components/AIVideoGeneratorModal';
import { deleteShoeVideo, toggleShoeVideo, setHeroVideo } from '../api/aiVideoApi';

export const Products = () => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

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
    colors: ['Black', 'White'],
    video: '',
    videoEnabled: true,
    isHeroVideo: false
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
      colors: prod.colors || ['Black', 'White'],
      video: prod.video || '',
      videoEnabled: prod.videoEnabled !== false,
      isHeroVideo: Boolean(prod.isHeroVideo)
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

  const handleAddAngleImage = () => {
    setForm((prev) => ({
      ...prev,
      images: [...prev.images, '']
    }));
  };

  const handleUpdateAngleImage = (index, value) => {
    setForm((prev) => {
      const updated = [...prev.images];
      updated[index] = value;
      return { ...prev, images: updated };
    });
  };

  const handleRemoveAngleImage = (index) => {
    setForm((prev) => {
      const updated = prev.images.filter((_, i) => i !== index);
      return { ...prev, images: updated.length ? updated : [''] };
    });
  };

  const handleSetMainImage = (index) => {
    setForm((prev) => {
      if (index === 0) return prev;
      const updated = [...prev.images];
      const [moved] = updated.splice(index, 1);
      updated.unshift(moved);
      return { ...prev, images: updated };
    });
  };

  const handleMoveAngleImage = (index, direction) => {
    setForm((prev) => {
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= prev.images.length) return prev;
      const updated = [...prev.images];
      const temp = updated[index];
      updated[index] = updated[targetIndex];
      updated[targetIndex] = temp;
      return { ...prev, images: updated };
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      price: Number(form.price),
      originalPrice: form.originalPrice ? Number(form.originalPrice) : Math.round(Number(form.price) * 1.3),
      stock: Number(form.stock),
      inStock: Boolean(form.inStock),
      video: form.video || '',
      videoEnabled: Boolean(form.videoEnabled),
      isHeroVideo: Boolean(form.isHeroVideo)
    };

    if (editingProduct) {
      await updateProduct(editingProduct._id || editingProduct.productId, payload);
    } else {
      await createProduct(payload);
    }

    setIsModalOpen(false);
    loadProducts();
  };

  const handleVideoSaved = (savedProduct) => {
    if (savedProduct && savedProduct.video) {
      setForm((prev) => ({
        ...prev,
        video: savedProduct.video,
        videoEnabled: true,
      }));
      if (editingProduct) {
        setEditingProduct((prev) => ({
          ...prev,
          video: savedProduct.video,
          videoEnabled: true,
        }));
      }
      loadProducts();
    }
  };

  const handleRemoveVideo = async () => {
    if (!window.confirm('Are you sure you want to remove the promotional video from this product?')) {
      return;
    }
    const targetId = editingProduct?._id || editingProduct?.productId || form.productId;
    if (targetId) {
      await deleteShoeVideo(targetId);
    }
    setForm((prev) => ({ ...prev, video: '', videoEnabled: false, isHeroVideo: false }));
    loadProducts();
  };

  const handleToggleVideoEnabled = async () => {
    const nextVal = !form.videoEnabled;
    setForm((prev) => ({ ...prev, videoEnabled: nextVal }));
    const targetId = editingProduct?._id || editingProduct?.productId;
    if (targetId) {
      await toggleShoeVideo(targetId, nextVal);
      loadProducts();
    }
  };

  const handleToggleHeroVideo = async () => {
    const nextVal = !form.isHeroVideo;
    setForm((prev) => ({ ...prev, isHeroVideo: nextVal }));
    const targetId = editingProduct?._id || editingProduct?.productId;
    if (targetId) {
      await setHeroVideo(targetId, nextVal);
      loadProducts();
    }
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
            {loading ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '2rem' }}>
                  Loading product inventory...
                </td>
              </tr>
            ) : filteredProducts.length === 0 ? (
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
                      src={prod.images?.[0] || prod.image || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=150&q=80'}
                      alt={prod.name}
                      style={{ width: '45px', height: '45px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=150&q=80';
                      }}
                    />
                  </td>
                  <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{prod.productId || 'N/A'}</td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <span style={{ fontWeight: 600 }}>{prod.name}</span>
                      {prod.video && (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: 'rgba(245, 158, 11, 0.15)',
                          color: '#f59e0b',
                          border: '1px solid rgba(245, 158, 11, 0.4)',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          width: 'fit-content'
                        }}>
                          <Video size={10} /> AI 360° Video
                          {prod.isHeroVideo && ' • Home Hero'}
                        </span>
                      )}
                    </div>
                  </td>
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

          {/* Multi-Angle Product Gallery Manager */}
          <div className="form-group" style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <label className="form-label" style={{ fontWeight: 700, margin: 0 }}>
                Product Angle Images Gallery ({form.images.length} {form.images.length === 1 ? 'Angle' : 'Angles'})
              </label>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                onClick={handleAddAngleImage}
              >
                + Add Angle Image
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {form.images.map((imgUrl, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, width: '70px', flexShrink: 0 }}>
                    {idx === 0 ? '★ Main' : `Angle ${idx + 1}`}
                  </span>

                  <input
                    type="text"
                    className="form-control"
                    placeholder={`Image URL for Angle ${idx + 1}...`}
                    value={imgUrl}
                    onChange={(e) => handleUpdateAngleImage(idx, e.target.value)}
                    required={idx === 0}
                  />

                  {idx > 0 && (
                    <button
                      type="button"
                      title="Make Primary Image"
                      onClick={() => handleSetMainImage(idx)}
                      style={{ padding: '0.3rem 0.5rem', fontSize: '0.7rem', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Make Main
                    </button>
                  )}

                  {idx > 0 && (
                    <button
                      type="button"
                      title="Move Up"
                      onClick={() => handleMoveAngleImage(idx, -1)}
                      style={{ padding: '0.3rem 0.4rem', fontSize: '0.7rem', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      ↑
                    </button>
                  )}

                  {idx < form.images.length - 1 && (
                    <button
                      type="button"
                      title="Move Down"
                      onClick={() => handleMoveAngleImage(idx, 1)}
                      style={{ padding: '0.3rem 0.4rem', fontSize: '0.7rem', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      ↓
                    </button>
                  )}

                  {form.images.length > 1 && (
                    <button
                      type="button"
                      title="Remove Angle"
                      onClick={() => handleRemoveAngleImage(idx)}
                      style={{ padding: '0.3rem 0.5rem', fontSize: '0.7rem', color: '#f87171', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Thumbnail Previews Grid */}
            <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {form.images.map((imgUrl, idx) => (
                <div key={idx} style={{ position: 'relative' }}>
                  <img
                    src={imgUrl || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=150&q=80'}
                    alt={`Preview ${idx + 1}`}
                    style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px', border: idx === 0 ? '2px solid #f59e0b' : '1px solid var(--border-color)' }}
                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=150&q=80'; }}
                  />
                  <span style={{ position: 'absolute', bottom: '2px', right: '2px', fontSize: '0.65rem', background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '0 3px', borderRadius: '3px' }}>
                    {idx + 1}
                  </span>
                </div>
              ))}
            </div>
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

          {/* AI Shoe-to-Video Generator Section */}
          <div
            className="form-group"
            style={{
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 27, 75, 0.4) 100%)',
              border: '1px solid #334155',
              borderRadius: '10px',
              padding: '1.2rem',
              marginTop: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <label className="form-label" style={{ fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#f8fafc' }}>
                  <Sparkles size={16} color="#f59e0b" /> AI Shoe-to-Video Generator
                </label>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>
                  Generate a smooth 360-degree promotional commercial video of this footwear
                </p>
              </div>

              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setIsVideoModalOpen(true)}
                style={{
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: '#000',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  padding: '0.45rem 0.9rem',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                }}
              >
                <Sparkles size={15} />
                {form.video ? 'Generate / Replace AI Video' : 'Generate AI Shoe Video'}
              </button>
            </div>

            {/* Video Preview Card if video is attached */}
            {form.video ? (
              <div
                style={{
                  background: '#0a0f1d',
                  borderRadius: '8px',
                  padding: '1rem',
                  border: '1px solid #10b981',
                  marginTop: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Check size={14} /> Video Attached to Product
                  </span>
                  <button
                    type="button"
                    onClick={handleRemoveVideo}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#f87171',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Remove Video
                  </button>
                </div>

                <div style={{ width: '100%', maxHeight: '220px', borderRadius: '6px', overflow: 'hidden', background: '#000', display: 'flex', justifyContent: 'center' }}>
                  <video
                    src={form.video.startsWith('http') || form.video.startsWith('data:') ? form.video : `http://localhost:5000${form.video}`}
                    controls
                    autoPlay
                    loop
                    muted
                    style={{ maxHeight: '220px', maxWidth: '100%', objectFit: 'contain' }}
                  />
                </div>

                {/* Video Controls / Switches */}
                <div style={{ marginTop: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#cbd5e1', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={Boolean(form.videoEnabled)}
                      onChange={handleToggleVideoEnabled}
                    />
                    <span>Show Video on Customer Product Details Page (replaces static photo with video player)</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#cbd5e1', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={Boolean(form.isHeroVideo)}
                      onChange={handleToggleHeroVideo}
                    />
                    <span>Feature this Shoe Video on Home Page Hero Media (replaces store photo)</span>
                  </label>
                </div>
              </div>
            ) : (
              <div
                style={{
                  background: 'rgba(0,0,0,0.25)',
                  border: '1px dashed #334155',
                  borderRadius: '8px',
                  padding: '1rem',
                  textAlign: 'center',
                  color: '#94a3b8',
                  fontSize: '0.82rem',
                }}
              >
                <Video size={28} color="#64748b" style={{ margin: '0 auto 0.4rem auto' }} />
                No promotional video attached yet. Click <strong>"Generate AI Shoe Video"</strong> above to upload a shoe photo and generate a 360° commercial.
              </div>
            )}
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
      {/* AI Shoe-to-Video Generator Modal */}
      {isVideoModalOpen && (
        <AIVideoGeneratorModal
          isOpen={isVideoModalOpen}
          onClose={() => setIsVideoModalOpen(false)}
          product={editingProduct || form}
          onVideoSaved={handleVideoSaved}
        />
      )}
    </AdminLayout>
  );
};
