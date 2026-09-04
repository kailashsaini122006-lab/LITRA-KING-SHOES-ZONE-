import React, { useState, useEffect, useCallback } from 'react';
import { List, X, RefreshCw, ShieldCheck, Package, DollarSign, Truck, Clock, CheckCircle2, XCircle, Search, Eye, Filter, ArrowUpDown, Trash2, MapPin, AlertTriangle } from 'lucide-react';
import { getApiUrl } from '../config/api';

const getOrderPriceBreakdown = (ord) => {
  if (!ord) return { subtotal: 0, deliveryCharge: 0, grandTotal: 0 };
  const subtotal = ord.subtotal !== undefined && ord.subtotal !== null
    ? Number(ord.subtotal)
    : (Array.isArray(ord.items) ? ord.items.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 1)), 0) : Number(ord.totalAmount || 0));
  const deliveryCharge = ord.deliveryCharge !== undefined && ord.deliveryCharge !== null
    ? Number(ord.deliveryCharge)
    : (ord.totalAmount !== undefined && ord.totalAmount !== null ? Math.max(0, Number(ord.totalAmount) - subtotal) : (subtotal >= 1000 || subtotal === 0 ? 0 : 99));
  const grandTotal = ord.totalAmount !== undefined && ord.totalAmount !== null
    ? Number(ord.totalAmount)
    : (subtotal + deliveryCharge);
  return { subtotal, deliveryCharge, grandTotal };
};

