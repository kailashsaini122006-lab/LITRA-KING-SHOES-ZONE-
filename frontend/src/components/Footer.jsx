import React from 'react';
import { Phone, MapPin, ChevronRight, Heart, ShieldCheck } from 'lucide-react';
import lkLogo from '../assets/lk_logo.jpg';

const InstagramIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-zinc-950 border-t border-zinc-800 text-zinc-400 pt-16 pb-24 md:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          
          {/* Brand Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img
                src={lkLogo}
                alt="Litra King Logo"
                className="w-12 h-12 rounded-full object-cover shadow-lg shadow-amber-500/30"
              />
              <div>
                <h3 className="text-xl font-extrabold text-white tracking-wider">LITRA KING</h3>
                <p className="text-xs font-semibold text-amber-400 uppercase tracking-widest">SHOES ZONE • CHOMU</p>
              </div>
            </div>

            <p className="text-zinc-300 font-bold text-sm">
              Premium Quality Footwear for Every Step
            </p>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Your premier retail & wholesale footwear destination in Chomu, Rajasthan. Providing stylish, comfortable, and high-durability shoes at competitive rates.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-white font-extrabold text-base tracking-wider uppercase border-b border-zinc-800 pb-2">
              Quick Links
            </h4>
            <ul className="space-y-2.5 text-sm">
              {['Home', 'About Us', 'Collection', 'Wholesale Offer', 'Gallery', 'Location & Directions', 'Contact'].map((item, idx) => {
                const linkId = item.toLowerCase().replace(' us', '').replace(' offer', '').replace(' & directions', '');
                return (
                  <li key={idx}>
                    <a
                      href={`#${linkId === 'home' ? 'home' : linkId}`}
                      className="hover:text-amber-400 transition-colors flex items-center gap-1.5"
                    >
                      <ChevronRight className="w-3.5 h-3.5 text-amber-500" />
                      <span>{item}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Footwear Categories */}
          <div className="space-y-4">
            <h4 className="text-white font-extrabold text-base tracking-wider uppercase border-b border-zinc-800 pb-2">
              Wholesale Stock
            </h4>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-amber-400 rounded-full"></span>Sports Shoes</li>
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-amber-400 rounded-full"></span>Casual Shoes & Sneakers</li>
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-amber-400 rounded-full"></span>Running & Athletic Shoes</li>
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-amber-400 rounded-full"></span>Formal Leather Footwear</li>
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-amber-400 rounded-full"></span>Comfort Slippers & Sandals</li>
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-amber-400 rounded-full"></span>Kids Footwear Collections</li>
            </ul>
          </div>

          {/* Contact & Socials */}
          <div className="space-y-4">
            <h4 className="text-white font-extrabold text-base tracking-wider uppercase border-b border-zinc-800 pb-2">
              Store Info
            </h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-1" />
                <span className="text-zinc-300">Chomu, Rajasthan, India</span>
              </div>

              <div className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-amber-400 shrink-0 mt-1" />
                <a href="tel:9257575393" className="text-amber-400 hover:underline font-bold">
                  9257575393
                </a>
              </div>

              <div className="flex items-start gap-2.5">
                <InstagramIcon className="w-4 h-4 text-pink-400 shrink-0 mt-1" />
                <a
                  href="https://instagram.com/litra_king_shoes_zone_chomu"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-pink-400 hover:underline font-semibold text-xs"
                >
                  @litra_king_shoes_zone_chomu
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar & Copyright */}
        <div className="border-t border-zinc-900 pt-8 text-center text-xs text-zinc-400 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {currentYear} LITRA KING (SHOES ZONE), Chomu, Rajasthan. All Rights Reserved.</p>
          <div className="flex items-center gap-4 text-zinc-400">
            <span>WHOLESALE SALE</span>
            <span>•</span>
            <span>CHOMU FOOTWEAR</span>
            <span>•</span>
            <a href="tel:9257575393" className="text-amber-400 hover:underline">9257575393</a>
          </div>
        </div>

      </div>
    </footer>
  );
}
