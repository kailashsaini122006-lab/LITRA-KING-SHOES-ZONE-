import React, { useState, useEffect } from 'react';
import { X, Star, ShoppingBag, Zap, ShieldCheck, Truck, Check, Minus, Plus, AlertCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function ProductDetailsModal({ product, isOpen, onClose, onBuyNow }) {
  const { addToCart } = useCart();

  const [selectedImage, setSelectedImage] = useState('');
  const [selectedSize, setSelectedSize] = useState(8);
  const [selectedColor, setSelectedColor] = useState('Black');
  const [quantity, setQuantity] = useState(1);
  const [addedMessage, setAddedMessage] = useState(false);

  useEffect(() => {
    if (product) {
      const defaultImg = Array.isArray(product.images) && product.images.length ? product.images[0] : (product.img || '');
      setSelectedImage(defaultImg);
      setSelectedSize(Array.isArray(product.sizes) && product.sizes.length ? product.sizes[0] : 8);
      setSelectedColor(Array.isArray(product.colors) && product.colors.length ? product.colors[0] : 'Black');
      setQuantity(1);
      setAddedMessage(false);
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const imagesList = Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : [product.img || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80'];

  const sizesList = Array.isArray(product.sizes) && product.sizes.length > 0 ? product.sizes : [6, 7, 8, 9, 10];
  const colorsList = Array.isArray(product.colors) && product.colors.length > 0 ? product.colors : ['Black', 'White', 'Red'];

  const isOutOfStock = product.stock !== undefined && product.stock <= 0;
  const discountPercent = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 35;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addToCart(product, selectedSize, selectedColor, quantity);
    setAddedMessage(true);
    setTimeout(() => setAddedMessage(false), 2000);
  };

  const handleBuyNowClick = () => {
    if (isOutOfStock) return;
    addToCart(product, selectedSize, selectedColor, quantity);
    onClose();
    if (onBuyNow) onBuyNow();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden text-zinc-100 flex flex-col max-h-[90vh]">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/70">
          <div className="flex items-center gap-2 text-xs text-amber-400 font-bold uppercase tracking-wider">
            <span>{product.brand || 'LITRA KING'}</span>
            <span>•</span>
            <span className="text-zinc-400">{product.category || 'Footwear'}</span>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* Left Column: Image Viewer */}
          <div className="md:col-span-6 space-y-4">
            <div className="relative h-72 sm:h-80 bg-zinc-950 rounded-2xl overflow-hidden border border-zinc-800 shadow-inner group">
              <img
                src={selectedImage || imagesList[0]}
                alt={product.name}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />
              <span className="absolute top-3 left-3 bg-red-600 text-white font-extrabold text-xs px-3 py-1 rounded-full shadow">
                {discountPercent}% OFF
              </span>
            </div>

            {/* Image Thumbnails */}
            {imagesList.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-1 no-scrollbar">
                {imagesList.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(imgUrl)}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                      selectedImage === imgUrl ? 'border-amber-400 scale-105 shadow-md shadow-amber-500/20' : 'border-zinc-800 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={imgUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Value Badges */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 bg-zinc-950/70 border border-zinc-800/80 rounded-xl flex items-center gap-2.5 text-xs text-zinc-300">
                <Truck className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Fast Express Delivery</span>
              </div>
              <div className="p-3 bg-zinc-950/70 border border-zinc-800/80 rounded-xl flex items-center gap-2.5 text-xs text-zinc-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Cash on Delivery</span>
              </div>
            </div>
          </div>

          {/* Right Column: Product Details & Selectors */}
          <div className="md:col-span-6 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              {/* Title & Rating */}
              <div>
                <h2 className="text-2xl font-black text-white leading-snug">{product.name}</h2>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-zinc-300">{product.rating || 4.8} / 5.0</span>
                  <span className="text-xs text-zinc-500">• (120+ Verified Reviews)</span>
                </div>
              </div>

              {/* Pricing Box */}
              <div className="p-4 bg-zinc-950/80 border border-zinc-800 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-black text-amber-400 font-mono">₹{product.price}</span>
                    {product.originalPrice && (
                      <span className="text-base text-zinc-500 line-through font-mono">₹{product.originalPrice}</span>
                    )}
                  </div>
                  <p className="text-[11px] text-emerald-400 font-semibold mt-0.5">Inclusive of all taxes &amp; charges</p>
                </div>

                {/* Stock Indicator */}
                <div>
                  {isOutOfStock ? (
                    <span className="px-3 py-1.5 bg-red-950/80 border border-red-800 text-red-400 font-bold text-xs rounded-full flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> Out of Stock
                    </span>
                  ) : (
                    <span className="px-3 py-1.5 bg-emerald-950/80 border border-emerald-800 text-emerald-400 font-bold text-xs rounded-full flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> In Stock ({product.stock || 25} left)
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-900/50 p-3.5 rounded-xl border border-zinc-800/60">
                {product.description}
              </p>

              {/* Shoe Size Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center justify-between">
                  <span>Select UK/IND Shoe Size *</span>
                  <span className="text-[11px] text-amber-400 hover:underline cursor-pointer">Size Guide</span>
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {sizesList.map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setSelectedSize(sz)}
                      className={`w-11 h-11 rounded-xl font-mono font-bold text-sm transition-all border ${
                        selectedSize === sz
                          ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-md shadow-amber-500/20 scale-105'
                          : 'bg-zinc-950 text-zinc-300 border-zinc-800 hover:border-amber-500/50'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Select Color Variant *
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {colorsList.map((clr) => (
                    <button
                      key={clr}
                      type="button"
                      onClick={() => setSelectedColor(clr)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                        selectedColor === clr
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500'
                          : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
                      }`}
                    >
                      {clr}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity Selector */}
              <div className="flex items-center gap-4 pt-1">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Quantity:</span>
                <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-xl p-1">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1 || isOutOfStock}
                    className="p-2 text-zinc-400 hover:text-white disabled:opacity-30"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-4 font-mono font-bold text-sm text-amber-400">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(product.stock || 25, q + 1))}
                    disabled={isOutOfStock || (product.stock && quantity >= product.stock)}
                    className="p-2 text-zinc-400 hover:text-white disabled:opacity-30"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>

            {/* Bottom Action Buttons */}
            <div className="space-y-3 pt-4 border-t border-zinc-800">
              {addedMessage && (
                <div className="p-2.5 bg-emerald-950/80 border border-emerald-500/60 rounded-xl text-emerald-300 text-xs text-center font-bold animate-fadeIn flex items-center justify-center gap-2">
                  <Check className="w-4 h-4" /> Added to Cart Successfully!
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className="py-3.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-white font-extrabold rounded-2xl text-xs sm:text-sm border border-zinc-700 transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  <ShoppingBag className="w-4 h-4 text-amber-400" />
                  <span>ADD TO CART</span>
                </button>

                <button
                  type="button"
                  onClick={handleBuyNowClick}
                  disabled={isOutOfStock}
                  className="py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-40 text-zinc-950 font-extrabold rounded-2xl text-xs sm:text-sm transition-all shadow-lg shadow-amber-500/20 hover:scale-[1.01] flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4 fill-zinc-950" />
                  <span>BUY NOW (COD)</span>
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
