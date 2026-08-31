import React from 'react';
import { CheckCircle2, PackageCheck, MapPin, Truck, ShoppingBag, CreditCard, ShieldCheck } from 'lucide-react';

export default function OrderConfirmationModal({ order, isOpen, onClose, onTrackOrder }) {
  if (!isOpen || !order) return null;

  const isOnlinePayment = order.paymentMethod === 'Online Payment' || order.paymentMethod === 'Razorpay';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden text-zinc-100 p-6 sm:p-8 space-y-6 text-center">
        
        {/* Animated Check Icon */}
        <div className="w-20 h-20 bg-emerald-500/20 border-2 border-emerald-500/50 rounded-full flex items-center justify-center mx-auto text-emerald-400 shadow-xl shadow-emerald-500/20 animate-bounce">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        {/* Heading */}
        <div className="space-y-1">
          <span className="text-amber-400 font-extrabold uppercase tracking-widest text-xs">
            {isOnlinePayment ? 'Payment Verified & Confirmed' : 'Order Confirmation'}
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white">🎉 Order Placed Successfully!</h2>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            Thank you for shopping with <strong className="text-white">LITRA KING (SHOES ZONE)</strong>. Your footwear order has been saved in MongoDB.
          </p>
        </div>

        {/* Order Details Card */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 space-y-3 text-left">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <span className="text-xs text-zinc-400 uppercase font-semibold">Order ID Number:</span>
            <span className="text-base font-mono font-black text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-lg">
              #{order.orderId}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs pt-1">
            <div>
              <span className="text-zinc-500 block">Payment Method:</span>
              <span className="font-bold text-white flex items-center gap-1 mt-0.5">
                {isOnlinePayment ? (
                  <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <Truck className="w-3.5 h-3.5 text-amber-400" />
                )}
                {order.paymentMethod || 'Cash on Delivery'}
              </span>
            </div>

            <div>
              <span className="text-zinc-500 block">Payment Status:</span>
              <span className="font-bold text-emerald-400 bg-emerald-950 border border-emerald-800 px-2 py-0.5 rounded text-[11px] inline-block mt-0.5">
                {order.paymentStatus || 'Pending'}
              </span>
            </div>

            {order.transactionId && (
              <div className="col-span-2 bg-zinc-900/60 p-2 rounded-xl border border-zinc-800 font-mono text-[11px] flex justify-between">
                <span className="text-zinc-400">Razorpay Txn ID:</span>
                <span className="text-amber-400 font-bold">{order.transactionId}</span>
              </div>
            )}

            <div>
              <span className="text-zinc-500 block">Customer Name:</span>
              <span className="font-semibold text-zinc-200 mt-0.5 block">{order.customer?.name}</span>
            </div>

            <div>
              <span className="text-zinc-500 block">Grand Total Amount:</span>
              <span className="font-mono font-black text-amber-400 text-sm mt-0.5 block">
                ₹{order.totalAmount}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-800/80 text-[11px] text-zinc-400 flex items-start gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
            <span>
              Shipping to: {order.customer?.address}, {order.customer?.city}, {order.customer?.state} - {order.customer?.pincode}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            onClick={() => {
              onClose();
              if (onTrackOrder) onTrackOrder(order.orderId);
            }}
            className="py-3.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black rounded-2xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
          >
            <PackageCheck className="w-4 h-4" /> Track Order Status
          </button>

          <button
            onClick={onClose}
            className="py-3.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-2xl text-xs uppercase tracking-wider transition-all border border-zinc-700 flex items-center justify-center gap-2"
          >
            <ShoppingBag className="w-4 h-4 text-amber-400" /> Continue Shopping
          </button>
        </div>

      </div>
    </div>
  );
}
