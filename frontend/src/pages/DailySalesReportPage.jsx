import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Package,
  CreditCard,
  Truck,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  User,
  Phone,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { getApiUrl } from '../config/api';

export default function DailySalesReportPage({ accessToken }) {
  const navigate = useNavigate();

  const getAuthToken = useCallback(() => {
    return accessToken || sessionStorage.getItem('lk_access_token') || localStorage.getItem('lk_access_token') || '';
  }, [accessToken]);

  const getTodayDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDailyReport = useCallback(async (dateVal) => {
    const activeToken = getAuthToken();
    if (!activeToken) {
      setLoading(false);
      setError('Admin authentication required. Token is missing or expired. Click "Back to Admin Panel" to verify your PIN.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const targetDate = dateVal || selectedDate;
      const url = getApiUrl(`/orders/reports/daily?date=${encodeURIComponent(targetDate)}`);
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${activeToken}` },
      });
      const data = await res.json().catch(() => null);

      if (res.ok && data && data.success) {
        setReportData(data);
      } else {
        setError(data?.message || `Failed to fetch daily sales report (${res.status}).`);
      }
    } catch (err) {
      console.error('Error fetching daily sales report:', err);
      setError(`Connection error (${err.message}). Unable to connect to backend API.`);
    } finally {
      setLoading(false);
    }
  }, [getAuthToken, selectedDate]);

  useEffect(() => {
    if (selectedDate) {
      fetchDailyReport(selectedDate);
    }
  }, [selectedDate, fetchDailyReport]);

  const formatTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  };

  const formatDateLabel = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
    return dateObj.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const summary = reportData?.summary || {
    totalSales: 0,
    totalOrders: 0,
    onlineSales: 0,
    onlineOrdersCount: 0,
    codSales: 0,
    codOrdersCount: 0,
    otherSales: 0,
    otherOrdersCount: 0,
  };

  const ordersList = reportData?.orders || [];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 sm:p-6 lg:p-8 pt-6 sm:pt-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-zinc-900/90 border border-zinc-800 p-4 sm:p-5 rounded-2xl shadow-xl">
          <div className="flex items-center gap-3">
            
            {/* Small Circular Close/Back Icon Button */}
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="w-10 h-10 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-full border border-zinc-800 flex items-center justify-center transition-all cursor-pointer shadow-md group shrink-0"
              title="Back to Admin Panel"
            >
              <ArrowLeft className="w-5 h-5 text-amber-400 group-hover:-translate-x-0.5 transition-transform" />
            </button>

            <div>
              <h1 className="text-lg sm:text-xl font-black text-white tracking-wide flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-400" />
                <span>Daily Sales Report</span>
              </h1>
              <p className="text-[11px] text-zinc-400">
                Detailed breakdown of daily collected payments and MongoDB orders.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 px-3 py-2 rounded-xl text-xs text-zinc-300 w-full sm:w-auto">
              <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-white font-mono font-bold focus:outline-none cursor-pointer w-full"
              />
            </div>
            <button
              type="button"
              onClick={() => fetchDailyReport(selectedDate)}
              disabled={loading}
              className="p-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl border border-zinc-700 transition-all shrink-0 cursor-pointer"
              title="Refresh Report Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Selected Date Badge */}
        <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/20 px-4 py-3 rounded-xl text-xs text-amber-300 font-semibold">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Selected Date: <strong className="text-white">{formatDateLabel(selectedDate)}</strong> ({selectedDate})</span>
          </div>
          <span className="text-[10px] bg-amber-500/20 text-amber-300 font-mono font-bold px-2 py-0.5 rounded-md">
            Live MongoDB Query
          </span>
        </div>

        {error && (
          <div className="p-4 bg-red-950/80 border border-red-800/90 rounded-2xl text-red-300 text-xs font-semibold flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="px-3 py-1.5 bg-red-900/60 hover:bg-red-800 text-white rounded-xl text-xs font-bold transition-all border border-red-700 shrink-0 cursor-pointer"
            >
              Return to Admin Panel
            </button>
          </div>
        )}

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Total Sales Card */}
          <div className="p-5 bg-zinc-900/90 border border-amber-500/40 rounded-2xl space-y-2 shadow-lg">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400">Total Collected Sales</span>
              <DollarSign className="w-5 h-5 text-amber-400" />
            </div>
            <div className="text-3xl font-mono font-black text-amber-400">
              ₹{(summary.totalSales || 0).toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-zinc-400">
              Sum of non-cancelled orders on {selectedDate}
            </p>
          </div>

          {/* Total Orders Card */}
          <div className="p-5 bg-zinc-900/90 border border-zinc-800 rounded-2xl space-y-2 shadow-lg">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-300">Total Orders</span>
              <Package className="w-5 h-5 text-zinc-400" />
            </div>
            <div className="text-3xl font-mono font-black text-white">
              {summary.totalOrders || 0}
            </div>
            <p className="text-[11px] text-zinc-400">
              {summary.validOrdersCount || 0} active, {summary.cancelledOrdersCount || 0} cancelled
            </p>
          </div>

          {/* Online Payments Card */}
          <div className="p-5 bg-zinc-900/90 border border-emerald-500/30 rounded-2xl space-y-2 shadow-lg">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400">Online Payments</span>
              <CreditCard className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-3xl font-mono font-black text-emerald-400">
              ₹{(summary.onlineSales || 0).toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-zinc-400">
              {summary.onlineOrdersCount || 0} orders via Razorpay / UPI / Online
            </p>
          </div>

          {/* COD / Cash Payments Card */}
          <div className="p-5 bg-zinc-900/90 border border-blue-500/30 rounded-2xl space-y-2 shadow-lg">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-400">COD / Cash Payments</span>
              <Truck className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-3xl font-mono font-black text-blue-400">
              ₹{(summary.codSales || 0).toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-zinc-400">
              {summary.codOrdersCount || 0} orders via Cash on Delivery
            </p>
          </div>
        </div>

        {/* Formula Summary Breakdown Bar */}
        <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl text-xs flex flex-col md:flex-row items-center justify-between gap-3 text-zinc-300">
          <div className="font-semibold flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>Payment Audit Formula:</span>
          </div>
          <div className="font-mono text-zinc-200 bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800 text-center">
            Total (₹{(summary.totalSales || 0).toLocaleString('en-IN')}) = Online (₹{(summary.onlineSales || 0).toLocaleString('en-IN')}) + Cash/COD (₹{(summary.codSales || 0).toLocaleString('en-IN')}) {summary.otherSales > 0 ? `+ Other (₹${summary.otherSales.toLocaleString('en-IN')})` : ''}
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <Package className="w-4 h-4 text-amber-400" />
              <span>Orders Placed on {selectedDate} ({ordersList.length})</span>
            </h3>
            <span className="text-[11px] text-zinc-400 font-mono">Sorted by latest order time</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-zinc-400 flex flex-col items-center gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
              <span className="text-xs font-semibold">Loading date orders from database...</span>
            </div>
          ) : ordersList.length === 0 ? (
            <div className="p-12 text-center text-zinc-500 space-y-2">
              <Calendar className="w-8 h-8 text-zinc-600 mx-auto" />
              <p className="text-sm font-semibold text-zinc-400">No orders placed on {selectedDate}.</p>
              <p className="text-xs text-zinc-500">Try selecting a different date from the date picker above.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="bg-zinc-950 text-zinc-400 uppercase font-mono text-[10px] tracking-wider border-b border-zinc-800">
                  <tr>
                    <th className="py-3 px-4">Order ID</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Order & Payment Time</th>
                    <th className="py-3 px-4">Payment Method</th>
                    <th className="py-3 px-4">Payment Status</th>
                    <th className="py-3 px-4">Order Total</th>
                    <th className="py-3 px-4">Delivery Charge</th>
                    <th className="py-3 px-4">Order Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-sans">
                  {ordersList.map((ord) => {
                    const isPaid = ord.paymentStatus === 'Paid';
                    const isCancelled = ord.orderStatus === 'Cancelled';
                    const orderAmt = ord.totalAmount || (ord.subtotal + (ord.deliveryCharge || 0));

                    return (
                      <tr key={ord._id || ord.orderId} className={`hover:bg-zinc-800/40 transition-colors ${isCancelled ? 'opacity-50 bg-red-950/10' : ''}`}>
                        <td className="py-3 px-4 font-mono font-black text-amber-400">
                          #{ord.orderId}
                        </td>
                        <td className="py-3 px-4 space-y-0.5">
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-zinc-400" />
                            <span>{ord.customer?.name || 'N/A'}</span>
                          </div>
                          <div className="text-[11px] text-zinc-400 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-zinc-500" />
                            <span>{ord.customer?.phone || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-zinc-300">
                          <div className="flex items-center gap-1 text-white font-bold">
                            <Clock className="w-3.5 h-3.5 text-amber-400" />
                            <span>{formatTime(ord.createdAt)}</span>
                          </div>
                          <span className="text-[10px] text-zinc-500">{new Date(ord.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            ord.paymentMethod === 'COD'
                              ? 'bg-blue-950 text-blue-300 border border-blue-800/60'
                              : 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                          }`}>
                            {ord.paymentMethod || 'COD'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isPaid
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                              : 'bg-amber-950 text-amber-300 border border-amber-800/60'
                          }`}>
                            {ord.paymentStatus || 'Pending'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-black text-amber-400 text-sm">
                          ₹{(orderAmt || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 font-mono text-zinc-400">
                          {ord.deliveryCharge ? `₹${ord.deliveryCharge}` : <span className="text-emerald-400 font-bold">FREE</span>}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            ord.orderStatus === 'Delivered'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : ord.orderStatus === 'Cancelled'
                              ? 'bg-red-950 text-red-300 border border-red-800'
                              : 'bg-zinc-800 text-zinc-200 border border-zinc-700'
                          }`}>
                            {ord.orderStatus || 'Pending'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
