import React from 'react';
import { Home, Grid, ShoppingBag, PackageCheck, Phone, MessageCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function MobileActionBar({ onOpenCart, onOpenTracking }) {
  const { getCartCount } = useCart();
  const cartCount = getCartCount();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800 px-2 py-2 shadow-2xl">
      <div className="grid grid-cols-4 gap-1 max-w-md mx-auto text-center">
        {/* 1. Home */}
        <a
          href="#home"
          className="flex flex-col items-center justify-center py-1 text-[11px] font-bold text-zinc-400 hover:text-amber-400 transition-colors"
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span>Home</span>
        </a>

        {/* 2. Categories / Shop */}
        <a
          href="#collection"
          className="flex flex-col items-center justify-center py-1 text-[11px] font-bold text-zinc-400 hover:text-amber-400 transition-colors"
        >
          <Grid className="w-5 h-5 mb-0.5" />
          <span>Categories</span>
        </a>

        {/* 3. Cart */}
        <button
          onClick={onOpenCart}
          className="relative flex flex-col items-center justify-center py-1 text-[11px] font-bold text-zinc-400 hover:text-amber-400 transition-colors"
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5 mb-0.5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-amber-500 text-zinc-950 text-[10px] font-mono font-black w-4 h-4 rounded-full flex items-center justify-center shadow">
                {cartCount}
              </span>
            )}
          </div>
          <span>Cart</span>
        </button>

        {/* 4. Orders */}
        <button
          onClick={onOpenTracking}
          className="flex flex-col items-center justify-center py-1 text-[11px] font-bold text-zinc-400 hover:text-amber-400 transition-colors"
        >
          <PackageCheck className="w-5 h-5 mb-0.5 text-amber-400" />
          <span>Orders</span>
        </button>
      </div>
    </div>
  );
}

