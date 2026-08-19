import React from 'react';
import { Award, Tag, Sparkles, MapPin, ShieldCheck, ThumbsUp } from 'lucide-react';

export default function WhyChooseUs() {
  const reasons = [
    {
      icon: Award,
      title: 'Premium Quality',
      desc: 'Quality footwear for everyday use crafted with comfortable materials and durable soles.',
      glowColor: 'hover:border-amber-500/60 hover:shadow-amber-500/10',
      iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    },
    {
      icon: Tag,
      title: 'Wholesale Prices',
      desc: 'Special pricing available for bulk orders, ideal for shop owners and resellers.',
      glowColor: 'hover:border-red-500/60 hover:shadow-red-500/10',
      iconBg: 'bg-red-600/10 text-red-400 border-red-500/30',
    },
    {
      icon: Sparkles,
      title: 'Latest Styles',
      desc: 'Modern and stylish footwear collections continuously updated with trending designs.',
      glowColor: 'hover:border-amber-500/60 hover:shadow-amber-500/10',
      iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    },
    {
      icon: MapPin,
      title: 'Trusted Local Store',
      desc: 'Serving customers in Chomu, Rajasthan with transparent service and reliable footwear.',
      glowColor: 'hover:border-amber-500/60 hover:shadow-amber-500/10',
      iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    },
  ];

  return (
    <section className="py-20 bg-zinc-950 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center space-y-3 mb-14">
          <span className="text-amber-400 font-bold uppercase tracking-widest text-xs sm:text-sm">
            Why Shop With Us
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white">
            Why Choose <span className="gold-text-gradient">LITRA KING</span>
          </h2>
          <p className="text-zinc-400 max-w-xl mx-auto text-sm sm:text-base">
            We prioritize customer satisfaction, superior footwear comfort, and genuine wholesale rates.
          </p>
        </div>

        {/* 4 Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {reasons.map((item, idx) => {
            const IconComp = item.icon;
            return (
              <div
                key={idx}
                className={`bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1.5 shadow-xl ${item.glowColor} group`}
              >
                <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center mb-5 ${item.iconBg} group-hover:scale-110 transition-transform`}>
                  <IconComp className="w-7 h-7" />
                </div>
                <h3 className="text-white font-extrabold text-xl mb-2 group-hover:text-amber-400 transition-colors">
                  {item.title}
                </h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
