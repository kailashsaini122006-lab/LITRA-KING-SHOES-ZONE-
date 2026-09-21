import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Package,
  RefreshCw,
  AlertCircle,
  Clock,
  User,
  Phone,
  Mail,
  MapPin,
  Truck,
  CreditCard,
  Tag,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { getApiUrl } from '../config/api';

export default function OrdersReportPage({ accessToken }) {
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

  const getCurrentMonthString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

  const [filterType, setFilterType] = useState('date'); // 'date' | 'month'
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthString());
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedOrders, setExpandedOrders] = useState({});

  const fetchOrdersReport = useCallback(async () => {
    const activeToken = getAuthToken();
    if (!activeToken) {
      setLoading(false);
      setError('Admin authentication required. Token is missing or expired. Click "Back to Admin Panel" to verify your PIN.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      let endpoint = '/orders/reports/orders';
      if (filterType === 'date' && selectedDate) {
        endpoint += `?date=${encodeURIComponent(selectedDate)}`;
      } else if (filterType === 'month' && selectedMonth) {
        endpoint += `?month=${encodeURIComponent(selectedMonth)}`;
      }

      const url = getApiUrl(endpoint);
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${activeToken}` },
      });
      const data = await res.json().catch(() => null);

      if (res.ok && data && data.success) {
        setReportData(data);
      } else {
        setError(data?.message || `Failed to fetch orders report (${res.status}).`);
      }
    } catch (err) {
      console.error('Error fetching orders report:', err);
      setError(`Connection error (${err.message}). Unable to connect to backend API.`);
    } finally {
      setLoading(false);
    }
  }, [getAuthToken, filterType, selectedDate, selectedMonth]);

  useEffect(() => {
    fetchOrdersReport();
  }, [fetchOrdersReport]);

  const toggleExpand = (orderId) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const summary = reportData?.summary || {
    totalOrders: 0,
    totalAmount: 0,
    deliveredCount: 0,
    pendingCount: 0,
    cancelledCount: 0,
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
                <Package className="w-5 h-5 text-amber-400" />
                <span>Detailed Orders Report</span>
              </h1>
              <p className="text-[11px] text-zinc-400">
                Itemized customer & order records filterable by specific date or month.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            
            {/* Filter Type Segment Selector */}
            <div className="flex bg-zinc-950 p-1 border border-zinc-800 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setFilterType('date')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  filterType === 'date'
                    ? 'bg-amber-500 text-zinc-950 font-extrabold shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Specific Date
              </button>
              <button
                type="button"
                onClick={() => setFilterType('month')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  filterType === 'month'
                    ? 'bg-amber-500 text-zinc-950 font-extrabold shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Complete Month
              </button>
            </div>

            {/* Date or Month Picker */}
            {filterType === 'date' ? (
              <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 px-3 py-2 rounded-xl text-xs text-zinc-300">
                <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent text-white font-mono font-bold focus:outline-none cursor-pointer w-full"
                />
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 px-3 py-2 rounded-xl text-xs text-zinc-300">
                <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-transparent text-white font-mono font-bold focus:outline-none cursor-pointer w-full"
                />
              </div>
            )}

            <button
              type="button"
              onClick={fetchOrdersReport}
              disabled={loading}
              className="p-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl border border-zinc-700 transition-all shrink-0 cursor-pointer"
              title="Refresh Report Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
            </button>
          </div>
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
          <div className="p-5 bg-zinc-900/90 border border-amber-500/30 rounded-2xl space-y-2 shadow-lg">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400">Total Orders</span>
              <Package className="w-5 h-5 text-amber-400" />
            </div>
            <div className="text-3xl font-mono font-black text-white">
              {summary.totalOrders || 0}
            </div>
            <p className="text-[11px] text-zinc-400">
              Matching selected {filterType}
            </p>
          </div>

          <div className="p-5 bg-zinc-900/90 border border-emerald-500/30 rounded-2xl space-y-2 shadow-lg">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400">Total Orders Value</span>
              <Tag className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-3xl font-mono font-black text-emerald-400">
              ₹{(summary.totalAmount || 0).toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-zinc-400">
              Sum of non-cancelled orders
            </p>
          </div>

          <div className="p-5 bg-zinc-900/90 border border-blue-500/30 rounded-2xl space-y-2 shadow-lg">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-400">Delivered Orders</span>
              <CheckCircle2 className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-3xl font-mono font-black text-blue-400">
              {summary.deliveredCount || 0}
            </div>
            <p className="text-[11px] text-zinc-400">
              Completed deliveries
            </p>
          </div>

          <div className="p-5 bg-zinc-900/90 border border-zinc-800 rounded-2xl space-y-2 shadow-lg">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-300">Pending Orders</span>
              <Clock className="w-5 h-5 text-zinc-400" />
            </div>
            <div className="text-3xl font-mono font-black text-white">
              {summary.pendingCount || 0}
            </div>
            <p className="text-[11px] text-zinc-400">
              Awaiting delivery dispatch
            </p>
          </div>
        </div>

        {/* Orders Detailed List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <Package className="w-4 h-4 text-amber-400" />
              <span>Full Itemized Order Details ({ordersList.length})</span>
            </h3>
            <span className="text-[11px] text-zinc-400 font-mono">Sorted by latest created time</span>
          </div>

          {loading ? (
            <div className="p-12 bg-zinc-900/90 border border-zinc-800 rounded-2xl text-center text-zinc-400 flex flex-col items-center gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
              <span className="text-xs font-semibold">Fetching detailed orders from MongoDB database...</span>
            </div>
          ) : ordersList.length === 0 ? (
            <div className="p-12 bg-zinc-900/90 border border-zinc-800 rounded-2xl text-center text-zinc-500 space-y-2">
              <Package className="w-8 h-8 text-zinc-600 mx-auto" />
              <p className="text-sm font-semibold text-zinc-400">No orders found for selected {filterType}.</p>
              <p className="text-xs text-zinc-500">Change date/month filter above to inspect historical orders.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {ordersList.map((ord) => {
                const isExpanded = Boolean(expandedOrders[ord._id || ord.orderId]);
                const isPaid = ord.paymentStatus === 'Paid';
                const isCancelled = ord.orderStatus === 'Cancelled';
                const orderAmt = ord.totalAmount || (ord.subtotal + (ord.deliveryCharge || 0));

                return (
                  <div
                    key={ord._id || ord.orderId}
                    className={`bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 rounded-2xl overflow-hidden transition-all shadow-lg ${
                      isCancelled ? 'opacity-60 bg-red-950/10' : ''
                    }`}
                  >
                    {/* Header Row */}
                    <div
                      onClick={() => toggleExpand(ord._id || ord.orderId)}
                      className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-zinc-800/40 transition-colors"
                    >
                      <div className="flex items-start md:items-center gap-3">
                        <div className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-amber-400 font-mono font-black text-sm shrink-0">
                          #{ord.orderId}
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm flex items-center gap-2">
                            <span>{ord.customer?.name || 'N/A'}</span>
                            {ord.customer?.email && (
                              <span className="text-xs font-normal text-zinc-400 font-mono">({ord.customer.email})</span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 mt-0.5">
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-zinc-500" />
                              {ord.customer?.phone || 'N/A'}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1 font-mono">
                              <Clock className="w-3 h-3 text-amber-400" />
                              {formatDate(ord.createdAt)} at {formatTime(ord.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-zinc-800">
                        <div className="text-right">
                          <div className="text-base font-mono font-black text-amber-400">
                            ₹{(orderAmt || 0).toLocaleString('en-IN')}
                          </div>
                          <div className="text-[10px] text-zinc-400 uppercase font-mono">
                            {ord.paymentMethod} • {ord.paymentStatus}
                          </div>
                        </div>

                        <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          ord.orderStatus === 'Delivered'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : isCancelled
                            ? 'bg-red-950 text-red-300 border border-red-800'
                            : 'bg-zinc-800 text-zinc-200 border border-zinc-700'
                        }`}>
                          {ord.orderStatus || 'Pending'}
                        </span>

                        <button className="p-1.5 bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Detailed Expanded Section */}
                    {isExpanded && (
                      <div className="p-4 sm:p-5 border-t border-zinc-800 bg-zinc-950/80 space-y-5 animate-fadeIn">
                        
                        {/* 3 Grid Column Breakdown */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                          
                          {/* 1. Customer Information */}
                          <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2">
                            <h4 className="font-extrabold text-amber-400 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5" /> Customer Details
                            </h4>
                            <div className="space-y-1 text-zinc-300">
                              <p><strong className="text-zinc-400">Name:</strong> {ord.customer?.name}</p>
                              <p className="flex items-center gap-1">
                                <Mail className="w-3 h-3 text-zinc-500" />
                                <strong className="text-zinc-400">Gmail:</strong> {ord.customer?.email || 'N/A'}
                              </p>
                              <p className="flex items-center gap-1">
                                <Phone className="w-3 h-3 text-zinc-500" />
                                <strong className="text-zinc-400">Mobile:</strong> +91 {ord.customer?.phone}
                              </p>
                            </div>
                          </div>

                          {/* 2. Full Delivery Address */}
                          <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2">
                            <h4 className="font-extrabold text-blue-400 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5" /> Delivery Address
                            </h4>
                            <div className="space-y-1 text-zinc-300">
                              <p>{ord.customer?.address}</p>
                              {ord.customer?.landmark && <p className="text-zinc-400">Landmark: {ord.customer.landmark}</p>}
                              <p><strong className="text-zinc-400">City:</strong> {ord.customer?.city || 'Jodhpur'}, <strong className="text-zinc-400">State:</strong> {ord.customer?.state || 'Rajasthan'}</p>
                              <p><strong className="text-zinc-400">Pincode:</strong> <span className="font-mono font-bold text-white">{ord.customer?.pincode}</span></p>
                              <p className="text-zinc-400">
                                Distance: <span className="font-mono text-white">{ord.deliveryDistance || ord.deliveryDistanceKm || 0} km</span> | Charge: <span className="font-mono text-white">₹{ord.deliveryCharge || 0}</span>
                                {(ord.customer?.latitude || ord.latitude) && (
                                  <span className="ml-2 text-emerald-400 font-mono text-[10px] bg-emerald-950 border border-emerald-800 px-1.5 py-0.5 rounded">
                                    GPS: {ord.customer?.latitude || ord.latitude}, {ord.customer?.longitude || ord.longitude}
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>

                          {/* 3. Payment & Timestamps Audit */}
                          <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2">
                            <h4 className="font-extrabold text-emerald-400 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                              <CreditCard className="w-3.5 h-3.5" /> Payment & Audit Log
                            </h4>
                            <div className="space-y-1 text-zinc-300">
                              <p><strong className="text-zinc-400">Payment Method:</strong> <span className="font-bold text-white">{ord.paymentMethod}</span></p>
                              <p><strong className="text-zinc-400">Payment Status:</strong> <span className="font-bold text-emerald-400">{ord.paymentStatus}</span></p>
                              <p><strong className="text-zinc-400">Order Created Date:</strong> {formatDate(ord.createdAt)}</p>
                              <p><strong className="text-zinc-400">Exact Created Time:</strong> <span className="font-mono text-amber-300">{formatTime(ord.createdAt)}</span></p>
                              {ord.deliveryCompletedAt && (
                                <p><strong className="text-zinc-400">Delivered Time:</strong> <span className="font-mono text-emerald-300">{formatTime(ord.deliveryCompletedAt)}</span></p>
                              )}
                              {ord.transactionId && (
                                <p className="text-[10px] font-mono text-zinc-400 truncate">Txn ID: {ord.transactionId}</p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Itemized Purchased Products */}
                        <div className="space-y-2">
                          <h4 className="font-extrabold text-white uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                            <Package className="w-3.5 h-3.5 text-amber-400" /> Purchased Footwear Items ({ord.items?.length || 0})
                          </h4>
                          <div className="divide-y divide-zinc-800 bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
                            {Array.isArray(ord.items) && ord.items.map((item, idx) => (
                              <div key={idx} className="p-3 flex items-center justify-between text-xs">
                                <div className="flex items-center gap-3">
                                  {item.image ? (
                                    <img src={item.image} alt={item.name} className="w-10 h-10 object-cover rounded-lg border border-zinc-800" />
                                  ) : (
                                    <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-500 font-bold">LK</div>
                                  )}
                                  <div>
                                    <span className="font-bold text-white block">{item.name}</span>
                                    <span className="text-[10px] text-zinc-400 block font-mono">
                                      Size: UK-{item.size} | Color: {item.color} | Qty: {item.quantity}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-right font-mono font-bold text-amber-400">
                                  ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                                  <span className="text-[10px] text-zinc-500 block font-normal">(₹{item.price} x {item.quantity})</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
