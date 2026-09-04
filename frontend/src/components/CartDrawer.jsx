import React from 'react';
import { ShoppingBag, X, Trash2, Plus, Minus, ArrowRight, ShieldCheck, Truck } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function CartDrawer({ isOpen, onClose, onProceedToCheckout }) {
  const { cartItems, removeFromCart, updateQuantity, getCartSubtotal, getCartCount, clearCart, startCartCheckout } = useCart();

  if (!isOpen) return null;

  const subtotal = getCartSubtotal();
  const deliveryFee = subtotal >= 1000 || subtotal === 0 ? 0 : 99;
  const grandTotal = subtotal + deliveryFee;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-md bg-zinc-900 border-l border-zinc-800 shadow-2xl text-zinc-100 flex flex-col justify-between">
          
          {/* Header */}
          <div className="px-6 py-5 border-b border-zinc-800 bg-zinc-950/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-white tracking-wider flex items-center gap-2">
                  YOUR SHOPPING CART
                  <span className="text-xs bg-amber-500 text-zinc-950 font-black px-2 py-0.5 rounded-full">
                    {getCartCount()}
                  </span>
                </h2>
                <p className="text-[11px] text-zinc-400">Review selected footwear before checkout</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-16 text-zinc-500">
                <div className="p-5 bg-zinc-950 border border-zinc-800 rounded-full text-zinc-600">
                  <ShoppingBag className="w-12 h-12 stroke-[1.5]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-300">Your cart is empty</h3>
                  <p className="text-xs text-zinc-500 mt-1 max-w-xs">
                    Explore our latest Litra King footwear collection and add your favorite shoes.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold text-xs rounded-xl shadow-md transition-all"
                >
                  Browse Footwear Collection
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-zinc-400 border-b border-zinc-800/80 pb-2">
                  <span>SELECTED ITEMS ({cartItems.length})</span>
                  <button
                    onClick={clearCart}
                    className="text-red-400 hover:underline text-[11px] font-semibold"
                  >
                    Clear Cart
                  </button>
                </div>

                {cartItems.map((item) => (
                  <div
                    key={item.key}
                    className="p-3.5 bg-zinc-950 border border-zinc-800/80 rounded-2xl flex gap-3.5 items-center group hover:border-amber-500/30 transition-all"
                  >
                    {/* Item Image */}
                    <div className="w-20 h-20 bg-zinc-900 rounded-xl overflow-hidden shrink-0 border border-zinc-800">
                      <img
                        src={item.image || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80'}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Item Details */}
                    <div className="flex-1 space-y-1">
                      <h4 className="text-xs font-bold text-white leading-snug line-clamp-1">{item.name}</h4>
                      
                      {/* Specs pills */}
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="bg-zinc-900 border border-zinc-800 text-amber-400 px-2 py-0.5 rounded font-mono font-bold">
                          UK Size: {item.size}
                        </span>
                        <span className="bg-zinc-900 border border-zinc-800 text-zinc-300 px-2 py-0.5 rounded font-semibold">
                          {item.color}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="font-mono font-bold text-sm text-amber-400">
                          ₹{item.price * item.quantity}
                        </span>

                        {/* Quantity Buttons */}
                        <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
                          <button
                            onClick={() => updateQuantity(item.key, -1)}
                            className="p-1 text-zinc-400 hover:text-white"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 font-mono text-xs font-bold text-white">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.key, 1)}
                            className="p-1 text-zinc-400 hover:text-white"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Delete Item Button */}
                    <button
                      onClick={() => removeFromCart(item.key)}
                      className="p-2 text-zinc-500 hover:text-red-400 hover:bg-zinc-900 rounded-lg transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Summary & Checkout */}
          {cartItems.length > 0 && (
            <div className="p-6 border-t border-zinc-800 bg-zinc-950/90 space-y-4">
              
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-zinc-400">
                  <span>Subtotal</span>
                  <span className="font-mono font-bold text-zinc-200">₹{subtotal}</span>
                </div>

                <div className="flex justify-between text-zinc-400">
                  <span className="flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-amber-400" /> Delivery Charges
                  </span>
                  <span className="font-mono font-bold text-zinc-200">
                    {deliveryFee === 0 ? <span className="text-emerald-400">FREE</span> : `₹${deliveryFee}`}
                  </span>
                </div>

                {subtotal < 1000 && (
                  <p className="text-[10px] text-amber-400/90 italic">
                    Add ₹{1000 - subtotal} more for FREE delivery!
                  </p>
                )}

                <div className="pt-2 border-t border-zinc-800 flex justify-between text-base font-extrabold text-white">
                  <span>Total Amount</span>
                  <span className="font-mono text-amber-400 text-lg">₹{grandTotal}</span>
                </div>
              </div>

              {/* Checkout Action Button */}
              <button
                onClick={() => {
                  startCartCheckout();
                  onClose();
                  if (onProceedToCheckout) onProceedToCheckout();
                }}
                className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black rounded-2xl text-sm shadow-xl shadow-amber-500/25 transition-all hover:scale-[1.01] flex items-center justify-center gap-2 uppercase tracking-wider"
              >
                <span>PROCEED TO CHECKOUT</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-zinc-500">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>100% Cash on Delivery &amp; Secure Order Guaranteed</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
