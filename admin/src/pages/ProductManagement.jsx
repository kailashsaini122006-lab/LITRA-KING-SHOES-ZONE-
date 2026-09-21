import React, { useState, useEffect, useCallback } from 'react';
import { ShoppingBag, Plus, Trash2, Edit3, Upload, Check, AlertCircle, RefreshCw, Search, ShieldCheck, ArrowLeft, Image as ImageIcon, X } from 'lucide-react';
import { getApiUrl } from '../config/api';

const CATEGORIES = [
  'Running Shoes',
  'Sports Shoes',
  'Casual Shoes',
  'Sneakers',
  'Formal Shoes',
  'Slippers',
  'Sandals',
  'Kids Footwear',
];

const AVAILABLE_SIZES_OPTIONS = [5, 6, 7, 8, 9, 10, 11, 12];

const BADGE_OPTIONS = ['New', 'Best Seller', 'Special Offer', 'Hot Deal', 'Popular', 'Limited Stock'];

const INITIAL_FORM = {
  name: '',
  brand: 'LITRA KING',
  category: 'Running Shoes',
  price: '',
  originalPrice: '',
  stock: '25',
  sizes: [6, 7, 8, 9, 10],
  color: 'Black, White',
  tag: 'New',
  description: '',
  image: '',
};

