import React, { useState, useEffect, useCallback } from 'react';
import { ShoppingBag, Eye, Star, RefreshCw, Check, AlertCircle } from 'lucide-react';
import { getApiUrl } from '../config/api';
import { useCart } from '../context/CartContext';

const DEFAULT_PRODUCTS = [
  {
    _id: 'prod-ntr-001',
    productId: 'LK-NTR-001',
    name: 'Black & White Nitro Running Shoe',
    brand: 'LITRA KING',
    category: 'Running Shoes',
    description: 'High-performance athletic running footwear featuring responsive Nitro foam cushioning, breathable mesh upper, and anti-slip rubber outsole.',
    price: 850,
    originalPrice: 1999,
    images: ['/assets/nitro-black-white.jpg'],
    sizes: [6, 7, 8, 9, 10],
    stock: 25,
    inStock: true,
    rating: 4.9,
    tag: 'WHOLESALE FAVORITE',
    isFeatured: true,
  },
  {
    _id: 'prod-ntr-002',
    productId: 'LK-NTR-002',
    name: 'Grey/Yellow Nitro Running Shoe',
    brand: 'LITRA KING',
    category: 'Running Shoes',
    description: 'Vibrant electric yellow highlight running footwear with high rebound Nitro foam technology, ergonomic heel support, and flexible tread.',
    price: 850,
    originalPrice: 1999,
    images: ['/assets/nitro-grey-yellow.jpg'],
    sizes: [6, 7, 8, 9, 10],
    stock: 20,
    inStock: true,
    rating: 4.8,
    tag: 'WHOLESALE FAVORITE',
    isFeatured: true,
  },
  {
    _id: 'prod-ntr-003',
    productId: 'LK-NTR-003',
    name: 'White/Turquoise Nitro Running Shoe',
    brand: 'LITRA KING',
    category: 'Running Shoes',
    description: 'Clean crisp white and bright turquoise edition athletic shoes with energy returning Nitro foam midsole and breathable airflow mesh.',
    price: 850,
    originalPrice: 1999,
    images: ['/assets/nitro-white-turquoise.jpg'],
    sizes: [6, 7, 8, 9, 10],
    stock: 22,
    inStock: true,
    rating: 4.9,
    tag: 'WHOLESALE FAVORITE',
    isFeatured: true,
  },
  {
    _id: 'prod-ntr-004',
    productId: 'LK-NTR-004',
    name: 'Red/Black Nitro Sport Edition',
    brand: 'LITRA KING',
    category: 'Running Shoes',
    description: 'Aggressive crimson red and black edition athletic shoes featuring Nitro Elite foam energy core and metallic silver side accents.',
    price: 850,
    originalPrice: 1999,
    images: ['/assets/nitro-red-black.jpg'],
    sizes: [6, 7, 8, 9, 10],
    stock: 18,
    inStock: true,
    rating: 4.9,
    tag: 'WHOLESALE FAVORITE',
    isFeatured: true,
  },
];

