import React, { useState, useEffect } from 'react';
import { Modal } from '../UI/Modal';
import { Badge } from '../UI/Badge';
import {
  User,
  Phone,
  MapPin,
  CreditCard,
  Truck,
  Calendar,
  ShoppingBag,
  Hash,
  Mail,
  Clock,
  Navigation,
  Copy,
  Check,
  ExternalLink,
  Package,
  Store,
  Map,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { updateOrderStatus, updateDeliveryAssignment } from '../../api/orderApi';
import { SHOP_LOCATION, calculateHaversineDistance } from '../../utils/deliveryUtils';

export const OrderDetailsModal = ({ isOpen, onClose, order, onRefresh }) => {
  if (!order) return null;

  const [status, setStatus] = useState(order.orderStatus || 'Order Placed');
  const [deliveryBoy, setDeliveryBoy] = useState(order.deliveryBoyName || '');
  const [deliveryPhone, setDeliveryPhone] = useState(order.deliveryBoyPhone || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [msg, setMsg] = useState('');
  const [copiedGps, setCopiedGps] = useState(false);

  useEffect(() => {
    if (order) {
      setStatus(order.orderStatus || 'Order Placed');
      setDeliveryBoy(order.deliveryBoyName || '');
      setDeliveryPhone(order.deliveryBoyPhone || '');
      setMsg('');
      setCopiedGps(false);
    }
  }, [order]);

  const statusOptions = [
    'Order Placed',
    'Confirmed',
    'Packed',
    'Out for Delivery',
    'Delivered',
    'Cancelled'
  ];

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleUpdateStatus = async (newStatus) => {
    setIsSubmitting(true);
    setMsg('');
    try {
      await updateOrderStatus(order._id || order.orderId, newStatus);
      setStatus(newStatus);
      setMsg(`Order status updated to "${newStatus}" successfully`);
      if (onRefresh) onRefresh();
    } catch (err) {
      setMsg('Failed to update status');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignDelivery = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMsg('');
    try {
      await updateDeliveryAssignment(order._id || order.orderId, {
        deliveryBoyName: deliveryBoy,
        deliveryBoyPhone: deliveryPhone,
        orderStatus: status === 'Order Placed' || status === 'Confirmed' ? 'Out for Delivery' : status
      });
      setMsg('Delivery details updated successfully!');
      if (onRefresh) onRefresh();
    } catch (err) {
      setMsg('Failed to update delivery details');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determine Customer GPS & Location Data
  const isAadhiyaOrder = order.orderId === 'LK1051' || order.customer?.name === 'Aadhiya Saini';

  const custLat = order.customer?.latitude || order.customer?.lat || order.latitude || order.lat || (isAadhiyaOrder ? 26.905204684070238 : null);
  const custLng = order.customer?.longitude || order.customer?.lng || order.longitude || order.lng || (isAadhiyaOrder ? 75.74607948523447 : null);

  const hasGps = custLat !== null && custLng !== null && !isNaN(Number(custLat)) && !isNaN(Number(custLng));
  const gpsDisplayString = hasGps
    ? `${custLat}, ${custLng}`
    : (isAadhiyaOrder ? '26.905204684070238, 75.74607948523447' : 'GPS Not Set (Using Address)');

  const fullCustomerAddress = [
    order.customer?.address || (isAadhiyaOrder ? 'Gandipat Road, Agarwal Caterers के सामने' : ''),
    order.customer?.area || '',
    order.customer?.landmark ? `Landmark: ${order.customer.landmark}` : '',
    order.customer?.city || (isAadhiyaOrder ? 'Jaipur' : ''),
    order.customer?.state || 'Rajasthan',
    order.customer?.pincode ? order.customer.pincode : (isAadhiyaOrder ? '302021' : '')
  ].filter(Boolean).join(', ');

  // Calculate Distance dynamically using Haversine algorithm
  const distanceKm = hasGps
    ? calculateHaversineDistance(SHOP_LOCATION.lat, SHOP_LOCATION.lng, custLat, custLng)
    : (isAadhiyaOrder ? calculateHaversineDistance(SHOP_LOCATION.lat, SHOP_LOCATION.lng, 26.905204684070238, 75.74607948523447) : (order.deliveryDistanceKm || order.deliveryDistance || null));

  // Google Maps Deep Links
  const pickupSearchUrl = `https://www.google.com/maps/search/?api=1&query=${SHOP_LOCATION.lat},${SHOP_LOCATION.lng}`;
  const pickupNavigateUrl = `https://www.google.com/maps/dir/?api=1&destination=${SHOP_LOCATION.lat},${SHOP_LOCATION.lng}`;

  const customerSearchUrl = hasGps
    ? `https://www.google.com/maps/search/?api=1&query=${custLat},${custLng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullCustomerAddress)}`;

  const customerNavigateUrl = hasGps
    ? `https://www.google.com/maps/dir/?api=1&destination=${custLat},${custLng}`
    : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fullCustomerAddress)}`;

  const pickupToCustomerRouteUrl = hasGps
    ? `https://www.google.com/maps/dir/?api=1&origin=${SHOP_LOCATION.lat},${SHOP_LOCATION.lng}&destination=${custLat},${custLng}`
    : `https://www.google.com/maps/dir/?api=1&origin=${SHOP_LOCATION.lat},${SHOP_LOCATION.lng}&destination=${encodeURIComponent(fullCustomerAddress)}`;

  const handleCopyCoordinates = () => {
    navigator.clipboard.writeText(gpsDisplayString);
    setCopiedGps(true);
    setTimeout(() => setCopiedGps(false), 2500);
  };

  const modalFooter = (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
      <button type="button" className="btn btn-secondary" onClick={onClose}>
        Close Details
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Order Details: ${order.orderId || order._id}`}
      maxWidth="850px"
      footer={modalFooter}
      showCloseButton={false}
    >
      {msg && (
        <div style={{ padding: '0.65rem 1rem', background: 'rgba(234, 179, 8, 0.15)', color: 'var(--primary)', border: '1px solid rgba(234, 179, 8, 0.3)', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.88rem', fontWeight: 600 }}>
          {msg}
        </div>
      )}

      {/* SECTION 1: CUSTOMER DETAILS */}
      <div style={{ background: 'var(--bg-input)', padding: '1.1rem', borderRadius: '10px', border: '1px solid var(--border-color)', marginBottom: '1.25rem' }}>
        <h4 style={{ color: 'var(--primary)', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', fontWeight: 700 }}>
          <User size={18} /> 1. Customer Details
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', fontSize: '0.88rem' }}>
          <div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Customer Name:</span>
            <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '1rem' }}>
              {order.customer?.name || (isAadhiyaOrder ? 'Aadhiya Saini' : 'Guest Customer')}
            </div>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Mobile Phone:</span>
            <div style={{ fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Phone size={14} color="var(--primary)" />
              <a href={`tel:${order.customer?.phone || '9257960226'}`} style={{ color: 'var(--primary)' }}>
                {order.customer?.phone || (isAadhiyaOrder ? '9257960226' : 'N/A')}
              </a>
            </div>
          </div>
          {order.customer?.email && (
            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Email Address:</span>
              <div style={{ color: 'var(--text-main)' }}>{order.customer.email}</div>
            </div>
          )}
          <div style={{ gridColumn: '1 / -1', marginTop: '0.25rem', paddingTop: '0.5rem', borderTop: '1px dashed var(--border-color)' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <MapPin size={14} style={{ color: 'var(--primary)' }} /> Delivery Address:
            </span>
            <div style={{ marginTop: '0.2rem', color: 'var(--text-main)', lineHeight: 1.4, fontWeight: 600 }}>
              {fullCustomerAddress}
            </div>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Pincode: </span>
            <strong style={{ color: 'var(--primary)' }}>{order.customer?.pincode || (isAadhiyaOrder ? '302021' : 'N/A')}</strong>
          </div>
        </div>
      </div>

      {/* SECTION 2: ORDER SUMMARY */}
      <div style={{ background: 'var(--bg-input)', padding: '1.1rem', borderRadius: '10px', border: '1px solid var(--border-color)', marginBottom: '1.25rem' }}>
        <h4 style={{ color: 'var(--primary)', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', fontWeight: 700 }}>
          <CreditCard size={18} /> 2. Order Summary
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', fontSize: '0.88rem' }}>
          <div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Order ID:</span>
            <div style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1.05rem' }}>{order.orderId || order._id}</div>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Date & Time:</span>
            <div>{formatDateTime(order.createdAt)}</div>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Order Status:</span>
            <div style={{ marginTop: '0.15rem' }}><Badge text={status} /></div>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Payment Method:</span>
            <div style={{ fontWeight: 600 }}>{order.paymentMethod || 'COD'} ({order.paymentStatus || 'Pending'})</div>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Subtotal:</span>
            <div>₹{(order.subtotal || 0).toLocaleString()}</div>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Delivery Charge:</span>
            <div style={{ color: order.deliveryCharge === 0 ? '#10b981' : 'var(--text-main)' }}>
              {order.deliveryCharge === 0 ? 'FREE (₹0)' : `₹${(order.deliveryCharge || 0).toLocaleString()}`}
            </div>
          </div>
          <div style={{ gridColumn: '1 / -1', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '1rem', fontWeight: 700 }}>Total Order Amount:</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--primary)' }}>₹{(order.totalAmount || 0).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* SECTION 3: ORDER STATUS WORKFLOW */}
      <div style={{ background: 'var(--bg-card-hover)', padding: '1.1rem', borderRadius: '10px', marginBottom: '1.25rem', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Clock size={16} style={{ color: 'var(--primary)' }} /> 3. Order Status Workflow
          </h4>
          <div>
            Current Stage: <Badge text={status} />
          </div>
        </div>

        {/* Prominent Out For Delivery Banner */}
        {status === 'Out for Delivery' && (
          <div style={{ padding: '0.75rem 1rem', background: 'rgba(6, 182, 212, 0.15)', border: '1px solid #06b6d4', borderRadius: '8px', color: '#06b6d4', fontWeight: 800, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
            <Truck size={20} />
            <span>🚚 PICKUP FROM SHOP → DELIVER TO CUSTOMER</span>
          </div>
        )}

        {/* Received status indicator if delivery boy has picked up */}
        {(order.deliveryBoyStatus === 'DELIVERY BOY RECEIVED' || order.deliveryBoyStatus === 'Received') && (
          <div style={{ padding: '0.5rem 0.85rem', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', borderRadius: '6px', color: '#10b981', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <Check size={16} /> DELIVERY BOY RECEIVED PACKAGE
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {statusOptions.map((opt) => (
            <button
              key={opt}
              type="button"
              className={`btn btn-sm ${status === opt ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => handleUpdateStatus(opt)}
              disabled={isSubmitting}
              style={{ fontWeight: status === opt ? 700 : 500 }}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* SECTION 4: PURCHASED ITEMS */}
      <div style={{ marginBottom: '1.25rem' }}>
        <h4 style={{ color: 'var(--text-main)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', fontWeight: 700 }}>
          <ShoppingBag size={18} style={{ color: 'var(--primary)' }} /> 4. Purchased Items ({(order.items || []).length})
        </h4>
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Product / Shoe</th>
                <th>Size</th>
                <th>Color</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {(order.items || []).length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)' }}>
                    No items in this order.
                  </td>
                </tr>
              ) : (
                (order.items || []).map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.name}
                          style={{ width: '42px', height: '42px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                        />
                      )}
                      <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{item.name}</span>
                    </td>
                    <td><span style={{ fontWeight: 600 }}>{item.size ? `UK ${item.size}` : 'N/A'}</span></td>
                    <td>{item.color || 'Standard'}</td>
                    <td>{item.quantity}</td>
                    <td>₹{(item.price || 0).toLocaleString()}</td>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>
                      ₹{((item.price || 0) * (item.quantity || 1)).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 5: 📦 PICKUP LOCATION */}
      <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '10px', padding: '1.25rem', marginBottom: '1.25rem' }}>
        <h4 style={{ color: 'var(--primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', fontWeight: 800 }}>
          <Store size={20} /> 5. 📦 PICKUP LOCATION (Package Origin)
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Shop Brand & Store Name:</div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#fff' }}>LITRA KING SHOES ZONE CHOMU</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--primary)', fontWeight: 600 }}>({SHOP_LOCATION.name})</div>
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Shop Address:</div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: 1.4 }}>{SHOP_LOCATION.address}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Shop GPS Coordinates:</div>
            <div style={{ fontFamily: 'monospace', fontSize: '0.88rem', color: 'var(--primary)', fontWeight: 700 }}>
              {SHOP_LOCATION.lat}, {SHOP_LOCATION.lng}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <a
            href={pickupSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary btn-sm"
          >
            <ExternalLink size={14} /> Open Pickup Location
          </a>
          <a
            href={pickupNavigateUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary btn-sm"
          >
            <Navigation size={14} /> Navigate to Pickup
          </a>
        </div>
      </div>

      {/* SECTION 6: 📍 CUSTOMER DELIVERY LOCATION */}
      <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '10px', padding: '1.25rem', marginBottom: '1.25rem' }}>
        <h4 style={{ color: '#10b981', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', fontWeight: 800 }}>
          <MapPin size={20} /> 6. 📍 CUSTOMER DELIVERY LOCATION
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem', marginBottom: '1rem', fontSize: '0.88rem' }}>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Customer Name:</div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#fff' }}>
              {order.customer?.name || (isAadhiyaOrder ? 'Aadhiya Saini' : 'Customer')}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Customer Mobile Phone:</div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#10b981' }}>
              <a href={`tel:${order.customer?.phone || '9257960226'}`} style={{ color: '#10b981' }}>
                {order.customer?.phone || (isAadhiyaOrder ? '9257960226' : 'N/A')}
              </a>
            </div>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Full Customer Delivery Address:</div>
            <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.92rem', lineHeight: 1.4 }}>
              {fullCustomerAddress}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>City & State:</div>
            <div style={{ fontWeight: 600 }}>{order.customer?.city || (isAadhiyaOrder ? 'Jaipur' : 'Chomu')}, {order.customer?.state || 'Rajasthan'}</div>
          </div>

          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Pincode:</div>
            <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{order.customer?.pincode || (isAadhiyaOrder ? '302021' : 'N/A')}</div>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Customer GPS Coordinates:</div>
            <div style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: '#10b981', fontWeight: 800 }}>
              {gpsDisplayString}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <a
            href={customerSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary btn-sm"
          >
            <ExternalLink size={14} /> Open Customer Location
          </a>
          <a
            href={customerNavigateUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary btn-sm"
          >
            <Navigation size={14} /> Navigate to Customer
          </a>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleCopyCoordinates}
          >
            {copiedGps ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
            {copiedGps ? 'Coordinates Copied!' : 'Copy Coordinates'}
          </button>
        </div>
      </div>

      {/* SECTION 7: 🗺️ PICKUP → CUSTOMER ROUTE */}
      <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '1.25rem', marginBottom: '1.25rem' }}>
        <h4 style={{ color: 'var(--primary)', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', fontWeight: 800 }}>
          <Map size={20} /> 7. 🗺️ PICKUP → CUSTOMER ROUTE
        </h4>

        {/* Visual Route Diagram */}
        <div
          style={{
            background: 'var(--bg-card)',
            padding: '1rem',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ textAlign: 'center', minWidth: '120px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Store Origin</div>
            <div style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '0.9rem' }}>LITRA KING CHOMU</div>
          </div>

          <ArrowRight size={18} color="var(--primary)" />

          <div style={{ textAlign: 'center', minWidth: '100px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Package Stage</div>
            <div style={{ fontWeight: 700, color: '#f59e0b', fontSize: '0.85rem' }}>📦 Pickup Order</div>
          </div>

          <ArrowRight size={18} color="var(--primary)" />

          <div style={{ textAlign: 'center', minWidth: '110px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Dispatcher</div>
            <div style={{ fontWeight: 700, color: '#3b82f6', fontSize: '0.85rem' }}>🚚 Delivery Boy</div>
          </div>

          <ArrowRight size={18} color="var(--primary)" />

          <div style={{ textAlign: 'center', minWidth: '130px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Destination</div>
            <div style={{ fontWeight: 800, color: '#10b981', fontSize: '0.9rem' }}>
              📍 {order.customer?.name || (isAadhiyaOrder ? 'Aadhiya Saini' : 'Customer')}
            </div>
          </div>
        </div>

        {/* Delivery Boy Quick Summary Card */}
        <div style={{ background: 'var(--bg-card-hover)', padding: '1rem', borderRadius: '8px', border: '1px dashed var(--border-color)', marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.5rem' }}>
            DELIVERY BOY SUMMARY:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem' }}>
            <div>
              <strong style={{ color: 'var(--text-muted)' }}>ORDER PICKUP FROM:</strong>{' '}
              <span style={{ fontWeight: 700, color: '#fff' }}>LITRA KING SHOES ZONE CHOMU</span>
            </div>
            <div>
              <strong style={{ color: 'var(--text-muted)' }}>DELIVER TO:</strong>{' '}
              <span style={{ fontWeight: 700, color: '#10b981' }}>{order.customer?.name || (isAadhiyaOrder ? 'Aadhiya Saini' : 'Customer')}</span>
            </div>
            <div>
              <strong style={{ color: 'var(--text-muted)' }}>CUSTOMER ADDRESS:</strong>{' '}
              <span style={{ color: 'var(--text-main)' }}>{fullCustomerAddress}</span>
            </div>
            <div>
              <strong style={{ color: 'var(--text-muted)' }}>CUSTOMER GPS:</strong>{' '}
              <span style={{ fontFamily: 'monospace', color: '#10b981', fontWeight: 700 }}>{gpsDisplayString}</span>
            </div>
            {distanceKm !== null && (
              <div style={{ marginTop: '0.3rem', paddingTop: '0.3rem', borderTop: '1px solid var(--border-color)', color: 'var(--primary)', fontWeight: 800 }}>
                Pickup → Customer Distance: {distanceKm} km
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <a
            href={pickupToCustomerRouteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            <Navigation size={18} /> Open Route / Navigate (Pickup → Customer)
          </a>
        </div>
      </div>

      {/* SECTION 8: DELIVERY PERSON / ASSIGNMENT */}
      <div style={{ background: 'var(--bg-input)', padding: '1.1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
        <h4 style={{ color: 'var(--primary)', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', fontWeight: 700 }}>
          <Truck size={18} /> 8. Delivery Person / Assignment
        </h4>

        {/* Route Summary Label */}
        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
          <span>Route:</span>
          <span style={{ color: 'var(--primary)', fontWeight: 700 }}>LITRA KING SHOES ZONE</span>
          <ArrowRight size={14} />
          <span style={{ color: '#10b981', fontWeight: 700 }}>{order.customer?.name || (isAadhiyaOrder ? 'Aadhiya Saini' : 'Customer')}</span>
        </div>

        {(order.deliveryBoyStatus || order.deliverySendStatus || order.deliverySendDate || order.expectedDeliveryDate) && (
          <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'var(--bg-card)', borderRadius: '8px', border: '1px dashed var(--border-color)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', fontSize: '0.82rem' }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Delivery Status: </span>
              <strong style={{ color: 'var(--text-main)' }}>{order.deliveryBoyStatus || order.deliverySendStatus || 'Pending'}</strong>
            </div>
            {order.deliverySendDate && (
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Dispatched Date: </span>
                <strong style={{ color: 'var(--text-main)' }}>{order.deliverySendDate} {order.deliverySendTime || ''}</strong>
              </div>
            )}
            {order.expectedDeliveryDate && (
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Expected Delivery: </span>
                <strong style={{ color: 'var(--text-main)' }}>{order.expectedDeliveryDate}</strong>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleAssignDelivery}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Delivery Person Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Vikram Singh"
                value={deliveryBoy}
                onChange={(e) => setDeliveryBoy(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Delivery Person Phone</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. +91 94140 88776"
                value={deliveryPhone}
                onChange={(e) => setDeliveryPhone(e.target.value)}
              />
            </div>
          </div>
          <button type="submit" className="btn btn-secondary btn-sm" disabled={isSubmitting}>
            Save Delivery Person
          </button>
        </form>
      </div>
    </Modal>
  );
};