export default function ProductManagement({ onBack }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [formData, setFormData] = useState(INITIAL_FORM);
  const [editingId, setEditingId] = useState(null);

  const [imagePreview, setImagePreview] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Delete Confirmation Modal State
  const [productToDelete, setProductToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingStockId, setTogglingStockId] = useState(null);

  // Security Auth Token Check
  const token = sessionStorage.getItem('lk_access_token') || localStorage.getItem('lk_access_token') || '';

  const handleToggleStockAdmin = async (prod) => {
    const targetId = prod._id || prod.productId;
    const currentAvailable = prod.inStock !== false && (prod.stock === undefined || prod.stock > 0);
    const newInStock = !currentAvailable;

    try {
      setTogglingStockId(targetId);
      setErrorMessage('');
      const res = await fetch(getApiUrl(`/products/${encodeURIComponent(targetId)}/stock`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ inStock: newInStock }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data && data.success) {
        setSuccessMessage(`"${prod.name}" status updated to ${newInStock ? 'IN STOCK' : 'OUT OF STOCK'}.`);
        fetchProducts();
        window.dispatchEvent(new Event('lk_admin_stock_changed'));
        setTimeout(() => setSuccessMessage(''), 3500);
      } else {
        setErrorMessage(data?.message || 'Failed to update stock status.');
      }
    } catch (err) {
      console.error('Error toggling stock:', err);
      setErrorMessage(`Error updating stock status: ${err.message}`);
    } finally {
      setTogglingStockId(null);
    }
  };

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(getApiUrl('/products'));
      const data = await res.json().catch(() => null);

      if (res.ok && data && Array.isArray(data.products)) {
        setProducts(data.products);
      } else {
        setErrorMessage(data?.message || 'Failed to load products list.');
      }
    } catch (err) {
      console.error('Error loading products:', err);
      setErrorMessage(`Connection Error (${err.message}). Ensure backend server is running.`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrorMessage('');
  };

  const handleToggleSize = (sz) => {
    setFormData((prev) => {
      const current = prev.sizes || [];
      const updated = current.includes(sz) ? current.filter((s) => s !== sz) : [...current, sz].sort((a, b) => a - b);
      return { ...prev, sizes: updated };
    });
  };

  // Image File Picker & Upload Handler
  const handleImageFileChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setErrorMessage('Image size must be less than 8 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Data = event.target.result;
      setImagePreview(base64Data);

      // Upload to server if token exists
      if (token) {
        try {
          setUploadingImage(true);
          const res = await fetch(getApiUrl('/products/upload-image'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ imageBase64: base64Data }),
          });

          const data = await res.json().catch(() => null);
          if (res.ok && data && data.success && data.imageUrl) {
            handleInputChange('image', data.imageUrl);
          } else {
            // Fallback to base64 preview URL
            handleInputChange('image', base64Data);
          }
        } catch (err) {
          console.warn('Image upload fallback to data URL:', err.message);
          handleInputChange('image', base64Data);
        } finally {
          setUploadingImage(false);
        }
      } else {
        handleInputChange('image', base64Data);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!formData.name.trim()) {
      setErrorMessage('Please enter Shoe Name.');
      return;
    }

    if (!formData.category.trim()) {
      setErrorMessage('Please select Category.');
      return;
    }

    if (!formData.description.trim()) {
      setErrorMessage('Please enter Description.');
      return;
    }

    const numPrice = Number(formData.price);
    if (isNaN(numPrice) || numPrice < 0) {
      setErrorMessage('Please enter a valid Selling Price.');
      return;
    }

    const numOriginalPrice = formData.originalPrice ? Number(formData.originalPrice) : Math.round(numPrice * 1.4);
    if (isNaN(numOriginalPrice) || numOriginalPrice < 0) {
      setErrorMessage('Please enter a valid Original Price.');
      return;
    }

    const numStock = formData.stock !== '' ? Number(formData.stock) : 25;
    if (isNaN(numStock) || numStock < 0) {
      setErrorMessage('Stock quantity must be a valid number.');
      return;
    }

    const finalImage = formData.image || imagePreview || '/assets/real-nitro-black-white.jpg';

    const payload = {
      name: formData.name.trim(),
      brand: formData.brand.trim() || 'LITRA KING',
      category: formData.category,
      description: formData.description.trim(),
      price: numPrice,
      originalPrice: numOriginalPrice,
      stock: numStock,
      sizes: formData.sizes.length ? formData.sizes : [6, 7, 8, 9, 10],
      colors: formData.color ? formData.color.split(',').map((c) => c.trim()).filter(Boolean) : ['Black', 'White'],
      tag: formData.tag || 'New',
      images: [finalImage],
      image: finalImage,
    };

    try {
      setSubmitting(true);
      const url = editingId ? getApiUrl(`/products/${encodeURIComponent(editingId)}`) : getApiUrl('/products');
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data && data.success) {
        setSuccessMessage(editingId ? 'Product updated successfully!' : 'Product added successfully!');
        setFormData(INITIAL_FORM);
        setImagePreview('');
        setEditingId(null);
        fetchProducts();
        window.dispatchEvent(new Event('lk_admin_stock_changed'));
        setTimeout(() => setSuccessMessage(''), 4000);
      } else {
        setErrorMessage(data?.message || 'Failed to save product. Please try again.');
      }
    } catch (err) {
      console.error('Error saving product:', err);
      setErrorMessage(`Error saving product: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (prod) => {
    setEditingId(prod._id || prod.productId);
    const imgUrl = Array.isArray(prod.images) && prod.images.length ? prod.images[0] : (prod.img || '');
    setImagePreview(imgUrl);
    setFormData({
      name: prod.name || '',
      brand: prod.brand || 'LITRA KING',
      category: prod.category || 'Running Shoes',
      price: prod.price !== undefined ? prod.price : '',
      originalPrice: prod.originalPrice !== undefined ? prod.originalPrice : '',
      stock: prod.stock !== undefined ? prod.stock : 25,
      sizes: Array.isArray(prod.sizes) && prod.sizes.length ? prod.sizes : [6, 7, 8, 9, 10],
      color: Array.isArray(prod.colors) ? prod.colors.join(', ') : (prod.colors || 'Black, White'),
      tag: prod.tag || 'New',
      description: prod.description || '',
      image: imgUrl,
    });
    setErrorMessage('');
    setSuccessMessage('');

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData(INITIAL_FORM);
    setImagePreview('');
    setErrorMessage('');
  };

  const handleDeleteExecute = async () => {
    if (!productToDelete) return;
    const targetId = productToDelete._id || productToDelete.productId;

    try {
      setDeleting(true);
      const res = await fetch(getApiUrl(`/products/${encodeURIComponent(targetId)}`), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data && data.success) {
        setSuccessMessage(`Product "${productToDelete.name}" deleted successfully.`);
        setProductToDelete(null);
        fetchProducts();
        window.dispatchEvent(new Event('lk_admin_stock_changed'));
        setTimeout(() => setSuccessMessage(''), 4000);
      } else {
        setErrorMessage(data?.message || 'Failed to delete product.');
      }
    } catch (err) {
      setErrorMessage(`Error deleting product: ${err.message}`);
    } finally {
      setDeleting(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.category && p.category.toLowerCase().includes(q)) ||
      (p.brand && p.brand.toLowerCase().includes(q)) ||
      (p.tag && p.tag.toLowerCase().includes(q))
    );
  });

  const resolveImgSrc = (pathOrUrl) => {
    if (!pathOrUrl) return '/assets/real-nitro-black-white.jpg';
    if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://') || pathOrUrl.startsWith('data:') || pathOrUrl.startsWith('/assets')) {
      return pathOrUrl;
    }
    return getApiUrl(pathOrUrl);
  };

  if (!token) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-zinc-900 border border-red-800/80 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 bg-red-950/80 border border-red-500/50 rounded-full flex items-center justify-center mx-auto text-red-400">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-white">Admin Authentication Required</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Product Management is restricted to Litra King store administrators. Please authenticate using the 4-digit Security PIN.
          </p>
          {onBack && (
            <button
              onClick={onBack}
              className="py-2.5 px-6 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-xl border border-zinc-700 transition-colors"
            >
              Back to Store
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-8 animate-fadeIn text-zinc-100">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-2xl text-zinc-400 hover:text-white transition-colors"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded">
                Admin Control
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                Product Management
              </h2>
            </div>
            <p className="text-xs text-zinc-400 mt-1">Add, edit, manage stock, and upload footwear images for LITRA KING Shoes Zone</p>
          </div>
        </div>

        <button
          onClick={() => window.location.reload()}
          disabled={loading}
          className="py-2 px-3.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-bold border border-zinc-800 flex items-center gap-2 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh List</span>
        </button>
      </div>

      {/* Global Banners */}
      {errorMessage && (
        <div className="p-4 bg-red-950/80 border border-red-800/90 rounded-2xl text-red-300 text-xs font-semibold flex items-start gap-3 shadow-lg animate-shake">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-800/90 rounded-2xl text-emerald-300 text-xs font-bold flex items-center gap-3 shadow-lg animate-fadeIn">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* ─── SECTION 1: ADD / EDIT PRODUCT FORM ───────────────────────────── */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">
                {editingId ? 'Edit Product Details' : 'Add New Shoe Product'}
              </h3>
              <p className="text-xs text-zinc-400">Fill in shoe details, pricing, sizes, and upload image</p>
            </div>
          </div>

          {editingId && (
            <button
              onClick={handleCancelEdit}
              className="py-1.5 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-xl border border-zinc-700 transition-colors flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" /> Cancel Edit
            </button>
          )}
        </div>

        <form onSubmit={handleSubmitForm} className="space-y-6">
          
          {/* Row 1: Shoe Name & Brand */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            <div className="sm:col-span-8">
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                Shoe Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g. Puma Nitro Black Running Shoe"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white text-xs focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>

            <div className="sm:col-span-4">
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                Brand
              </label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => handleInputChange('brand', e.target.value)}
                placeholder="LITRA KING / Puma / Adidas"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white text-xs focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>
          </div>

          {/* Row 2: Category, Prices & Stock */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-3 text-white text-xs focus:outline-none focus:border-amber-400 transition-colors"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                Selling Price (₹) *
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                placeholder="999"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white text-xs font-mono focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                Original Price (₹)
              </label>
              <input
                type="number"
                min="0"
                value={formData.originalPrice}
                onChange={(e) => handleInputChange('originalPrice', e.target.value)}
                placeholder="1999"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white text-xs font-mono focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                Stock Quantity *
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.stock}
                onChange={(e) => handleInputChange('stock', e.target.value)}
                placeholder="25 (0 = Out of Stock)"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white text-xs font-mono focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>
          </div>

          {/* Row 3: Available Sizes & Colors & Tag */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-5">
            <div className="sm:col-span-5 space-y-2">
              <label className="block text-xs font-bold text-zinc-300">
                Available UK/IND Sizes *
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {AVAILABLE_SIZES_OPTIONS.map((sz) => {
                  const isSelected = (formData.sizes || []).includes(sz);
                  return (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => handleToggleSize(sz)}
                      className={`w-9 h-9 rounded-xl font-mono text-xs font-bold transition-all border ${
                        isSelected
                          ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-md scale-105'
                          : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      {sz}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="sm:col-span-4">
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                Colors (Comma Separated)
              </label>
              <input
                type="text"
                value={formData.color}
                onChange={(e) => handleInputChange('color', e.target.value)}
                placeholder="Black, White, Navy Blue"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white text-xs focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                Badge / Tag
              </label>
              <select
                value={formData.tag}
                onChange={(e) => handleInputChange('tag', e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-3 text-white text-xs focus:outline-none focus:border-amber-400 transition-colors"
              >
                {BADGE_OPTIONS.map((bg) => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 4: Description */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1.5">
              Product Description *
            </label>
            <textarea
              rows="3"
              required
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter product features, mesh quality, sole comfort, and style highlights..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white text-xs focus:outline-none focus:border-amber-400 transition-colors"
            ></textarea>
          </div>

          {/* Row 5: Shoe Image Upload & Preview */}
          <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-3">
            <label className="block text-xs font-bold text-zinc-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-amber-400" /> Shoe Image Upload / Image URL
              </span>
              <span className="text-[11px] text-zinc-400">Supported: Upload file or paste URL</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
              <div className="sm:col-span-7 space-y-2">
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-amber-400 text-xs font-extrabold rounded-xl transition-all flex items-center gap-2 shadow-sm shrink-0">
                    <Upload className="w-4 h-4" />
                    <span>Choose Image File</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                  </label>

                  {uploadingImage && (
                    <div className="text-xs text-amber-400 font-bold flex items-center gap-1.5 animate-pulse">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Uploading image...
                    </div>
                  )}
                </div>

                <div className="text-xs text-zinc-500 font-bold">OR paste Image URL:</div>
                <input
                  type="text"
                  value={formData.image}
                  onChange={(e) => {
                    handleInputChange('image', e.target.value);
                    setImagePreview(e.target.value);
                  }}
                  placeholder="https://... or /assets/puma-nitro.jpg"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-white text-xs focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>

              {/* Preview Box */}
              <div className="sm:col-span-5 flex justify-center sm:justify-end">
                <div className="relative w-36 h-36 bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center group">
                  {imagePreview || formData.image ? (
                    <img
                      src={resolveImgSrc(imagePreview || formData.image)}
                      alt="Preview"
                      className="w-full h-full object-cover object-center"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/assets/real-nitro-black-white.jpg';
                      }}
                    />
                  ) : (
                    <div className="text-center p-3 text-zinc-600 space-y-1">
                      <ImageIcon className="w-8 h-8 mx-auto opacity-50" />
                      <span className="text-[10px] block font-bold">Image Preview</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Form Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting || uploadingImage}
              className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black rounded-2xl text-sm shadow-xl shadow-amber-500/20 transition-all hover:scale-[1.005] flex items-center justify-center gap-2 uppercase tracking-wider disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>{editingId ? 'UPDATING PRODUCT...' : 'ADDING PRODUCT...'}</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-5 h-5" />
                  <span>{editingId ? 'UPDATE PRODUCT DETAILS' : 'SAVE & ADD NEW PRODUCT'}</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>

      {/* ─── SECTION 2: EXISTING PRODUCTS MANAGEMENT LIST ──────────────────── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <span>Existing Store Products ({filteredProducts.length})</span>
            </h3>
            <p className="text-xs text-zinc-400">View, edit, or delete shoe items currently available on website</p>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search product by name or category..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-amber-400 transition-colors"
            />
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-3xl text-center space-y-2">
            <p className="text-sm font-bold text-zinc-400">No products found matching your filter.</p>
            <p className="text-xs text-zinc-500">Try adjusting your search query or add a new product above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((prod) => {
              const pId = prod._id || prod.productId;
              const displayImg = Array.isArray(prod.images) && prod.images.length ? prod.images[0] : (prod.img || '');
              const isAvailable = prod.inStock !== false && (prod.stock === undefined || prod.stock > 0);

              return (
                <div
                  key={pId}
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between space-y-3 shadow-lg hover:border-zinc-700 transition-all"
                >
                  <div className="flex gap-3">
                    <img
                      src={resolveImgSrc(displayImg)}
                      alt={prod.name}
                      className="w-20 h-20 rounded-xl object-cover bg-zinc-950 border border-zinc-800 shrink-0"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/assets/real-nitro-black-white.jpg';
                      }}
                    />
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[9px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded">
                          {prod.tag || 'Shoes'}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-bold uppercase truncate">{prod.category}</span>
                      </div>

                      <h4 className="text-xs font-extrabold text-white leading-snug line-clamp-2">
                        {prod.name}
                      </h4>

                      <div className="flex items-baseline gap-2 font-mono text-xs">
                        <span className="font-black text-amber-400">₹{prod.price}</span>
                        {prod.originalPrice && (
                          <span className="text-zinc-500 line-through text-[11px]">₹{prod.originalPrice}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-zinc-800 text-xs">
                    {/* Admin Stock Control Toggle Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleStockAdmin(prod)}
                      disabled={togglingStockId === pId}
                      title={isAvailable ? 'Click to set OUT OF STOCK' : 'Click to set IN STOCK'}
                      className={`py-1.5 px-3 rounded-xl font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 border transition-all cursor-pointer shadow-sm ${
                        isAvailable
                          ? 'bg-emerald-950/90 hover:bg-emerald-900 text-emerald-300 border-emerald-700/80 hover:border-emerald-500'
                          : 'bg-red-950/90 hover:bg-red-900 text-red-300 border-red-700/80 hover:border-red-500 animate-pulse'
                      }`}
                    >
                      <ShieldCheck className={`w-3.5 h-3.5 ${isAvailable ? 'text-emerald-400' : 'text-red-400'}`} />
                      <span>{togglingStockId === pId ? 'SAVING...' : isAvailable ? 'IN STOCK' : 'OUT OF STOCK'}</span>
                    </button>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditClick(prod)}
                        className="p-2 bg-zinc-800 hover:bg-amber-500 hover:text-zinc-950 text-zinc-300 rounded-xl transition-all border border-zinc-700"
                        title="Edit Product"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setProductToDelete(prod)}
                        className="p-2 bg-zinc-800 hover:bg-red-600 text-zinc-300 hover:text-white rounded-xl transition-all border border-zinc-700"
                        title="Delete Product"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── DELETE CONFIRMATION MODAL ────────────────────────────────────── */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
          <div className="relative w-full max-w-md bg-zinc-900 border border-red-800/80 rounded-3xl shadow-2xl p-6 text-zinc-100 space-y-5 text-center">
            <div className="w-16 h-16 bg-red-950/80 border border-red-500/50 rounded-full flex items-center justify-center mx-auto text-red-400 shadow-xl">
              <Trash2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-black text-white">
                Delete Product Confirmation
              </h3>
              <p className="text-xs text-red-300 font-semibold bg-red-950/60 border border-red-800/80 p-3 rounded-xl">
                Are you sure you want to delete this product?
              </p>
            </div>

            {/* Product Card Snippet */}
            <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center gap-3 text-left text-xs">
              <img
                src={resolveImgSrc(Array.isArray(productToDelete.images) && productToDelete.images.length ? productToDelete.images[0] : (productToDelete.img || ''))}
                alt={productToDelete.name}
                className="w-14 h-14 rounded-xl object-cover bg-zinc-900 border border-zinc-800 shrink-0"
              />
              <div>
                <div className="font-extrabold text-white leading-snug line-clamp-1">{productToDelete.name}</div>
                <div className="text-[11px] text-zinc-400 font-mono mt-0.5">₹{productToDelete.price} • {productToDelete.category}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={handleDeleteExecute}
                disabled={deleting}
                className="py-3 bg-red-600 hover:bg-red-500 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-red-600/20 disabled:opacity-50"
              >
                {deleting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span>Yes, Delete</span>
              </button>

              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors border border-zinc-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
