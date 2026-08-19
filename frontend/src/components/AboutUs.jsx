import React from 'react';
import { Award, CheckCircle2, Store, Users, Layers, Phone } from 'lucide-react';
import aboutShopImg from '../assets/about_shop.png';

export default function AboutUs() {
  const highlights = [
    {
      title: 'Diverse Footwear Range',
      desc: 'Footwear for all daily, athletic, formal, and festive requirements under one roof.',
    },
    {
      title: 'Wholesale & Retail Options',
      desc: 'Special wholesale purchasing options for bulk buyers and shop owners.',
    },
    {
      title: 'Uncompromising Quality',
      desc: 'Durable materials, comfortable fits, and modern trending styles.',
    },
    {
      title: 'Competitive Local Pricing',
      desc: 'Best price guarantee in Chomu with honest customer support.',
    },
  ];

  return (
    <section id="about" className="py-20 bg-zinc-900/60 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Image with Decorative Frames */}
          <div className="lg:col-span-6 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              
              {/* Back glowing ambient shape */}
              <div className="absolute -inset-2 bg-gradient-to-r from-amber-500/20 to-red-600/20 rounded-3xl blur-xl"></div>

              {/* Main Image Container */}
              <div className="relative rounded-2xl overflow-hidden border border-zinc-700/80 shadow-2xl bg-zinc-950">
                <img
                  src={aboutShopImg}
                  alt="LITRA KING SHOES ZONE Interior & Display Shelves"
                  className="w-full h-[400px] sm:h-[480px] object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent"></div>

                {/* Counter Stats Floating Card */}
                <div className="absolute top-4 right-4 bg-zinc-950/90 backdrop-blur-md px-4 py-3 rounded-xl border border-amber-500/40 text-center shadow-xl">
                  <p className="text-2xl font-black text-amber-400">100%</p>
                  <p className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Quality Verified</p>
                </div>
              </div>

              {/* Trust Badge */}
              <div className="mt-4 p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center gap-4">
                <div className="p-3 bg-amber-500/10 rounded-lg text-amber-400">
                  <Store className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-sm sm:text-base">Trusted Footwear Store in Chomu</h4>
                  <p className="text-xs sm:text-sm text-zinc-400">Serving hundreds of happy retail & wholesale customers.</p>
                </div>
              </div>

            </div>
          </div>

          {/* Right Column: About Content */}
          <div className="lg:col-span-6 space-y-6">
            
            <div className="space-y-2">
              <span className="text-amber-400 font-bold uppercase tracking-widest text-xs sm:text-sm flex items-center gap-2">
                <span className="w-6 h-0.5 bg-amber-500"></span>
                About LITRA KING (SHOES ZONE)
              </span>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
                Your Trusted Footwear Partner in <span className="gold-text-gradient">Chomu, Rajasthan</span>
              </h2>
            </div>

            <p className="text-base sm:text-lg text-zinc-300 leading-relaxed">
              <strong className="text-white">LITRA KING (SHOES ZONE)</strong> is a premier footwear store located in <strong className="text-amber-400">Chomu, Rajasthan</strong> offering top quality footwear with stylish modern designs and highly competitive prices.
            </p>

            <p className="text-base text-zinc-400 leading-relaxed">
              We provide footwear for all requirements — from high-performance athletic sneakers and formal leather shoes to comfortable casual slides and trendy kids' footwear. In addition to retail sales, our store specializes in <strong className="text-red-400 font-semibold">wholesale purchasing options</strong> for retailers and bulk buyers looking for premium stock at best wholesale rates.
            </p>

            {/* Feature Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {highlights.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 hover:border-amber-500/40 transition-colors"
                >
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-sm mb-1">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>{item.title}</span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-normal">{item.desc}</p>
                </div>
              ))}
            </div>

            {/* Quick Contact Button */}
            <div className="pt-2">
              <a
                href="tel:9257575393"
                className="inline-flex items-center gap-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold px-6 py-3.5 rounded-xl shadow-lg shadow-amber-500/20 transition-all hover:scale-105"
              >
                <Phone className="w-4 h-4 fill-zinc-950" />
                <span>Enquire Wholesale Rates — 9257575393</span>
              </a>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