export default function DataEntryModal({ isOpen, onClose, accessToken }) {
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'inquiries'

  // Tab 1: Orders State
  const [orders, setOrders] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [fetchingOrders, setFetchingOrders] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAdminOrder, setSelectedAdminOrder] = useState(null);

  // Custom Delete Confirmation & Success Modal State
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletedOrderInfo, setDeletedOrderInfo] = useState(null);

  // Tab 2: Customer Inquiries State
  const [inquiries, setInquiries] = useState([]);
  const [fetchingInquiries, setFetchingInquiries] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch Orders & Metrics from Backend (JWT Protected)
  const fetchOrdersAndMetrics = useCallback(async () => {
    try {
      setFetchingOrders(true);
      setErrorMessage('');

      let url = getApiUrl('/orders');
      const params = new URLSearchParams();
      if (statusFilter !== 'All') params.append('status', statusFilter);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if ([...params].length > 0) url += `?${params.toString()}`;

      const resOrder = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const dataOrder = await resOrder.json().catch(() => null);

      if (resOrder.ok && dataOrder && dataOrder.success) {
        setOrders(dataOrder.orders || []);
      } else {
        setErrorMessage(dataOrder?.message || 'Failed to load orders.');
      }

      // Fetch Metrics
      const resMetrics = await fetch(getApiUrl('/orders/admin/metrics'), {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const dataMetrics = await resMetrics.json().catch(() => null);
      if (resMetrics.ok && dataMetrics && dataMetrics.success) {
        setMetrics(dataMetrics.metrics);
      }
    } catch (err) {
      console.error('Error fetching admin orders:', err);
      setErrorMessage(`Connection Error (${err.message}). Unable to reach backend server.`);
    } finally {
      setFetchingOrders(false);
    }
  }, [accessToken, statusFilter, searchQuery]);

  // Fetch Customer Inquiries (JWT Protected)
  const fetchInquiries = useCallback(async () => {
    try {
      setFetchingInquiries(true);
      setErrorMessage('');
      const res = await fetch(getApiUrl('/data-entry'), {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data && data.success) {
        setInquiries(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching inquiries:', err);
      setErrorMessage(`Connection Error (${err.message}).`);
    } finally {
      setFetchingInquiries(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (isOpen && accessToken) {
      if (activeTab === 'orders') {
        fetchOrdersAndMetrics();
      } else {
        fetchInquiries();
      }
    }
  }, [isOpen, accessToken, activeTab, fetchOrdersAndMetrics, fetchInquiries]);

  // Handle Order Status & Payment Status Update
  const handleUpdateOrderStatus = async (orderId, newOrderStatus, newPaymentStatus) => {
    try {
      setErrorMessage('');
      const payload = {};
      if (newOrderStatus) payload.orderStatus = newOrderStatus;
      if (newPaymentStatus) payload.paymentStatus = newPaymentStatus;

      const res = await fetch(getApiUrl(`/orders/${orderId}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data && data.success) {
        setSuccessMessage(`Order #${orderId} status updated successfully`);
        setTimeout(() => setSuccessMessage(''), 3000);

        // Update local modal state if selected
        if (selectedAdminOrder && selectedAdminOrder.orderId === orderId) {
          setSelectedAdminOrder(data.order);
        }

        fetchOrdersAndMetrics();
      } else {
        setErrorMessage(data?.message || 'Failed to update order status.');
      }
    } catch (err) {
      console.error('Error updating order status:', err);
      setErrorMessage(`Error updating status: ${err.message}`);
    }
  };

  // Trigger Custom Delete Confirmation Modal
  const handleDeleteOrder = (targetOrder) => {
    if (!targetOrder) return;
    setOrderToDelete(targetOrder);
  };

  // Execute Order Deletion via Backend API
  const confirmExecuteDelete = async () => {
    if (!orderToDelete) return;

    const orderId = typeof orderToDelete === 'object'
      ? (orderToDelete.orderId || orderToDelete._id)
      : orderToDelete;

    if (!orderId) {
      setErrorMessage('Invalid order selected for deletion.');
      setOrderToDelete(null);
      return;
    }

    const displayId = typeof orderToDelete === 'object'
      ? (orderToDelete.orderId || orderId)
      : orderId;

    try {
      setIsDeleting(true);
      setErrorMessage('');
      const deleteUrl = getApiUrl(`/orders/${encodeURIComponent(orderId)}`);

      const res = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data && data.success) {
        // Instant local state update (no full web reload)
        setOrders((prevOrders) =>
          prevOrders.filter((o) => o.orderId !== orderId && o._id !== orderId)
        );

        if (selectedAdminOrder && (selectedAdminOrder.orderId === orderId || selectedAdminOrder._id === orderId)) {
          setSelectedAdminOrder(null);
        }

        setSuccessMessage(`Order #${displayId} deleted successfully.`);
        setTimeout(() => setSuccessMessage(''), 3500);

        // Trigger Custom Success Modal
        setDeletedOrderInfo({ displayId });

        // Refresh metrics and database state
        fetchOrdersAndMetrics();
      } else {
        setErrorMessage(data?.message || `Failed to delete Order #${displayId}.`);
      }
    } catch (err) {
      console.error('Error deleting order:', err);
      const networkMsg = err.message === 'Failed to fetch'
        ? 'Unable to connect to backend API. Please ensure the backend server is running and accessible.'
        : err.message;
      setErrorMessage(`Error deleting order: ${networkMsg}`);
    } finally {
      setIsDeleting(false);
      setOrderToDelete(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 animate-fadeIn">
      <div className="relative w-full max-w-6xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden text-zinc-100 flex flex-col max-h-[94vh]">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl text-zinc-950 font-bold shadow-md shadow-amber-500/20">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-white tracking-wider flex items-center gap-2">
                ADMIN ORDER MANAGEMENT PORTAL
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold uppercase hidden sm:flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> JWT Authenticated
                </span>
              </h3>
              <p className="text-xs text-zinc-400">Manage shoe orders, update shipment statuses, &amp; view live sales</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-800 bg-zinc-950/40">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all border ${
                activeTab === 'orders'
                  ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-md'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Orders &amp; Sales</span>
              {orders.length > 0 && (
                <span className="bg-zinc-950 text-amber-300 px-2 py-0.5 rounded-full font-mono text-[10px]">
                  {orders.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('inquiries')}
              className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all border ${
                activeTab === 'inquiries'
                  ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-md'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
              <span>Customer Inquiries</span>
            </button>
          </div>

          <button
            onClick={activeTab === 'orders' ? fetchOrdersAndMetrics : fetchInquiries}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${(fetchingOrders || fetchingInquiries) ? 'animate-spin text-amber-400' : ''}`} /> Refresh
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          
          {errorMessage && (
            <div className="p-4 bg-red-950/70 border border-red-800/80 rounded-2xl text-red-300 text-xs">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="p-4 bg-emerald-950/70 border border-emerald-800/80 rounded-2xl text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {successMessage}
            </div>
          )}

          {/* TAB 1: ORDERS & SALES DASHBOARD */}
          {activeTab === 'orders' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Sales Metrics Cards Grid */}
              {metrics && (
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                  <div className="p-3.5 bg-zinc-950 border border-amber-500/30 rounded-2xl space-y-1">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase block">Total Sales</span>
                    <span className="text-lg font-mono font-black text-amber-400">₹{metrics.totalSales}</span>
                  </div>

                  <div className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-1">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase block">Total Orders</span>
                    <span className="text-lg font-mono font-black text-white">{metrics.totalOrders}</span>
                  </div>

                  <div className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-1">
                    <span className="text-[10px] text-amber-400 font-bold uppercase block">Pending</span>
                    <span className="text-lg font-mono font-black text-amber-300">{metrics.pendingOrders}</span>
                  </div>

                  <div className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-1">
                    <span className="text-[10px] text-blue-400 font-bold uppercase block">Confirmed</span>
                    <span className="text-lg font-mono font-black text-blue-300">{metrics.confirmedOrders}</span>
                  </div>

                  <div className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-1">
                    <span className="text-[10px] text-purple-400 font-bold uppercase block">Shipped</span>
                    <span className="text-lg font-mono font-black text-purple-300">{metrics.shippedOrders}</span>
                  </div>

                  <div className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-1">
                    <span className="text-[10px] text-emerald-400 font-bold uppercase block">Delivered</span>
                    <span className="text-lg font-mono font-black text-emerald-300">{metrics.deliveredOrders}</span>
                  </div>

                  <div className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-1">
                    <span className="text-[10px] text-red-400 font-bold uppercase block">Cancelled</span>
                    <span className="text-lg font-mono font-black text-red-400">{metrics.cancelledOrders}</span>
                  </div>
                </div>
              )}

              {/* Search & Status Filter Controls */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-950/60 p-4 border border-zinc-800 rounded-2xl">
                
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by Order ID (#LK1002), Customer Name, or Phone..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
                  <span className="text-[11px] text-zinc-400 font-bold uppercase mr-1 flex items-center gap-1">
                    <Filter className="w-3.5 h-3.5 text-amber-400" /> Filter:
                  </span>
                  {['All', 'Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'].map((st) => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border whitespace-nowrap ${
                        statusFilter === st
                          ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

              </div>

              {/* Orders List Container */}
              {fetchingOrders ? (
                <div className="py-16 text-center text-zinc-400 flex items-center justify-center gap-3">
                  <RefreshCw className="w-6 h-6 animate-spin text-amber-400" /> Fetching customer orders from MongoDB...
                </div>
              ) : orders.length === 0 ? (
                <div className="py-16 text-center text-zinc-500 text-sm">
                  No orders found for the selected search query or status filter.
                </div>
              ) : (
                <>
                  {/* DESKTOP TABLE VIEW (md:table) */}
                  <div className="hidden md:block border border-zinc-800 rounded-2xl overflow-hidden shadow-inner">
                    <table className="w-full text-left text-xs text-zinc-300">
                      <thead className="bg-zinc-950 text-zinc-400 uppercase font-bold border-b border-zinc-800">
                        <tr>
                          <th className="px-4 py-3.5">Order ID</th>
                          <th className="px-4 py-3.5">Customer Details</th>
                          <th className="px-4 py-3.5">Ordered Shoes</th>
                          <th className="px-4 py-3.5">Total Amount</th>
                          <th className="px-4 py-3.5">Payment</th>
                          <th className="px-4 py-3.5">Order Status Action</th>
                          <th className="px-4 py-3.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60 bg-zinc-900/40">
                        {orders.map((ord) => {
                          const { subtotal, deliveryCharge, grandTotal } = getOrderPriceBreakdown(ord);
                          return (
                            <tr key={ord._id} className="hover:bg-zinc-800/40 transition-colors group">
                              <td className="px-4 py-3.5 font-mono font-black text-amber-400 whitespace-nowrap">
                                #{ord.orderId}
                              </td>

                              <td className="px-4 py-3.5 max-w-xs">
                                <div className="font-bold text-white text-sm">{ord.customer?.name}</div>
                                <div className="text-amber-400 font-semibold font-mono">+91 {ord.customer?.phone}</div>
                                <div className="text-zinc-400 text-[11px] truncate" title={`${ord.customer?.address}, ${ord.customer?.city}`}>
                                  {ord.customer?.city}, {ord.customer?.pincode}
                                </div>
                              </td>

                              <td className="px-4 py-3.5 max-w-xs space-y-1">
                                {ord.items?.map((item, idx) => (
                                  <div key={idx} className="flex items-center gap-2 text-[11px]">
                                    <span className="font-semibold text-zinc-200 truncate max-w-[130px]">{item.name}</span>
                                    <span className="bg-zinc-950 text-amber-400 border border-zinc-800 px-1.5 py-0.5 rounded font-mono font-bold">
                                      Size {item.size}
                                    </span>
                                    <span className="text-zinc-400">x{item.quantity}</span>
                                  </div>
                                ))}
                              </td>

                              {/* Price Breakdown Column */}
                              <td className="px-4 py-3.5 whitespace-nowrap">
                                <div className="space-y-0.5 text-xs font-mono">
                                  <div className="flex justify-between gap-3 text-zinc-400 text-[11px]">
                                    <span>Product Price:</span>
                                    <span className="font-semibold text-zinc-200">₹{subtotal}</span>
                                  </div>
                                  <div className="flex justify-between gap-3 text-zinc-400 text-[11px]">
                                    <span>Delivery Charge:</span>
                                    <span className="font-semibold text-zinc-200">
                                      {deliveryCharge === 0 ? <span className="text-emerald-400 font-bold font-sans">FREE</span> : `₹${deliveryCharge}`}
                                    </span>
                                  </div>
                                  <div className="flex justify-between gap-3 text-amber-400 font-black text-xs border-t border-zinc-800/80 pt-0.5">
                                    <span>Grand Total:</span>
                                    <span>₹{grandTotal}</span>
                                  </div>
                                </div>
                              </td>

                            <td className="px-4 py-3.5 whitespace-nowrap space-y-1">
                              <div className="font-bold text-white">{ord.paymentMethod}</div>
                              <select
                                value={ord.paymentStatus}
                                onChange={(e) => handleUpdateOrderStatus(ord.orderId, null, e.target.value)}
                                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-zinc-950 border focus:outline-none ${
                                  ord.paymentStatus === 'Paid'
                                    ? 'text-emerald-400 border-emerald-800'
                                    : ord.paymentStatus === 'Payment Failed' || ord.paymentStatus === 'Failed'
                                    ? 'text-red-400 border-red-800'
                                    : 'text-amber-300 border-amber-800'
                                }`}
                              >
                                <option value="Pending">Pending</option>
                                <option value="Pending Verification">Pending Verification</option>
                                <option value="Paid">Paid</option>
                                <option value="Payment Failed">Payment Failed</option>
                              </select>
                            </td>

                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <select
                                value={ord.orderStatus}
                                onChange={(e) => handleUpdateOrderStatus(ord.orderId, e.target.value, null)}
                                className={`bg-zinc-950 border font-bold text-xs rounded-xl px-3 py-1.5 focus:outline-none transition-colors ${
                                  ord.orderStatus === 'Delivered'
                                    ? 'text-emerald-400 border-emerald-800'
                                    : ord.orderStatus === 'Cancelled'
                                    ? 'text-red-400 border-red-800'
                                    : 'text-amber-400 border-amber-500/50'
                                }`}
                              >
                                <option value="Pending">Pending</option>
                                <option value="Confirmed">Confirmed</option>
                                <option value="Shipped">Shipped</option>
                                <option value="Delivered">Delivered</option>
                                <option value="Cancelled">Cancelled</option>
                              </select>
                            </td>

                            <td className="px-4 py-3.5 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => setSelectedAdminOrder(ord)}
                                  className="p-1.5 bg-zinc-800 hover:bg-amber-500 hover:text-zinc-950 text-zinc-300 rounded-lg transition-colors"
                                  title="View Full Order Details"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteOrder(ord)}
                                  className="p-1.5 bg-zinc-800 hover:bg-red-600 hover:text-white text-zinc-400 rounded-lg transition-colors"
                                  title="Delete Order"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      </tbody>
                    </table>
                  </div>

                  {/* MOBILE CARDS VIEW (block md:hidden) */}
                  <div className="block md:hidden space-y-4">
                    {orders.map((ord) => {
                      const { subtotal, deliveryCharge, grandTotal } = getOrderPriceBreakdown(ord);
                      return (
                        <div
                          key={ord._id}
                          className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-3 shadow-md"
                        >
                          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                            <span className="font-mono font-black text-amber-400 text-base">#{ord.orderId}</span>
                            <span className="text-[11px] font-mono text-zinc-400">
                              {new Date(ord.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                            </span>
                          </div>

                          <div className="space-y-1 text-xs">
                            <div className="font-extrabold text-white text-sm">{ord.customer?.name}</div>
                            <div className="text-amber-400 font-mono font-bold">+91 {ord.customer?.phone}</div>
                            <div className="text-zinc-400 text-[11px]">{ord.customer?.address}, {ord.customer?.city}</div>
                          </div>

                          {/* Items list */}
                          <div className="bg-zinc-900/60 p-2.5 rounded-xl space-y-1.5 text-xs">
                            {ord.items?.map((item, idx) => (
                              <div key={idx} className="flex justify-between items-center text-[11px]">
                                <span className="text-zinc-200 font-semibold truncate max-w-[180px]">{item.name}</span>
                                <span className="text-amber-400 font-mono">UK {item.size} x{item.quantity}</span>
                              </div>
                            ))}
                          </div>

                          {/* Price Breakdown Box */}
                          <div className="p-2.5 bg-zinc-900/70 border border-zinc-800 rounded-xl space-y-1 text-[11px] font-mono">
                            <div className="flex justify-between text-zinc-400">
                              <span>Product Price:</span>
                              <span className="text-zinc-200 font-semibold">₹{subtotal}</span>
                            </div>
                            <div className="flex justify-between text-zinc-400">
                              <span>Delivery Charge:</span>
                              <span className="text-zinc-200 font-semibold">
                                {deliveryCharge === 0 ? <span className="text-emerald-400 font-bold font-sans">FREE</span> : `₹${deliveryCharge}`}
                              </span>
                            </div>
                            <div className="flex justify-between border-t border-zinc-800 pt-1 font-mono font-extrabold text-amber-400 text-xs">
                              <span>Grand Total:</span>
                              <span>₹{grandTotal}</span>
                            </div>
                          </div>

                          {/* Status Dropdown */}
                          <div className="flex items-center justify-between pt-1">
                            <select
                              value={ord.orderStatus}
                              onChange={(e) => handleUpdateOrderStatus(ord.orderId, e.target.value, null)}
                              className="w-full bg-zinc-900 border border-amber-500/50 text-amber-400 font-bold text-xs rounded-xl px-3 py-2 focus:outline-none"
                            >
                              <option value="Pending">Pending</option>
                              <option value="Confirmed">Confirmed</option>
                              <option value="Shipped">Shipped</option>
                              <option value="Delivered">Delivered</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          </div>

                        {/* Action buttons */}
                        <div className="pt-2 border-t border-zinc-800/80 flex items-center gap-2">
                          <button
                            onClick={() => setSelectedAdminOrder(ord)}
                            className="flex-1 py-2 bg-zinc-900 hover:bg-zinc-800 text-amber-400 font-bold text-xs rounded-xl flex items-center justify-center gap-1 border border-zinc-800"
                          >
                            <Eye className="w-3.5 h-3.5" /> View Details
                          </button>
                          <button
                            onClick={() => handleDeleteOrder(ord)}
                            className="px-3 py-2 bg-red-950/40 hover:bg-red-600 text-red-400 hover:text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 border border-red-800/50 transition-colors"
                            title="Delete Order"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        </div>
                      </div>
                      ); })}
                  </div>
                </>
              )}

            </div>
          )}

          {/* TAB 2: SAVED CUSTOMER INQUIRIES */}
          {activeTab === 'inquiries' && (
            <div className="space-y-4 animate-fadeIn">
              {fetchingInquiries ? (
                <div className="py-12 text-center text-zinc-400 flex items-center justify-center gap-3">
                  <RefreshCw className="w-6 h-6 animate-spin text-amber-400" /> Loading saved inquiries...
                </div>
              ) : inquiries.length === 0 ? (
                <div className="py-12 text-center text-zinc-500 text-sm">
                  No saved inquiries found in MongoDB.
                </div>
              ) : (
                <div className="border border-zinc-800 rounded-2xl overflow-hidden shadow-inner">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-zinc-300">
                      <thead className="bg-zinc-950 text-zinc-400 uppercase font-bold border-b border-zinc-800">
                        <tr>
                          <th className="px-4 py-3.5">User Name</th>
                          <th className="px-4 py-3.5">Mobile Number</th>
                          <th className="px-4 py-3.5">Inquiry Type</th>
                          <th className="px-4 py-3.5">Message / Requirements</th>
                          <th className="px-4 py-3.5">Submitted Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60 bg-zinc-900/40">
                        {inquiries.map((rec) => (
                          <tr key={rec._id} className="hover:bg-zinc-800/50 transition-colors">
                            <td className="px-4 py-3.5 font-bold text-white">{rec.userName}</td>
                            <td className="px-4 py-3.5 font-semibold text-amber-400">+91 {rec.mobileNumber}</td>
                            <td className="px-4 py-3.5 text-zinc-300 font-medium">
                              <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-semibold">
                                {rec.inquiryType || 'Wholesale Inquiry'}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-zinc-300 max-w-xs leading-relaxed">{rec.message}</td>
                            <td className="px-4 py-3.5 text-zinc-400 font-mono text-[11px] whitespace-nowrap">
                              {new Date(rec.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

      </div>

      {/* ─── DETAILED ADMIN ORDER MODAL VIEW ─────────────────────────── */}
      {selectedAdminOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden text-zinc-100 flex flex-col max-h-[90vh]">
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950">
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-mono font-black text-xl">#{selectedAdminOrder.orderId}</span>
                <span className="text-xs text-zinc-400">• Full Order Breakdown</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDeleteOrder(selectedAdminOrder)}
                  className="px-3 py-1.5 bg-red-950/60 hover:bg-red-600 border border-red-800 text-red-300 hover:text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors mr-2"
                  title="Delete Order"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Order
                </button>
                <button
                  onClick={() => setSelectedAdminOrder(null)}
                  className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              
              {/* Status Update Control */}
              <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4 flex-wrap">
                  <div>
                    <span className="text-zinc-400 block text-[11px]">Order Status:</span>
                    <span className="text-amber-400 font-extrabold text-sm">{selectedAdminOrder.orderStatus}</span>
                  </div>
                  <div className="border-l border-zinc-800 pl-4">
                    <span className="text-zinc-400 block text-[11px]">Payment Method & Status:</span>
                    <span className="text-white font-bold text-xs">{selectedAdminOrder.paymentMethod}</span>
                    <span className={`ml-2 text-[10px] font-bold uppercase px-2 py-0.5 rounded border inline-block ${
                      selectedAdminOrder.paymentStatus === 'Paid'
                        ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                        : selectedAdminOrder.paymentStatus === 'Payment Failed' || selectedAdminOrder.paymentStatus === 'Failed'
                        ? 'bg-red-950 text-red-400 border-red-800'
                        : 'bg-amber-950 text-amber-300 border-amber-800'
                    }`}>
                      {selectedAdminOrder.paymentStatus}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span className="text-zinc-400 font-bold text-[11px]">Payment Status:</span>
                    <select
                      value={selectedAdminOrder.paymentStatus}
                      onChange={(e) => handleUpdateOrderStatus(selectedAdminOrder.orderId, null, e.target.value)}
                      className="bg-zinc-900 border border-zinc-700 text-white font-bold text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-amber-400"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Pending Verification">Pending Verification</option>
                      <option value="Paid">Paid</option>
                      <option value="Payment Failed">Payment Failed</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-zinc-400 font-bold text-[11px]">Order Status:</span>
                    <select
                      value={selectedAdminOrder.orderStatus}
                      onChange={(e) => handleUpdateOrderStatus(selectedAdminOrder.orderId, e.target.value, null)}
                      className="bg-zinc-900 border border-amber-500 text-amber-400 font-bold text-xs rounded-xl px-3 py-1.5 focus:outline-none"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Customer & Address Details */}
              <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-2">
                <h5 className="font-extrabold text-amber-400 uppercase border-b border-zinc-800 pb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-red-500" /> Customer Information &amp; Address
                </h5>
                <div className="text-white font-extrabold text-sm">{selectedAdminOrder.customer?.name}</div>
                <div className="text-amber-400 font-mono font-semibold">+91 {selectedAdminOrder.customer?.phone}</div>
                {selectedAdminOrder.customer?.email && <div className="text-zinc-400">{selectedAdminOrder.customer?.email}</div>}
                <div className="text-zinc-300 leading-relaxed pt-1">
                  {selectedAdminOrder.customer?.address}, {selectedAdminOrder.customer?.city}, {selectedAdminOrder.customer?.state} - {selectedAdminOrder.customer?.pincode}
                </div>
              </div>

              {/* Items Summary */}
              <div className="border border-zinc-800 rounded-2xl overflow-hidden">
                <div className="bg-zinc-950 px-4 py-2.5 font-extrabold text-zinc-400 uppercase border-b border-zinc-800">
                  Ordered Footwear Items ({selectedAdminOrder.items?.length || 0})
                </div>
                <div className="divide-y divide-zinc-800/60 bg-zinc-950/50">
                  {selectedAdminOrder.items?.map((item, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between gap-3">
                      <img src={item.image} alt={item.name} className="w-12 h-12 rounded-xl object-cover bg-zinc-900 border border-zinc-800" />
                      <div className="flex-1">
                        <div className="font-bold text-white text-sm">{item.name}</div>
                        <div className="text-[11px] text-zinc-400">
                          Size: <strong className="text-amber-400 font-mono">{item.size}</strong> | Color: {item.color} | Qty: {item.quantity}
                        </div>
                      </div>
                      <div className="font-mono font-bold text-amber-400 text-sm">
                        ₹{item.price * item.quantity}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Breakdown */}
              {(() => {
                const { subtotal, deliveryCharge, grandTotal } = getOrderPriceBreakdown(selectedAdminOrder);
                return (
                  <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-2">
                    <div className="flex justify-between text-zinc-400">
                      <span>Product Price (Subtotal)</span>
                      <span className="font-mono font-bold text-zinc-200">₹{subtotal}</span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>Delivery Charge</span>
                      <span className="font-mono font-bold text-zinc-200">
                        {deliveryCharge === 0 ? <span className="text-emerald-400 font-bold">FREE</span> : `₹${deliveryCharge}`}
                      </span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>Payment Method</span>
                      <span className="font-bold text-white">{selectedAdminOrder.paymentMethod}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-zinc-800 text-sm font-black text-white">
                      <span>Grand Total Amount</span>
                      <span className="font-mono text-amber-400 text-base">₹{grandTotal}</span>
                    </div>
                  </div>
                );
              })()}

            </div>

          </div>
        </div>
      )}

      {/* ─── CUSTOM PREMIUM DELETE CONFIRMATION MODAL ────────────────── */}
      {orderToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
          <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl p-6 sm:p-7 text-center text-zinc-100 animate-scaleUp">
            
            {/* Close Button */}
            <button
              type="button"
              onClick={() => !isDeleting && setOrderToDelete(null)}
              disabled={isDeleting}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Trash Icon Badge */}
            <div className="mx-auto w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 shadow-lg shadow-red-500/10 mb-4">
              <svg className="w-8 h-8 text-red-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </div>

            {/* Modal Heading & Subtitle */}
            <h4 className="text-xl font-extrabold text-white tracking-wide">
              Delete Order?
            </h4>
            <p className="text-xs sm:text-sm text-zinc-300 mt-2 leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <strong className="text-amber-400 font-mono text-sm">
                Order #{typeof orderToDelete === 'object' ? (orderToDelete.orderId || orderToDelete._id) : orderToDelete}
              </strong>?
            </p>

            {/* Warning Box */}
            <div className="mt-4 p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-red-300 text-xs font-semibold flex items-center justify-center gap-2">
              <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <span>This action cannot be undone.</span>
            </div>

            {/* Action Buttons Grid */}
            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setOrderToDelete(null)}
                disabled={isDeleting}
                className="flex-1 py-3 px-4 bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-300 hover:text-white font-bold text-xs rounded-xl transition-all border border-zinc-700 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmExecuteDelete}
                disabled={isDeleting}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 active:scale-95 text-white font-extrabold text-xs rounded-xl transition-all shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 border border-red-500 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                    <span>Yes, Delete Order</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ─── CUSTOM DELETE SUCCESS MODAL ────────────────────────────── */}
      {deletedOrderInfo && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
          <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl p-6 sm:p-7 text-center text-zinc-100 animate-scaleUp">
            
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setDeletedOrderInfo(null)}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Check Circle Icon Badge */}
            <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10 mb-4">
              <svg className="w-9 h-9 text-emerald-400 animate-bounce-short" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            {/* Heading */}
            <h4 className="text-xl font-extrabold text-white tracking-wide">
              Order Deleted Successfully
            </h4>

            {/* Main Message with Order ID */}
            <p className="text-sm text-zinc-300 mt-2 leading-relaxed">
              Order <strong className="text-amber-400 font-mono text-sm">#{deletedOrderInfo.displayId}</strong> has been permanently deleted.
            </p>

            {/* Sub-message */}
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80">
              The order has been removed from the database and Order &amp; Sales list.
            </p>

            {/* Action OK / Done Button */}
            <div className="mt-6">
              <button
                type="button"
                onClick={() => setDeletedOrderInfo(null)}
                className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 active:scale-95 text-white font-extrabold text-xs rounded-xl transition-all shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 border border-emerald-500"
              >
                <span>OK / Done</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
