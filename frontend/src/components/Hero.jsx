import React from 'react';
import { Phone, Navigation, Sparkles, ShieldCheck, Tag, ShoppingBag } from 'lucide-react';
import heroShopImg from '../assets/hero_shop.png';
import AeroShards from './AeroShards';

export default function Hero() {
  return (
    <section id="home" className="relative min-h-screen pt-24 sm:pt-28 md:pt-36 pb-16 md:pb-24 flex items-start lg:items-center bg-zinc-950 overflow-hidden">
      {/* WebGPU AeroShards Interactive Visual Background */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
        <AeroShards
          backgroundColor="#09090b"
          shardColor="#f59e0b"
          accentColor="#dc2626"
          placement="full"
          flow="stream"
          material="pearl"
          detail="balanced"
          effect="none"
          scale={1}
          spread={1}
          depth={1}
          speed={0.8}
          spin={1}
          interaction="repel"
          density={1.2}
          shardSize={1.0}
          stretch={1}
          turbulence={1}
          glow={1}
          edgeSoftness={2}
          bloom={0.5}
          grain={0.05}
          chromaticAberration={0.005}
          transitionDuration={1}
          interactionRadius={1.5}
          interactionStrength={0.5}
          rippleIntensity={1}
          holdToGather={true}
        />
      </div>

      {/* Background Radial Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-0 w-[400px] h-[400px] bg-red-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Hero Text Content */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            
            {/* Wholesale Special Offer Pill */}
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600/30 via-red-500/20 to-amber-500/20 border border-red-500/50 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold text-red-300 shadow-lg shadow-red-950/50 animate-pulse-glow">
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

            {/* Feature Highlights Pills */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2 text-xs sm:text-sm text-zinc-300">
              <div className="flex items-center gap-1.5 bg-zinc-900/90 px-3.5 py-1.5 rounded-lg border border-zinc-800">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>100% Quality Assured</span>
              </div>
              <div className="flex items-center gap-1.5 bg-zinc-900/90 px-3.5 py-1.5 rounded-lg border border-zinc-800">
                <Tag className="w-4 h-4 text-red-400" />
                <span>Bulk Wholesale Rates</span>
              </div>
              <div className="flex items-center gap-1.5 bg-zinc-900/90 px-3.5 py-1.5 rounded-lg border border-zinc-800">
                <ShoppingBag className="w-4 h-4 text-amber-400" />
                <span>Latest Shoe Styles</span>
              </div>
            </div>

            {/* Hero CTA Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
              <a
                href="tel:9257575393"
                className="w-full sm:w-auto flex items-center justify-center gap-3 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 px-8 py-4 rounded-xl font-extrabold text-base shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 transition-all hover:-translate-y-0.5"
              >
                <Phone className="w-5 h-5 fill-zinc-950" />
                <span>Call Now — 9257575393</span>
              </a>

              <a
                href="#location"
                className="w-full sm:w-auto flex items-center justify-center gap-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-100 border border-zinc-700/80 px-8 py-4 rounded-xl font-bold text-base hover:border-amber-400/50 transition-all hover:-translate-y-0.5"
              >
                <Navigation className="w-5 h-5 text-amber-400" />
                <span>Get Directions</span>
              </a>
            </div>

          </div>

          {/* Right Hero Image Card Container */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              
              {/* Decorative Frame */}
              <div className="absolute -inset-1.5 bg-gradient-to-r from-amber-500 via-red-500 to-amber-600 rounded-3xl blur-md opacity-40 animate-pulse"></div>

              {/* Main Shop Image Card */}
              <div className="relative rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-700/60 shadow-2xl group">
                <img
                  src={heroShopImg}
                  alt="LITRA KING SHOES ZONE Actual Shop Front in Chomu"
                  className="w-full h-[420px] sm:h-[520px] object-cover object-center transform group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-80"></div>

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
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
