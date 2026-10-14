import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, Star, ShoppingBag, Zap, ShieldCheck, Truck, Check, Minus, Plus, AlertCircle, Play, Pause, Volume2, VolumeX, Video, Sparkles, RotateCw } from 'lucide-react';
import { useCart } from '../context/CartContext';
import Shoe360Viewer from './Shoe360Viewer';

export default function ProductDetailsModal({ product, isOpen, onClose, onBuyNow }) {
  const { addToCart, startBuyNow } = useCart();

  const [selectedSize, setSelectedSize] = useState(8);
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [addedMessage, setAddedMessage] = useState(false);
  const [unavailableAlert, setUnavailableAlert] = useState(false);

  // Video State
  const hasVideo = Boolean(product?.video && product?.videoEnabled !== false);
  const [activeMediaTab, setActiveMediaTab] = useState(hasVideo ? 'video' : 'images');
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const videoRef = useRef(null);

  const imagesList = useMemo(() => {
    return Array.isArray(product?.images) && product.images.length > 0
      ? product.images
      : [product?.img || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80'];
  }, [product]);

  useEffect(() => {
    if (product) {
      setSelectedSize(Array.isArray(product.sizes) && product.sizes.length ? product.sizes[0] : 8);
      const colorVal = product.color || (Array.isArray(product.colors) && product.colors.length ? product.colors[0] : 'Default');
      setSelectedColor(colorVal);
      setQuantity(1);
      setAddedMessage(false);
      setActiveMediaTab(product.video && product.videoEnabled !== false ? 'video' : 'images');
      setIsVideoPlaying(true);
    }
  }, [product]);

  useEffect(() => {
    if (isOpen && product) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = 'unset';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen, product, onClose]);

  if (!isOpen || !product) return null;

  const sizesList = Array.isArray(product.sizes) && product.sizes.length > 0 ? product.sizes : [6, 7, 8, 9, 10];

  const sellPrice = product.price || 850;
  const origPrice = product.originalPrice || 1999;
  const isOutOfStock = product.inStock === false || (product.stock !== undefined && product.stock <= 0);
  const discountPercent = origPrice > sellPrice
    ? Math.round(((origPrice - sellPrice) / origPrice) * 100)
    : 57;

  const handleAddToCart = (e) => {
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    if (isOutOfStock) {
      setUnavailableAlert(true);
      setTimeout(() => setUnavailableAlert(false), 3000);
      return;
    }
    const colorToUse = selectedColor || product.color || 'Standard';
    addToCart(product, selectedSize, colorToUse, quantity);
    setAddedMessage(true);
    setTimeout(() => setAddedMessage(false), 2000);
  };

  const handleBuyNowClick = () => {
    if (isOutOfStock) {
      setUnavailableAlert(true);
      setTimeout(() => setUnavailableAlert(false), 3000);
      return;
    }
    const colorToUse = selectedColor || product.color || 'Standard';
    const mainImg = imagesList[0] || product.img;
    startBuyNow(product, selectedSize, colorToUse, quantity, mainImg);
    onClose();
    if (onBuyNow) onBuyNow();
  };

  const togglePlayVideo = (e) => {
    if (e) e.stopPropagation();
    if (!videoRef.current) return;
    if (isVideoPlaying) {
      videoRef.current.pause();
      setIsVideoPlaying(false);
    } else {
      videoRef.current.play();
      setIsVideoPlaying(true);
    }
  };

  const toggleMuteVideo = (e) => {
    if (e) e.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !isVideoMuted;
    setIsVideoMuted(!isVideoMuted);
  };

  const resolveVideoUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
    if (url.startsWith('/uploads/')) {
      const envUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const baseUrl = envUrl.replace(/\/+$/, '').replace(/\/api$/, '');
      return `${baseUrl}${url}`;
    }
    return url;
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn overflow-y-auto cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden text-zinc-100 flex flex-col max-h-[90vh] cursor-default my-auto"
      >
        
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
          
          {/* Left Column: Interactive 360 Viewer or AI Shoe Video Player */}
          <div className="md:col-span-6 space-y-4">
            
            {hasVideo && activeMediaTab === 'video' ? (
              /* AI Video Player Stage */
              <div className="relative w-full aspect-square sm:aspect-square bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center group select-none">
                <video
                  ref={videoRef}
                  src={resolveVideoUrl(product.video)}
                  autoPlay
                  loop
                  muted={isVideoMuted}
                  playsInline
                  onClick={togglePlayVideo}
                  className="w-full h-full object-contain cursor-pointer"
                />

                {/* Top Badges Overlay */}
                <div className="absolute top-4 left-4 flex items-center gap-2 pointer-events-none">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-500/25 text-amber-300 border border-amber-500/40 backdrop-blur-md shadow-lg shadow-amber-950/50">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>AI 360° PROMO VIDEO</span>
                  </span>
                </div>

                {discountPercent > 0 && (
                  <div className="absolute top-4 right-4 bg-red-600 text-white text-xs font-black px-2.5 py-1 rounded-lg shadow-md pointer-events-none">
                    -{discountPercent}% OFF
                  </div>
                )}

                {/* Bottom Video Controls Overlay */}
                <div className="absolute bottom-4 left-4 right-4 bg-zinc-950/85 backdrop-blur-md border border-zinc-800 p-2.5 rounded-2xl flex items-center justify-between shadow-2xl">
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={togglePlayVideo}
                      className="w-8 h-8 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 flex items-center justify-center transition-all shadow-md cursor-pointer"
                      title={isVideoPlaying ? 'Pause Video' : 'Play Video'}
                    >
                      {isVideoPlaying ? <Pause className="w-4 h-4 fill-zinc-950" /> : <Play className="w-4 h-4 fill-zinc-950" />}
                    </button>

                    <button
                      type="button"
                      onClick={toggleMuteVideo}
                      className="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                      title={isVideoMuted ? 'Unmute Audio' : 'Mute Audio'}
                    >
                      {isVideoMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>

                    <span className="text-xs font-bold text-zinc-400 hidden sm:inline">
                      Continuous 360° Rotation
                    </span>
                  </div>

                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-amber-400 bg-amber-500/10 px-2 py-1 rounded-md border border-amber-500/20">
                    AI Commercial
                  </span>
                </div>
              </div>
            ) : (
              /* Normal Interactive 360 Viewer */
              <Shoe360Viewer
                imagesList={imagesList}
                productName={product.name}
                discountPercent={discountPercent}
              />
            )}

            {/* Media Mode Selector Switcher (Video vs Angle Photos) */}
            {hasVideo && (
              <div className="flex items-center gap-2 p-1.5 bg-zinc-950/80 border border-zinc-800 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setActiveMediaTab('video')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeMediaTab === 'video'
                      ? 'bg-amber-500 text-zinc-950 font-black shadow-lg shadow-amber-500/20'
                      : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>AI 360° Video</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveMediaTab('images')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeMediaTab === 'images'
                      ? 'bg-amber-500 text-zinc-950 font-black shadow-lg shadow-amber-500/20'
                      : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Normal Images ({imagesList.length} Angles)</span>
                </button>
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
                    <span className="text-3xl font-black text-amber-400 font-mono">₹{sellPrice}</span>
                    {origPrice && (
                      <span className="text-base text-zinc-500 line-through font-mono">₹{origPrice}</span>
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

              <div className="flex items-center gap-4 pt-1">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Quantity:</span>
                <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-xl p-1">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1 || isOutOfStock}
                    className="p-2 text-zinc-400 hover:text-white disabled:opacity-30"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-4 font-mono font-bold text-sm text-amber-400">{quantity}</span>
                  <button
                    type="button"
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
              {unavailableAlert && (
                <div className="p-3 bg-red-950/90 border border-red-500/80 rounded-xl text-red-300 text-xs sm:text-sm text-center font-extrabold animate-bounce flex items-center justify-center gap-2 shadow-xl">
                  <AlertCircle className="w-4.5 h-4.5 text-red-400" /> <span>Out of Stock — This product is currently unavailable.</span>
                </div>
              )}

              {addedMessage && (
                <div className="p-2.5 bg-emerald-950/80 border border-emerald-500/60 rounded-xl text-emerald-300 text-xs text-center font-bold animate-fadeIn flex items-center justify-center gap-2">
                  <Check className="w-4 h-4" /> Added to Cart Successfully!
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className={`py-3.5 font-extrabold rounded-2xl text-xs sm:text-sm border transition-all flex items-center justify-center gap-2 shadow-lg ${
                    isOutOfStock
                      ? 'bg-zinc-800 text-zinc-500 border-zinc-700/50 cursor-not-allowed opacity-60'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4 text-amber-400" />
                  <span>ADD TO CART</span>
                </button>

                <button
                  type="button"
                  onClick={handleBuyNowClick}
                  className={`py-3.5 font-extrabold rounded-2xl text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-lg ${
                    isOutOfStock
                      ? 'bg-zinc-800 text-zinc-500 border-zinc-700/50 cursor-not-allowed opacity-60'
                      : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 shadow-amber-500/20 hover:scale-[1.01]'
                  }`}
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

