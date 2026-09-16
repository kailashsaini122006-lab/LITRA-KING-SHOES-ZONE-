import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { List, X, RefreshCw, ShieldCheck, Package, DollarSign, Truck, Clock, CheckCircle2, XCircle, Search, Eye, Filter, ArrowUpDown, Trash2, MapPin, AlertTriangle, TrendingUp, Calendar, UserCheck, Mail } from 'lucide-react';
import { getApiUrl } from '../config/api';
import ProductManagement from '../pages/ProductManagement';

function formatOrderDateTime(isoString) {
  if (!isoString) return { date: 'N/A', time: 'N/A' };
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return { date: 'N/A', time: 'N/A' };

  const dateStr = d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  });

  const timeStr = d.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  });

  return { date: dateStr, time: timeStr };
}

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

const getSuggestedDeliveryTime = (dist) => {
  const distance = Number(dist || 0);
  if (distance <= 5) return '1–2 hours';
  if (distance <= 10) return '2–3 hours';
  if (distance <= 20) return '3–5 hours';
  return '5–8 hours';
};

const getOrderCoordinates = (ord) => {
  if (!ord) return null;
  let lat = ord.customer?.latitude ?? ord.latitude ?? null;
  let lng = ord.customer?.longitude ?? ord.longitude ?? null;

  if (lat !== null && lng !== null && !isNaN(Number(lat)) && !isNaN(Number(lng))) {
    return { lat: Number(lat), lng: Number(lng) };
  }

  const fullAddress = ord.customer?.address || '';
  const match = fullAddress.match(/GPS Location:\s*([-\d.]+),\s*([-\d.]+)/i);
  if (match) {
    const parsedLat = parseFloat(match[1]);
    const parsedLng = parseFloat(match[2]);
    if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
      return { lat: parsedLat, lng: parsedLng };
    }
  }

  return null;
};

const getNext7Days = () => {
  const dates = [];
  const now = new Date();
  const monthsEnglish = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthsHindi = [
    'जनवरी', 'फरवरी', 'मार्च', 'अप्रैल', 'मई', 'जून',
    'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'
  ];

  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);

    const dayNum = d.getDate();
    const monthNameEng = monthsEnglish[d.getMonth()];
    const year = d.getFullYear();

    const value = `${monthNameEng} ${dayNum}, ${year}`;
    let labelEng = value;

    if (i === 0) {
      labelEng = `Today — ${value}`;
    } else if (i === 1) {
      labelEng = `Tomorrow — ${value}`;
    }

    dates.push({
      index: i,
      value,
      labelEng,
      dayNum,
      monthNameEng,
      monthNameHin: monthsHindi[d.getMonth()],
      year,
    });
  }
  return dates;
};

const formatPhoneForWhatsApp = (phoneStr) => {
  if (!phoneStr) return '';
  const cleaned = phoneStr.toString().replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `91${cleaned}`;
  }
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    return cleaned;
  }
  return cleaned;
};

const generateWhatsAppMessage = (ord, deliveryTime, deliveryDate, language = 'English') => {
  if (!ord) return '';
  const customerName = ord.customer?.name || 'Customer';
  const orderId = ord.orderId || '';
  
  let productText = '';
  let sizeText = '';
  if (Array.isArray(ord.items) && ord.items.length > 0) {
    productText = ord.items.map(item => item.name).join(', ');
    sizeText = ord.items.map(item => item.size).join(', ');
  } else {
    productText = 'LITRA KING Footwear';
    sizeText = 'N/A';
  }

  const { grandTotal } = getOrderPriceBreakdown(ord);
  const paymentMethod = ord.paymentMethod || 'COD';
  
  let paymentStatusText = ord.paymentStatus || 'Pending';
  if (ord.paymentStatus === 'Paid') {
    paymentStatusText = 'Confirmed';
  } else if (paymentMethod === 'COD' && (ord.paymentStatus === 'Pending' || !ord.paymentStatus)) {
    paymentStatusText = 'COD';
  }

  const orderStatusText = ord.orderStatus || 'Confirmed';
  const distText = ord.deliveryDistance ? `${ord.deliveryDistance} KM` : 'Local';

  let timeText = deliveryTime || ord.estimatedDeliveryTime || getSuggestedDeliveryTime(ord.deliveryDistance);
  let dateText = deliveryDate || ord.expectedDeliveryDate || (timeText === 'Tomorrow' ? 'Tomorrow' : 'Today');

  if (language === 'Hindi') {
    // Convert standard time terms to Hindi
    if (timeText === '1–2 hours') timeText = '1–2 घंटे';
    else if (timeText === '2–3 hours') timeText = '2–3 घंटे';
    else if (timeText === '3–5 hours') timeText = '3–5 घंटे';
    else if (timeText === '5–8 hours') timeText = '5–8 घंटे';
    else if (timeText === 'Tomorrow') timeText = 'कल';

    // Format date in Hindi format (e.g. "September 10, 2026" -> "10 सितंबर 2026")
    const monthsMap = {
      January: 'जनवरी', February: 'फरवरी', March: 'मार्च', April: 'अप्रैल',
      May: 'मई', June: 'जून', July: 'जुलाई', August: 'अगस्त',
      September: 'सितंबर', October: 'अक्टूबर', November: 'नवंबर', December: 'दिसंबर'
    };

    if (dateText === 'Today') dateText = 'आज';
    else if (dateText === 'Tomorrow') dateText = 'कल';
    else {
      const match = dateText.match(/^([A-Za-z]+)\s+(\d+),\s*(\d+)$/);
      if (match && monthsMap[match[1]]) {
        dateText = `${match[2]} ${monthsMap[match[1]]} ${match[3]}`;
      }
    }

    let statusLine = `आपका LITRA KING Order #${orderId} Confirmed हो गया है।`;
    if (orderStatusText === 'Shipped') {
      statusLine = `आपका LITRA KING Order #${orderId} Ship हो गया है।`;
    } else if (orderStatusText === 'Delivered') {
      statusLine = `आपका LITRA KING Order #${orderId} Deliver हो गया है।`;
    } else if (orderStatusText === 'Cancelled') {
      statusLine = `आपका LITRA KING Order #${orderId} Cancel हो गया है।`;
    } else if (orderStatusText === 'Pending') {
      statusLine = `आपका LITRA KING Order #${orderId} Pending में है।`;
    }

    return `नमस्ते ${customerName} 👋\n\n${statusLine}\n\nProduct: ${productText}\nSize: ${sizeText}\nTotal Amount: ₹${grandTotal}\nPayment: ${paymentMethod}\nPayment Status: ${paymentStatusText}\nOrder Status: ${orderStatusText}\nDelivery Distance: ${distText}\n\nEstimated Delivery Time: ${timeText}\nExpected Delivery Date: ${dateText}\n\nLITRA KING से खरीदारी करने के लिए धन्यवाद।`;
  }

  // Default English Message
  let statusLine = `Your LITRA KING order #${orderId} has been confirmed.`;
  if (orderStatusText === 'Shipped') {
    statusLine = `Your LITRA KING order #${orderId} has been shipped.`;
  } else if (orderStatusText === 'Delivered') {
    statusLine = `Your LITRA KING order #${orderId} has been delivered.`;
  } else if (orderStatusText === 'Cancelled') {
    statusLine = `Your LITRA KING order #${orderId} has been cancelled.`;
  } else if (orderStatusText === 'Pending') {
    statusLine = `Your LITRA KING order #${orderId} is currently pending.`;
  }

  return `Hello ${customerName} 👋\n\n${statusLine}\n\nProduct: ${productText}\nSize: ${sizeText}\nTotal Amount: ₹${grandTotal}\nPayment: ${paymentMethod}\nPayment Status: ${paymentStatusText}\nOrder Status: ${orderStatusText}\nDelivery Distance: ${distText}\n\nEstimated Delivery Time: ${timeText}\nExpected Delivery Date: ${dateText}\n\nThank you for shopping with LITRA KING.`;
};

