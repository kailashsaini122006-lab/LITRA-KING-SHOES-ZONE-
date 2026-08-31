import React, { useState, useEffect, useCallback } from 'react';
import { Package, X, Search, RefreshCw, CheckCircle2, Clock, Truck, MapPin, AlertCircle, ShoppingBag, ShieldCheck } from 'lucide-react';
import { getApiUrl } from '../config/api';

export default function OrderTrackingModal({ isOpen, onClose, initialOrderId }) {
  const [searchQuery, setSearchQuery] = useState(initialOrderId || '');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchOrderDetails = useCallback(async (query) => {
    if (!query || !query.trim()) return;

    try {
      setLoading(true);
      setErrorMessage('');
      const cleanQuery = query.trim().toUpperCase().replace('#', '');
      const res = await fetch(getApiUrl(`/orders/track/${encodeURIComponent(cleanQuery)}`));
      const data = await res.json().catch(() => null);

      if (res.ok && data && data.success) {
        setOrder(data.order);
      } else {
        setOrder(null);
        setErrorMessage(data?.message || `Order #${query} not found. Please check your Order ID.`);
      }
    } catch (err) {
      console.error('Error tracking order:', err);
      setErrorMessage(`Connection Error (${err.message}). Unable to reach backend server.`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (initialOrderId) {
        setSearchQuery(initialOrderId);
        fetchOrderDetails(initialOrderId);
      } else {
        setOrder(null);
        setErrorMessage('');
      }
    }
  }, [isOpen, initialOrderId, fetchOrderDetails]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setErrorMessage('Please enter an Order ID (e.g. LK1002) or registered mobile number.');
      return;
    }
    fetchOrderDetails(searchQuery);
  };

  if (!isOpen) return null;

  // Step definition mapping
  const STEPS = [
    { key: 'Pending', label: 'Order Placed', desc: 'Order received & saved' },
    { key: 'Confirmed', label: 'Confirmed', desc: 'Order verified by Litra King' },
    { key: 'Shipped', label: 'Shipped', desc: 'Dispatched with courier' },
    { key: 'Delivered', label: 'Delivered', desc: 'Handed over to customer' },
  ];

  const getStepStatus = (stepKey) => {
    if (!order || order.orderStatus === 'Cancelled') return false;
    const orderStatus = order.orderStatus || 'Pending';

    const orderRank = {
      Pending: 1,
      Confirmed: 2,
      Shipped: 3,
      Delivered: 4,
    };

    return (orderRank[orderStatus] || 1) >= (orderRank[stepKey] || 1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden text-zinc-100 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white tracking-wider uppercase">
                CUSTOMER ORDER TRACKING
              </h3>
              <p className="text-xs text-zinc-400">Real-time live shipment timeline status from database</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input Bar */}
        <div className="p-6 pb-4 border-b border-zinc-800/80 bg-zinc-950/40">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-500 absolute left-4 top-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter Order ID (e.g. #LK1002) or Mobile Number"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-11 pr-4 py-3 text-xs text-white uppercase font-mono focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span>Track Order</span>
            </button>
          </form>
        </div>

        {/* Tracking Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {errorMessage && (
            <div className="flex items-start gap-3 p-4 bg-red-950/70 border border-red-800/80 rounded-2xl text-red-300 text-xs">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {loading ? (
            <div className="py-12 text-center text-zinc-400 flex items-center justify-center gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-amber-400" /> Fetching shipment status from MongoDB...
            </div>
          ) : order ? (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Order Status Header Card */}
              <div className="p-5 bg-zinc-950 border border-zinc-800 rounded-2xl flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-zinc-400 font-semibold block">Order ID Number:</span>
                  <span className="text-xl font-mono font-black text-amber-400">#{order.orderId}</span>
                </div>

                <div>
                  <span className="text-xs text-zinc-400 font-semibold block">Order Date:</span>
                  <span className="text-xs text-zinc-200 font-mono">
                    {new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                </div>

                <div>
                  <span className="text-xs text-zinc-400 font-semibold block">Live Status:</span>
                  <span className={`text-xs font-extrabold uppercase px-3 py-1 rounded-full border inline-block mt-0.5 ${
                    order.orderStatus === 'Delivered'
                      ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                      : order.orderStatus === 'Cancelled'
                      ? 'bg-red-950 text-red-400 border-red-800'
                      : 'bg-amber-500/10 text-amber-300 border-amber-500/40'
                  }`}>
                    {order.orderStatus}
                  </span>
                </div>
              </div>

              {/* Step-by-Step Vertical / Horizontal Order Timeline */}
              {order.orderStatus !== 'Cancelled' ? (
                <div className="p-6 bg-zinc-950/70 border border-zinc-800 rounded-2xl space-y-6">
                  <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                    <h4 className="text-xs font-extrabold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                      <Truck className="w-4 h-4 text-amber-400" /> Order Shipment Progress Timeline
                    </h4>
                    <span className="text-[11px] text-amber-400 font-bold bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded">
                      Live Backend Status
                    </span>
                  </div>

                  {/* Horizontal / Grid Timeline */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative">
                    {STEPS.map((step, idx) => {
                      const isDone = getStepStatus(step.key);
                      return (
                        <div key={step.key} className="flex sm:flex-col items-center gap-3 sm:gap-2 text-left sm:text-center p-3 sm:p-0 bg-zinc-900/40 sm:bg-transparent rounded-xl border sm:border-0 border-zinc-800/60">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all shrink-0 ${
                              isDone
                                ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-lg shadow-amber-500/25 scale-105'
                                : 'bg-zinc-900 text-zinc-600 border-zinc-800'
                            }`}
                          >
                            {isDone ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                          </div>

                          <div className="space-y-0.5">
                            <div className={`text-xs font-extrabold ${isDone ? 'text-amber-400' : 'text-zinc-500'}`}>
                              {isDone ? '✓ ' : '○ '}{step.label}
                            </div>
                            <div className="text-[10px] text-zinc-400 leading-tight">
                              {step.desc}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-5 bg-red-950/70 border border-red-800/80 rounded-2xl text-red-300 text-xs text-center space-y-2">
                  <div className="font-extrabold text-sm text-red-400 flex items-center justify-center gap-2">
                    <AlertCircle className="w-5 h-5" /> Order Cancelled
                  </div>
                  <p className="text-zinc-300">
                    This order was cancelled. Item stock has been restored to catalog inventory. For assistance, contact Litra King at 9257575393.
                  </p>
                </div>
              )}

              {/* Customer Shipping Address & Payment Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-2 text-xs">
                  <h5 className="font-extrabold text-amber-400 flex items-center gap-1.5 uppercase border-b border-zinc-800 pb-2">
                    <MapPin className="w-3.5 h-3.5 text-red-500" /> Delivery Address
                  </h5>
                  <div className="text-white font-bold text-sm">{order.customer?.name}</div>
                  <div className="text-amber-400 font-mono font-semibold">+91 {order.customer?.phone}</div>
                  {order.customer?.email && <div className="text-zinc-400">{order.customer?.email}</div>}
                  <div className="text-zinc-300 leading-relaxed pt-1">
                    {order.customer?.address}, {order.customer?.city}, {order.customer?.state} - {order.customer?.pincode}
                  </div>
                </div>

                <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-2 text-xs">
                  <h5 className="font-extrabold text-amber-400 flex items-center gap-1.5 uppercase border-b border-zinc-800 pb-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Payment &amp; Total Summary
                  </h5>
                  <div className="flex justify-between text-zinc-400">
                    <span>Payment Method:</span>
                    <span className="font-bold text-white">{order.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Payment Status:</span>
                    <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                      order.paymentStatus === 'Paid' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}>
                      {order.paymentStatus}
                    </span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Delivery Fee:</span>
                    <span className="font-mono font-bold text-zinc-200">
                      {order.deliveryCharge === 0 ? <span className="text-emerald-400">FREE</span> : `₹${order.deliveryCharge}`}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-zinc-800 text-sm font-black text-white">
                    <span>Grand Total:</span>
                    <span className="font-mono text-amber-400 text-base">₹{order.totalAmount}</span>
                  </div>
                </div>
              </div>

              {/* Ordered Footwear Items */}
              <div className="border border-zinc-800 rounded-2xl overflow-hidden">
                <div className="bg-zinc-950 px-4 py-2.5 text-xs font-extrabold text-zinc-400 uppercase border-b border-zinc-800 flex justify-between">
                  <span>Ordered Footwear Items ({order.items?.length || 0})</span>
                  <span>Items Total</span>
                </div>
                <div className="divide-y divide-zinc-800/60 bg-zinc-900/40">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between text-xs gap-3">
                      <img src={item.image} alt={item.name} className="w-12 h-12 rounded-xl object-cover bg-zinc-950 border border-zinc-800" />
                      <div className="flex-1">
                        <div className="font-bold text-white text-sm">{item.name}</div>
                        <div className="text-[11px] text-zinc-400 flex items-center gap-2 mt-0.5">
                          <span>UK Size: <strong className="text-amber-400 font-mono">{item.size}</strong></span>
                          <span>•</span>
                          <span>Color: <strong>{item.color}</strong></span>
                          <span>•</span>
                          <span>Qty: <strong>{item.quantity}</strong></span>
                        </div>
                      </div>
                      <div className="font-mono font-bold text-amber-400 text-sm">
                        ₹{item.price * item.quantity}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            <div className="py-12 text-center text-zinc-500 text-xs">
              Enter your Order ID (e.g. #LK1002) or mobile number above to view shipment progress.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
