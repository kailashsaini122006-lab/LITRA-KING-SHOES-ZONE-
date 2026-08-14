import React, { useState } from 'react';
import { ShoppingBag, MessageCircle, Phone, Tag, Sparkles } from 'lucide-react';

export default function Collection() {
  const [activeCategory, setActiveCategory] = useState('All');

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

  // High quality generic Unsplash footwear visuals representing shop categories
  const collectionItems = [
    {
      id: 1,
      category: 'Sports Shoes',
      title: 'Performance Sports Shoes Category',
      desc: 'Lightweight, high-grip athletic footwear for workouts, cricket, running, and active wear.',
      tag: 'Wholesale & Retail',
      img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 2,
      category: 'Sneakers',
      title: 'Trendy Streetwear Sneakers Category',
      desc: 'Modern urban sneaker collections in popular colorways and sleek comfortable soles.',
      tag: 'Best Wholesale Seller',
      img: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 3,
      category: 'Casual Shoes',
      title: 'Everyday Casual Footwear Category',
      desc: 'Comfortable casual loafers, canvas shoes, and daily walk wear for men and youth.',
      tag: 'Wholesale & Retail',
      img: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 4,
      category: 'Running Shoes',
      title: 'Pro Running & Fitness Shoes Category',
      desc: 'Cushioned breathable mesh running shoes engineered for maximum endurance.',
      tag: 'Bulk Stock Ready',
      img: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 5,
      category: 'Formal Shoes',
      title: 'Classic Formal Leather Shoes Category',
      desc: 'Elegant oxford, derby, and monk strap leather shoes for office, weddings, and formal events.',
      tag: 'Premium Collection',
      img: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 6,
      category: 'Slippers',
      title: 'Comfort Slippers & Flip-Flops Category',
      desc: 'Durable anti-slip slippers, soft slides, and indoor/outdoor comfort flip-flops.',
      tag: 'Wholesale Available',
      img: 'https://images.unsplash.com/photo-1603808033192-082d6919d3e1?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 7,
      category: 'Sandals',
      title: 'Stylish Men & Boys Sandals Category',
      desc: 'Sturdy leather & synthetic strap sandals ideal for casual wear and hot climates.',
      tag: 'Wholesale & Retail',
      img: 'https://images.unsplash.com/photo-1607522370275-f14206abe5d3?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 8,
      category: 'Kids Footwear',
      title: 'Vibrant Kids Shoes & Sneakers Category',
      desc: 'Playful, safe, and sturdy footwear range designed specifically for growing children.',
      tag: 'Bulk Stock Ready',
      img: 'https://images.unsplash.com/photo-1514989940723-e8e51635b782?auto=format&fit=crop&w=800&q=80',
    },
  ];

  const filteredItems = activeCategory === 'All'
    ? collectionItems
    : collectionItems.filter((item) => item.category === activeCategory);

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
                  ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-lg shadow-amber-500/20'
                  : 'bg-zinc-900/90 text-zinc-300 border-zinc-800 hover:border-amber-500/40 hover:text-amber-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Footwear Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-amber-500/50 transition-all duration-300 hover:-translate-y-1 shadow-xl flex flex-col group"
            >
              {/* Image Box */}
              <div className="relative h-56 overflow-hidden bg-zinc-950">
                <img
                  src={item.img}
                  alt={item.title}
                  className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent"></div>

                <span className="absolute top-3 left-3 bg-red-600/90 text-white font-extrabold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-md shadow">
                  {item.tag}
                </span>

                <span className="absolute bottom-3 left-3 bg-zinc-950/80 backdrop-blur text-amber-400 font-bold text-xs px-2.5 py-1 rounded-md border border-amber-500/30">
                  {item.category}
                </span>
              </div>

              {/* Content Box */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <h3 className="text-white font-bold text-base group-hover:text-amber-400 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-zinc-400 text-xs leading-relaxed">{item.desc}</p>
                </div>

                {/* Inquiry Actions */}
                <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                  <a
                    href={`https://wa.me/919257575393?text=Hello%20Litra%20King%20Shoes%20Zone,%20I%20am%20inquiring%20about%20${encodeURIComponent(item.category)}.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 bg-zinc-800 hover:bg-emerald-600 text-white font-semibold text-xs py-2.5 rounded-lg transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Inquire</span>
                  </a>

                  <a
                    href="tel:9257575393"
                    className="flex items-center justify-center p-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-lg transition-colors"
                    title="Call Now"
                  >
                    <Phone className="w-3.5 h-3.5 fill-zinc-950" />
                  </a>
                </div>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
