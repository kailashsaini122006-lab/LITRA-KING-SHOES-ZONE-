import React from 'react';
import { Phone, Tag, CheckCircle2, Truck, ShieldCheck, Sparkles, MessageCircle } from 'lucide-react';

export default function WholesaleSection() {
  const wholesaleFeatures = [
    { title: 'Wholesale Pricing', desc: 'Direct wholesale rates with high profit margin for bulk buyers.' },
    { title: 'Bulk Orders', desc: 'Capable of fulfilling large order quantities with fast processing.' },
    { title: 'Quality Footwear', desc: 'Every shoe inspected for stitch quality, sole strength, and finish.' },
    { title: 'Multiple Styles', desc: 'Sports, formal, sneakers, slippers, and kids footwear in stock.' },
    { title: 'Competitive Prices', desc: 'Unbeatable wholesale rates in Chomu & surrounding markets.' },
    { title: 'Direct Wholesale Support', desc: 'Contact us directly for custom bulk price quotes and catalogues.' },
  ];

  return (
    <section id="wholesale" className="py-20 bg-zinc-950 relative overflow-hidden">
      {/* Background Accent Gradients */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-7xl h-96 bg-gradient-to-r from-red-600/15 via-amber-500/10 to-red-600/15 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Main High-Impact Offer Container */}
        <div className="rounded-3xl bg-gradient-to-b from-zinc-900 via-zinc-950 to-zinc-900 border-2 border-red-600/50 p-6 sm:p-10 lg:p-14 shadow-2xl shadow-red-950/40 relative overflow-hidden">
          
          {/* Top Banner Tag */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 text-white font-black text-xs sm:text-sm uppercase tracking-widest px-6 py-2 rounded-full shadow-lg shadow-red-600/40 animate-pulse">
              <Tag className="w-4 h-4 fill-white" />
              <span>WHOLESALE OFFER • CHOMU RAJASTHAN</span>
            </div>
          </div>

          {/* Headings */}
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-10">
            <h2 className="text-4xl sm:text-6xl font-black text-white tracking-tight">
              <span className="text-red-500 uppercase">WHOLESALE</span>{' '}
              <span className="gold-text-gradient">SALE</span>
            </h2>
            <p className="text-xl sm:text-3xl font-extrabold text-amber-300">
              Best Prices for Bulk Footwear Orders
            </p>
            <p className="text-zinc-400 text-sm sm:text-base">
              Are you a shopkeeper, reseller, or bulk buyer in Rajasthan? Partner with LITRA KING (SHOES ZONE) for premium footwear inventory at factory-competitive wholesale rates.
            </p>
          </div>

          {/* Wholesale Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {wholesaleFeatures.map((item, idx) => (
              <div
                key={idx}
                className="bg-zinc-900/90 border border-red-900/40 hover:border-amber-500/50 p-5 rounded-2xl transition-all duration-300 hover:-translate-y-1 group"
              >
                <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/30 text-red-400 flex items-center justify-center mb-3 group-hover:bg-amber-500/20 group-hover:text-amber-400 transition-colors">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-white font-bold text-lg mb-1">{item.title}</h3>
                <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Large Call CTA Banner */}
          <div className="bg-gradient-to-r from-red-950 via-zinc-900 to-red-950 border border-red-500/50 rounded-2xl p-6 sm:p-8 text-center space-y-6 max-w-4xl mx-auto">
            <div className="space-y-2">
              <h3 className="text-2xl sm:text-3xl font-black text-white">Ready to Place a Bulk Footwear Order?</h3>
              <p className="text-zinc-300 text-sm sm:text-base">Get instant wholesale quotes and order details directly over call or WhatsApp.</p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="tel:9257575393"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-gradient-to-r from-red-600 via-red-500 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-black text-lg sm:text-xl px-8 py-4 rounded-xl shadow-xl shadow-red-600/40 transition-all hover:scale-105"
              >
                <Phone className="w-6 h-6 fill-white" />
                <span>CALL FOR WHOLESALE — 9257575393</span>
              </a>

              <a
                href="https://wa.me/919257575393?text=Hello%20Litra%20King%20Shoes%20Zone,%20I%20am%20interested%20in%20Wholesale%20Footwear%20orders."
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base px-6 py-4 rounded-xl shadow-lg transition-all"
              >
                <MessageCircle className="w-5 h-5 fill-white" />
                <span>WhatsApp Wholesale Enquiry</span>
              </a>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
