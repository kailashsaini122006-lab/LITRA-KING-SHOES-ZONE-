import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { List, X, RefreshCw, ShieldCheck, Package, DollarSign, Truck, Clock, CheckCircle2, XCircle, Search, Eye, Filter, ArrowUpDown, Trash2, MapPin, AlertTriangle, TrendingUp, Calendar, UserCheck, Mail, SlidersHorizontal, FileText } from 'lucide-react';
import { getApiUrl } from '../config/api';
import ProductManagement from '../pages/ProductManagement';
import { SHOP_LOCATION, calculateHaversineDistance } from '../utils/deliveryUtils';

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
  const [showSalesReport, setShowSalesReport] = useState(false);
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [showControlPanelModal, setShowControlPanelModal] = useState(false);
  const [fetchingOrders, setFetchingOrders] = useState(false);
  const [statusFilter, setStatusFilter] = useState('New Order');
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

  // ── Combined Order & Payment Status Modal State ─────────────────────────────
  const [statusModalOrder, setStatusModalOrder] = useState(null);
  const [statusModalOrderStatus, setStatusModalOrderStatus] = useState('ORDER PENDING');
  const [statusModalDeliveryBoyStatus, setStatusModalDeliveryBoyStatus] = useState('DELIVERY BOY PENDING');
  const [statusModalPaymentStatus, setStatusModalPaymentStatus] = useState('COD • PENDING');
  const [statusModalPaymentDate, setStatusModalPaymentDate] = useState('');
  const [statusModalPaymentTime, setStatusModalPaymentTime] = useState('');
  const [statusModalError, setStatusModalError] = useState('');
  const [statusModalSaving, setStatusModalSaving] = useState(false);

  // ── Admin Delivery Send Modal State ─────────────────────────────────────────
  const [deliverySendOrder, setDeliverySendOrder] = useState(null);
  const [deliverySendBoyId, setDeliverySendBoyId] = useState('');
  const [deliverySendBoyName, setDeliverySendBoyName] = useState('');
  const [deliverySendBoyPhone, setDeliverySendBoyPhone] = useState('');
  const [deliverySendIsCustomBoy, setDeliverySendIsCustomBoy] = useState(false);
  const [deliverySendDate, setDeliverySendDate] = useState('');
  const [deliverySendTime, setDeliverySendTime] = useState('');
  const [deliverySendError, setDeliverySendError] = useState('');
  const [deliverySendSubmitting, setDeliverySendSubmitting] = useState(false);

  const presetDeliveryBoys = [
    { id: 'DB01', name: 'Ramesh Kumar', phone: '9876543210' },
    { id: 'DB02', name: 'Suresh Singh', phone: '9876543211' },
    { id: 'DB03', name: 'Vikram Sharma', phone: '9876543212' },
    { id: 'DB04', name: 'Rahul Verma', phone: '9876543213' },
  ];

  const allAvailableDeliveryBoys = [
    ...presetDeliveryBoys,
    ...Array.from(new Set((handovers || []).map((h) => h.deliveryBoyName)))
      .filter((name) => name && !presetDeliveryBoys.some((p) => p.name === name))
      .map((name, idx) => {
        const match = (handovers || []).find((h) => h.deliveryBoyName === name);
        return {
          id: `HO_${idx}`,
          name,
          phone: match?.deliveryBoyPhone || '',
        };
      }),
  ];

  const handleOpenDeliverySendModal = (ord) => {
    if (!ord) return;
    const currentOrd = orders.find((o) => o.orderId === ord.orderId || o._id === ord._id) || ord;
    setDeliverySendOrder(currentOrd);
    setDeliverySendError('');

    if (currentOrd.deliveryBoyName) {
      setDeliverySendBoyName(currentOrd.deliveryBoyName);
      setDeliverySendBoyPhone(currentOrd.deliveryBoyPhone || '');
      const match = allAvailableDeliveryBoys.find((b) => b.name === currentOrd.deliveryBoyName);
      setDeliverySendBoyId(match ? match.id : 'CUSTOM');
      setDeliverySendIsCustomBoy(!match);
    } else {
      const defaultBoy = presetDeliveryBoys[0];
      setDeliverySendBoyName(defaultBoy.name);
      setDeliverySendBoyPhone(defaultBoy.phone);
      setDeliverySendBoyId(defaultBoy.id);
      setDeliverySendIsCustomBoy(false);
    }

    const d = new Date();
    setDeliverySendDate(d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }));
    setDeliverySendTime(d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }));
  };

  const handleSaveDeliverySend = async () => {
    if (!deliverySendOrder) return;
    if (!deliverySendBoyName || !deliverySendBoyName.trim()) {
      setDeliverySendError('Please select or enter a Delivery Boy name.');
      return;
    }

    try {
      setDeliverySendSubmitting(true);
      setDeliverySendError('');
      const token = getAuthToken();

      const payload = {
        deliveryBoyId: deliverySendBoyId,
        deliveryBoyName: deliverySendBoyName.trim(),
        deliveryBoyPhone: deliverySendBoyPhone ? deliverySendBoyPhone.trim() : '',
        sendDate: deliverySendDate,
        sendTime: deliverySendTime,
      };

      const res = await fetch(getApiUrl(`/orders/${encodeURIComponent(deliverySendOrder.orderId)}/delivery-send`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data && data.success && data.order) {
        const updatedOrder = data.order;
        setSuccessMessage(`Order #${deliverySendOrder.orderId} package sent successfully to Delivery Boy ${updatedOrder.deliveryBoyName}!`);
        setTimeout(() => setSuccessMessage(''), 4000);

        setOrders((prev) => prev.map((o) => (o.orderId === updatedOrder.orderId || o._id === updatedOrder._id ? updatedOrder : o)));
        if (selectedAdminOrder && (selectedAdminOrder.orderId === updatedOrder.orderId || selectedAdminOrder._id === updatedOrder._id)) {
          setSelectedAdminOrder(updatedOrder);
        }

        setDeliverySendOrder(null);
        fetchOrdersAndMetrics();
      } else {
        setDeliverySendError(data?.message || 'Failed to send package to Delivery Boy.');
      }
    } catch (err) {
      console.error('Error in handleSaveDeliverySend:', err);
      setDeliverySendError(`Error sending to delivery boy: ${err.message}`);
    } finally {
      setDeliverySendSubmitting(false);
    }
  };


  const getAuthToken = () => {
    return accessToken || sessionStorage.getItem('lk_access_token') || localStorage.getItem('lk_access_token') || '';
  };

  const handleOpenStatusModal = (ord) => {
    if (!ord) return;

    // Retrieve fresh order object from orders state array if present
    const currentOrd = orders.find((o) => o.orderId === ord.orderId || o._id === ord._id) || ord;
    const isOnline = Boolean(currentOrd.paymentMethod && currentOrd.paymentMethod !== 'COD');

    // 1. DELIVERY BOY STATUS
    const rawDeliveryBoyStatus = (currentOrd.deliveryBoyStatus || '').toString().trim();
    let delBoyStat = 'DELIVERY BOY PENDING';
    if (rawDeliveryBoyStatus === 'DELIVERY BOY RECEIVED' || rawDeliveryBoyStatus === 'Received' || rawDeliveryBoyStatus === 'DELIVERY SENT') {
      delBoyStat = 'DELIVERY BOY RECEIVED';
    } else if (rawDeliveryBoyStatus === 'DELIVERY BOY PENDING' || rawDeliveryBoyStatus === 'Pending') {
      delBoyStat = 'DELIVERY BOY PENDING';
    } else if (rawOrderStatus === 'Out for Delivery' || rawOrderStatus === 'Delivered' || rawOrderStatus === 'Confirmed') {
      delBoyStat = 'DELIVERY BOY RECEIVED';
    } else {
      delBoyStat = 'DELIVERY BOY PENDING';
    }

    // 2. ORDER STATUS
    const rawOrderStatus = (currentOrd.orderStatus || '').toString().trim();
    let orderStat = (rawOrderStatus === 'Pending' || rawOrderStatus === 'ORDER PENDING' || !rawOrderStatus)
      ? 'ORDER PENDING'
      : 'ORDER CONFIRMED';

    if (delBoyStat === 'DELIVERY BOY RECEIVED') {
      orderStat = 'ORDER CONFIRMED';
    }

    // 3. PAYMENT STATUS
    const rawPaymentStatus = (currentOrd.paymentStatus || '').toString().trim();
    let payStat = 'COD • PENDING';
    if (isOnline) {
      payStat = 'ONLINE • PAID';
    } else if (rawPaymentStatus === 'Paid' || rawPaymentStatus === 'COD • PAID') {
      payStat = 'COD • PAID';
    } else {
      payStat = 'COD • PENDING';
    }

    // 4. PAYMENT DATE & TIME
    const now = new Date();
    const todayIso = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const nowTime = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); // HH:MM

    let pDate = currentOrd.paymentDate ? currentOrd.paymentDate.toString().trim() : '';
    let pTime = currentOrd.paymentTime ? currentOrd.paymentTime.toString().trim() : '';

    if (!pDate) {
      if (rawPaymentStatus === 'Paid' || rawPaymentStatus === 'COD • PAID' || isOnline) {
        const dObj = currentOrd.paidAt ? new Date(currentOrd.paidAt) : (currentOrd.createdAt ? new Date(currentOrd.createdAt) : now);
        pDate = !isNaN(dObj.getTime()) ? dObj.toISOString().split('T')[0] : todayIso;
      } else {
        pDate = todayIso;
      }
    } else if (pDate.includes('-') && pDate.split('-')[0].length === 2) {
      // Convert DD-MM-YYYY (e.g. 16-09-2026) to YYYY-MM-DD (2026-09-16) for HTML <input type="date">
      const [d, m, y] = pDate.split('-');
      pDate = `${y}-${m}-${d}`;
    }

    if (!pTime) {
      if (rawPaymentStatus === 'Paid' || rawPaymentStatus === 'COD • PAID' || isOnline) {
        const dObj = currentOrd.paidAt ? new Date(currentOrd.paidAt) : (currentOrd.createdAt ? new Date(currentOrd.createdAt) : now);
        pTime = !isNaN(dObj.getTime()) ? dObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : nowTime;
      } else {
        pTime = nowTime;
      }
    } else if (pTime.includes('AM') || pTime.includes('PM')) {
      // Convert 12h time (e.g. "08:52 AM" or "02:30 PM") to 24h format "08:52" / "14:30" for HTML <input type="time">
      try {
        const match = pTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
        if (match) {
          let h = parseInt(match[1], 10);
          const m = match[2];
          const ampm = match[3].toUpperCase();
          if (ampm === 'PM' && h < 12) h += 12;
          if (ampm === 'AM' && h === 12) h = 0;
          pTime = `${h < 10 ? '0' + h : h}:${m}`;
        }
      } catch (e) {}
    }

    setStatusModalOrder(currentOrd);
    setStatusModalOrderStatus(orderStat);
    setStatusModalDeliveryBoyStatus(delBoyStat);
    setStatusModalPaymentStatus(payStat);
    setStatusModalPaymentDate(pDate);
    setStatusModalPaymentTime(pTime);
    setStatusModalError('');
  };

  const handleSaveStatusModal = async () => {
    if (!statusModalOrder) return;
    try {
      setStatusModalSaving(true);
      setStatusModalError('');

      const isOnline = Boolean(statusModalOrder.paymentMethod && statusModalOrder.paymentMethod !== 'COD');

      // Validation: Require Payment Date and Payment Time if COD payment is marked as PAID
      if (!isOnline && statusModalPaymentStatus === 'COD • PAID') {
        if (!statusModalPaymentDate || !statusModalPaymentDate.trim()) {
          setStatusModalError('Please select or enter the Payment Date before saving.');
          setStatusModalSaving(false);
          return;
        }
        if (!statusModalPaymentTime || !statusModalPaymentTime.trim()) {
          setStatusModalError('Please select or enter the Payment Time before saving.');
          setStatusModalSaving(false);
          return;
        }
      }

      // Convert YYYY-MM-DD input date to DD-MM-YYYY (e.g. 16-09-2026) for display/storage
      let formattedDate = statusModalPaymentDate;
      if (formattedDate && formattedDate.includes('-') && formattedDate.split('-')[0].length === 4) {
        const [y, m, d] = formattedDate.split('-');
        formattedDate = `${d}-${m}-${y}`;
      }

      // Convert 24h HH:MM input time to 12h "08:52 AM" / "02:30 PM" format
      let formattedTime = statusModalPaymentTime;
      if (formattedTime && formattedTime.includes(':') && !formattedTime.includes('AM') && !formattedTime.includes('PM')) {
        const parts = formattedTime.split(':');
        let h = parseInt(parts[0], 10);
        const m = parts[1] ? parts[1].substring(0, 2) : '00';
        if (!isNaN(h)) {
          const ampm = h >= 12 ? 'PM' : 'AM';
          h = h % 12 || 12;
          const hFormatted = h < 10 ? `0${h}` : `${h}`;
          formattedTime = `${hFormatted}:${m} ${ampm}`;
        }
      }

      const payload = {
        orderStatus: statusModalOrderStatus === 'ORDER PENDING' ? 'Pending' : 'Confirmed',
        deliveryBoyStatus: statusModalDeliveryBoyStatus,
        paymentStatus: isOnline ? 'Paid' : (statusModalPaymentStatus === 'COD • PAID' ? 'Paid' : 'Pending'),
        paymentDate: formattedDate,
        paymentTime: formattedTime,
      };

      const token = getAuthToken();
      const res = await fetch(getApiUrl(`/orders/${statusModalOrder.orderId}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data && data.success && data.order) {
        setSuccessMessage(`Order #${statusModalOrder.orderId} status saved successfully!`);
        setTimeout(() => setSuccessMessage(''), 3000);

        const updatedOrder = data.order;
        setOrders(prev => prev.map(o => (o.orderId === updatedOrder.orderId || o._id === updatedOrder._id) ? updatedOrder : o));
        if (selectedAdminOrder && (selectedAdminOrder.orderId === updatedOrder.orderId || selectedAdminOrder._id === updatedOrder._id)) {
          setSelectedAdminOrder(updatedOrder);
        }

        setStatusModalOrder(null);
        fetchOrdersAndMetrics();
      } else {
        setStatusModalError(data?.message || 'Failed to save status.');
      }
    } catch (err) {
      console.error('Error saving status:', err);
      setStatusModalError(`Error saving status: ${err.message}`);
    } finally {
      setStatusModalSaving(false);
    }
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
      if (statusFilter !== 'All' && statusFilter !== 'Processing' && statusFilter !== 'New Order' && !cleanSearch.includes('@')) {
        params.append('status', statusFilter);
      }
      if ([...params].length > 0) url += `?${params.toString()}`;

      const resOrder = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const dataOrder = await resOrder.json().catch(() => null);

      if (resOrder.ok && dataOrder && dataOrder.success) {
        const fetchedOrders = dataOrder.orders || [];
        setOrders(fetchedOrders);
        setSelectedAdminOrder((prev) => {
          if (!prev) return null;
          const match = fetchedOrders.find((o) => o.orderId === prev.orderId || o._id === prev._id);
          return match || prev;
        });
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
              <p className="text-xs text-zinc-400">Manage shoe orders &amp; update shipment statuses</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowControlPanelModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-zinc-950 font-black text-xs rounded-xl flex items-center gap-2 shadow-md transition-all cursor-pointer shrink-0"
            title="Open Control Panel for filters, search, reports, and stock controls"
          >
            <SlidersHorizontal className="w-4 h-4 text-zinc-950" />
            <span>Control Panel &amp; Filters</span>
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
              {showSalesReport && metrics && (
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

              {/* Minimal Clean Order Filter Banner */}
              <div className="flex items-center justify-between p-3.5 bg-zinc-950/80 border border-zinc-800 rounded-2xl text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-zinc-400 font-bold uppercase text-[10px]">Filter Status:</span>
                  <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2.5 py-0.5 rounded-full font-bold font-mono">
                    {statusFilter}
                  </span>
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
              {(() => {
                const filtered = orders.filter((o) => {
                  const st = (o.orderStatus || '').toString().trim();
                  if (statusFilter === 'New Order' || statusFilter === 'Processing') {
                    return st !== 'Delivered' && st !== 'Cancelled';
                  }
                  if (statusFilter !== 'All') {
                    return st === statusFilter || (statusFilter === 'Pending' && (st === 'ORDER PENDING' || st === 'Order Placed'));
                  }
                  return true;
                });

                const displayedOrders = statusFilter === 'New Order' ? filtered.slice(0, 1) : filtered;

                return fetchingOrders ? (
                  <div className="py-16 text-center text-zinc-400 flex items-center justify-center gap-3">
                    <RefreshCw className="w-6 h-6 animate-spin text-amber-400" /> Fetching customer orders from MongoDB...
                  </div>
                ) : displayedOrders.length === 0 ? (
                  <div className="py-16 text-center space-y-3">
                    <div className="text-zinc-400 text-sm font-bold">
                      {searchQuery.trim().includes('@')
                        ? 'No orders found for this Gmail.'
                        : statusFilter === 'Processing'
                        ? 'No orders requiring processing currently.'
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
                    {/* COMPACT CLEAN ORDER CARDS VIEW */}
                    <div className="space-y-3">
                      {displayedOrders.map((ord) => {
                      const { date: orderDate, time: orderTime } = formatOrderDateTime(ord.createdAt);
                      const shoeNames = ord.items?.map((it) => it.name).filter(Boolean).join(', ') || 'LITRA KING Footwear';

                      return (
                        <div
                          key={ord._id || ord.orderId}
                          onClick={() => setSelectedAdminOrder(ord)}
                          className="p-3.5 sm:p-4 bg-zinc-950 border border-zinc-800/90 hover:border-amber-500/50 rounded-2xl shadow-md hover:shadow-amber-500/5 transition-all cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-zinc-300"
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4 items-center flex-1 min-w-0">
                            
                            {/* 1. Order ID */}
                            <div className="space-y-0.5">
                              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Order ID</span>
                              <span className="font-mono font-black text-amber-400 text-sm sm:text-base group-hover:text-amber-300 transition-colors block">
                                #{ord.orderId}
                              </span>
                            </div>

                            {/* 2. Customer Name */}
                            <div className="space-y-0.5 min-w-0">
                              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Customer</span>
                              <span className="font-bold text-white text-sm truncate block" title={ord.customer?.name}>
                                {ord.customer?.name || 'Customer'}
                              </span>
                            </div>

                            {/* 3. Order Date & Time */}
                            <div className="space-y-0.5 min-w-0">
                              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Date &amp; Time</span>
                              <div className="text-[11px] text-zinc-300 font-mono flex items-center gap-1.5 flex-wrap">
                                <span className="flex items-center gap-1 font-semibold text-zinc-200">
                                  <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                  {orderDate}
                                </span>
                                <span className="text-zinc-500 hidden sm:inline">•</span>
                                <span className="flex items-center gap-1 text-zinc-400">
                                  <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                  {orderTime}
                                </span>
                              </div>
                            </div>

                            {/* 4. Short Product/Shoe Name */}
                            <div className="space-y-0.5 min-w-0">
                              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Shoe / Product</span>
                              <span className="font-semibold text-zinc-200 text-xs truncate block" title={shoeNames}>
                                {shoeNames}
                              </span>
                            </div>

                          </div>

                          {/* 5. View Details Clickable Action */}
                          <div className="flex items-center justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800/80">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedAdminOrder(ord);
                              }}
                              className="px-3.5 py-1.5 bg-amber-500/10 group-hover:bg-amber-500 text-amber-400 group-hover:text-zinc-950 border border-amber-500/30 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View Details</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              );
            })()}

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
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-mono font-black text-xl">#{selectedAdminOrder.orderId}</span>
                <span className="text-xs text-zinc-400">• Full Order Breakdown</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => {
                    const cur = selectedAdminOrder;
                    handleOpenDeliverySendModal(cur);
                  }}
                  className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-zinc-950 font-black text-xs rounded-xl flex items-center gap-1.5 shadow-md transition-colors"
                  title="Send Package from LITRA KING Store to Delivery Boy"
                >
                  <Truck className="w-3.5 h-3.5 text-zinc-950" />
                  <span>Deliver</span>
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
                  <button
                    onClick={() => handleOpenStatusModal(selectedAdminOrder)}
                    className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
                  >
                    <SlidersHorizontal className="w-4 h-4 text-zinc-950" />
                    <span>Order &amp; Payment Status</span>
                  </button>
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

      {/* ─── ADMIN DELIVERY SEND MODAL ────────────────────────────────────────── */}
      {deliverySendOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-zinc-900 border border-amber-500/40 rounded-3xl shadow-2xl overflow-hidden text-zinc-100 flex flex-col max-h-[92vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-400">
                  <Truck className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-amber-400 flex items-center gap-2">
                    🚚 Admin Delivery Send
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Hand over package from LITRA KING Store to assigned Delivery Boy
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDeliverySendOrder(null)}
                className="p-2 text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors"
                title="Close Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh] custom-scrollbar">
              
              {/* Error Message */}
              {deliverySendError && (
                <div className="p-3 bg-red-950/80 border border-red-800 rounded-xl text-red-200 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span>{deliverySendError}</span>
                </div>
              )}

              {/* 1. Visual Route & Customer GPS Location Card */}
              {(() => {
                const sendCoords = getOrderCoordinates(deliverySendOrder);
                const sendCleanAddress = (deliverySendOrder.customer?.address || '')
                  .replace(/\(GPS Location:.*?\)/gi, '')
                  .replace(/GPS Location:.*$/gi, '')
                  .trim();

                let sendDistance = deliverySendOrder.deliveryDistance || deliverySendOrder.deliveryDistanceKm || 0;
                if (sendCoords && sendCoords.lat && sendCoords.lng) {
                  sendDistance = calculateHaversineDistance(SHOP_LOCATION.lat, SHOP_LOCATION.lng, sendCoords.lat, sendCoords.lng);
                }

                const mapsUrl = sendCoords
                  ? `https://www.google.com/maps?q=${sendCoords.lat},${sendCoords.lng}`
                  : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${sendCleanAddress}, ${deliverySendOrder.customer?.city || ''}, ${deliverySendOrder.customer?.pincode || ''}`)}`;

                const routeUrl = sendCoords
                  ? `https://www.google.com/maps/dir/?api=1&origin=${SHOP_LOCATION.lat},${SHOP_LOCATION.lng}&destination=${sendCoords.lat},${sendCoords.lng}&travelmode=driving`
                  : `https://www.google.com/maps/dir/?api=1&origin=${SHOP_LOCATION.lat},${SHOP_LOCATION.lng}&destination=${encodeURIComponent(`${sendCleanAddress}, ${deliverySendOrder.customer?.city || ''}, ${deliverySendOrder.customer?.pincode || ''}`)}&travelmode=driving`;

                return (
                  <div className="p-4 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-amber-500/30 rounded-2xl space-y-3">
                    <div className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-amber-400" /> Store Package Transfer Route
                      </span>
                      <span className="px-2.5 py-0.5 bg-amber-950 text-amber-400 rounded-lg border border-amber-800 text-[10px] font-mono">
                        Distance: {sendDistance > 0 ? `${sendDistance} KM` : 'Local / Std'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-5 items-center gap-2 text-center py-2 bg-zinc-950/70 rounded-xl border border-zinc-800 p-3">
                      <div className="md:col-span-2 text-left space-y-0.5">
                        <span className="text-[10px] text-zinc-500 block uppercase font-bold">SOURCE</span>
                        <span className="text-xs font-black text-amber-400 flex items-center gap-1">
                          🏪 LITRA KING STORE
                        </span>
                        <span className="text-[10px] text-zinc-400 block font-mono">Main Footwear Market, Chomu (303702)</span>
                      </div>
                      <div className="md:col-span-1 flex flex-col items-center justify-center my-1 md:my-0">
                        <span className="text-[10px] text-amber-400 font-extrabold animate-pulse">🚚 DELIVERY ROUTE</span>
                        <div className="w-full h-0.5 bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-500 my-1"></div>
                      </div>
                      <div className="md:col-span-2 text-right space-y-0.5">
                        <span className="text-[10px] text-zinc-500 block uppercase font-bold">DESTINATION CUSTOMER</span>
                        <span className="text-xs font-black text-emerald-400 block">
                          🏠 {deliverySendOrder.customer?.name || 'Customer'}
                        </span>
                        <span className="text-[10px] text-zinc-300 block truncate" title={sendCleanAddress}>
                          {sendCleanAddress || deliverySendOrder.customer?.city || 'Local'} (Pincode: {deliverySendOrder.customer?.pincode})
                        </span>
                      </div>
                    </div>

                    {/* Customer GPS Location & Maps Buttons */}
                    <div className="p-3 bg-zinc-950/80 rounded-xl border border-zinc-800 space-y-2 text-xs">
                      {sendCoords ? (
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div>
                            <span className="text-zinc-400 block text-[11px] font-bold">Customer GPS Location:</span>
                            <span className="font-mono text-amber-400 font-extrabold text-xs">
                              📍 Latitude: {sendCoords.lat} | Longitude: {sendCoords.lng}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <a
                              href={mapsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500 hover:text-zinc-950 text-amber-400 border border-amber-500/40 rounded-xl font-bold text-xs transition-all flex items-center gap-1 shadow-sm"
                            >
                              <MapPin className="w-3.5 h-3.5" />
                              <span>📍 OPEN CUSTOMER LOCATION</span>
                            </a>
                            <a
                              href={routeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500 hover:text-zinc-950 text-emerald-400 border border-emerald-500/40 rounded-xl font-bold text-xs transition-all flex items-center gap-1 shadow-sm"
                            >
                              <Truck className="w-3.5 h-3.5" />
                              <span>🚗 OPEN ROUTE IN GOOGLE MAPS</span>
                            </a>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div>
                            <span className="text-amber-400/90 font-bold block text-[11px]">
                              Customer GPS location is not available for this order.
                            </span>
                            <span className="text-zinc-400 text-[10px] block">
                              Address: {sendCleanAddress}, Pincode: {deliverySendOrder.customer?.pincode}
                            </span>
                          </div>
                          <a
                            href={mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-zinc-700 rounded-xl font-bold text-xs transition-all flex items-center gap-1"
                          >
                            <MapPin className="w-3.5 h-3.5" />
                            <span>📍 OPEN ADDRESS IN GOOGLE MAPS</span>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* 2. Order Information Breakdown */}
              <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-3">
                <h4 className="font-extrabold text-xs uppercase text-zinc-300 border-b border-zinc-800 pb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-amber-400">
                    <Package className="w-4 h-4 text-amber-400" /> Package Order Details
                  </span>
                  <span className="font-mono text-amber-400">#{deliverySendOrder.orderId}</span>
                </h4>

                {(() => {
                  const sendCoords = getOrderCoordinates(deliverySendOrder);
                  const sendCleanAddress = (deliverySendOrder.customer?.address || '')
                    .replace(/\(GPS Location:.*?\)/gi, '')
                    .replace(/GPS Location:.*$/gi, '')
                    .trim();
                  let sendDistance = deliverySendOrder.deliveryDistance || deliverySendOrder.deliveryDistanceKm || 0;
                  if (sendCoords && sendCoords.lat && sendCoords.lng) {
                    sendDistance = calculateHaversineDistance(SHOP_LOCATION.lat, SHOP_LOCATION.lng, sendCoords.lat, sendCoords.lng);
                  }

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-zinc-500 text-[11px] block">Customer Name & Phone:</span>
                        <span className="font-bold text-white block">{deliverySendOrder.customer?.name}</span>
                        <span className="text-zinc-400 font-mono text-[11px] block">+91 {deliverySendOrder.customer?.phone}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 text-[11px] block">Customer Address & Pincode:</span>
                        <span className="text-zinc-300 block">{sendCleanAddress || deliverySendOrder.customer?.address}</span>
                        <span className="text-amber-400 font-mono text-[11px] font-bold block">Pincode: {deliverySendOrder.customer?.pincode}</span>
                      </div>
                      <div className="sm:col-span-2 border-t border-zinc-800/80 pt-2">
                        <span className="text-zinc-500 text-[11px] block mb-1">Ordered Shoe/Product:</span>
                        <div className="space-y-1">
                          {Array.isArray(deliverySendOrder.items) && deliverySendOrder.items.length > 0 ? (
                            deliverySendOrder.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between items-center bg-zinc-900/80 p-2 rounded-lg border border-zinc-800 text-xs">
                                <span className="font-semibold text-zinc-200">
                                  {item.name} <span className="text-amber-400">(Size: {item.size})</span>
                                </span>
                                <span className="font-mono text-zinc-400">x{item.quantity} • ₹{Number(item.price) * Number(item.quantity)}</span>
                              </div>
                            ))
                          ) : (
                            <div className="text-zinc-400 italic">LITRA KING Footwear</div>
                          )}
                        </div>
                      </div>

                      <div className="sm:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-zinc-800/80 font-mono text-[11px]">
                        <div className="bg-zinc-900 p-2 rounded-lg border border-zinc-800">
                          <span className="text-zinc-500 block text-[10px]">Payment Method:</span>
                          <span className="font-bold text-white">{deliverySendOrder.paymentMethod || 'COD'}</span>
                        </div>
                        <div className="bg-zinc-900 p-2 rounded-lg border border-zinc-800">
                          <span className="text-zinc-500 block text-[10px]">Payment Status:</span>
                          <span className={`font-bold ${deliverySendOrder.paymentStatus === 'Paid' ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {deliverySendOrder.paymentMethod !== 'COD'
                              ? (deliverySendOrder.paymentStatus === 'Paid' ? 'ONLINE • PAID' : 'ONLINE • PENDING')
                              : (deliverySendOrder.paymentStatus === 'Paid' ? 'COD • PAID' : 'COD • PENDING')}
                          </span>
                        </div>
                        <div className="bg-zinc-900 p-2 rounded-lg border border-zinc-800">
                          <span className="text-zinc-500 block text-[10px]">Delivery Distance:</span>
                          <span className="font-bold text-zinc-200">{sendDistance > 0 ? `${sendDistance} KM` : 'Local'}</span>
                        </div>
                        <div className="bg-zinc-900 p-2 rounded-lg border border-zinc-800">
                          <span className="text-zinc-500 block text-[10px]">Grand Total:</span>
                          <span className="font-black text-amber-400 text-xs">₹{getOrderPriceBreakdown(deliverySendOrder).grandTotal}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* 3. Delivery Boy Assignment Section */}
              <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-3">
                <h4 className="font-extrabold text-xs uppercase text-amber-400 flex items-center gap-1.5 border-b border-zinc-800 pb-2">
                  <UserCheck className="w-4 h-4 text-amber-400" /> Assign Delivery Boy
                </h4>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1">
                      Delivery Boy <span className="text-amber-400">*</span>
                    </label>
                    <select
                      value={deliverySendIsCustomBoy ? 'CUSTOM' : deliverySendBoyId}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'CUSTOM') {
                          setDeliverySendIsCustomBoy(true);
                          setDeliverySendBoyId('CUSTOM');
                          setDeliverySendBoyName('');
                          setDeliverySendBoyPhone('');
                        } else {
                          setDeliverySendIsCustomBoy(false);
                          const selectedBoy = allAvailableDeliveryBoys.find((b) => b.id === val || b.name === val);
                          if (selectedBoy) {
                            setDeliverySendBoyId(selectedBoy.id);
                            setDeliverySendBoyName(selectedBoy.name);
                            setDeliverySendBoyPhone(selectedBoy.phone || '');
                          }
                        }
                      }}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-white font-semibold focus:outline-none focus:border-amber-500"
                    >
                      <optgroup label="Standard LITRA KING Delivery Executives">
                        {presetDeliveryBoys.map((db) => (
                          <option key={db.id} value={db.id}>
                            {db.name} (+91 {db.phone})
                          </option>
                        ))}
                      </optgroup>
                      {allAvailableDeliveryBoys.filter((b) => b.id.startsWith('HO_')).length > 0 && (
                        <optgroup label="Recent Delivery Executives from Handovers">
                          {allAvailableDeliveryBoys
                            .filter((b) => b.id.startsWith('HO_'))
                            .map((b) => (
                              <option key={b.id} value={b.id}>
                                {b.name} {b.phone ? `(+91 ${b.phone})` : ''}
                              </option>
                            ))}
                        </optgroup>
                      )}
                      <option value="CUSTOM">+ Enter New / Custom Delivery Boy</option>
                    </select>
                  </div>

                  {deliverySendIsCustomBoy && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-zinc-900/90 border border-amber-500/30 rounded-xl">
                      <div>
                        <label className="text-[11px] font-bold text-zinc-400 block mb-1">
                          Delivery Boy Name <span className="text-amber-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={deliverySendBoyName}
                          onChange={(e) => setDeliverySendBoyName(e.target.value)}
                          placeholder="e.g. Ramesh Kumar"
                          className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-zinc-400 block mb-1">
                          Delivery Boy Mobile Number
                        </label>
                        <input
                          type="text"
                          value={deliverySendBoyPhone}
                          onChange={(e) => setDeliverySendBoyPhone(e.target.value)}
                          placeholder="e.g. 9876543210"
                          className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 4. Confirmation Section */}
              <div className="p-4 bg-amber-950/40 border border-amber-500/40 rounded-2xl space-y-3">
                <h4 className="font-extrabold text-xs uppercase text-amber-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-400" /> Send this order to Delivery Boy?
                </h4>
                
                <div className="p-3 bg-zinc-950/80 rounded-xl border border-amber-500/20 text-xs space-y-1.5 font-mono">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Order ID:</span>
                    <span className="font-black text-amber-400">#{deliverySendOrder.orderId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Customer:</span>
                    <span className="font-bold text-white">{deliverySendOrder.customer?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Assigned Delivery Boy:</span>
                    <span className="font-bold text-amber-400">{deliverySendBoyName || 'None Selected'} {deliverySendBoyPhone ? `(+91 ${deliverySendBoyPhone})` : ''}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Payment Status:</span>
                    <span className={`font-bold ${deliverySendOrder.paymentStatus === 'Paid' ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {deliverySendOrder.paymentMethod !== 'COD'
                        ? (deliverySendOrder.paymentStatus === 'Paid' ? 'ONLINE • PAID' : 'ONLINE • PENDING')
                        : (deliverySendOrder.paymentStatus === 'Paid' ? 'COD • PAID' : 'COD • PENDING')}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-zinc-800 pt-1.5 font-black text-amber-400">
                    <span>Order Amount:</span>
                    <span>₹{getOrderPriceBreakdown(deliverySendOrder).grandTotal}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-800 bg-zinc-950">
              <button
                type="button"
                onClick={() => setDeliverySendOrder(null)}
                disabled={deliverySendSubmitting}
                className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-extrabold text-xs rounded-xl transition-all"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleSaveDeliverySend}
                disabled={deliverySendSubmitting}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {deliverySendSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-zinc-950" />
                    <span>SENDING...</span>
                  </>
                ) : (
                  <>
                    <Truck className="w-4 h-4 text-zinc-950" />
                    <span>SEND TO DELIVERY BOY</span>
                  </>
                )}
              </button>
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

      {/* COMBINED ORDER & PAYMENT STATUS MODAL */}
      {statusModalOrder && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl relative text-white max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div>
                <h3 className="text-lg font-black text-amber-400 flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-amber-400" />
                  Order &amp; Payment Status
                </h3>
                <p className="text-xs text-zinc-400 font-mono mt-0.5">
                  Order ID: <strong className="text-white font-bold">#{statusModalOrder.orderId}</strong> | Customer: <strong className="text-zinc-200">{statusModalOrder.customer?.name}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStatusModalOrder(null)}
                className="p-2 text-zinc-400 hover:text-white rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {statusModalError && (
              <div className="p-3 bg-red-950/80 border border-red-800 rounded-xl text-red-300 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{statusModalError}</span>
              </div>
            )}

            <div className="space-y-5 text-xs">
              {/* 1. ORDER STATUS SECTION */}
              <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl space-y-2.5">
                <div className="font-extrabold uppercase text-[11px] text-zinc-400 tracking-wider flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-amber-400" /> 1. ORDER STATUS
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setStatusModalOrderStatus('ORDER PENDING')}
                    className={`py-2.5 px-3 rounded-xl font-extrabold text-xs transition-all border ${
                      statusModalOrderStatus === 'ORDER PENDING'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500 shadow-md shadow-amber-500/10'
                        : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                    }`}
                  >
                    ORDER PENDING
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusModalOrderStatus('ORDER CONFIRMED')}
                    className={`py-2.5 px-3 rounded-xl font-extrabold text-xs transition-all border ${
                      statusModalOrderStatus === 'ORDER CONFIRMED'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 shadow-md shadow-emerald-500/10'
                        : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                    }`}
                  >
                    ORDER CONFIRMED
                  </button>
                </div>
              </div>

              {/* 2. DELIVERY BOY STATUS SECTION */}
              <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl space-y-2.5">
                <div className="font-extrabold uppercase text-[11px] text-zinc-400 tracking-wider flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-blue-400" /> 2. DELIVERY BOY STATUS
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setStatusModalDeliveryBoyStatus('DELIVERY BOY PENDING')}
                    className={`py-2.5 px-3 rounded-xl font-extrabold text-xs transition-all border ${
                      statusModalDeliveryBoyStatus === 'DELIVERY BOY PENDING'
                        ? 'bg-zinc-800 text-amber-300 border-amber-500/50'
                        : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                    }`}
                  >
                    DELIVERY BOY PENDING
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStatusModalDeliveryBoyStatus('DELIVERY BOY RECEIVED');
                      setStatusModalOrderStatus('ORDER CONFIRMED');
                    }}
                    className={`py-2.5 px-3 rounded-xl font-extrabold text-xs transition-all border ${
                      statusModalDeliveryBoyStatus === 'DELIVERY BOY RECEIVED'
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500 shadow-md shadow-blue-500/10'
                        : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                    }`}
                  >
                    DELIVERY BOY RECEIVED
                  </button>
                </div>
              </div>

              {/* 3. PAYMENT STATUS SECTION */}
              <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl space-y-3">
                <div className="font-extrabold uppercase text-[11px] text-zinc-400 tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-400" /> 3. PAYMENT STATUS ({statusModalOrder.paymentMethod || 'COD'})
                </div>

                {statusModalOrder.paymentMethod && statusModalOrder.paymentMethod !== 'COD' ? (
                  /* ONLINE ORDER: READ ONLY / PRESERVED ONLINE PAYMENT STATUS */
                  <div className="space-y-3">
                    <div className="p-3 bg-emerald-950/60 border border-emerald-800 rounded-xl flex items-center justify-between">
                      <span className="text-xs font-black text-emerald-400 uppercase tracking-wide">
                        ONLINE • PAID
                      </span>
                      <span className="text-[10px] font-mono text-emerald-300/80 bg-emerald-900/40 border border-emerald-800/60 px-2 py-0.5 rounded-md">
                        Verified Online Payment
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="text-[10px] text-zinc-400 font-bold uppercase block mb-1">Payment Date</label>
                        <input
                          type="text"
                          disabled
                          value={statusModalPaymentDate ? (statusModalPaymentDate.includes('-') && statusModalPaymentDate.split('-')[0].length === 4 ? `${statusModalPaymentDate.split('-')[2]}-${statusModalPaymentDate.split('-')[1]}-${statusModalPaymentDate.split('-')[0]}` : statusModalPaymentDate) : ''}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-300 font-mono text-xs cursor-not-allowed opacity-80"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-400 font-bold uppercase block mb-1">Payment Time</label>
                        <input
                          type="text"
                          disabled
                          value={statusModalPaymentTime}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-300 font-mono text-xs cursor-not-allowed opacity-80"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* COD ORDER: CAN CHANGE BETWEEN COD • PENDING & COD • PAID */
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setStatusModalPaymentStatus('COD • PENDING')}
                        className={`py-2.5 px-3 rounded-xl font-extrabold text-xs transition-all border ${
                          statusModalPaymentStatus === 'COD • PENDING'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500 shadow-md shadow-amber-500/10'
                            : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                        }`}
                      >
                        COD • PENDING
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setStatusModalPaymentStatus('COD • PAID');
                          if (!statusModalPaymentDate) {
                            const dObj = new Date();
                            setStatusModalPaymentDate(dObj.toISOString().split('T')[0]);
                          }
                          if (!statusModalPaymentTime) {
                            const dObj = new Date();
                            setStatusModalPaymentTime(dObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
                          }
                        }}
                        className={`py-2.5 px-3 rounded-xl font-extrabold text-xs transition-all border ${
                          statusModalPaymentStatus === 'COD • PAID'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 shadow-md shadow-emerald-500/10'
                            : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                        }`}
                      >
                        COD • PAID
                      </button>
                    </div>

                    {/* Display Payment Date & Time inputs when payment is COD • PAID */}
                    {statusModalPaymentStatus === 'COD • PAID' && (
                      <div className="p-3 bg-zinc-950 border border-emerald-800/60 rounded-xl space-y-3 animate-fadeIn">
                        <div className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Enter/Select COD Payment Collection Date &amp; Time:
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] text-zinc-400 font-bold uppercase block mb-1">
                              Payment Date <span className="text-amber-400">*</span>
                            </label>
                            <input
                              type="date"
                              value={statusModalPaymentDate}
                              onChange={(e) => setStatusModalPaymentDate(e.target.value)}
                              className="w-full bg-zinc-900 border border-zinc-700 focus:border-amber-400 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none"
                            />
                            {statusModalPaymentDate && (
                              <span className="text-[10px] text-amber-300 font-mono block mt-1">
                                Formatted: {statusModalPaymentDate.includes('-') && statusModalPaymentDate.split('-')[0].length === 4 ? `${statusModalPaymentDate.split('-')[2]}-${statusModalPaymentDate.split('-')[1]}-${statusModalPaymentDate.split('-')[0]}` : statusModalPaymentDate}
                              </span>
                            )}
                          </div>
                          <div>
                            <label className="text-[10px] text-zinc-400 font-bold uppercase block mb-1">
                              Payment Time <span className="text-amber-400">*</span>
                            </label>
                            <input
                              type="time"
                              value={statusModalPaymentTime}
                              onChange={(e) => setStatusModalPaymentTime(e.target.value)}
                              className="w-full bg-zinc-900 border border-zinc-700 focus:border-amber-400 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none"
                            />
                            {statusModalPaymentTime && (
                              <span className="text-[10px] text-amber-300 font-mono block mt-1">
                                Preview: {(() => {
                                  if (statusModalPaymentTime.includes(':') && !statusModalPaymentTime.includes('AM') && !statusModalPaymentTime.includes('PM')) {
                                    const parts = statusModalPaymentTime.split(':');
                                    let h = parseInt(parts[0], 10);
                                    const m = parts[1] ? parts[1].substring(0, 2) : '00';
                                    if (!isNaN(h)) {
                                      const ampm = h >= 12 ? 'PM' : 'AM';
                                      h = h % 12 || 12;
                                      return `${h < 10 ? '0' + h : h}:${m} ${ampm}`;
                                    }
                                  }
                                  return statusModalPaymentTime;
                                })()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 border-t border-zinc-800 pt-4">
              <button
                type="button"
                onClick={() => setStatusModalOrder(null)}
                className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold text-xs rounded-xl border border-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={statusModalSaving}
                onClick={handleSaveStatusModal}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 disabled:opacity-50 text-zinc-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-1.5"
              >
                {statusModalSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-zinc-950" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-zinc-950" />
                    <span>
                      {statusModalOrder.paymentMethod && statusModalOrder.paymentMethod !== 'COD' ? 'SAVE STATUS' : 'SAVE PAYMENT'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reports Statistics Overlay Modal ────────────────────────────────────── */}
      {showReportsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 animate-fadeIn">
          <div className="relative w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden text-zinc-100 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/80">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-white tracking-wider flex items-center gap-2">
                    ORDERS &amp; SALES REPORT STATISTICS
                  </h3>
                  <p className="text-xs text-zinc-400">Real-time statistics calculated from live database orders</p>
                </div>
              </div>

              <button
                onClick={() => setShowReportsModal(false)}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
              {(() => {
                const todayObj = new Date();
                const todayDateStr = todayObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                const currentMonth = todayObj.getMonth();
                const currentYear = todayObj.getFullYear();

                let todayOrdersCount = 0;
                let monthOrdersCount = 0;
                let monthSalesTotal = 0;

                let pendingCount = 0;
                let confirmedCount = 0;
                let shippedCount = 0;
                let deliveredCount = 0;
                let cancelledCount = 0;

                const dateMap = {};

                orders.forEach((ord) => {
                  if (!ord.createdAt) return;
                  const createdAtDate = new Date(ord.createdAt);
                  const dateFormatted = createdAtDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

                  dateMap[dateFormatted] = (dateMap[dateFormatted] || 0) + 1;

                  if (createdAtDate.toDateString() === todayObj.toDateString()) {
                    todayOrdersCount++;
                  }

                  if (createdAtDate.getMonth() === currentMonth && createdAtDate.getFullYear() === currentYear) {
                    monthOrdersCount++;
                    monthSalesTotal += Number(ord.totalAmount || 0);
                  }

                  const st = (ord.orderStatus || '').toString().trim();
                  if (st === 'Delivered') {
                    deliveredCount++;
                  } else if (st === 'Cancelled') {
                    cancelledCount++;
                  } else if (st === 'Confirmed') {
                    confirmedCount++;
                  } else if (st === 'Shipped' || st === 'Out for Delivery' || st === 'Packed') {
                    shippedCount++;
                  } else {
                    pendingCount++;
                  }
                });

                const dateWiseList = Object.keys(dateMap).map((dStr) => ({
                  dateStr: dStr,
                  count: dateMap[dStr],
                })).sort((a, b) => new Date(b.dateStr).getTime() - new Date(a.dateStr).getTime());

                const report = {
                  todayDateStr,
                  todayOrdersCount,
                  monthOrdersCount,
                  monthSalesTotal: metrics?.monthSales || monthSalesTotal,
                  pendingCount,
                  confirmedCount,
                  shippedCount,
                  deliveredCount,
                  cancelledCount,
                  dateWiseList,
                };

                return (
                  <>
                    {/* Core Cards Overview Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {/* 1. Today's Date & Today's Total Orders */}
                      <div className="p-4 bg-zinc-950 border border-amber-500/40 rounded-2xl space-y-1.5 shadow-md">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 block">Today's Orders ({report.todayDateStr})</span>
                        <div className="text-3xl font-mono font-black text-amber-400">
                          {report.todayOrdersCount} <span className="text-xs font-normal text-zinc-400">orders</span>
                        </div>
                        <p className="text-[10px] text-zinc-500">Orders created today</p>
                      </div>

                      {/* 2. This Month's Total Orders */}
                      <div className="p-4 bg-zinc-950 border border-emerald-500/40 rounded-2xl space-y-1.5 shadow-md">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 block">This Month's Orders</span>
                        <div className="text-3xl font-mono font-black text-emerald-400">
                          {report.monthOrdersCount} <span className="text-xs font-normal text-zinc-400">orders</span>
                        </div>
                        <p className="text-[10px] text-zinc-500">Total orders in current month</p>
                      </div>

                      {/* 3. This Month's Total Sales */}
                      <div className="p-4 bg-zinc-950 border border-emerald-500/40 rounded-2xl space-y-1.5 shadow-md">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 block">This Month's Sales</span>
                        <div className="text-2xl font-mono font-black text-emerald-400">
                          ₹{(report.monthSalesTotal || 0).toLocaleString('en-IN')}
                        </div>
                        <p className="text-[10px] text-zinc-500">Revenue generated this month</p>
                      </div>

                      {/* 4. Total Orders Count */}
                      <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-1.5 shadow-md">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 block">Total Database Orders</span>
                        <div className="text-3xl font-mono font-black text-white">
                          {orders.length} <span className="text-xs font-normal text-zinc-400">orders</span>
                        </div>
                        <p className="text-[10px] text-zinc-500">All historical orders in DB</p>
                      </div>
                    </div>

                    {/* Status Breakdown Section */}
                    <div className="p-4 bg-zinc-950/80 border border-zinc-800 rounded-2xl space-y-3">
                      <h4 className="text-xs font-extrabold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                        <SlidersHorizontal className="w-4 h-4 text-amber-400" /> Order Status Breakdown
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-center">
                        <div className="p-3 bg-zinc-900 border border-amber-500/30 rounded-xl">
                          <div className="text-[10px] font-bold text-amber-400 uppercase">Pending</div>
                          <div className="text-xl font-mono font-black text-white mt-1">{report.pendingCount}</div>
                        </div>
                        <div className="p-3 bg-zinc-900 border border-blue-500/30 rounded-xl">
                          <div className="text-[10px] font-bold text-blue-400 uppercase">Confirmed</div>
                          <div className="text-xl font-mono font-black text-white mt-1">{report.confirmedCount}</div>
                        </div>
                        <div className="p-3 bg-zinc-900 border border-purple-500/30 rounded-xl">
                          <div className="text-[10px] font-bold text-purple-400 uppercase">Shipped</div>
                          <div className="text-xl font-mono font-black text-white mt-1">{report.shippedCount}</div>
                        </div>
                        <div className="p-3 bg-zinc-900 border border-emerald-500/30 rounded-xl">
                          <div className="text-[10px] font-bold text-emerald-400 uppercase">Delivered</div>
                          <div className="text-xl font-mono font-black text-white mt-1">{report.deliveredCount}</div>
                        </div>
                        <div className="p-3 bg-zinc-900 border border-red-500/30 rounded-xl">
                          <div className="text-[10px] font-bold text-red-400 uppercase">Cancelled</div>
                          <div className="text-xl font-mono font-black text-white mt-1">{report.cancelledCount}</div>
                        </div>
                      </div>
                    </div>

                    {/* Date-wise Order Count Breakdown Table */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-extrabold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-amber-400" /> Date-Wise Order Counts ({report.dateWiseList.length} dates)
                      </h4>
                      <div className="border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-950">
                        <div className="max-h-60 overflow-y-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead className="bg-zinc-900 text-zinc-400 font-bold uppercase text-[10px] sticky top-0 border-b border-zinc-800">
                              <tr>
                                <th className="p-3">Order Date</th>
                                <th className="p-3">Total Orders Count</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/60 text-zinc-300 font-mono">
                              {report.dateWiseList.length === 0 ? (
                                <tr>
                                  <td colSpan={2} className="p-4 text-center text-zinc-500">No orders date history found.</td>
                                </tr>
                              ) : (
                                report.dateWiseList.map((item, idx) => (
                                  <tr key={idx} className="hover:bg-zinc-900/50 transition-colors">
                                    <td className="p-3 font-semibold text-white">{item.dateStr}</td>
                                    <td className="p-3 font-bold text-amber-400">{item.count} orders</td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end px-6 py-3 border-t border-zinc-800 bg-zinc-950/80">
              <button
                type="button"
                onClick={() => setShowReportsModal(false)}
                className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-xl transition-all"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Admin Control Panel & Filters Overlay Modal ───────────────────────── */}
      {showControlPanelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 animate-fadeIn">
          <div className="relative w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden text-zinc-100 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/80">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
                  <SlidersHorizontal className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-white tracking-wider flex items-center gap-2">
                    ADMIN CONTROL PANEL &amp; FILTERS
                  </h3>
                  <p className="text-xs text-zinc-400">Search orders, filter by status, view reports &amp; stock controls</p>
                </div>
              </div>

              <button
                onClick={() => setShowControlPanelModal(false)}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
              
              {/* Navigation Tabs Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-zinc-950/80 border border-zinc-800 rounded-2xl">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => {
                      setActiveTab('orders');
                    }}
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
                    onClick={() => {
                      setActiveTab('inquiries');
                    }}
                    className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all border ${
                      activeTab === 'inquiries'
                        ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-md'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                    }`}
                  >
                    <List className="w-4 h-4" />
                    <span>Customer Inquiries</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('products');
                    }}
                    className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all border ${
                      activeTab === 'products'
                        ? 'bg-red-600 text-white border-red-500 shadow-md'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Stock Control</span>
                  </button>
                </div>

                <button
                  onClick={() => window.location.reload()}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${(fetchingOrders || fetchingInquiries || fetchingProductsList) ? 'animate-spin text-amber-400' : ''}`} /> Refresh
                </button>
              </div>

              {/* Search Bar */}
              <div className="p-4 bg-zinc-950/60 border border-zinc-800 rounded-2xl space-y-3">
                <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">Search Customer Orders:</span>
                <form onSubmit={(e) => { handleSearchSubmit(e); setShowControlPanelModal(false); }} className="flex items-center gap-2">
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
              </div>

              {/* Filter Tabs Section */}
              <div className="p-4 bg-zinc-950/60 border border-zinc-800 rounded-2xl space-y-3">
                <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">Filter Orders by Status:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {['New Order', 'Processing', 'Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled', 'All'].map((st) => (
                    <button
                      key={st}
                      onClick={() => {
                        setStatusFilter(st);
                        setShowControlPanelModal(false);
                      }}
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

              {/* Action Tools & Features */}
              <div className="p-4 bg-zinc-950/60 border border-zinc-800 rounded-2xl space-y-3">
                <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">Admin Tools &amp; Reports:</span>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      setShowControlPanelModal(false);
                      setShowReportsModal(true);
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-zinc-950 font-black text-xs rounded-xl flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-zinc-950" />
                    <span>Open Statistics Reports</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowSalesReport(!showSalesReport)}
                    className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <TrendingUp className="w-4 h-4 text-amber-400" />
                    <span>{showSalesReport ? 'Hide Sales Report Cards' : 'Show Sales Report Cards'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowAdminDeleteControls(!showAdminDeleteControls)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                      showAdminDeleteControls
                        ? 'bg-red-500/20 text-red-300 border-red-500/50'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                    }`}
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                    <span>{showAdminDeleteControls ? 'Delete Mode: ON' : 'Delete Mode: OFF'}</span>
                  </button>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end px-6 py-3 border-t border-zinc-800 bg-zinc-950/80">
              <button
                type="button"
                onClick={() => setShowControlPanelModal(false)}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold text-xs rounded-xl shadow-md transition-all"
              >
                Apply &amp; Close Panel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
