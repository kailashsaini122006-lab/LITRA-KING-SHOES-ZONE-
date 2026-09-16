import React, { useState, useEffect, useCallback } from 'react';
import { ShoppingBag, Eye, Star, RefreshCw, Check, AlertCircle, Search, X, ShieldCheck, Lock } from 'lucide-react';
import { getApiUrl } from '../config/api';
import { useCart } from '../context/CartContext';

const DEFAULT_PRODUCTS = [
  {
    _id: 'LK-NTR-001',
    productId: 'LK-NTR-001',
    name: 'Puma MAG MAX NITRO Black Running Shoe',
    brand: 'Puma',
    category: 'Running Shoes',
    description: 'High-performance Puma MAG MAX NITRO running shoe with max cushioning sole, lightweight breathable mesh upper, and ultimate running comfort.',
    price: 999,
    originalPrice: 1999,
    images: ['/assets/real-nitro-black-white.jpg', '/assets/nitro-black-white.jpg'],
    sizes: [6, 7, 8, 9, 10],
    colors: ['Black', 'White'],
    stock: 25,
    inStock: true,
    rating: 4.9,
    tag: 'HOT RUNNER',
    isFeatured: true,
  },
  {
    _id: 'LK-NTR-002',
    productId: 'LK-NTR-002',
    name: 'Puma NITRO Grey & Yellow Running Shoe',
    brand: 'Puma',
    category: 'Running Shoes',
    description: 'Dynamic Puma NITRO grey running shoe with high-visibility yellow accents, ergonomic heel lock, and responsive cushion sole.',
    price: 999,
    originalPrice: 1999,
    images: ['/assets/real-nitro-grey-yellow.jpg', '/assets/nitro-grey-yellow.jpg'],
    sizes: [6, 7, 8, 9, 10],
    colors: ['Grey', 'Yellow'],
    stock: 25,
    inStock: true,
    rating: 4.9,
    tag: 'POPULAR CHOICE',
    isFeatured: true,
  },
  {
    _id: 'LK-NTR-003',
    productId: 'LK-NTR-003',
    name: 'Puma NITRO White & Cyan Running Shoe',
    brand: 'Puma',
    category: 'Running Shoes',
    description: 'Fresh white & cyan turquoise Puma NITRO running shoe with shock-absorbing foam midsole, ultra-soft footbed, and stylish look.',
    price: 999,
    originalPrice: 1999,
    images: ['/assets/real-nitro-white-turquoise.jpg', '/assets/nitro-white-turquoise.jpg'],
    sizes: [6, 7, 8, 9, 10],
    colors: ['White', 'Cyan'],
    stock: 25,
    inStock: true,
    rating: 5.0,
    tag: 'SPECIAL OFFER',
    isFeatured: true,
  },
  {
    _id: 'LK-ASCS-1100',
    productId: 'LK-ASCS-1100',
    name: 'ASICS FF BLAST Running Shoe',
    brand: 'ASICS',
    category: 'Running Shoes',
    description: 'High-performance ASICS FF Blast running shoe with light responsive cushioning, breathable mesh upper, and dynamic grip.',
    price: 1100,
    originalPrice: 2200,
    images: ['/assets/asics-ff-blast-1100.png'],
    sizes: [6, 7, 8, 9, 10],
    stock: 25,
    inStock: true,
    rating: 4.9,
    tag: 'NEW COLLECTION',
    isFeatured: true,
  },
  {
    _id: 'LK-CHNK-899',
    productId: 'LK-CHNK-899',
    name: 'Black Chunky Platform Sneaker',
    brand: 'LITRA KING',
    category: 'Casual Shoes',
    description: 'Stylish black chunky platform sneaker with metallic accent bubble cushioning midsole and comfortable slip-resistant sole.',
    price: 899,
    originalPrice: 1799,
    images: ['/assets/chunky-black-platform-899.png'],
    sizes: [6, 7, 8, 9, 10],
    stock: 25,
    inStock: true,
    rating: 4.8,
    tag: 'BEST SELLER',
    isFeatured: true,
  },
  {
    _id: 'LK-RBK-1750',
    productId: 'LK-RBK-1750',
    name: 'Reebok Speed Black & White Shoe',
    brand: 'Reebok',
    category: 'Running Shoes',
    description: 'Premium Reebok black and white athletic shoe featuring breathable mesh, ergonomic heel support, and durable rubber traction.',
    price: 1750,
    originalPrice: 3500,
    images: ['/assets/reebok-black-white-1750.png'],
    sizes: [6, 7, 8, 9, 10],
    stock: 20,
    inStock: true,
    rating: 4.9,
    tag: 'PREMIUM FOOTWEAR',
    isFeatured: true,
  },
  {
    _id: 'LK-ADS-999',
    productId: 'LK-ADS-999',
    name: 'Adidas 3-Stripe Bubble Sneaker',
    brand: 'Adidas',
    category: 'Sneakers',
    description: 'Iconic black Adidas sneaker with 3 white side stripes and translucent air bubble pod cushioning sole.',
    price: 999,
    originalPrice: 1999,
    images: ['/assets/adidas-bubble-sole-999.png'],
    sizes: [6, 7, 8, 9, 10],
    stock: 22,
    inStock: true,
    rating: 4.8,
    tag: 'WHOLESALE FAVORITE',
    isFeatured: true,
  },
  {
    _id: 'LK-RBK-750',
    productId: 'LK-RBK-750',
    name: 'Reebok Air Cushion Black Runner',
    brand: 'Reebok',
    category: 'Casual Shoes',
    description: 'Sleek black Reebok runner shoe with translucent air bubble heel section and lightweight comfortable everyday sole.',
    price: 750,
    originalPrice: 1500,
    images: ['/assets/reebok-air-heel-750.png'],
    sizes: [6, 7, 8, 9, 10],
    stock: 30,
    inStock: true,
    rating: 4.7,
    tag: 'HOT DEAL',
    isFeatured: true,
  },
  {
    _id: 'LK-SNK-799',
    productId: 'LK-SNK-799',
    name: 'Classic White & Green Striped Retro Sneaker',
    brand: 'LITRA KING',
    category: 'Sneakers',
    description: 'Classic retro white sneaker featuring dark green & red side stripes, light grey suede toe overlay, soft inner cushioning, and slip-resistant sole.',
    price: 799,
    originalPrice: 1599,
    images: ['/assets/green-red-white-sneaker-799.jpg'],
    sizes: [6, 7, 8, 9, 10],
    colors: ['White', 'Green', 'Red'],
    stock: 30,
    inStock: true,
    rating: 4.9,
    tag: 'NEW SNEAKER',
    isFeatured: true,
  },
];

