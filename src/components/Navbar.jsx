import React, { useState, useEffect } from 'react';
import { Phone, Menu, X, ShoppingBag, MapPin, Tag } from 'lucide-react';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', href: '#home' },
    { name: 'About', href: '#about' },
    { name: 'Collection', href: '#collection' },
    { name: 'Wholesale', href: '#wholesale' },
    { name: 'Gallery', href: '#gallery' },
    { name: 'Contact', href: '#contact' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80 py-3 shadow-2xl shadow-black/50'
          : 'bg-gradient-to-b from-black/90 to-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand Logo */}
        <a href="#home" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 flex items-center justify-center text-zinc-950 font-black text-xl shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
            LK
          </div>
          <div className="flex flex-col">
            <span className="text-xl sm:text-2xl font-extrabold tracking-wider text-white flex items-center gap-1.5">
              LITRA KING
              <span className="text-xs bg-red-600 text-white font-bold px-1.5 py-0.5 rounded tracking-normal uppercase">
                Wholesale
              </span>
            </span>
            <span className="text-xs font-semibold tracking-widest text-amber-400 uppercase">
              SHOES ZONE • CHOMU
            </span>
          </div>
        </a>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="px-3.5 py-2 text-sm font-medium text-zinc-300 hover:text-amber-400 hover:bg-zinc-900/60 rounded-lg transition-all"
            >
              {link.name}
            </a>
          ))}
        </nav>

        {/* Desktop Call Action Button */}
        <div className="hidden md:flex items-center space-x-3">
          <a
            href="tel:9257575393"
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 px-5 py-2.5 rounded-full font-bold text-sm shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all hover:scale-105"
          >
            <Phone className="w-4 h-4 fill-zinc-950" />
            <span>Call: 9257575393</span>
          </a>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2.5 rounded-xl bg-zinc-900/80 text-zinc-300 hover:text-amber-400 border border-zinc-800 transition-colors"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-zinc-950/95 backdrop-blur-xl border-b border-zinc-800 px-4 pt-3 pb-6 space-y-3 animate-fadeIn">
          <div className="grid grid-cols-2 gap-2 pb-2">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2.5 text-center rounded-xl bg-zinc-900/60 text-zinc-200 hover:bg-amber-500/20 hover:text-amber-400 font-medium text-sm border border-zinc-800/80 transition-all"
              >
                {link.name}
              </a>
            ))}
          </div>

          <a
            href="tel:9257575393"
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 py-3 rounded-xl font-extrabold text-base shadow-lg shadow-amber-500/20 w-full"
          >
            <Phone className="w-5 h-5 fill-zinc-950" />
            <span>Call Now — 9257575393</span>
          </a>
        </div>
      )}
    </header>
  );
}
