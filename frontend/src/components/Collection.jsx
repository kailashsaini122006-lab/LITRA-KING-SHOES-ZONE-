import React, { useState, useEffect, useCallback } from 'react';
import { ShoppingBag, Eye, Star, MessageCircle, Phone, RefreshCw, Zap } from 'lucide-react';
import { getApiUrl } from '../config/api';
import { useCart } from '../context/CartContext';

export default function Collection({ onProductSelect }) {
  const { addToCart } = useCart();

  const [activeCategory, setActiveCategory] = useState('All');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addedId, setAddedId] = useState(null);

  const categories = [
    'All',
    'Sports Shoes',
    'Casual Shoes',
    'Sneakers',
    'Running Shoes',
    'Formal Shoes',
    'Slippers',
    'Sandals',
    'Kids Footwear',
  ];

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const url = activeCategory === 'All'
        ? getApiUrl('/products')
        : getApiUrl(`/products?category=${encodeURIComponent(activeCategory)}`);

      const res = await fetch(url);
      const data = await res.json().catch(() => null);

      if (res.ok && data && Array.isArray(data.products)) {
        setProducts(data.products);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  }, [activeCategory]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleQuickAdd = (e, item) => {
    e.stopPropagation();
    if (item.stock !== undefined && item.stock <= 0) return;
    addToCart(item, item.sizes ? item.sizes[0] : 8, item.colors ? item.colors[0] : 'Black', 1);
    setAddedId(item.productId || item._id);
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
            Our Footwear <span className="gold-text-gradient">Collection</span>
          </h2>
          <p className="text-zinc-400 max-w-2xl mx-auto text-sm sm:text-base">
            We offer an extensive range of high-quality footwear categories for both retail customers and bulk wholesale buyers.
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

        {/* Footwear Grid */}
        {loading ? (
          <div className="py-16 text-center text-zinc-400 flex items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-amber-400" /> Loading shoes collection from database...
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center text-zinc-500 text-sm">
            No footwear items found in this category.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((item) => {
              const isOutOfStock = item.stock !== undefined && item.stock <= 0;
              const imgUrl = Array.isArray(item.images) && item.images.length ? item.images[0] : item.img;
              const discountPercent = item.originalPrice && item.originalPrice > item.price
                ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)
                : 35;

              return (
                <div
                  key={item._id || item.productId}
                  onClick={() => onProductSelect(item)}
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-amber-500/60 transition-all duration-300 hover:-translate-y-1 shadow-xl flex flex-col group cursor-pointer"
                >
                  {/* Image Box */}
                  <div className="relative h-60 overflow-hidden bg-zinc-950">
                    <img
                      src={imgUrl || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80'}
                      alt={item.name}
                      className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-80" />

                    {/* Tag / Discount Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1">
                      <span className="bg-red-600/90 text-white font-extrabold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-md shadow">
                        {discountPercent}% OFF
                      </span>
                      {item.tag && (
                        <span className="bg-amber-500/90 text-zinc-950 font-extrabold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md shadow">
                          {item.tag}
                        </span>
                      )}
                    </div>

                    {/* Category Pill */}
                    <span className="absolute bottom-3 left-3 bg-zinc-950/80 backdrop-blur text-amber-400 font-bold text-xs px-2.5 py-1 rounded-md border border-amber-500/30">
                      {item.category}
                    </span>

                    {/* Quick View Floating Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onProductSelect(item);
                      }}
                      className="absolute bottom-3 right-3 p-2 bg-zinc-900/90 hover:bg-amber-500 hover:text-zinc-950 text-white rounded-xl border border-zinc-700 transition-all shadow-lg"
                      title="Quick View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Content Box */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-400 font-bold uppercase tracking-wider">{item.brand || 'LITRA KING'}</span>
                        <div className="flex items-center text-amber-400 gap-1 font-mono font-bold">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          <span>{item.rating || 4.8}</span>
                        </div>
                      </div>

                      <h3 className="text-white font-bold text-base group-hover:text-amber-400 transition-colors line-clamp-1">
                        {item.name}
                      </h3>

                      <p className="text-zinc-400 text-xs leading-relaxed line-clamp-2">{item.description}</p>
                    </div>

                    {/* Price & Stock */}
                    <div className="space-y-3 pt-2 border-t border-zinc-800/80">
                      <div className="flex items-baseline justify-between">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl font-black text-amber-400 font-mono">₹{item.price}</span>
                          {item.originalPrice && (
                            <span className="text-xs text-zinc-500 line-through font-mono">₹{item.originalPrice}</span>
                          )}
                        </div>

                        {isOutOfStock ? (
                          <span className="text-[10px] bg-red-950 text-red-400 border border-red-800 font-bold px-2 py-0.5 rounded">
                            Out of Stock
                          </span>
                        ) : (
                          <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold px-2 py-0.5 rounded">
                            In Stock
                          </span>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onProductSelect(item);
                          }}
                          className="flex items-center justify-center gap-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs py-2.5 rounded-xl border border-zinc-700 transition-all"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-400" />
                          <span>Details</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleQuickAdd(e, item)}
                          disabled={isOutOfStock}
                          className={`flex items-center justify-center gap-1 font-extrabold text-xs py-2.5 rounded-xl transition-all shadow-md ${
                            addedId === (item.productId || item._id)
                              ? 'bg-emerald-500 text-zinc-950'
                              : isOutOfStock
                              ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed border border-zinc-800'
                              : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 shadow-amber-500/20'
                          }`}
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>{addedId === (item.productId || item._id) ? 'Added!' : 'Add to Cart'}</span>
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