export default function Collection({ onProductSelect }) {
  const { addToCart, startBuyNow } = useCart();

  const [activeCategory, setActiveCategory] = useState('All');
  const [shoeFinderType, setShoeFinderType] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSizeFilter, setSelectedSizeFilter] = useState('All');
  const [selectedColorFilter, setSelectedColorFilter] = useState('All');
  const [maxPriceFilter, setMaxPriceFilter] = useState(5000);
  const [badgeFilter, setBadgeFilter] = useState('All'); // 'All' | 'Best Seller' | 'New' | 'Offer'

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addedId, setAddedId] = useState(null);
  const [stockOverrides, setStockOverrides] = useState({});

  // Admin Auth Detection State (strictly conditional rendering)
  const [isAdmin, setIsAdmin] = useState(() => !!sessionStorage.getItem('lk_access_token'));

  // Wishlist State (persisted in localStorage)
  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem('lk_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [toastMessage, setToastMessage] = useState('');

  // Fetch products callback defined before useEffect hooks to avoid TDZ issue
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (activeCategory !== 'All') {
        queryParams.set('category', activeCategory);
      }

      const queryString = queryParams.toString();
      const url = getApiUrl(queryString ? `/products?${queryString}` : '/products');

      const res = await fetch(url);
      const data = await res.json().catch(() => null);

      if (res.ok && data && Array.isArray(data.products) && data.products.length > 0) {
        setProducts(data.products);
      } else {
        const filtered = DEFAULT_PRODUCTS.filter(p => {
          const matchCat = activeCategory === 'All' || p.category === activeCategory;
          return matchCat;
        });
        setProducts(filtered);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      const filtered = DEFAULT_PRODUCTS.filter(p => {
        const matchCat = activeCategory === 'All' || p.category === activeCategory;
        return matchCat;
      });
      setProducts(filtered);
    } finally {
      setLoading(false);
    }
  }, [activeCategory]);

  useEffect(() => {
    const checkAdmin = () => {
      setIsAdmin(!!sessionStorage.getItem('lk_access_token'));
    };
    window.addEventListener('lk_admin_auth_changed', checkAdmin);
    window.addEventListener('storage', checkAdmin);
    return () => {
      window.removeEventListener('lk_admin_auth_changed', checkAdmin);
      window.removeEventListener('storage', checkAdmin);
    };
  }, []);

  // Re-fetch products when admin changes stock status from admin panel
  useEffect(() => {
    const handleAdminStockChanged = () => {
      fetchProducts();
    };
    window.addEventListener('lk_admin_stock_changed', handleAdminStockChanged);
    return () => {
      window.removeEventListener('lk_admin_stock_changed', handleAdminStockChanged);
    };
  }, [fetchProducts]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchProducts]);

  const toggleWishlist = (e, itemKey) => {
    e.stopPropagation();
    setWishlist((prev) => {
      const updated = prev.includes(itemKey)
        ? prev.filter((id) => id !== itemKey)
        : [...prev, itemKey];
      try {
        localStorage.setItem('lk_wishlist', JSON.stringify(updated));
      } catch (err) {
        console.error('Error saving wishlist:', err);
      }
      return updated;
    });
  };

  // Admin-Only Stock Availability Toggle with API Persistence
  const handleToggleStockAdmin = async (e, item) => {
    e.stopPropagation();
    const token = sessionStorage.getItem('lk_access_token');
    if (!token) return;

    const id = item._id || item.productId;
    const currentInStock = item.inStock !== false;
    const newInStock = !currentInStock;

    // Optimistic UI state update
    setProducts((prev) =>
      prev.map((p) =>
        (p._id === id || p.productId === id) ? { ...p, inStock: newInStock } : p
      )
    );
    setStockOverrides((prev) => ({ ...prev, [id]: newInStock }));

    try {
      const res = await fetch(getApiUrl(`/products/${encodeURIComponent(id)}/stock`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ inStock: newInStock }),
      });
      const data = await res.json().catch(() => null);

      if (res.ok && data && data.success && data.product) {
        setProducts((prev) =>
          prev.map((p) =>
            (p._id === id || p.productId === id) ? { ...p, inStock: data.product.inStock } : p
          )
        );
        setToastMessage(`⚡ Admin: "${item.name}" marked ${data.product.inStock ? 'Available' : 'Out of Stock'}`);
        setTimeout(() => setToastMessage(''), 3500);
      } else {
        // Fallback to PUT if PATCH not handled
        const putRes = await fetch(getApiUrl(`/products/${encodeURIComponent(id)}`), {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ inStock: newInStock }),
        });
        const putData = await putRes.json().catch(() => null);
        if (putRes.ok && putData && putData.success && putData.product) {
          setProducts((prev) =>
            prev.map((p) =>
              (p._id === id || p.productId === id) ? { ...p, inStock: putData.product.inStock } : p
            )
          );
          setToastMessage(`⚡ Admin: "${item.name}" marked ${putData.product.inStock ? 'Available' : 'Out of Stock'}`);
          setTimeout(() => setToastMessage(''), 3500);
        }
      }
    } catch (err) {
      console.error('Error saving product stock to backend:', err);
    }
  };

  const categories = [
    'All',
    'Running Shoes',
    'Sports Shoes',
    'Casual Shoes',
    'Sneakers',
    'Formal Shoes',
    'Slippers',
  ];

  const shoeFinderOptions = [
    { label: 'All', icon: '👟' },
    { label: 'Sneakers', icon: '👟' },
    { label: 'Running', icon: '🏃' },
    { label: 'Sports', icon: '⚡' },
    { label: 'Casual', icon: '✨' },
    { label: 'Formal', icon: '👞' },
    { label: 'Party', icon: '🎉' },
  ];

  const handleQuickAdd = (e, item, isAvailable) => {
    e.stopPropagation();
    if (!isAvailable) {
      setToastMessage(`❌ "${item.name}" — Out of Stock`);
      setTimeout(() => setToastMessage(''), 3500);
      return;
    }

    const itemKey = item.productId || item._id;
    const defaultImg = Array.isArray(item.images) && item.images.length ? item.images[0] : (item.img || '/assets/real-nitro-black-white.jpg');
    const chosenSize = Array.isArray(item.sizes) && item.sizes.length ? item.sizes[0] : 8;

    addToCart({ ...item, images: [defaultImg] }, chosenSize, '', 1);
    setAddedId(itemKey);
    setTimeout(() => setAddedId(null), 1500);
  };

  // Smart search & advanced filters matching helper
  const matchesFilters = (item) => {
    // 1. Search Query
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const words = q.split(/\s+/).filter(Boolean);
      const normalizedWords = words.map(w => {
        if (w === 'runing' || w === 'runingg') return 'running';
        if (w === 'shoze' || w === 'shose' || w === 'jute' || w === 'juta') return 'shoes';
        if (w === 'senakers' || w === 'senaker' || w === 'sneakers' || w === 'sneaker') return 'sneaker';
        return w;
      });

      const fullText = [
        item.name || '',
        item.brand || '',
        item.category || '',
        item.description || '',
        item.tag || '',
        ...(Array.isArray(item.colors) ? item.colors : []),
      ].join(' ').toLowerCase();

      const matchSearch = normalizedWords.every(word => fullText.includes(word)) || fullText.includes(q);
      if (!matchSearch) return false;
    }

    // 2. Personalized Shoe Finder Filter
    if (shoeFinderType !== 'All') {
      const target = shoeFinderType.toLowerCase();
      const itemText = (item.name + ' ' + item.category + ' ' + item.description + ' ' + (item.tag || '')).toLowerCase();
      if (target === 'sneakers') {
        if (!itemText.includes('sneaker') && !itemText.includes('sneakers') && item.category !== 'Sneakers') {
          return false;
        }
      } else if (!itemText.includes(target)) {
        if (target === 'party' && !itemText.includes('formal') && !itemText.includes('chunky') && !itemText.includes('platform')) {
          return false;
        } else if (target !== 'party') {
          return false;
        }
      }
    }

    // 3. Price Filter
    if (item.price && item.price > maxPriceFilter) {
      return false;
    }

    // 4. Size Filter
    if (selectedSizeFilter !== 'All') {
      const targetSz = Number(selectedSizeFilter);
      if (Array.isArray(item.sizes) && item.sizes.length && !item.sizes.includes(targetSz)) {
        return false;
      }
    }

    // 5. Color Filter
    if (selectedColorFilter !== 'All') {
      const itemColors = Array.isArray(item.colors) ? item.colors.map(c => c.toLowerCase()) : ['black'];
      if (!itemColors.some(c => c.includes(selectedColorFilter.toLowerCase()))) {
        return false;
      }
    }

    // 6. Badge / Tag Filter
    if (badgeFilter !== 'All') {
      const tagLower = (item.tag || '').toLowerCase();
      if (badgeFilter === 'Best Seller' && !tagLower.includes('best') && !tagLower.includes('favorite') && !item.isFeatured) {
        return false;
      }
      if (badgeFilter === 'New' && !tagLower.includes('new') && !tagLower.includes('hot')) {
        return false;
      }
      if (badgeFilter === 'Offer' && !tagLower.includes('offer') && !tagLower.includes('deal') && !tagLower.includes('sale')) {
        return false;
      }
    }

    return true;
  };

  const displayedProducts = products.filter(matchesFilters);

  const resetAllFilters = () => {
    setActiveCategory('All');
    setShoeFinderType('All');
    setSearchQuery('');
    setSelectedSizeFilter('All');
    setSelectedColorFilter('All');
    setMaxPriceFilter(5000);
    setBadgeFilter('All');
  };

  return (
    <section id="collection" className="py-20 bg-zinc-900/40 relative">
      {/* Toast Alert Message Popup */}
      {toastMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-red-950 border-2 border-red-500 text-white font-extrabold px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce max-w-md w-11/12 text-center justify-center">
          <AlertCircle className="w-6 h-6 text-red-400 shrink-0" />
          <span className="text-xs sm:text-sm leading-tight">{toastMessage}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center space-y-3 mb-8">
          <span className="text-amber-400 font-bold uppercase tracking-widest text-xs sm:text-sm">
            Explore Footwear Varieties
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white">
            LITRA KING <span className="gold-text-gradient">Shoe Collection</span>
          </h2>
          <p className="text-zinc-400 max-w-2xl mx-auto text-sm sm:text-base">
            Discover top-tier running shoes, sneakers, formal leather footwear, and everyday sports styles at unbeatable prices.
          </p>
        </div>

        {/* ── 1. PERSONALIZED SHOE FINDER: "Find Your Perfect Shoes 👟" ── */}
        <div className="bg-zinc-950/80 border border-amber-500/30 rounded-3xl p-4 sm:p-6 mb-8 text-center space-y-4 shadow-2xl">
          <div className="flex items-center justify-center gap-2">
            <span className="text-xl sm:text-2xl font-black text-white">Find Your Perfect Shoes</span>
            <span className="text-xl sm:text-2xl">👟</span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto">
            Select your preferred shoe type to instantly highlight matching pairs from our store:
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
            {shoeFinderOptions.map((opt) => (
              <button
                key={opt.label}
                onClick={() => setShoeFinderType(opt.label)}
                className={`px-4 py-2.5 rounded-2xl font-extrabold text-xs sm:text-sm transition-all flex items-center gap-2 border ${
                  shoeFinderType === opt.label
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 border-amber-400 shadow-lg shadow-amber-500/25 scale-105'
                    : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-amber-500/40 hover:text-amber-300'
                }`}
              >
                <span>{opt.icon}</span>
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── 2. PROMINENT SEARCH BAR ── */}
        <div className="max-w-2xl mx-auto mb-6 relative">
          <div className="relative flex items-center">
            <Search className="w-5 h-5 text-amber-400 absolute left-4 pointer-events-none" />
            <input
              type="text"
              id="shoe-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by shoe name, Puma Nitro, ASICS, category, brand..."
              className="w-full bg-zinc-950/90 text-white placeholder-zinc-500 pl-12 pr-10 py-3.5 rounded-2xl border border-zinc-800 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-sm font-medium transition-all shadow-xl"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 p-1 rounded-full text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 transition-colors"
                title="Clear Search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* ── 3. SEARCH FILTERS BAR (PRICE, SIZE, COLOR, BADGE) ── */}
        <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-2xl p-4 mb-8 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs border-b border-zinc-800/80 pb-3">
            <span className="font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>⚡ Filter Shoes:</span>
            </span>

            <button
              onClick={resetAllFilters}
              className="text-zinc-400 hover:text-white font-semibold underline"
            >
              Reset All Filters
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {/* Price Filter */}
            <div>
              <label className="block text-zinc-400 font-bold mb-1">Max Price: ₹{maxPriceFilter}</label>
              <input
                type="range"
                min="500"
                max="5000"
                step="250"
                value={maxPriceFilter}
                onChange={(e) => setMaxPriceFilter(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Size Filter */}
            <div>
              <label className="block text-zinc-400 font-bold mb-1">Shoe Size:</label>
              <select
                value={selectedSizeFilter}
                onChange={(e) => setSelectedSizeFilter(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-white font-bold focus:border-amber-400"
              >
                <option value="All">All Sizes</option>
                <option value="6">UK / IND 6</option>
                <option value="7">UK / IND 7</option>
                <option value="8">UK / IND 8</option>
                <option value="9">UK / IND 9</option>
                <option value="10">UK / IND 10</option>
              </select>
            </div>

            {/* Color Filter */}
            <div>
              <label className="block text-zinc-400 font-bold mb-1">Color:</label>
              <select
                value={selectedColorFilter}
                onChange={(e) => setSelectedColorFilter(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-white font-bold focus:border-amber-400"
              >
                <option value="All">All Colors</option>
                <option value="Black">Black</option>
                <option value="White">White</option>
                <option value="Grey">Grey</option>
                <option value="Yellow">Yellow</option>
                <option value="Cyan">Cyan</option>
              </select>
            </div>

            {/* Badge / Tag Filter */}
            <div>
              <label className="block text-zinc-400 font-bold mb-1">Filter Tag:</label>
              <select
                value={badgeFilter}
                onChange={(e) => setBadgeFilter(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-white font-bold focus:border-amber-400"
              >
                <option value="All">All Shoes</option>
                <option value="Best Seller">🔥 Best Sellers</option>
                <option value="New">✨ New Arrivals</option>
                <option value="Offer">🏷️ Special Offers</option>
              </select>
            </div>
          </div>

          {(searchQuery || shoeFinderType !== 'All' || selectedSizeFilter !== 'All' || selectedColorFilter !== 'All' || maxPriceFilter < 5000 || badgeFilter !== 'All') && (
            <div className="pt-2 text-xs text-amber-400 font-semibold flex items-center justify-between">
              <span>Showing {displayedProducts.length} matching footwear items</span>
            </div>
          )}
        </div>

        {/* ── 4. CATEGORY TABS ── */}
        <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-4 mb-10 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all border ${
                activeCategory === cat
                  ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-lg shadow-amber-500/20 scale-105'
                  : 'bg-zinc-900/90 text-zinc-300 border-zinc-800 hover:border-amber-500/40 hover:text-amber-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* ── 5. FOOTWEAR GRID ── */}
        {loading ? (
          <div className="py-16 text-center text-zinc-400 flex items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-amber-400" /> Loading shoes collection from database...
          </div>
        ) : displayedProducts.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <p className="text-zinc-400 text-base font-semibold">
              No footwear items found matching your filters.
            </p>
            <button
              onClick={resetAllFilters}
              className="bg-amber-500 hover:bg-amber-400 text-zinc-950 px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg transition-all"
            >
              Clear All Filters &amp; Show All Shoes
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {displayedProducts.map((item) => {
              const itemKey = item.productId || item._id;
              const defaultAvailable = item.inStock !== false && (item.stock === undefined || item.stock > 0);
              const isAvailable = stockOverrides[itemKey] !== undefined ? stockOverrides[itemKey] : defaultAvailable;

              const rawImg = Array.isArray(item.images) && item.images.length ? item.images[0] : (item.img || '/assets/real-nitro-black-white.jpg');
              const displayImg = (rawImg.startsWith('http://') || rawImg.startsWith('https://') || rawImg.startsWith('data:') || rawImg.startsWith('/assets'))
                ? rawImg
                : getApiUrl(rawImg);
              
              const sellPrice = item.price || 999;
              const origPrice = item.originalPrice || 1999;
              const discountPercent = origPrice > sellPrice
                ? Math.round(((origPrice - sellPrice) / origPrice) * 100)
                : 57;

              const isWishlisted = wishlist.includes(itemKey);

              return (
                <div
                  key={itemKey}
                  onClick={() => {
                    if (!isAvailable) {
                      setToastMessage(`❌ "${item.name}" — Out of Stock`);
                      setTimeout(() => setToastMessage(''), 3500);
                    }
                    onProductSelect({ ...item, images: [displayImg], inStock: isAvailable });
                  }}
                  className={`bg-zinc-900 border rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-1 shadow-2xl flex flex-col group cursor-pointer relative ${
                    !isAvailable ? 'border-red-900/50 opacity-95' : 'border-zinc-800 hover:border-amber-500/60'
                  }`}
                >
                  {/* Image Box */}
                  <div className="relative h-56 overflow-hidden bg-zinc-950">
                    <img
                      src={displayImg}
                      alt={item.name}
                      className={`w-full h-full object-cover object-center transition-transform duration-500 ${
                        isAvailable ? 'group-hover:scale-105' : 'grayscale-[40%]'
                      }`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-80" />

                    {/* Real Product Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                      {discountPercent > 0 && (
                        <span className="bg-red-600 text-white font-black text-[11px] uppercase tracking-wider px-2.5 py-0.5 rounded-lg shadow-md">
                          {discountPercent}% OFF
                        </span>
                      )}
                      <span className="bg-amber-500 text-zinc-950 font-black text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-md shadow-sm">
                        {item.tag || (item.isFeatured ? '🔥 BEST SELLER' : 'SPECIAL OFFER')}
                      </span>
                    </div>

                    {/* Wishlist Heart Toggle Button */}
                    <button
                      type="button"
                      onClick={(e) => toggleWishlist(e, itemKey)}
                      className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all shadow-md z-10 border ${
                        isWishlisted
                          ? 'bg-red-600 text-white border-red-500 scale-110'
                          : 'bg-zinc-950/70 text-zinc-400 hover:text-red-400 border-zinc-800'
                      }`}
                      title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                    >
                      <span className="text-sm">{isWishlisted ? '❤️' : '🤍'}</span>
                    </button>

                    {/* ADMIN-ONLY STOCK CONTROL ICON / BUTTON (Visible ONLY to Logged-in Admin) */}
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={(e) => handleToggleStockAdmin(e, item)}
                        title={isAvailable ? 'Admin Control: Click to mark Out of Stock' : 'Admin Control: Click to mark Available'}
                        className={`absolute bottom-3 left-3 z-20 p-2 rounded-xl backdrop-blur-md font-extrabold text-[11px] uppercase tracking-wider flex items-center gap-1.5 shadow-xl border transition-all cursor-pointer ${
                          isAvailable
                            ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950 border-amber-300'
                            : 'bg-red-600 hover:bg-red-500 text-white border-red-400 animate-pulse'
                        }`}
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>{isAvailable ? 'Admin: In Stock' : 'Admin: Out of Stock'}</span>
                      </button>
                    )}

                    {/* Quick View Floating Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isAvailable) {
                          setToastMessage(`❌ "${item.name}" — Out of Stock`);
                          setTimeout(() => setToastMessage(''), 3500);
                        }
                        onProductSelect({ ...item, images: [displayImg], inStock: isAvailable });
                      }}
                      className="absolute bottom-3 right-3 p-2 bg-zinc-900/90 hover:bg-amber-500 hover:text-zinc-950 text-white rounded-xl border border-zinc-700 transition-all shadow-lg z-10"
                      title="Quick View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Content Box */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3.5">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-400 font-bold uppercase tracking-wider text-[11px]">{item.brand || 'LITRA KING'}</span>
                        <div className="flex items-center text-amber-400 gap-1 font-mono font-bold text-[11px]">
                          <Star className="w-3 h-3 fill-amber-400" />
                          <span>{item.rating || 4.9}</span>
                        </div>
                      </div>

                      <h3 className="text-white font-black text-base group-hover:text-amber-400 transition-colors leading-snug line-clamp-1">
                        {item.name}
                      </h3>

                      <p className="text-zinc-400 text-xs leading-relaxed line-clamp-2">{item.description}</p>

                      {/* Available Sizes Tag Pill List */}
                      <div className="flex items-center gap-1.5 pt-1">
                        <span className="text-[10px] text-zinc-500 font-bold uppercase">Sizes:</span>
                        <div className="flex items-center gap-1 flex-wrap">
                          {(Array.isArray(item.sizes) ? item.sizes : [6, 7, 8, 9, 10]).map((sz) => (
                            <span key={sz} className="text-[10px] font-mono font-bold bg-zinc-950 text-zinc-300 px-1.5 py-0.5 rounded border border-zinc-800">
                              {sz}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Price & Availability Stock Status */}
                    <div className="space-y-3 pt-2 border-t border-zinc-800/80">
                      <div className="flex items-baseline justify-between">
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-black text-amber-400 font-mono">₹{sellPrice}</span>
                          <span className="text-xs text-zinc-500 line-through font-mono">₹{origPrice}</span>
                        </div>

                        {/* Customer Stock Badge */}
                        <div
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 transition-all border ${
                            isAvailable
                              ? 'bg-emerald-950/90 text-emerald-400 border-emerald-800/80'
                              : 'bg-red-950/90 text-red-400 border-red-800/80'
                          }`}
                        >
                          {isAvailable ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span>In Stock</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-3 h-3 text-red-400" />
                              <span>Out of Stock</span>
                            </>
                          )}
                        </div>
                      </div>

                      {!isAvailable && (
                        <div className="bg-red-950/80 border border-red-800/60 rounded-xl p-2 text-center text-[11px] font-extrabold text-red-300 flex items-center justify-center gap-1.5 shadow-inner">
                          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                          <span>Out of Stock</span>
                        </div>
                      )}

                      {/* Action Buttons: Details, Add to Cart, Buy Now */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={(e) => handleQuickAdd(e, item, isAvailable)}
                          disabled={!isAvailable}
                          className={`flex items-center justify-center gap-1 font-extrabold text-xs py-2.5 rounded-xl transition-all shadow-md ${
                            !isAvailable
                              ? 'bg-zinc-800 text-zinc-500 border border-zinc-700/50 cursor-not-allowed opacity-60'
                              : addedId === itemKey
                              ? 'bg-emerald-500 text-zinc-950'
                              : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'
                          }`}
                        >
                          <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
                          <span>
                            {addedId === itemKey ? 'Added!' : 'Add to Cart'}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isAvailable) {
                              setToastMessage(`❌ "${item.name}" — Out of Stock`);
                              setTimeout(() => setToastMessage(''), 3500);
                              return;
                            }
                            const chosenSize = Array.isArray(item.sizes) && item.sizes.length ? item.sizes[0] : 8;
                            const chosenColor = Array.isArray(item.colors) && item.colors.length ? item.colors[0] : 'Black';
                            startBuyNow(item, chosenSize, chosenColor, 1, displayImg);
                            onProductSelect({ ...item, images: [displayImg], inStock: isAvailable });
                          }}
                          disabled={!isAvailable}
                          className={`flex items-center justify-center gap-1 font-black text-xs py-2.5 rounded-xl transition-all shadow-md ${
                            !isAvailable
                              ? 'bg-zinc-800 text-zinc-500 border border-zinc-700/50 cursor-not-allowed opacity-60'
                              : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 shadow-amber-500/20'
                          }`}
                        >
                          <span>Buy Now</span>
                        </button>
                      </div>

                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>
    </section>
  );
}

