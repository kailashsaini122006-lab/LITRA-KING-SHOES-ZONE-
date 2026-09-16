import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ShoppingBag, PackageCheck } from 'lucide-react';
import lkLogo from '../assets/lk_logo.jpg';
import { useCart } from '../context/CartContext';

export default function Navbar({ onDataAddClick, onOpenCart, onOpenTracking }) {
  const { getCartCount } = useCart();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Collection', path: '/collection' },
  ];

  const cartCount = getCartCount();

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80 py-3 shadow-2xl shadow-black/50'
          : 'bg-gradient-to-b from-black/90 to-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <img
            src={lkLogo}
            alt="Litra King Logo"
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full object-cover shadow-lg shadow-amber-500/30 group-hover:scale-110 transition-transform duration-300"
          />
          <div className="flex flex-col">
            <span className="text-lg sm:text-2xl font-extrabold tracking-wider text-white flex items-center gap-1.5">
              LITRA KING
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center space-x-1">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.name}
                to={link.path}
                className={`px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                  isActive
                    ? 'text-amber-400 bg-zinc-900/90 border border-amber-500/30'
                    : 'text-zinc-300 hover:text-amber-400 hover:bg-zinc-900/60'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
          <button
            onClick={onOpenTracking}
            className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-amber-400 hover:bg-amber-500/10 rounded-lg transition-all flex items-center gap-1.5"
          >
            <PackageCheck className="w-4 h-4 text-amber-400" />
            <span>Track Order</span>
          </button>
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          
          {/* Shopping Cart Button */}
          <button
            onClick={onOpenCart}
            className="relative flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 px-3.5 sm:px-4 py-2 rounded-full font-black text-xs sm:text-sm shadow-lg shadow-amber-500/25 transition-all hover:scale-105"
            aria-label="View Shopping Cart"
          >
            <ShoppingBag className="w-4 h-4 fill-zinc-950" />
            <span className="hidden sm:inline">Cart</span>
            {cartCount > 0 && (
              <span className="bg-zinc-950 text-amber-400 font-mono text-[11px] px-2 py-0.5 rounded-full font-bold">
                {cartCount}
              </span>
            )}
          </button>

          {/* Mobile Hamburger Menu */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl bg-zinc-900 text-zinc-300 hover:text-amber-400 border border-zinc-800 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-zinc-950/95 backdrop-blur-xl border-b border-zinc-800 px-4 pt-3 pb-6 space-y-3 animate-fadeIn">
          <div className="grid grid-cols-2 gap-2 pb-2">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-2.5 text-center rounded-xl font-medium text-xs border transition-all ${
                    isActive
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 font-bold'
                      : 'bg-zinc-900/60 text-zinc-200 hover:bg-amber-500/20 hover:text-amber-400 border-zinc-800/80'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>

          <div className="pt-1">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenTracking();
              }}
              className="w-full flex items-center justify-center gap-1.5 bg-amber-500/10 border border-amber-500/40 text-amber-400 py-3 rounded-xl font-bold text-xs"
            >
              <PackageCheck className="w-4 h-4" />
              <span>Track Order</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

