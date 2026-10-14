import React, { useState, useEffect } from 'react';
import { Navigation, Tag, ArrowLeft, Sparkles, Video, Eye, ArrowRight } from 'lucide-react';
import heroShopImg from '../assets/hero_shop.png';
import { getApiUrl } from '../config/api';

export default function Hero({ onProductSelect }) {
  const [heroSettings, setHeroSettings] = useState({
    heroVideoEnabled: false,
    heroProduct: null,
  });

  useEffect(() => {
    let isMounted = true;
    const fetchHeroSettings = async () => {
      try {
        const res = await fetch(getApiUrl('/settings'));
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data && data.success) {
            setHeroSettings({
              heroVideoEnabled: Boolean(data.heroVideoEnabled && data.heroProduct?.video),
              heroProduct: data.heroProduct,
            });
          }
        }
      } catch (err) {
        console.warn('Hero settings fetch notice:', err.message);
      }
    };

    fetchHeroSettings();
    return () => {
      isMounted = false;
    };
  }, []);

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

  const isVideoHero = Boolean(heroSettings.heroVideoEnabled && heroSettings.heroProduct?.video);
  const featuredProduct = heroSettings.heroProduct;

  return (
    <section id="home" className="relative min-h-screen pt-24 sm:pt-28 md:pt-36 pb-16 md:pb-24 flex items-start lg:items-center bg-zinc-950 overflow-hidden">
      {/* Background Radial Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-0 w-[400px] h-[400px] bg-red-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Hero Text Content */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            
            {/* Wholesale Special Offer Pill */}
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600/30 via-red-500/20 to-amber-500/20 border border-red-500/50 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold text-red-300 shadow-lg shadow-red-950/50">
              <Tag className="w-4 h-4 text-red-400" />
              <span>WHOLESALE SALE — Special Wholesale Prices Available</span>
            </div>

            {/* Main Headlines */}
            <div className="space-y-2">
              <div className="flex items-center justify-center lg:justify-start gap-2">
                <span className="h-0.5 w-10 bg-amber-500 rounded-full inline-block"></span>
                <span className="text-amber-400 font-bold uppercase tracking-widest text-sm sm:text-base">
                  Chomu's Leading Footwear Destination
                </span>
              </div>
              
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-none">
                LITRA KING <br />
                <span className="gold-text-gradient">SHOES ZONE</span>
              </h1>
            </div>

            {/* Tagline & Subtext */}
            <p className="text-xl sm:text-2xl font-bold text-amber-200/90 tracking-wide">
              Premium Quality Footwear for Every Step
            </p>

            <p className="text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
              <strong className="text-white font-semibold">Wholesale & Retail Footwear Available</strong>. Serving retail customers and bulk shopkeepers across Chomu and Rajasthan with top-tier designs at unbeatable prices.
            </p>

            {/* Hero CTA Action Buttons */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 pt-4">
              <a
                href="#collection"
                className="w-full sm:w-auto flex items-center justify-center gap-2.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 px-7 py-3.5 rounded-xl font-black text-base shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 transition-all hover:-translate-y-0.5"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Shop Now</span>
              </a>

              <a
                href="#location"
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-amber-400 border border-zinc-800 px-6 py-3.5 rounded-xl font-bold text-sm transition-all"
              >
                <Navigation className="w-4 h-4 text-amber-400" />
                <span>Get Directions</span>
              </a>
            </div>

          </div>

          {/* Right Hero Media Card Container */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              
              {/* Decorative Frame */}
              <div className="absolute -inset-1.5 bg-gradient-to-r from-amber-500 via-red-500 to-amber-600 rounded-3xl blur-md opacity-40"></div>

              {/* Main Media Card (Video OR Store Photo based on Admin setting) */}
              <div className="relative rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-700/60 shadow-2xl group">
                {isVideoHero ? (
                  /* Admin Selected Shoe Promotional 360° Video */
                  <div className="relative w-full h-[420px] sm:h-[520px] bg-black flex items-center justify-center">
                    <video
                      src={resolveVideoUrl(featuredProduct.video)}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-contain"
                    />

                    {/* Top Floating Badge */}
                    <div className="absolute top-4 left-4 z-20">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-500/30 text-amber-300 border border-amber-500/50 backdrop-blur-md shadow-lg shadow-amber-950/50 animate-pulse">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>FEATURED 360° SHOE VIDEO</span>
                      </span>
                    </div>

                    {/* Gradient shading */}
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-90 pointer-events-none"></div>

                    {/* Floating Product Details Overlay on Video */}
                    <div className="absolute bottom-4 left-4 right-4 bg-zinc-950/90 backdrop-blur-md p-4 rounded-xl border border-amber-500/40 flex items-center justify-between shadow-2xl z-20">
                      <div className="min-w-0 flex-1 pr-3">
                        <p className="text-[10px] text-amber-400 font-extrabold uppercase tracking-wider">
                          {featuredProduct.brand || 'LITRA KING'} • {featuredProduct.category || 'Footwear'}
                        </p>
                        <p className="text-white font-black text-sm sm:text-base leading-snug truncate">
                          {featuredProduct.name}
                        </p>
                        <p className="text-amber-400 font-black text-sm font-mono mt-0.5">
                          ₹{featuredProduct.price}
                        </p>
                      </div>

                      <div className="shrink-0">
                        {onProductSelect ? (
                          <button
                            type="button"
                            onClick={() => onProductSelect(featuredProduct)}
                            className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 text-xs font-black px-3.5 py-2 rounded-lg uppercase tracking-wider shadow-lg transition-transform hover:scale-105 cursor-pointer"
                          >
                            <span>View Shoe</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <a
                            href="#collection"
                            className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 text-xs font-black px-3.5 py-2 rounded-lg uppercase tracking-wider shadow-lg transition-transform hover:scale-105"
                          >
                            <span>View Shoe</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Store Exterior Photo (Default when Hero video setting is disabled) */
                  <>
                    <img
                      src={heroShopImg}
                      alt="LITRA KING SHOES ZONE Actual Shop Front in Chomu"
                      className="w-full h-[420px] sm:h-[520px] object-cover object-center transform group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-80 pointer-events-none"></div>

                    {/* Floating Store Badge Overlay */}
                    <div className="absolute bottom-4 left-4 right-4 bg-zinc-950/90 backdrop-blur-md p-4 rounded-xl border border-amber-500/30 flex items-center justify-between shadow-2xl">
                      <div>
                        <p className="text-xs text-amber-400 font-extrabold uppercase tracking-wider">Actual Store Photo</p>
                        <p className="text-white font-bold text-base">LITRA KING, Chomu (Rajasthan)</p>
                      </div>
                      <div className="text-right">
                        <span className="inline-block bg-red-600 text-white text-xs font-black px-2.5 py-1 rounded-md uppercase">
                          Wholesale Hub
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