export default function Collection({ onProductSelect }) {
  const { addToCart } = useCart();

  const [activeCategory, setActiveCategory] = useState('All');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addedId, setAddedId] = useState(null);

  const categories = [
    'All',
    'Running Shoes',
    'Sports Shoes',
    'Casual Shoes',
    'Sneakers',
    'Formal Shoes',
    'Slippers',
  ];

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const url = activeCategory === 'All'
        ? getApiUrl('/products')
        : getApiUrl(`/products?category=${encodeURIComponent(activeCategory)}`);

      const res = await fetch(url);
      const data = await res.json().catch(() => null);

      if (res.ok && data && Array.isArray(data.products) && data.products.length > 0) {
        setProducts(data.products);
      } else {
        const filtered = activeCategory === 'All'
          ? DEFAULT_PRODUCTS
          : DEFAULT_PRODUCTS.filter(p => p.category === activeCategory);
        setProducts(filtered);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      const filtered = activeCategory === 'All'
        ? DEFAULT_PRODUCTS
        : DEFAULT_PRODUCTS.filter(p => p.category === activeCategory);
      setProducts(filtered);
    } finally {
      setLoading(false);
    }
  }, [activeCategory]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleQuickAdd = (e, item) => {
    e.stopPropagation();
    const isAvailable = item.inStock !== false && (item.stock === undefined || item.stock > 0);
    if (!isAvailable) return;

    const itemKey = item.productId || item._id;
    const defaultImg = Array.isArray(item.images) && item.images.length ? item.images[0] : (item.img || '/assets/nitro-black-white.jpg');
    const chosenSize = Array.isArray(item.sizes) && item.sizes.length ? item.sizes[0] : 8;

    addToCart({ ...item, images: [defaultImg] }, chosenSize, '', 1);
    setAddedId(itemKey);
    setTimeout(() => setAddedId(null), 1500);
  };

  return (
    <section id="collection" className="py-20 bg-zinc-900/40 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center space-y-3 mb-12">
          <span className="text-amber-400 font-bold uppercase tracking-widest text-xs sm:text-sm">
            Explore Footwear Varieties
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white">
            Nitro Running <span className="gold-text-gradient">Collection</span>
          </h2>
          <p className="text-zinc-400 max-w-2xl mx-auto text-sm sm:text-base">
            Premium high-performance athletic footwear designed for maximum comfort, running efficiency, and bulk wholesale value.
          </p>
        </div>

        {/* Category Filter Tabs */}
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

        {/* Footwear Grid - Desktop: 4 Columns */}
        {loading ? (
          <div className="py-16 text-center text-zinc-400 flex items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-amber-400" /> Loading shoes collection from database...
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center text-zinc-500 text-sm">
            No footwear items found in this category.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {products.map((item) => {
              const itemKey = item.productId || item._id;
              const isAvailable = item.inStock !== false && (item.stock === undefined || item.stock > 0);
              const displayImg = Array.isArray(item.images) && item.images.length ? item.images[0] : (item.img || '/assets/nitro-black-white.jpg');
              
              const sellPrice = item.price || 850;
              const origPrice = item.originalPrice || 1999;
              const discountPercent = origPrice > sellPrice
                ? Math.round(((origPrice - sellPrice) / origPrice) * 100)
                : 57;

              return (
                <div
                  key={itemKey}
                  onClick={() => onProductSelect({ ...item, images: [displayImg] })}
                  className={`bg-zinc-900 border rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-1 shadow-2xl flex flex-col group cursor-pointer ${
                    !isAvailable ? 'border-zinc-800/80 opacity-90' : 'border-zinc-800 hover:border-amber-500/60'
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

                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                      <span className="bg-red-600 text-white font-black text-[11px] uppercase tracking-wider px-2.5 py-0.5 rounded-lg shadow-md">
                        {discountPercent}% OFF
                      </span>
                      <span className="bg-amber-500 text-zinc-950 font-black text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-md shadow-sm">
                        {item.tag || 'WHOLESALE FAVORITE'}
                      </span>
                    </div>

                    {/* Quick View Floating Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onProductSelect({ ...item, images: [displayImg] });
                      }}
                      className="absolute bottom-3 right-3 p-2 bg-zinc-900/90 hover:bg-amber-500 hover:text-zinc-950 text-white rounded-xl border border-zinc-700 transition-all shadow-lg"
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
                    </div>

                    {/* Price & Availability Stock Status */}
                    <div className="space-y-3 pt-2 border-t border-zinc-800/80">
                      <div className="flex items-baseline justify-between">
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-black text-amber-400 font-mono">₹{sellPrice}</span>
                          <span className="text-xs text-zinc-500 line-through font-mono">₹{origPrice}</span>
                        </div>

                        {isAvailable ? (
                          <span className="text-[10px] bg-emerald-950/90 text-emerald-400 border border-emerald-800/80 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Check className="w-3 h-3" /> In Stock
                          </span>
                        ) : (
                          <span className="text-[10px] bg-red-950/90 text-red-400 border border-red-800/80 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Not Available
                          </span>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onProductSelect({ ...item, images: [displayImg] });
                          }}
                          className="flex items-center justify-center gap-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs py-2.5 rounded-xl border border-zinc-700 transition-all"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-400" />
                          <span>Details</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleQuickAdd(e, item)}
                          disabled={!isAvailable}
                          className={`flex items-center justify-center gap-1 font-extrabold text-xs py-2.5 rounded-xl transition-all shadow-md ${
                            !isAvailable
                              ? 'bg-zinc-800 text-zinc-500 border border-zinc-800 cursor-not-allowed opacity-60'
                              : addedId === itemKey
                              ? 'bg-emerald-500 text-zinc-950'
                              : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 shadow-amber-500/20'
                          }`}
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>
                            {!isAvailable ? 'Not Available' : addedId === itemKey ? 'Added!' : 'Add to Cart'}
                          </span>
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