export default function DataEntryModal({ isOpen, onClose, accessToken }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'inquiries' | 'products'

  // Tab 1: Orders State
  const [orders, setOrders] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [fetchingOrders, setFetchingOrders] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInputVal, setSearchInputVal] = useState('');

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setSearchQuery((searchInputVal || '').trim());
  };

  const handleClearSearch = () => {
    setSearchInputVal('');
    setSearchQuery('');
  };
  const [selectedAdminOrder, setSelectedAdminOrder] = useState(null);

  // Delivery OTP Verification State
  const [otpInputVal, setOtpInputVal] = useState('');
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpSuccess, setOtpSuccess] = useState('');

  // Permanent Storage & Controlled Delete Mode State (Default: Permanent - Delete Hidden)
  const [showAdminDeleteControls, setShowAdminDeleteControls] = useState(false);

  // Delivery Handover Tab State
  const [handovers, setHandovers] = useState([]);
  const [fetchingHandovers, setFetchingHandovers] = useState(false);
  const [handoverSearch, setHandoverSearch] = useState('');
  const [handoverStatusFilter, setHandoverStatusFilter] = useState('All');
  const [handoverDateFilter, setHandoverDateFilter] = useState('');

  // Delivery Handover Form State
  const [handoverOrderIdInput, setHandoverOrderIdInput] = useState('');
  const [selectedOrderForHandover, setSelectedOrderForHandover] = useState(null);
  const [handoverDeliveryBoyName, setHandoverDeliveryBoyName] = useState('');
  const [handoverDeliveryBoyPhone, setHandoverDeliveryBoyPhone] = useState('');
  const [handoverDeliveryBoyReceived, setHandoverDeliveryBoyReceived] = useState('Yes');
  const [handoverOtpInput, setHandoverOtpInput] = useState('');
  const [handoverStatusInput, setHandoverStatusInput] = useState('Product Handed Over');
  const [handoverNotesInput, setHandoverNotesInput] = useState('');
  const [allowUpdateHandover, setAllowUpdateHandover] = useState(false);
  const [handoverSubmitting, setHandoverSubmitting] = useState(false);
  const [handoverFormSuccess, setHandoverFormSuccess] = useState(null);
  const [handoverFormError, setHandoverFormError] = useState('');
  const [fetchingSelectedOrderDetails, setFetchingSelectedOrderDetails] = useState(false);
  const [selectedOrderFetchError, setSelectedOrderFetchError] = useState('');

  // Delivery Handover Details Modal State
  const [selectedHandoverDetail, setSelectedHandoverDetail] = useState(null);
  const [handoverModalOpen, setHandoverModalOpen] = useState(false);

  const getAuthToken = () => {
    return accessToken || sessionStorage.getItem('lk_access_token') || localStorage.getItem('lk_access_token') || '';
  };

  const handleVerifyDeliveryOtpInAdmin = async (orderId, otpCode) => {
    try {
      setOtpVerifying(true);
      setOtpError('');
      setOtpSuccess('');
      const token = getAuthToken();

      const res = await fetch(getApiUrl(`/orders/${encodeURIComponent(orderId)}/verify-otp`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ otp: otpCode }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data && data.success) {
        setOtpSuccess(data.message || 'Delivery OTP verified successfully!');
        setOtpInputVal('');
        if (data.order) {
          setSelectedAdminOrder(data.order);
          setOrders((prev) => prev.map((o) => (o.orderId === data.order.orderId ? data.order : o)));
        }
        fetchOrdersAndMetrics();
      } else {
        setOtpError(data?.message || 'OTP verification failed. Please check the OTP and try again.');
      }
    } catch (err) {
      setOtpError(`Error verifying OTP: ${err.message}`);
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleResendDeliveryOtpInAdmin = async (orderId) => {
    try {
      setOtpVerifying(true);
      setOtpError('');
      setOtpSuccess('');
      const token = getAuthToken();

      const res = await fetch(getApiUrl(`/orders/${encodeURIComponent(orderId)}/resend-otp`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data && data.success) {
        const generatedAt = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
        setOtpSuccess(
          `New Delivery OTP generated and sent to customer!\n• Order ID: #${orderId}\n• Status: New OTP Sent via SMS ✓\n• Generated Date/Time: ${generatedAt}`
        );
        if (data.order) {
          setSelectedAdminOrder(data.order);
          setOrders((prev) => prev.map((o) => (o.orderId === data.order.orderId ? data.order : o)));
        }
        fetchOrdersAndMetrics();
      } else {
        setOtpError(data?.message || 'Failed to resend OTP.');
      }
    } catch (err) {
      setOtpError(`Error resending OTP: ${err.message}`);
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleMarkCustomerReachedInAdmin = async (orderId) => {
    try {
      setOtpVerifying(true);
      setOtpError('');
      setOtpSuccess('');
      const token = getAuthToken();

      // Automatically open the target order in details view so loading state & error/success messages are visible
      const target = orders.find((o) => o.orderId === orderId || o._id === orderId);
      if (target) {
        setSelectedAdminOrder(target);
      }

      const res = await fetch(getApiUrl(`/orders/${encodeURIComponent(orderId)}/customer-reached`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data && data.success) {
        const generatedAt = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
        setOtpSuccess(
          `Delivery OTP generated and sent to customer!\n• Order ID: #${data.order?.orderId || orderId}\n• Customer Name: ${data.order?.customer?.name || 'Customer'}\n• Phone: +91 ${data.order?.customer?.phone || ''}\n• Status: OTP Sent via SMS ✓\n• Generated Date/Time: ${generatedAt}`
        );
        if (data.order) {
          setSelectedAdminOrder(data.order);
          setOrders((prev) => prev.map((o) => (o.orderId === data.order.orderId ? data.order : o)));
        }
        fetchOrdersAndMetrics();
      } else {
        setOtpError(data?.message || 'Failed to update status to Customer Reached.');
      }
    } catch (err) {
      setOtpError(`Error updating status: ${err.message}`);
    } finally {
      setOtpVerifying(false);
    }
  };

  // Custom Delete Confirmation & Success Modal State
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletedOrderInfo, setDeletedOrderInfo] = useState(null);

  // WhatsApp Modal State
  const [whatsappModalOrder, setWhatsappModalOrder] = useState(null);
  const [whatsappDeliveryTime, setWhatsappDeliveryTime] = useState('2–3 hours');
  const [whatsappCustomTime, setWhatsappCustomTime] = useState('');
  const [whatsappDeliveryDate, setWhatsappDeliveryDate] = useState('');
  const [whatsappCustomDate, setWhatsappCustomDate] = useState('');
  const [whatsappLanguage, setWhatsappLanguage] = useState('English'); // 'English' | 'Hindi'
  const [whatsappMessageText, setWhatsappMessageText] = useState('');
  const [isSavingDelivery, setIsSavingDelivery] = useState(false);

  // Tab 2: Customer Inquiries State
  const [inquiries, setInquiries] = useState([]);
  const [fetchingInquiries, setFetchingInquiries] = useState(false);

  // Tab 3: Admin Product Stock Availability Control State
  const [productsList, setProductsList] = useState([]);
  const [fetchingProductsList, setFetchingProductsList] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch Products List for Admin Stock Management
  const fetchProductsList = useCallback(async () => {
    try {
      setFetchingProductsList(true);
      setErrorMessage('');
      const res = await fetch(getApiUrl('/products'));
      const data = await res.json().catch(() => null);
      if (res.ok && data && data.success && Array.isArray(data.products)) {
        setProductsList(data.products);
      }
    } catch (err) {
      console.error('Error fetching admin products list:', err);
    } finally {
      setFetchingProductsList(false);
    }
  }, []);

  // Admin Toggle Product Stock Status (In Stock ↔ Out of Stock)
  const handleToggleProductStockInModal = async (productObj) => {
    try {
      const prodId = productObj._id || productObj.productId;
      const currentInStock = productObj.inStock !== false;
      const newInStock = !currentInStock;

      // Optimistic update
      setProductsList((prev) =>
        prev.map((p) =>
          (p._id === prodId || p.productId === prodId) ? { ...p, inStock: newInStock } : p
        )
      );

      const res = await fetch(getApiUrl(`/products/${encodeURIComponent(prodId)}/stock`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ inStock: newInStock }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data && data.success && data.product) {
        setProductsList((prev) =>
          prev.map((p) =>
            (p._id === prodId || p.productId === prodId) ? { ...p, inStock: data.product.inStock } : p
          )
        );
        setSuccessMessage(`Product "${productObj.name}" updated to ${data.product.inStock ? 'Available' : 'Out of Stock'}`);
        setTimeout(() => setSuccessMessage(''), 3000);
        window.dispatchEvent(new Event('lk_admin_stock_changed'));
      } else {
        // Fallback to PUT
        const putRes = await fetch(getApiUrl(`/products/${encodeURIComponent(prodId)}`), {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ inStock: newInStock }),
        });
        const putData = await putRes.json().catch(() => null);
        if (putRes.ok && putData && putData.success && putData.product) {
          setProductsList((prev) =>
            prev.map((p) =>
              (p._id === prodId || p.productId === prodId) ? { ...p, inStock: putData.product.inStock } : p
            )
          );
          setSuccessMessage(`Product "${productObj.name}" updated to ${putData.product.inStock ? 'Available' : 'Out of Stock'}`);
          setTimeout(() => setSuccessMessage(''), 3000);
          window.dispatchEvent(new Event('lk_admin_stock_changed'));
        } else {
          // Revert optimistic update if API failed
          setProductsList((prev) =>
            prev.map((p) =>
              (p._id === prodId || p.productId === prodId) ? { ...p, inStock: currentInStock } : p
            )
          );
          setErrorMessage(putData?.message || data?.message || 'Failed to update stock status in database.');
        }
      }
    } catch (err) {
      console.error('Error toggling product stock:', err);
      // Revert optimistic update
      setProductsList((prev) =>
        prev.map((p) =>
          (p._id === productObj._id || p.productId === productObj.productId) ? { ...p, inStock: productObj.inStock !== false } : p
        )
      );
      setErrorMessage(`Error updating stock status: ${err.message}`);
    }
  };

  // Fetch Orders & Metrics from Backend (JWT Protected)
  const fetchOrdersAndMetrics = useCallback(async () => {
    try {
      setFetchingOrders(true);
      setErrorMessage('');

      let url = getApiUrl('/orders');
      const params = new URLSearchParams();
      const cleanSearch = searchQuery.trim();
      if (cleanSearch) {
        params.append('search', cleanSearch);
      }
      if (statusFilter !== 'All' && !cleanSearch.includes('@')) {
        params.append('status', statusFilter);
      }
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

  const fetchHandovers = useCallback(async () => {
    if (!accessToken) return;
    try {
      setFetchingHandovers(true);
      let url = getApiUrl('/delivery-handover');
      const params = new URLSearchParams();
      if (handoverStatusFilter && handoverStatusFilter !== 'All') {
        params.append('status', handoverStatusFilter);
      }
      if (handoverSearch && handoverSearch.trim()) {
        params.append('search', handoverSearch.trim());
      }
      if (handoverDateFilter && handoverDateFilter.trim()) {
        params.append('date', handoverDateFilter.trim());
      }
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data && data.success) {
        setHandovers(data.handovers || []);
      } else {
        console.error('Failed to fetch handovers:', data?.message);
      }
    } catch (err) {
      console.error('Error fetching handovers:', err);
    } finally {
      setFetchingHandovers(false);
    }
  }, [accessToken, handoverStatusFilter, handoverSearch, handoverDateFilter]);

  const handleSelectOrderForHandover = useCallback(async (rawId) => {
    const cleanId = (rawId || '').toString().trim().replace(/^#/, '');
    setHandoverOrderIdInput(rawId);
    setSelectedOrderFetchError('');

    if (!cleanId) {
      setSelectedOrderForHandover(null);
      return;
    }

    // 1. Check in existing orders array first
    const foundInState = orders.find(
      (o) => o.orderId?.toUpperCase() === cleanId.toUpperCase() || o._id === cleanId
    );

    if (foundInState) {
      setSelectedOrderForHandover(foundInState);
      return;
    }

    // 2. Fetch live from existing Order GET API: /api/orders/:id
    try {
      setFetchingSelectedOrderDetails(true);
      const res = await fetch(getApiUrl(`/orders/${encodeURIComponent(cleanId)}`), {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data && data.success && data.order) {
        setSelectedOrderForHandover(data.order);
      } else {
        setSelectedOrderForHandover(null);
        setSelectedOrderFetchError(data?.message || `Order #${cleanId} not found in database.`);
      }
    } catch (err) {
      setSelectedOrderForHandover(null);
      setSelectedOrderFetchError(`Error fetching order: ${err.message}`);
    } finally {
      setFetchingSelectedOrderDetails(false);
    }
  }, [orders, accessToken]);

  useEffect(() => {
    if (isOpen && accessToken) {
      if (activeTab === 'orders') {
        fetchOrdersAndMetrics();
      } else if (activeTab === 'inquiries') {
        fetchInquiries();
      } else if (activeTab === 'products') {
        fetchProductsList();
      } else if (activeTab === 'deliveryHandover') {
        fetchHandovers();
        if (orders.length === 0) {
          fetchOrdersAndMetrics();
        }
      }
    }
  }, [isOpen, accessToken, activeTab, fetchOrdersAndMetrics, fetchInquiries, fetchProductsList, fetchHandovers, orders.length]);

  const handleMarkProductHandedOver = async (e) => {
    if (e) e.preventDefault();
    const targetOrderId = (handoverOrderIdInput || selectedOrderForHandover?.orderId || '').trim();
    if (!targetOrderId) {
      setHandoverFormError('Please select or enter an Order ID.');
      return;
    }
    if (!handoverDeliveryBoyName.trim()) {
      setHandoverFormError('Please enter Delivery Boy Name.');
      return;
    }
    if (!handoverDeliveryBoyPhone.trim()) {
      setHandoverFormError('Please enter Delivery Boy Mobile Number.');
      return;
    }

    try {
      setHandoverSubmitting(true);
      setHandoverFormError('');
      setHandoverFormSuccess(null);

      const payload = {
        orderId: targetOrderId,
        deliveryBoyName: handoverDeliveryBoyName.trim(),
        deliveryBoyPhone: handoverDeliveryBoyPhone.trim(),
        deliveryBoyReceived: handoverDeliveryBoyReceived,
        handoverStatus: handoverStatusInput,
        notes: handoverNotesInput.trim(),
        otpCode: handoverOtpInput.trim(),
        allowUpdate: allowUpdateHandover,
      };

      const res = await fetch(getApiUrl('/delivery-handover'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data && data.success) {
        setHandoverFormSuccess({
          message: 'Product successfully handed over to delivery boy.',
          orderId: data.orderId,
          deliveryBoy: data.deliveryBoy,
          date: data.date,
          time: data.time,
          otpVerified: data.otpVerified,
        });
        setHandoverOtpInput('');
        setHandoverNotesInput('');
        setAllowUpdateHandover(false);
        fetchHandovers();
        fetchOrdersAndMetrics();
      } else {
        setHandoverFormSuccess(null);
        setHandoverFormError(data?.message || 'Failed to record delivery handover.');
      }
    } catch (err) {
      setHandoverFormSuccess(null);
      setHandoverFormError(`Error recording handover: ${err.message}`);
    } finally {
      setHandoverSubmitting(false);
    }
  };

  const handleViewHandoverDetails = async (id) => {
    try {
      const res = await fetch(getApiUrl(`/delivery-handover/${id}`), {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data && data.success) {
        setSelectedHandoverDetail(data);
        setHandoverModalOpen(true);
      } else {
        alert(data?.message || 'Handover record details not found.');
      }
    } catch (err) {
      alert(`Error fetching details: ${err.message}`);
    }
  };

  // Handle Order Status, Payment Status, & Delivery Time Update
  const handleUpdateOrderStatus = async (orderId, newOrderStatus, newPaymentStatus, newEstimatedDeliveryTime, newExpectedDeliveryDate) => {
    try {
      setErrorMessage('');
      const payload = {};
      if (newOrderStatus) payload.orderStatus = newOrderStatus;
      if (newPaymentStatus) payload.paymentStatus = newPaymentStatus;
      if (newEstimatedDeliveryTime !== undefined) payload.estimatedDeliveryTime = newEstimatedDeliveryTime;
      if (newExpectedDeliveryDate !== undefined) payload.expectedDeliveryDate = newExpectedDeliveryDate;

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
        setSuccessMessage(`Order #${orderId} updated successfully`);
        setTimeout(() => setSuccessMessage(''), 3000);

        // Update local modal state if selected
        if (selectedAdminOrder && selectedAdminOrder.orderId === orderId) {
          setSelectedAdminOrder(data.order);
        }
        if (whatsappModalOrder && whatsappModalOrder.orderId === orderId) {
          setWhatsappModalOrder(data.order);
        }

        fetchOrdersAndMetrics();
        return data.order;
      } else {
        setErrorMessage(data?.message || 'Failed to update order status.');
      }
    } catch (err) {
      console.error('Error updating order status:', err);
      setErrorMessage(`Error updating status: ${err.message}`);
    }
    return null;
  };

  // WhatsApp Modal Open & Input Change Handlers
  const handleOpenWhatsAppModal = (ord) => {
    if (!ord) return;
    const suggestedTime = ord.estimatedDeliveryTime || getSuggestedDeliveryTime(ord.deliveryDistance);
    const next7 = getNext7Days();
    const defaultDate = next7[0]?.value || 'Today';
    const suggestedDate = ord.expectedDeliveryDate || (suggestedTime === 'Tomorrow' ? (next7[1]?.value || 'Tomorrow') : defaultDate);

    const stdTimes = ['1–2 hours', '2–3 hours', '3–5 hours', '5–8 hours', 'Tomorrow'];
    const isCustomT = Boolean(ord.estimatedDeliveryTime && !stdTimes.includes(ord.estimatedDeliveryTime));

    const isNext7Date = next7.some(d => d.value === ord.expectedDeliveryDate);
    const isCustomD = Boolean(ord.expectedDeliveryDate && !isNext7Date && ord.expectedDeliveryDate !== 'Today' && ord.expectedDeliveryDate !== 'Tomorrow');

    const finalTimeSel = isCustomT ? 'Custom Time' : (stdTimes.includes(suggestedTime) ? suggestedTime : '2–3 hours');
    const finalTimeVal = isCustomT ? ord.estimatedDeliveryTime : (stdTimes.includes(suggestedTime) ? suggestedTime : '2–3 hours');

    const finalDateSel = isCustomD ? 'Custom Date' : suggestedDate;
    const finalDateVal = isCustomD ? ord.expectedDeliveryDate : suggestedDate;

    setWhatsappModalOrder(ord);
    setWhatsappDeliveryTime(finalTimeSel);
    setWhatsappCustomTime(isCustomT ? ord.estimatedDeliveryTime : '');
    setWhatsappDeliveryDate(finalDateSel);
    setWhatsappCustomDate(isCustomD ? ord.expectedDeliveryDate : '');

    const initialMsg = generateWhatsAppMessage(ord, finalTimeVal, finalDateVal, whatsappLanguage);
    setWhatsappMessageText(initialMsg);
  };

  const handleLanguageChange = (lang) => {
    setWhatsappLanguage(lang);
    if (whatsappModalOrder) {
      const timeVal = whatsappDeliveryTime === 'Custom Time' ? whatsappCustomTime : whatsappDeliveryTime;
      const dateVal = whatsappDeliveryDate === 'Custom Date' ? whatsappCustomDate : whatsappDeliveryDate;
      const msg = generateWhatsAppMessage(whatsappModalOrder, timeVal, dateVal, lang);
      setWhatsappMessageText(msg);
    }
  };

  const handleDeliveryTimeChangeInModal = (newTimeSel, customTVal = whatsappCustomTime) => {
    setWhatsappDeliveryTime(newTimeSel);
    const timeVal = newTimeSel === 'Custom Time' ? customTVal : newTimeSel;
    const dateVal = whatsappDeliveryDate === 'Custom Date' ? whatsappCustomDate : whatsappDeliveryDate;

    if (whatsappModalOrder) {
      const updatedMsg = generateWhatsAppMessage(whatsappModalOrder, timeVal, dateVal, whatsappLanguage);
      setWhatsappMessageText(updatedMsg);
    }
  };

  const handleDeliveryDateChangeInModal = (newDateSel, customDVal = whatsappCustomDate) => {
    setWhatsappDeliveryDate(newDateSel);
    const timeVal = whatsappDeliveryTime === 'Custom Time' ? whatsappCustomTime : whatsappDeliveryTime;
    const dateVal = newDateSel === 'Custom Date' ? customDVal : newDateSel;

    if (whatsappModalOrder) {
      const updatedMsg = generateWhatsAppMessage(whatsappModalOrder, timeVal, dateVal, whatsappLanguage);
      setWhatsappMessageText(updatedMsg);
    }
  };

  const handleSaveDeliveryDetails = async () => {
    if (!whatsappModalOrder) return;
    setIsSavingDelivery(true);
    const finalTime = whatsappDeliveryTime === 'Custom Time' ? whatsappCustomTime : whatsappDeliveryTime;
    const finalDate = whatsappDeliveryDate === 'Custom Date' ? whatsappCustomDate : whatsappDeliveryDate;

    const updatedOrder = await handleUpdateOrderStatus(
      whatsappModalOrder.orderId,
      null,
      null,
      finalTime,
      finalDate
    );

    if (updatedOrder) {
      setWhatsappModalOrder(updatedOrder);
      const msg = generateWhatsAppMessage(updatedOrder, finalTime, finalDate, whatsappLanguage);
      setWhatsappMessageText(msg);
    }
    setIsSavingDelivery(false);
  };

  const handleSendWhatsApp = () => {
    if (!whatsappModalOrder) return;
    const phone = formatPhoneForWhatsApp(whatsappModalOrder.customer?.phone);
    const encoded = encodeURIComponent(whatsappMessageText);
    const url = `https://wa.me/${phone}?text=${encoded}`;
    window.open(url, '_blank');
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

            {/* ADMIN-ONLY: Stock Control Tab */}
            <button
              onClick={() => setActiveTab('products')}
              className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all border ${
                activeTab === 'products'
                  ? 'bg-red-600 text-white border-red-500 shadow-md'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Stock Control</span>
              {productsList.length > 0 && (
                <span className="bg-zinc-950 text-red-300 px-2 py-0.5 rounded-full font-mono text-[10px]">
                  {productsList.filter(p => p.inStock === false).length > 0
                    ? `${productsList.filter(p => p.inStock === false).length} OOS`
                    : productsList.length
                  }
                </span>
              )}
            </button>

          </div>

          <button
            onClick={() => window.location.reload()}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${(fetchingOrders || fetchingInquiries || fetchingProductsList) ? 'animate-spin text-amber-400' : ''}`} /> Refresh
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
              
              {/* Sales Report Section */}
              {metrics && (
                <div className="space-y-3 bg-zinc-950/80 border border-zinc-800 p-4 sm:p-5 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <h4 className="text-sm font-extrabold text-white tracking-wider uppercase flex items-center gap-2">
                        Sales Report
                      </h4>
                    </div>
                    <span className="text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-400 px-2.5 py-1 rounded-full font-mono font-medium">
                      Live Database Data
                    </span>
                  </div>

                  {/* 4 Core Sales Report Metrics */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* 1. Today's Sales */}
                    <div className="p-4 bg-zinc-900/90 border border-amber-500/30 rounded-xl space-y-1.5 shadow-md hover:border-amber-500/60 transition-all group">
                      <div className="flex items-center justify-between text-zinc-400">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400">Today's Sales</span>
                        <button
                          type="button"
                          onClick={() => {
                            if (onClose) onClose();
                            navigate('/admin/reports/daily');
                          }}
                          className="p-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30 transition-all cursor-pointer flex items-center gap-1 shrink-0"
                          title="Click to view Daily Sales Report page"
                        >
                          <Calendar className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        </button>
                      </div>
                      <div className="text-2xl font-mono font-black text-amber-400">
                        ₹{(metrics.todaySales || 0).toLocaleString('en-IN')}
                      </div>
                      <p className="text-[10px] text-zinc-500 flex items-center justify-between">
                        <span>Orders placed today</span>
                        <span
                          onClick={() => {
                            if (onClose) onClose();
                            navigate('/admin/reports/daily');
                          }}
                          className="text-amber-400 font-bold hover:underline cursor-pointer"
                        >
                          Daily Report →
                        </span>
                      </p>
                    </div>

                    {/* 2. This Month's Sales */}
                    <div className="p-4 bg-zinc-900/90 border border-emerald-500/30 rounded-xl space-y-1.5 shadow-md hover:border-emerald-500/60 transition-all group">
                      <div className="flex items-center justify-between text-zinc-400">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400">This Month's Sales</span>
                        <button
                          type="button"
                          onClick={() => {
                            if (onClose) onClose();
                            navigate('/admin/reports/monthly');
                          }}
                          className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30 transition-all cursor-pointer flex items-center gap-1 shrink-0"
                          title="Click to view Monthly Sales Report page"
                        >
                          <DollarSign className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        </button>
                      </div>
                      <div className="text-2xl font-mono font-black text-emerald-400">
                        ₹{(metrics.monthSales || 0).toLocaleString('en-IN')}
                      </div>
                      <p className="text-[10px] text-zinc-500 flex items-center justify-between">
                        <span>Orders placed this month</span>
                        <span
                          onClick={() => {
                            if (onClose) onClose();
                            navigate('/admin/reports/monthly');
                          }}
                          className="text-emerald-400 font-bold hover:underline cursor-pointer"
                        >
                          Monthly Report →
                        </span>
                      </p>
                    </div>

                    {/* 3. Total Orders */}
                    <div className="p-4 bg-zinc-900/90 border border-zinc-800 rounded-xl space-y-1.5 shadow-md hover:border-zinc-700 transition-all group">
                      <div className="flex items-center justify-between text-zinc-400">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-200">Total Orders</span>
                        <button
                          type="button"
                          onClick={() => {
                            if (onClose) onClose();
                            navigate('/admin/reports/orders');
                          }}
                          className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg border border-zinc-700 transition-all cursor-pointer flex items-center gap-1 shrink-0"
                          title="Click to view Detailed Orders Report page"
                        >
                          <Package className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        </button>
                      </div>
                      <div className="text-2xl font-mono font-black text-white">
                        {metrics.totalOrders || 0}
                      </div>
                      <p className="text-[10px] text-zinc-500 flex items-center justify-between">
                        <span>Total orders in DB</span>
                        <span
                          onClick={() => {
                            if (onClose) onClose();
                            navigate('/admin/reports/orders');
                          }}
                          className="text-zinc-300 font-bold hover:underline cursor-pointer"
                        >
                          Orders Report →
                        </span>
                      </p>
                    </div>

                    {/* 4. Delivered Orders */}
                    <div className="p-4 bg-zinc-900/90 border border-zinc-800 rounded-xl space-y-1.5 shadow-md">
                      <div className="flex items-center justify-between text-zinc-400">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-400">Delivered Orders</span>
                        <Truck className="w-4 h-4 text-blue-400" />
                      </div>
                      <div className="text-2xl font-mono font-black text-blue-400">
                        {metrics.deliveredOrders || 0}
                      </div>
                      <p className="text-[10px] text-zinc-500">Orders with Delivered status</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Search & Status Filter Controls */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-950/60 p-4 border border-zinc-800 rounded-2xl">
                
                {/* Search Bar & Right-Side Search Button */}
                <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={searchInputVal}
                      onChange={(e) => setSearchInputVal(e.target.value)}
                      placeholder="Search customer by Gmail (e.g. customer@gmail.com)..."
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-4 pr-10 py-2 text-xs text-white focus:outline-none focus:border-amber-400 transition-colors"
                    />
                    {(searchInputVal || searchQuery) && (
                      <button
                        type="button"
                        onClick={handleClearSearch}
                        className="absolute right-3 top-2.5 text-zinc-400 hover:text-white p-0.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 transition-all"
                        title="Clear Search"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs rounded-xl transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5 shrink-0"
                    title="Search MongoDB Orders by Gmail"
                  >
                    <Search className="w-3.5 h-3.5 text-zinc-950" />
                    <span>Search</span>
                  </button>
                </form>

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

                {/* Permanent Records Badge & Admin Delete Control Toggle */}
                <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800">
                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1.5 whitespace-nowrap">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Permanent Records Active</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAdminDeleteControls(!showAdminDeleteControls)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all flex items-center gap-1 whitespace-nowrap ${
                      showAdminDeleteControls
                        ? 'bg-red-500/20 text-red-300 border-red-500/50'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                    }`}
                    title="Toggle Admin Delete Action Controls"
                  >
                    <Trash2 className="w-3 h-3 text-red-400" />
                    <span>{showAdminDeleteControls ? 'Delete Mode: ON' : 'Delete Mode: OFF'}</span>
                  </button>
                </div>

              </div>

              {/* Gmail Customer Search Result Summary Banner */}
              {searchQuery.trim().includes('@') && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/40 rounded-2xl flex flex-wrap items-center justify-between gap-4 animate-fadeIn">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-400">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Customer Order Search Summary</div>
                      <div className="text-xs sm:text-sm font-extrabold text-white font-mono flex items-center gap-2">
                        <span>Customer Email: <span className="text-amber-400 font-bold">{searchQuery.trim()}</span></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-[10px] text-zinc-400 font-bold uppercase">Total Orders</div>
                      <div className="text-sm font-mono font-black text-amber-400">{orders.length}</div>
                    </div>
                    <div className="border-l border-zinc-800 h-8"></div>
                    <div className="text-right">
                      <div className="text-[10px] text-zinc-400 font-bold uppercase">Total Amount</div>
                      <div className="text-sm font-mono font-black text-emerald-400">
                        ₹{orders.reduce((sum, ord) => sum + getOrderPriceBreakdown(ord).grandTotal, 0).toLocaleString('en-IN')}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="ml-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-xl border border-zinc-700 flex items-center gap-1 transition-all"
                    >
                      <X className="w-3.5 h-3.5" /> Clear Search
                    </button>
                  </div>
                </div>
              )}

              {/* Orders List Container */}
              {fetchingOrders ? (
                <div className="py-16 text-center text-zinc-400 flex items-center justify-center gap-3">
                  <RefreshCw className="w-6 h-6 animate-spin text-amber-400" /> Fetching customer orders from MongoDB...
                </div>
              ) : orders.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <div className="text-zinc-400 text-sm font-bold">
                    {searchQuery.trim().includes('@')
                      ? 'No orders found for this Gmail.'
                      : 'No orders found for the selected search query or status filter.'}
                  </div>
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold text-xs rounded-xl shadow-md transition-all"
                    >
                      <X className="w-4 h-4" /> Clear Search Filter
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {/* DESKTOP TABLE VIEW (md:table) */}
                  <div className="hidden md:block border border-zinc-800 rounded-2xl overflow-hidden shadow-inner">
                    <table className="w-full text-left text-xs text-zinc-300">
                      <thead className="bg-zinc-950 text-zinc-400 uppercase font-bold border-b border-zinc-800">
                        <tr>
                          <th className="px-4 py-3.5">Order ID &amp; Time</th>
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
                          const { date: orderDate, time: orderTime } = formatOrderDateTime(ord.createdAt);
                          return (
                            <tr key={ord._id} className="hover:bg-zinc-800/40 transition-colors group">
                              <td className="px-4 py-3.5 font-mono whitespace-nowrap">
                                <div className="font-black text-amber-400 text-sm">#{ord.orderId}</div>
                                <div className="text-[10px] text-zinc-400 font-mono space-y-0.5 mt-1">
                                  <div className="text-zinc-300 font-bold flex items-center gap-1">
                                    <Calendar className="w-3 h-3 text-amber-400 shrink-0" /> {orderDate}
                                  </div>
                                  <div className="text-zinc-400 flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-amber-400 shrink-0" /> {orderTime}
                                  </div>
                                </div>
                              </td>

                              <td className="px-4 py-3.5 max-w-xs">
                                <div className="font-bold text-white text-sm">{ord.customer?.name}</div>
                                <div className="text-amber-400 font-semibold font-mono">+91 {ord.customer?.phone}</div>
                                {ord.customer?.email && (
                                  <div className="text-zinc-300 text-[11px] truncate flex items-center gap-1 font-mono my-0.5" title={`Email: ${ord.customer.email}`}>
                                    <Mail className="w-3 h-3 text-amber-400 shrink-0" />
                                    <span className="truncate">{ord.customer.email}</span>
                                  </div>
                                )}
                                {ord.customer?.landmark && (
                                  <div className="text-amber-300 text-[10px] truncate" title={`Landmark: ${ord.customer.landmark}`}>
                                    📍 {ord.customer.landmark}
                                  </div>
                                )}
                                <div className="text-zinc-400 text-[11px] truncate" title={`${ord.customer?.address}, ${ord.customer?.city}`}>
                                  {ord.customer?.city}, {ord.customer?.pincode}
                                </div>
                                {(() => {
                                  const coords = getOrderCoordinates(ord);
                                  if (coords) {
                                    return (
                                      <a
                                        href={`https://www.google.com/maps?q=${coords.lat},${coords.lng}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold hover:underline mt-0.5"
                                      >
                                        <MapPin className="w-3 h-3 text-emerald-400" />
                                        <span>Open in Google Maps</span>
                                      </a>
                                    );
                                  }
                                  return (
                                    <span className="text-[10px] text-zinc-500 block font-normal">Location not provided</span>
                                  );
                                })()}
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

                              {/* Price Breakdown & Distance Column */}
                              <td className="px-4 py-3.5 whitespace-nowrap">
                                <div className="space-y-0.5 text-xs font-mono">
                                  <div className="flex justify-between gap-3 text-zinc-400 text-[11px]">
                                    <span>Product Price:</span>
                                    <span className="font-semibold text-zinc-200">₹{subtotal}</span>
                                  </div>
                                  <div className="flex justify-between gap-3 text-zinc-400 text-[11px]">
                                    <span>Distance:</span>
                                    <span className="font-semibold text-amber-300">
                                      {ord.deliveryDistance ? `${ord.deliveryDistance} km` : 'Std'}
                                    </span>
                                  </div>
                                  <div className="flex justify-between gap-3 text-zinc-400 text-[11px]">
                                    <span>Est. Delivery:</span>
                                    <span className="font-semibold text-emerald-400">
                                      {ord.estimatedDeliveryTime || getSuggestedDeliveryTime(ord.deliveryDistance)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between gap-3 text-zinc-400 text-[11px]">
                                    <span>Delivery Charge:</span>
                                    <span className="font-semibold text-emerald-400">
                                      ₹{deliveryCharge}
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
                                <option value="Customer Reached">Customer Reached</option>
                                <option value="Delivered">Delivered</option>
                                <option value="Cancelled">Cancelled</option>
                              </select>
                            </td>

                            <td className="px-4 py-3.5 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                {ord.orderStatus !== 'Delivered' && ord.orderStatus !== 'Cancelled' && (
                                  <button
                                    onClick={() => handleMarkCustomerReachedInAdmin(ord.orderId)}
                                    disabled={otpVerifying}
                                    className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs rounded-lg transition-all flex items-center gap-1 shadow-md shadow-amber-500/20 disabled:opacity-50"
                                    title="Mark Customer Reached & Send Delivery OTP via SMS"
                                  >
                                    <MapPin className="w-3.5 h-3.5 text-zinc-950" />
                                    <span>{ord.orderStatus === 'Customer Reached' ? 'Resend OTP' : 'Customer Reached'}</span>
                                  </button>
                                )}
                                <button
                                  onClick={() => handleOpenWhatsAppModal(ord)}
                                  className="px-2.5 py-1.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-extrabold text-xs rounded-lg transition-all flex items-center gap-1 shadow-md shadow-emerald-600/20"
                                  title="Customer WhatsApp Order Update"
                                >
                                  <svg className="w-3.5 h-3.5 fill-current text-white" viewBox="0 0 24 24">
                                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l.261.417-1.152 4.208 4.309-1.129.325.171z" />
                                  </svg>
                                  <span>WhatsApp</span>
                                </button>
                                <button
                                  onClick={() => setSelectedAdminOrder(ord)}
                                  className="p-1.5 bg-amber-500/10 hover:bg-amber-500 hover:text-zinc-950 text-amber-400 rounded-lg transition-colors border border-amber-500/30"
                                  title="View Full Order Details"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                {showAdminDeleteControls && (
                                  <button
                                    onClick={() => handleDeleteOrder(ord)}
                                    className="p-1.5 bg-red-950/60 hover:bg-red-600 text-red-400 hover:text-white rounded-lg transition-colors border border-red-800"
                                    title="Delete Order"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
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
                      const { date: orderDate, time: orderTime } = formatOrderDateTime(ord.createdAt);
                      return (
                        <div
                          key={ord._id}
                          className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-3 shadow-md"
                        >
                          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                            <div>
                              <span className="font-mono font-black text-amber-400 text-base">#{ord.orderId}</span>
                              <div className="text-[10px] text-zinc-400 font-mono">
                                <span>{orderDate} • {orderTime}</span>
                              </div>
                            </div>
                            <span className="text-[10px] font-mono bg-zinc-900 border border-zinc-800 text-zinc-300 px-2 py-1 rounded-lg">
                              {ord.orderStatus}
                            </span>
                          </div>

                          <div className="space-y-1 text-xs">
                            <div className="font-extrabold text-white text-sm">{ord.customer?.name}</div>
                            <div className="text-amber-400 font-mono font-bold">+91 {ord.customer?.phone}</div>
                            {ord.customer?.email && (
                              <div className="text-zinc-300 text-xs flex items-center gap-1 font-mono">
                                <Mail className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                <span>{ord.customer.email}</span>
                              </div>
                            )}
                            {ord.customer?.landmark && (
                              <div className="text-amber-300 text-[11px]">📍 Landmark: {ord.customer.landmark}</div>
                            )}
                            <div className="text-zinc-400 text-[11px]">{ord.customer?.address}, {ord.customer?.city}</div>
                            {(() => {
                              const coords = getOrderCoordinates(ord);
                              if (coords) {
                                return (
                                  <a
                                    href={`https://www.google.com/maps?q=${coords.lat},${coords.lng}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-bold hover:underline pt-0.5"
                                  >
                                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>Open in Google Maps</span>
                                  </a>
                                );
                              }
                              return <span className="text-[10px] text-zinc-500 block font-normal">Location not provided</span>;
                            })()}
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
                              <span>Delivery Distance:</span>
                              <span className="text-amber-300 font-semibold">{ord.deliveryDistance ? `${ord.deliveryDistance} km` : 'Std'}</span>
                            </div>
                            <div className="flex justify-between text-zinc-400">
                              <span>Est. Delivery:</span>
                              <span className="text-emerald-400 font-semibold">{ord.estimatedDeliveryTime || getSuggestedDeliveryTime(ord.deliveryDistance)}</span>
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
                              <option value="Customer Reached">Customer Reached</option>
                              <option value="Delivered">Delivered</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          </div>

                        {/* Action buttons */}
                        <div className="pt-2 border-t border-zinc-800/80 flex flex-wrap items-center gap-2">
                          {ord.orderStatus !== 'Delivered' && ord.orderStatus !== 'Cancelled' && (
                            <button
                              onClick={() => handleMarkCustomerReachedInAdmin(ord.orderId)}
                              disabled={otpVerifying}
                              className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 disabled:opacity-50"
                            >
                              <MapPin className="w-4 h-4 text-zinc-950" />
                              <span>{ord.orderStatus === 'Customer Reached' ? 'Resend OTP' : 'Customer Reached'}</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenWhatsAppModal(ord)}
                            className="flex-1 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all"
                          >
                            <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24">
                              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l.261.417-1.152 4.208 4.309-1.129.325.171z" />
                            </svg>
                            <span>WhatsApp</span>
                          </button>
                          <button
                            onClick={() => setSelectedAdminOrder(ord)}
                            className="flex-1 py-2 bg-amber-500/10 hover:bg-amber-500 hover:text-zinc-950 text-amber-400 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 border border-amber-500/30 transition-colors"
                          >
                            <Eye className="w-4 h-4" /> View Details
                          </button>
                          {showAdminDeleteControls && (
                            <button
                              onClick={() => handleDeleteOrder(ord)}
                              className="p-2 bg-red-950/40 hover:bg-red-600 text-red-400 hover:text-white font-bold text-xs rounded-xl flex items-center justify-center border border-red-800/50 transition-colors"
                              title="Delete Order"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
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

          {/* TAB 3: ADMIN PRODUCT MANAGEMENT & ADD PRODUCT SYSTEM */}
          {activeTab === 'products' && (
            <div className="animate-fadeIn">
              <ProductManagement />
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
                  onClick={() => {
                    const cur = selectedAdminOrder;
                    setSelectedAdminOrder(null);
                    handleOpenWhatsAppModal(cur);
                  }}
                  className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-md transition-colors"
                  title="Open WhatsApp Message Preview"
                >
                  <svg className="w-3.5 h-3.5 fill-current text-white" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l.261.417-1.152 4.208 4.309-1.129.325.171z" />
                  </svg>
                  <span>WhatsApp</span>
                </button>
                {showAdminDeleteControls && (
                  <button
                    onClick={() => handleDeleteOrder(selectedAdminOrder)}
                    className="px-3 py-1.5 bg-red-950/60 hover:bg-red-600 border border-red-800 text-red-300 hover:text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
                    title="Delete Order"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete Order
                  </button>
                )}
                <button
                  onClick={() => setSelectedAdminOrder(null)}
                  className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs">

              {/* Actual Order Creation Date & Time Card */}
              {(() => {
                const { date, time } = formatOrderDateTime(selectedAdminOrder.createdAt);
                return (
                  <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Actual Order Creation Date &amp; Time</div>
                        <div className="text-xs sm:text-sm font-extrabold text-white font-mono flex items-center gap-2">
                          <span>Date: <strong className="text-amber-400">{date}</strong></span>
                          <span>Time: <strong className="text-amber-400">{time}</strong></span>
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-400 px-2.5 py-1 rounded-full font-mono font-bold">
                      IST (Asia/Kolkata)
                    </span>
                  </div>
                );
              })()}

              {/* Status Update Control */}
              <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4 flex-wrap">
                  <div>
                    <span className="text-zinc-400 block text-[11px]">Order Status:</span>
                    <span className="text-amber-400 font-extrabold text-sm">{selectedAdminOrder.orderStatus}</span>
                  </div>
                  <div className="border-l border-zinc-800 pl-4">
                    <span className="text-zinc-400 block text-[11px]">Payment Method &amp; Status:</span>
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
                      <option value="Packed">Packed</option>
                      <option value="Out for Delivery">Out for Delivery</option>
                      <option value="Customer Reached">Customer Reached</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Order Status Timeline Card */}
              <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-3">
                <h5 className="font-extrabold text-amber-400 uppercase text-xs flex items-center gap-1.5 border-b border-zinc-800 pb-2">
                  <Clock className="w-4 h-4 text-amber-400" /> Order Status Timeline
                </h5>
                <div className="space-y-2">
                  {selectedAdminOrder.createdAt && (() => {
                    const { date, time } = formatOrderDateTime(selectedAdminOrder.createdAt);
                    return (
                      <div className="flex items-center justify-between bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800">
                        <span className="text-zinc-300 font-bold text-xs flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" /> Order Placed
                        </span>
                        <span className="text-amber-400 font-mono text-[11px] font-semibold">{date} at {time}</span>
                      </div>
                    );
                  })()}

                  {selectedAdminOrder.updatedAt && selectedAdminOrder.updatedAt !== selectedAdminOrder.createdAt && (() => {
                    const { date, time } = formatOrderDateTime(selectedAdminOrder.updatedAt);
                    return (
                      <div className="flex items-center justify-between bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800">
                        <span className="text-zinc-300 font-bold text-xs flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" /> Status Updated ({selectedAdminOrder.orderStatus})
                        </span>
                        <span className="text-zinc-400 font-mono text-[11px]">{date} at {time}</span>
                      </div>
                    );
                  })()}

                  {selectedAdminOrder.otpVerifiedAt && (() => {
                    const { date, time } = formatOrderDateTime(selectedAdminOrder.otpVerifiedAt);
                    return (
                      <div className="flex items-center justify-between bg-zinc-900/60 p-2.5 rounded-xl border border-emerald-800/50">
                        <span className="text-emerald-400 font-bold text-xs flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Delivery OTP Verified
                        </span>
                        <span className="text-emerald-400 font-mono text-[11px]">{date} at {time}</span>
                      </div>
                    );
                  })()}

                  {selectedAdminOrder.deliveryCompletedAt && (() => {
                    const { date, time } = formatOrderDateTime(selectedAdminOrder.deliveryCompletedAt);
                    return (
                      <div className="flex items-center justify-between bg-zinc-900/60 p-2.5 rounded-xl border border-emerald-800/50">
                        <span className="text-emerald-400 font-bold text-xs flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5 text-emerald-400" /> Order Delivered
                        </span>
                        <span className="text-emerald-400 font-mono text-[11px]">{date} at {time}</span>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Delivery OTP Verification Card */}
              <div className="p-4 bg-zinc-950 border border-amber-500/40 rounded-2xl space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2 border-b border-zinc-800 pb-2">
                  <h5 className="font-extrabold text-amber-400 uppercase text-xs flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-400" /> Delivery OTP Verification
                  </h5>
                  {selectedAdminOrder.otpVerified ? (
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> OTP Verified &amp; Delivered
                    </span>
                  ) : (
                    <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                      OTP Pending Verification
                    </span>
                  )}
                </div>

                {otpSuccess && (
                  <div className="p-2.5 bg-emerald-950/70 border border-emerald-800/80 rounded-xl text-emerald-300 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> {otpSuccess}
                  </div>
                )}

                {otpError && (
                  <div className="p-2.5 bg-red-950/70 border border-red-800/80 rounded-xl text-red-300 text-xs font-semibold flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-400 shrink-0" /> {otpError}
                  </div>
                )}

                {!selectedAdminOrder.otpVerified && selectedAdminOrder.orderStatus !== 'Delivered' ? (
                  <div className="space-y-3 pt-1">
                    {selectedAdminOrder.orderStatus !== 'Customer Reached' ? (
                      <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2">
                        <p className="text-[11px] text-zinc-400 leading-snug">
                          Click the <strong>Customer Reached</strong> (📍) action button in the Orders &amp; Sales table to generate and send the 6-digit Delivery OTP to the customer via SMS.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-[11px] text-amber-300 flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>Customer Reached! Delivery OTP has been sent via SMS to customer (<strong className="text-white font-mono">+91 {selectedAdminOrder.customer?.phone}</strong>). Ask customer for OTP.</span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <input
                            type="text"
                            maxLength="6"
                            value={otpInputVal}
                            onChange={(e) => setOtpInputVal(e.target.value.replace(/\D/g, ''))}
                            placeholder="Enter 6-digit OTP"
                            className="bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2 text-white font-mono font-bold text-sm focus:outline-none focus:border-amber-400 w-36 text-center"
                          />
                          <button
                            type="button"
                            onClick={() => handleVerifyDeliveryOtpInAdmin(selectedAdminOrder.orderId, otpInputVal)}
                            disabled={otpVerifying || !otpInputVal || otpInputVal.length < 4}
                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-zinc-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-1.5"
                          >
                            {otpVerifying ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                            <span>Verify OTP</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleResendDeliveryOtpInAdmin(selectedAdminOrder.orderId)}
                            disabled={otpVerifying}
                            className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs rounded-xl transition-all border border-zinc-700 flex items-center gap-1"
                          >
                            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                            <span>Resend SMS</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Delivery verified and completed safely on {selectedAdminOrder.otpVerifiedAt ? new Date(selectedAdminOrder.otpVerifiedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'recently'}.</span>
                  </div>
                )}
              </div>

              {/* Customer & Address Details */}
              <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-3">
                <h5 className="font-extrabold text-amber-400 uppercase border-b border-zinc-800 pb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-red-500" /> Customer Information &amp; Delivery Address
                  </span>
                </h5>

                <div className="space-y-1">
                  <div className="text-white font-extrabold text-sm">{selectedAdminOrder.customer?.name}</div>
                  <div className="text-amber-400 font-mono font-bold">+91 {selectedAdminOrder.customer?.phone}</div>
                  {selectedAdminOrder.customer?.email && (
                    <div className="text-zinc-200 font-mono text-xs flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 p-2 rounded-xl">
                      <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>{selectedAdminOrder.customer.email}</span>
                    </div>
                  )}
                </div>

                <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl space-y-1 text-xs">
                  <div className="font-bold text-zinc-200">Delivery Address:</div>
                  <div className="text-zinc-300 leading-relaxed">
                    {selectedAdminOrder.customer?.address}
                  </div>
                  {selectedAdminOrder.customer?.landmark && (
                    <div className="text-amber-300 font-semibold pt-0.5">
                      📍 Landmark: <strong className="text-white">{selectedAdminOrder.customer.landmark}</strong>
                    </div>
                  )}
                  <div className="text-zinc-400 text-[11px] pt-0.5">
                    {selectedAdminOrder.customer?.city}, {selectedAdminOrder.customer?.state} - <span className="font-mono font-bold text-amber-400">{selectedAdminOrder.customer?.pincode}</span>
                  </div>
                </div>

                {/* GPS Location & Google Maps Link */}
                {(() => {
                  const coords = getOrderCoordinates(selectedAdminOrder);
                  if (coords) {
                    const mapsUrl = `https://www.google.com/maps?q=${coords.lat},${coords.lng}`;
                    return (
                      <div className="p-3.5 bg-emerald-950/60 border border-emerald-800/80 rounded-xl space-y-2.5">
                        <div className="text-xs text-emerald-300 font-extrabold flex items-center gap-1.5 border-b border-emerald-800/50 pb-1.5">
                          <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>📍 Customer Location</span>
                        </div>
                        <div className="text-xs text-zinc-300 font-mono space-y-0.5 pl-1">
                          <div>Latitude: <strong className="text-amber-400">{coords.lat}</strong></div>
                          <div>Longitude: <strong className="text-amber-400">{coords.lng}</strong></div>
                        </div>
                        <div className="pt-1">
                          <a
                            href={mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md"
                          >
                            <MapPin className="w-4 h-4" />
                            <span>Open Customer Location</span>
                          </a>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-xl text-zinc-500 text-xs flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-zinc-600" />
                      <span>Location not provided</span>
                    </div>
                  );
                })()}
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

              {/* Delivery Time & Distance Information Section */}
              <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h5 className="font-extrabold text-amber-400 uppercase flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-amber-400" /> Delivery Distance &amp; Time
                  </h5>
                  <span className="text-[11px] font-mono bg-amber-500/10 border border-amber-500/30 text-amber-300 px-2.5 py-0.5 rounded-full font-bold">
                    Distance: {selectedAdminOrder.deliveryDistance ? `${selectedAdminOrder.deliveryDistance} KM` : 'Local / Std'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-zinc-400 block text-[11px] font-bold mb-1">Estimated Delivery Time:</label>
                    <select
                      value={selectedAdminOrder.estimatedDeliveryTime || getSuggestedDeliveryTime(selectedAdminOrder.deliveryDistance)}
                      onChange={(e) => handleUpdateOrderStatus(selectedAdminOrder.orderId, null, null, e.target.value, null)}
                      className="w-full bg-zinc-900 border border-amber-500/50 text-amber-300 font-bold text-xs rounded-xl px-3 py-1.5 focus:outline-none"
                    >
                      <option value="1–2 hours">1–2 hours (0–5 km)</option>
                      <option value="2–3 hours">2–3 hours (5–10 km)</option>
                      <option value="3–5 hours">3–5 hours (10–20 km)</option>
                      <option value="5–8 hours">5–8 hours (20+ km)</option>
                      <option value="Tomorrow">Tomorrow</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-zinc-400 block text-[11px] font-bold mb-1">Expected Delivery Date:</label>
                    <select
                      value={selectedAdminOrder.expectedDeliveryDate || (getNext7Days()[0]?.value || 'Today')}
                      onChange={(e) => handleUpdateOrderStatus(selectedAdminOrder.orderId, null, null, null, e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 text-white font-bold text-xs rounded-xl px-3 py-1.5 focus:outline-none"
                    >
                      {getNext7Days().map((d) => (
                        <option key={d.index} value={d.value}>
                          {d.labelEng}
                        </option>
                      ))}
                      <option value="Custom Date">Custom Date (Enter manually)</option>
                    </select>
                  </div>
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
                    {(selectedAdminOrder.transactionId || selectedAdminOrder.razorpayOrderId) && (
                      <div className="flex justify-between text-zinc-400 text-xs font-mono">
                        <span>Txn / Payment Ref:</span>
                        <span className="text-amber-400 font-bold">{selectedAdminOrder.transactionId || selectedAdminOrder.razorpayOrderId}</span>
                      </div>
                    )}
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

      {/* ─── WHATSAPP ORDER MESSAGE PREVIEW & EDITOR MODAL ────────────────── */}
      {whatsappModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-zinc-900 border border-emerald-500/30 rounded-3xl shadow-2xl overflow-hidden text-zinc-100 flex flex-col max-h-[92vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-400">
                  <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l.261.417-1.152 4.208 4.309-1.129.325.171z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-white tracking-wide flex items-center gap-2">
                    CUSTOMER WHATSAPP UPDATE
                    <span className="text-amber-400 font-mono text-sm">#{whatsappModalOrder.orderId}</span>
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Customer: <strong className="text-white">{whatsappModalOrder.customer?.name}</strong> (+91 {whatsappModalOrder.customer?.phone})
                  </p>
                </div>
              </div>

              <button
                onClick={() => setWhatsappModalOrder(null)}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs">

              {/* WhatsApp Message Language Switcher Bar */}
              <div className="flex items-center justify-between bg-zinc-950 p-3 rounded-2xl border border-emerald-500/30">
                <div className="flex items-center gap-2">
                  <span className="text-zinc-200 font-extrabold text-xs uppercase tracking-wider">WhatsApp Language:</span>
                </div>
                <div className="bg-zinc-900 p-1 rounded-xl border border-zinc-800 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleLanguageChange('English')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      whatsappLanguage === 'English'
                        ? 'bg-emerald-500 text-zinc-950 shadow-md font-black'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLanguageChange('Hindi')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      whatsappLanguage === 'Hindi'
                        ? 'bg-emerald-500 text-zinc-950 shadow-md font-black'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Hindi (हिंदी)
                  </button>
                </div>
              </div>

              {/* Delivery Distance & Suggested Time Banner */}
              <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-amber-400" />
                    <span className="font-extrabold text-white text-xs uppercase tracking-wider">Delivery Distance &amp; Auto Suggestion</span>
                  </div>
                  <span className="bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-[11px] px-2.5 py-0.5 rounded-full font-bold">
                    Distance: {whatsappModalOrder.deliveryDistance ? `${whatsappModalOrder.deliveryDistance} KM` : 'Local / Standard'}
                  </span>
                </div>

                <div className="text-[11px] text-zinc-400 flex items-center gap-2 bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800">
                  <Clock className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>
                    Auto Suggested Delivery Time: <strong className="text-emerald-400 font-bold">{getSuggestedDeliveryTime(whatsappModalOrder.deliveryDistance)}</strong> (based on {whatsappModalOrder.deliveryDistance || 0} km rule)
                  </span>
                </div>

                {/* Delivery Controls Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  
                  {/* Estimated Delivery Time Options */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-zinc-300 block">Estimated Delivery Time:</label>
                    <select
                      value={whatsappDeliveryTime}
                      onChange={(e) => handleDeliveryTimeChangeInModal(e.target.value)}
                      className="w-full bg-zinc-900 border border-amber-500/60 text-amber-300 font-bold text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-amber-400"
                    >
                      <option value="1–2 hours">1–2 hours (0–5 km)</option>
                      <option value="2–3 hours">2–3 hours (5–10 km)</option>
                      <option value="3–5 hours">3–5 hours (10–20 km)</option>
                      <option value="5–8 hours">5–8 hours (20+ km)</option>
                      <option value="Tomorrow">Tomorrow</option>
                      <option value="Custom Time">Custom Time (Enter manually)</option>
                    </select>

                    {whatsappDeliveryTime === 'Custom Time' && (
                      <input
                        type="text"
                        value={whatsappCustomTime}
                        onChange={(e) => {
                          setWhatsappCustomTime(e.target.value);
                          handleDeliveryTimeChangeInModal('Custom Time', e.target.value);
                        }}
                        placeholder="e.g. 45 mins, Evening 6-8 PM..."
                        className="w-full bg-zinc-900 border border-zinc-700 text-white text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-amber-400 mt-1"
                      />
                    )}
                  </div>

                  {/* Expected Delivery Date Options (Next 7 Days) */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-zinc-300 block">Expected Delivery Date:</label>
                    <select
                      value={whatsappDeliveryDate}
                      onChange={(e) => handleDeliveryDateChangeInModal(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 text-white font-bold text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-amber-400"
                    >
                      {getNext7Days().map((d) => (
                        <option key={d.index} value={d.value}>
                          {d.labelEng}
                        </option>
                      ))}
                      <option value="Custom Date">Custom Date (Enter manually)</option>
                    </select>

                    {whatsappDeliveryDate === 'Custom Date' && (
                      <input
                        type="text"
                        value={whatsappCustomDate}
                        onChange={(e) => {
                          setWhatsappCustomDate(e.target.value);
                          handleDeliveryDateChangeInModal('Custom Date', e.target.value);
                        }}
                        placeholder="e.g. Sep 10, 2026 or 10/09/2026..."
                        className="w-full bg-zinc-900 border border-zinc-700 text-white text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-amber-400 mt-1"
                      />
                    )}
                  </div>

                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleSaveDeliveryDetails}
                    disabled={isSavingDelivery}
                    className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold text-xs rounded-xl transition-all shadow flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isSavingDelivery ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    <span>Confirm &amp; Save Delivery Time to Database</span>
                  </button>
                </div>
              </div>

              {/* Order Status & Payment Status Fast Selectors */}
              <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-between flex-wrap gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-zinc-400 font-bold text-[11px]">Order Status:</span>
                  <select
                    value={whatsappModalOrder.orderStatus}
                    onChange={(e) => {
                      const newStatus = e.target.value;
                      handleUpdateOrderStatus(whatsappModalOrder.orderId, newStatus, null).then((updated) => {
                        if (updated) {
                          const finalT = whatsappDeliveryTime === 'Custom Time' ? whatsappCustomTime : whatsappDeliveryTime;
                          const finalD = whatsappDeliveryDate === 'Custom Date' ? whatsappCustomDate : whatsappDeliveryDate;
                          setWhatsappMessageText(generateWhatsAppMessage(updated, finalT, finalD, whatsappLanguage));
                        }
                      });
                    }}
                    className="bg-zinc-900 border border-amber-500/50 text-amber-400 font-bold text-xs rounded-xl px-3 py-1 focus:outline-none"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-zinc-400 font-bold text-[11px]">Payment Status:</span>
                  <select
                    value={whatsappModalOrder.paymentStatus}
                    onChange={(e) => {
                      const newPayStatus = e.target.value;
                      handleUpdateOrderStatus(whatsappModalOrder.orderId, null, newPayStatus).then((updated) => {
                        if (updated) {
                          const finalT = whatsappDeliveryTime === 'Custom Time' ? whatsappCustomTime : whatsappDeliveryTime;
                          const finalD = whatsappDeliveryDate === 'Custom Date' ? whatsappCustomDate : whatsappDeliveryDate;
                          setWhatsappMessageText(generateWhatsAppMessage(updated, finalT, finalD, whatsappLanguage));
                        }
                      });
                    }}
                    className="bg-zinc-900 border border-zinc-700 text-white font-bold text-xs rounded-xl px-3 py-1 focus:outline-none"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Pending Verification">Pending Verification</option>
                    <option value="Paid">Paid</option>
                    <option value="Payment Failed">Payment Failed</option>
                  </select>
                </div>
              </div>

              {/* WhatsApp Message Preview & Live Editor */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                    <span>Preview &amp; Edit WhatsApp Message:</span>
                  </label>
                  <span className="text-[10px] text-zinc-400 italic">
                    Edit text directly below before sending
                  </span>
                </div>

                <textarea
                  rows={12}
                  value={whatsappMessageText}
                  onChange={(e) => setWhatsappMessageText(e.target.value)}
                  className="w-full bg-zinc-950 border border-emerald-500/40 rounded-2xl p-4 text-xs font-mono text-zinc-100 leading-relaxed focus:outline-none focus:border-emerald-400 shadow-inner"
                />
              </div>

              {/* Information Callout */}
              <div className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl text-[11px] text-zinc-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>
                  Clicking <strong>"Send on WhatsApp"</strong> opens WhatsApp Web/App with customer number <strong className="text-white">+91 {whatsappModalOrder.customer?.phone}</strong> and your edited message pre-filled. You manually press Send inside WhatsApp.
                </span>
              </div>

            </div>

            {/* Modal Actions Footer */}
            <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-950 flex items-center justify-end gap-3">
              <button
                onClick={() => setWhatsappModalOrder(null)}
                className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs rounded-xl transition-all border border-zinc-700"
              >
                Cancel
              </button>

              <button
                onClick={handleSendWhatsApp}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 active:scale-95 text-white font-extrabold text-xs rounded-xl transition-all shadow-lg shadow-emerald-600/30 flex items-center gap-2 border border-emerald-400"
              >
                <svg className="w-5 h-5 fill-current text-white" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l.261.417-1.152 4.208 4.309-1.129.325.171z" />
                </svg>
                <span>Send on WhatsApp</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ─── DELIVERY HANDOVER DETAILS & TIMELINE MODAL ────────────────── */}
      {handoverModalOpen && selectedHandoverDetail && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-zinc-900 border border-blue-500/40 rounded-3xl shadow-2xl overflow-hidden text-zinc-100 flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-500/20 border border-blue-500/40 rounded-xl text-blue-400">
                  <Truck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-white tracking-wider flex items-center gap-2">
                    DELIVERY HANDOVER DETAILS &amp; TIMELINE
                  </h3>
                  <p className="text-xs font-mono text-amber-400 font-bold">
                    Order #{selectedHandoverDetail.handover?.orderId}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setHandoverModalOpen(false);
                  setSelectedHandoverDetail(null);
                }}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              
              {/* Handover Primary Status Card */}
              <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-between flex-wrap gap-2">
                <div>
                  <div className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider">Handover Status</div>
                  <div className="text-base font-black text-blue-400 mt-0.5">
                    {selectedHandoverDetail.handover?.handoverStatus}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider">OTP Verification</div>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mt-1 border ${
                    selectedHandoverDetail.handover?.otpVerified || selectedHandoverDetail.handover?.otpVerificationStatus === 'OTP Verified'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}>
                    {selectedHandoverDetail.handover?.otpVerified || selectedHandoverDetail.handover?.otpVerificationStatus === 'OTP Verified'
                      ? '✓ OTP Verified'
                      : 'Pending OTP Verification'}
                  </span>
                </div>
              </div>

              {/* Handover Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* Customer Details */}
                <div className="p-4 bg-zinc-950/60 border border-zinc-800 rounded-2xl space-y-2">
                  <div className="text-xs font-extrabold text-amber-400 uppercase tracking-wider border-b border-zinc-800 pb-1 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-amber-400" /> Customer Information
                  </div>
                  <div className="text-sm font-bold text-white">{selectedHandoverDetail.handover?.customerName}</div>
                  <div className="text-xs text-zinc-300 font-mono">+91 {selectedHandoverDetail.handover?.customerPhone}</div>
                  {selectedHandoverDetail.order?.customer?.address && (
                    <div className="text-[11px] text-zinc-400 pt-1 border-t border-zinc-800/60">
                      Address: {selectedHandoverDetail.order.customer.address}, {selectedHandoverDetail.order.customer.city} - {selectedHandoverDetail.order.customer.pincode}
                    </div>
                  )}
                </div>

                {/* Delivery Boy Details */}
                <div className="p-4 bg-zinc-950/60 border border-zinc-800 rounded-2xl space-y-2">
                  <div className="text-xs font-extrabold text-blue-400 uppercase tracking-wider border-b border-zinc-800 pb-1 flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-blue-400" /> Delivery Boy Information
                  </div>
                  <div className="text-sm font-bold text-white">{selectedHandoverDetail.handover?.deliveryBoyName}</div>
                  <div className="text-xs text-zinc-300 font-mono">+91 {selectedHandoverDetail.handover?.deliveryBoyPhone}</div>
                  <div className="text-[11px] text-zinc-400 pt-1 border-t border-zinc-800/60 flex items-center justify-between">
                    <span>Product Received by Delivery Boy:</span>
                    <strong className="text-emerald-400">{selectedHandoverDetail.handover?.deliveryBoyReceived || 'Yes'}</strong>
                  </div>
                </div>

              </div>

              {/* Product & Payment Summary */}
              <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-2">
                <div className="text-xs font-extrabold text-zinc-200 uppercase tracking-wider border-b border-zinc-800 pb-1.5 flex items-center justify-between">
                  <span>Product &amp; Payment Summary</span>
                  <span className="font-mono text-amber-400 font-bold">Total: ₹{selectedHandoverDetail.handover?.totalAmount}</span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1">
                  <div>
                    <div className="font-bold text-white">{selectedHandoverDetail.handover?.productName}</div>
                    <div className="text-[11px] text-zinc-400">Quantity: {selectedHandoverDetail.handover?.productQuantity}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-zinc-200">{selectedHandoverDetail.handover?.paymentMethod}</div>
                    <div className="text-[11px] text-zinc-400">Status: {selectedHandoverDetail.handover?.paymentStatus}</div>
                  </div>
                </div>
              </div>

              {/* Server Timestamp & Admin Details */}
              <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-2">
                <div className="text-xs font-extrabold text-zinc-300 uppercase tracking-wider border-b border-zinc-800 pb-1.5 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-400" /> Server Timestamp &amp; Admin Info
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-zinc-400 block text-[10px]">Handover Date:</span> <strong className="text-white">{selectedHandoverDetail.handover?.handoverDate}</strong></div>
                  <div><span className="text-zinc-400 block text-[10px]">Handover Time:</span> <strong className="text-white">{selectedHandoverDetail.handover?.handoverTime}</strong></div>
                  <div><span className="text-zinc-400 block text-[10px]">Exact Server Timestamp:</span> <span className="font-mono text-zinc-300 text-[11px]">{new Date(selectedHandoverDetail.handover?.exactTimestamp || selectedHandoverDetail.handover?.createdAt).toLocaleString('en-IN')}</span></div>
                  <div><span className="text-zinc-400 block text-[10px]">Marked By User/Admin:</span> <strong className="text-amber-400">{selectedHandoverDetail.handover?.markedByAdmin || 'Admin'}</strong></div>
                </div>

                {selectedHandoverDetail.handover?.notes && (
                  <div className="pt-2 border-t border-zinc-800 text-[11px]">
                    <span className="text-zinc-400 font-bold block">Internal Handover Notes:</span>
                    <p className="text-zinc-200 bg-zinc-900 p-2 rounded-xl mt-1 italic">{selectedHandoverDetail.handover.notes}</p>
                  </div>
                )}
              </div>

              {/* History Timeline */}
              {Array.isArray(selectedHandoverDetail.timeline) && selectedHandoverDetail.timeline.length > 1 && (
                <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-3">
                  <div className="text-xs font-extrabold text-blue-400 uppercase tracking-wider border-b border-zinc-800 pb-1.5 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-blue-400" /> Complete Handover History Log ({selectedHandoverDetail.timeline.length} Events)
                  </div>
                  <div className="space-y-2 divide-y divide-zinc-800/50">
                    {selectedHandoverDetail.timeline.map((item, index) => (
                      <div key={item._id} className="pt-2 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-white">{item.handoverStatus}</div>
                          <div className="text-[11px] text-zinc-400">Delivery Boy: {item.deliveryBoyName} (+91 {item.deliveryBoyPhone})</div>
                        </div>
                        <div className="text-right">
                          <div className="text-zinc-300 font-mono">{item.handoverDate} {item.handoverTime}</div>
                          <div className="text-[10px] text-amber-400">By: {item.markedByAdmin}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-950 flex items-center justify-end">
              <button
                type="button"
                onClick={() => {
                  setHandoverModalOpen(false);
                  setSelectedHandoverDetail(null);
                }}
                className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs rounded-xl transition-all border border-zinc-700"
              >
                Close Details
              </button>
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
