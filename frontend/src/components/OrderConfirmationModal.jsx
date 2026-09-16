import React from 'react';
import { X, CheckCircle2, PackageCheck, MapPin, Truck, ShoppingBag, CreditCard, ShieldCheck } from 'lucide-react';

export default function OrderConfirmationModal({ order, isOpen, onClose, onTrackOrder }) {
  if (!isOpen || !order) return null;

  const isUpi = order.paymentMethod === 'UPI';
  const isOnlinePayment = order.paymentMethod === 'Online Payment' || order.paymentMethod === 'Razorpay' || isUpi;

  const distVal = order.deliveryDistanceKm !== undefined && order.deliveryDistanceKm !== null
    ? order.deliveryDistanceKm
    : order.deliveryDistance;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden text-zinc-100 p-6 sm:p-8 space-y-6 text-center">
        
        {/* Top-Right X / Close Icon */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors z-10"
          title="Close"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Animated Check Icon */}
        <div className="w-20 h-20 bg-emerald-500/20 border-2 border-emerald-500/50 rounded-full flex items-center justify-center mx-auto text-emerald-400 shadow-xl shadow-emerald-500/20 animate-bounce">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        {/* Heading */}
        <div className="space-y-1">
          <span className="text-amber-400 font-extrabold uppercase tracking-widest text-xs">
            {isUpi ? 'UPI Payment Verification Pending' : isOnlinePayment ? 'Payment Verified & Confirmed' : 'Order Confirmation'}
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

          {distVal !== undefined && distVal !== null && (
            <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/30 px-3.5 py-2.5 rounded-xl text-xs text-amber-300 font-semibold">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Distance from LITRA KING Store:</span>
              </span>
              <span className="font-mono font-black text-amber-400 text-sm">
                {Number(distVal).toFixed(1)} km
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 text-xs pt-1">
            <div>
              <span className="text-zinc-500 block">Payment Method:</span>
              <span className="font-bold text-white flex items-center gap-1 mt-0.5">
                {isOnlinePayment ? (
                  <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <Truck className="w-3.5 h-3.5 text-amber-400" />
                )}
                {order.paymentMethod || 'COD'}
              </span>
            </div>

            <div>
              <span className="text-zinc-500 block">Payment Status:</span>
              <span className={`font-bold border px-2 py-0.5 rounded text-[11px] inline-block mt-0.5 ${
                order.paymentStatus === 'Paid'
                  ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                  : order.paymentStatus === 'Pending Verification'
                  ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                  : 'bg-zinc-900 text-zinc-300 border-zinc-700'
              }`}>
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
              <span className="text-zinc-500 block">Subtotal / Products:</span>
              <span className="font-mono font-bold text-zinc-200 text-xs mt-0.5 block">
                ₹{order.subtotal || order.totalAmount}
              </span>
            </div>

            <div>
              <span className="text-zinc-500 block">Delivery Charge:</span>
              <span className="font-mono font-bold text-emerald-400 text-xs mt-0.5 block">
                ₹{order.deliveryCharge ?? 0}
              </span>
            </div>

            <div>
              <span className="text-zinc-500 block">Grand Total:</span>
              <span className="font-mono font-black text-amber-400 text-sm mt-0.5 block">
                ₹{order.totalAmount}
              </span>
            </div>
          </div>

          {isUpi && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-[11px] text-amber-300 space-y-1">
              <span className="font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                Payment Status: Pending Verification
              </span>
              <p className="text-zinc-400 text-[10px]">
                Our team will cross-check your Paytm UPI payment against our bank records before dispatching your order.
              </p>
            </div>
          )}

          <div className="pt-2 border-t border-zinc-800/80 text-[11px] text-zinc-400 flex items-start gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
            <span>
              Shipping to: {order.customer?.address}, {order.customer?.city}, {order.customer?.state} - {order.customer?.pincode}
            </span>
          </div>

          {/* Delivery OTP Notice */}
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-[11px] text-amber-300 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
            <p className="text-zinc-300 text-[11px] leading-tight">
              <strong>Delivery Security:</strong> जब Delivery Executive आपके पते पर पहुँचेगा (Customer Reached), तब आपके मोबाइल (<strong className="text-amber-400">{order.customer?.phone}</strong>) पर Delivery OTP आएगा। सामान लेते समय यह OTP Delivery Boy को बताएं।
            </p>
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
