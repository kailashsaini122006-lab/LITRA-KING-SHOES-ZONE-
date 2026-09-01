import React, { useState, useEffect, useCallback } from 'react';
import { ShoppingBag, Eye, Star, MessageCircle, Phone, RefreshCw, Zap } from 'lucide-react';
import { getApiUrl } from '../config/api';
import { useCart } from '../context/CartContext';

const DEFAULT_PRODUCTS = [
  {
    _id: 'prod-001',
    productId: 'LK-SP-001',
    name: 'Air Max Pro Sport Shoes',
    brand: 'LITRA KING',
    category: 'Sports Shoes',
    description: 'High performance athletic shoes with ultra-grip cushioning, breathable mesh, and flexible soles for workouts, running, and active wear.',
    price: 1499,
    originalPrice: 2499,
    images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80'],
    sizes: [6, 7, 8, 9, 10],
    colors: ['Red', 'Black', 'White'],
    stock: 20,
    rating: 4.9,
    tag: 'Top Rated',
    isFeatured: true,
  },
  {
    _id: 'prod-002',
    productId: 'LK-SN-002',
    name: 'Streetwear Urban Edition Sneakers',
    brand: 'LITRA KING',
    category: 'Sneakers',
    description: 'Modern street style sneakers crafted with premium synthetic leather, lightweight shock-absorbing insoles, and trendy high-top finish.',
    price: 1899,
    originalPrice: 2999,
    images: ['https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=800&q=80'],
    sizes: [6, 7, 8, 9, 10],
    colors: ['White/Black', 'Grey', 'Full Black'],
    stock: 18,
    rating: 4.8,
    tag: 'Best Wholesale Seller',
    isFeatured: true,
  },
  {
    _id: 'prod-003',
    productId: 'LK-CS-003',
    name: 'Comfort Soft Casual Loafers',
    brand: 'LITRA KING',
    category: 'Casual Shoes',
    description: 'Ultra lightweight daily casual walk shoes designed for effortless slip-on comfort, all-day cushioning, and casual office or outing wear.',
    price: 1299,
    originalPrice: 1999,
    images: ['https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=800&q=80'],
    sizes: [7, 8, 9, 10],
    colors: ['Brown', 'Tan', 'Navy Blue'],
    stock: 25,
    rating: 4.7,
    tag: 'Wholesale Favorite',
    isFeatured: true,
  },
  {
    _id: 'prod-004',
    productId: 'LK-RN-004',
    name: 'FlyRunner Cushion Marathon Shoes',
    brand: 'LITRA KING',
    category: 'Running Shoes',
    description: 'Professional marathon running footwear featuring energy-returning foam midsole, arch support, and anti-slip rubber outsole.',
    price: 1699,
    originalPrice: 2799,
    images: ['https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=800&q=80'],
    sizes: [6, 7, 8, 9, 10],
    colors: ['Neon Green', 'Blue', 'Black'],
    stock: 15,
    rating: 4.9,
    tag: 'Pro Runner Choice',
    isFeatured: true,
  },
  {
    _id: 'prod-005',
    productId: 'LK-FM-005',
    name: 'Royal Heritage Leather Formal Shoes',
    brand: 'LITRA KING',
    category: 'Formal Shoes',
    description: 'Classic Oxford handcrafted formal shoes with sleek gloss finish, cushioned heel padding, and timeless wedding/office elegance.',
    price: 2199,
    originalPrice: 3499,
    images: ['https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=800&q=80'],
    sizes: [6, 7, 8, 9, 10],
    colors: ['Black', 'Dark Brown'],
    stock: 12,
    rating: 4.8,
    tag: 'Premium Leather',
    isFeatured: true,
  },
  {
    _id: 'prod-006',
    productId: 'LK-SL-006',
    name: 'UltraSoft Ortho Cushion Slippers',
    brand: 'LITRA KING',
    category: 'Slippers',
    description: 'Orthopedic memory foam slides and slippers designed for home comfort, anti-skid bathroom safety, and daily indoor relaxing.',
    price: 599,
    originalPrice: 999,
    images: ['https://images.unsplash.com/photo-1603808033192-082d6919d3e1?auto=format&fit=crop&w=800&q=80'],
    sizes: [6, 7, 8, 9, 10],
    colors: ['Grey', 'Black', 'Blue'],
    stock: 30,
    rating: 4.6,
    tag: 'Daily Comfort',
    isFeatured: false,
  },
  {
    _id: 'prod-007',
    productId: 'LK-SD-007',
    name: 'Sturdy Outdoor Leather Strap Sandals',
    brand: 'LITRA KING',
    category: 'Sandals',
    description: 'Rugged outdoor casual sandals with adjustable velcro straps, reinforced toe bumpers, and weather-resistant flexible soles.',
    price: 999,
    originalPrice: 1599,
    images: ['https://images.unsplash.com/photo-1607522370275-f14206abe5d3?auto=format&fit=crop&w=800&q=80'],
    sizes: [7, 8, 9, 10],
    colors: ['Brown', 'Camel', 'Black'],
    stock: 22,
    rating: 4.7,
    tag: 'All Terrain',
    isFeatured: false,
  },
  {
    _id: 'prod-008',
    productId: 'LK-KD-008',
    name: 'Vibrant Light-Up Kids Sneakers',
    brand: 'LITRA KING',
    category: 'Kids Footwear',
    description: 'Fun, safe, and flexible footwear for growing children featuring soft non-toxic padding, easy velcro enclosure, and durable rubber soles.',
    price: 799,
    originalPrice: 1299,
    images: ['https://images.unsplash.com/photo-1514989940723-e8e51635b782?auto=format&fit=crop&w=800&q=80'],
    sizes: [1, 2, 3, 4, 5],
    colors: ['Red/Yellow', 'Blue/White'],
    stock: 16,
    rating: 4.9,
    tag: 'Kids Special',
    isFeatured: false,
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
