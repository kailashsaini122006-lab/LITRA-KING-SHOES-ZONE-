import React, { useState } from 'react';
import { Eye, X, ZoomIn, Sparkles, Store } from 'lucide-react';
import heroShopImg from '../assets/hero_shop.png';
import aboutShopImg from '../assets/about_shop.png';

export default function Gallery() {
  const [activeModalImage, setActiveModalImage] = useState(null);

  const galleryImages = [
    {
      id: 1,
      title: 'LITRA KING SHOES ZONE Storefront',
      subtitle: 'Main Entrance & Illuminated Branding in Chomu',
      src: heroShopImg,
      badge: 'Store Exterior',
    },
    {
      id: 2,
      title: 'Interior Display & Stock Racks',
      subtitle: 'Footwear Collection & Wholesale Shelves',
      src: aboutShopImg,
      badge: 'Store Interior',
    },
    {
      id: 3,
      title: 'Sneaker & Sports Showcase',
      subtitle: 'Latest Trending Footwear Stock',
      src: '/assets/white-air-sneaker.png',
      badge: 'Products Showcase',
    },
    {
      id: 4,
      title: 'Formal Leather Footwear Display',
      subtitle: 'Premium Craftsmanship & Classic Designs',
      src: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=1200&q=80',
      badge: 'Formal Collection',
    },
    {
      id: 5,
      title: 'Wholesale Bulk Supply Racks',
      subtitle: 'Ready Stock For Shop Owners & Resellers',
      src: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80',
      badge: 'Wholesale Hub',
    },
    {
      id: 6,
      title: 'Casual & Daily Wear Variety',
      subtitle: 'Slides, Slippers & Comfortable Daily Shoes',
      src: 'https://images.unsplash.com/photo-1603808033192-082d6919d3e1?auto=format&fit=crop&w=1200&q=80',
      badge: 'Casual Zone',
    },
  ];

  return (
    <section id="gallery" className="py-20 bg-zinc-900/60 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center space-y-3 mb-12">
          <span className="text-amber-400 font-bold uppercase tracking-widest text-xs sm:text-sm flex items-center justify-center gap-2">
            <Store className="w-4 h-4 text-amber-400" />
            Store Gallery
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white">
            Shop Photos & <span className="gold-text-gradient">Showcase</span>
          </h2>
          <p className="text-zinc-400 max-w-xl mx-auto text-sm sm:text-base">
            Click on any photo to inspect high-resolution shop images and footwear displays.
          </p>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {galleryImages.map((img) => (
            <div
              key={img.id}
              onClick={() => setActiveModalImage(img)}
              className="relative group rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 hover:border-amber-500/60 cursor-pointer transition-all duration-300 shadow-xl"
            >
              <img
                src={img.src}
                alt={img.title}
                className="w-full h-72 object-cover object-center group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity"></div>

              {/* Top Badge */}
              <span className="absolute top-3 left-3 bg-zinc-950/80 backdrop-blur text-amber-400 font-bold text-xs px-3 py-1 rounded-full border border-amber-500/30">
                {img.badge}
              </span>

              {/* Zoom Icon Overlay */}
              <div className="absolute top-3 right-3 w-9 h-9 rounded-full bg-amber-500/90 text-zinc-950 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-110">
                <ZoomIn className="w-5 h-5" />
              </div>

              {/* Bottom Info */}
              <div className="absolute bottom-4 left-4 right-4 space-y-1">
                <h3 className="text-white font-bold text-lg group-hover:text-amber-400 transition-colors">
                  {img.title}
                </h3>
                <p className="text-zinc-400 text-xs">{img.subtitle}</p>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Lightbox Modal */}
      {activeModalImage && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-fadeIn">
          <div className="relative max-w-4xl w-full bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
            
            {/* Modal Close Button */}
            <button
              onClick={() => setActiveModalImage(null)}
              className="absolute top-4 right-4 z-10 p-2.5 rounded-full bg-zinc-900/90 text-zinc-300 hover:text-amber-400 hover:bg-zinc-800 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Modal Image */}
            <div className="max-h-[75vh] overflow-hidden bg-black flex items-center justify-center">
              <img
                src={activeModalImage.src}
                alt={activeModalImage.title}
                className="w-full h-full max-h-[70vh] object-contain"
              />
            </div>

            {/* Modal Footer Info */}
            <div className="p-6 bg-zinc-900 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-xs text-amber-400 font-bold uppercase tracking-wider">{activeModalImage.badge}</span>
                <h3 className="text-xl font-bold text-white">{activeModalImage.title}</h3>
                <p className="text-xs text-zinc-400">{activeModalImage.subtitle}</p>
              </div>

              <a
                href="tel:9257575393"
                className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-6 py-2.5 rounded-xl text-sm transition-colors whitespace-nowrap"
              >
                Call Store — 9257575393
              </a>
            </div>

          </div>
        </div>
      )}
    </section>
  );
}
