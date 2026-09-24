import React, { useState, useEffect } from 'react';
import { Modal } from '../UI/Modal';
import { Badge } from '../UI/Badge';
import { User, Phone, MapPin, CreditCard, Truck, Calendar, ShoppingBag, Hash, Mail, Clock } from 'lucide-react';
import { updateOrderStatus, updateDeliveryAssignment } from '../../api/orderApi';

export const OrderDetailsModal = ({ isOpen, onClose, order, onRefresh }) => {
  if (!order) return null;

  const [status, setStatus] = useState(order.orderStatus || 'Order Placed');
  const [deliveryBoy, setDeliveryBoy] = useState(order.deliveryBoyName || '');
  const [deliveryPhone, setDeliveryPhone] = useState(order.deliveryBoyPhone || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (order) {
      setStatus(order.orderStatus || 'Order Placed');
      setDeliveryBoy(order.deliveryBoyName || '');
      setDeliveryPhone(order.deliveryBoyPhone || '');
      setMsg('');
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

  const modalFooter = (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
      <button type="button" className="btn btn-secondary" onClick={onClose}>
        Close
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Order Details: ${order.orderId || order._id}`}
      maxWidth="800px"
      footer={modalFooter}
      showCloseButton={false}
    >
      {msg && (
        <div style={{ padding: '0.65rem 1rem', background: 'rgba(234, 179, 8, 0.15)', color: 'var(--primary)', border: '1px solid rgba(234, 179, 8, 0.3)', borderRadius: '6px', marginBottom: '1.25rem', fontSize: '0.88rem', fontWeight: 600 }}>
          {msg}
        </div>
      )}

      {/* Primary Details Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        {/* Customer Information */}
        <div style={{ background: 'var(--bg-input)', padding: '1.1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
          <h4 style={{ color: 'var(--primary)', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', fontWeight: 700 }}>
            <User size={18} /> Customer Details
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.88rem' }}>
            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Customer Name:</span>
              <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.95rem' }}>{order.customer?.name || 'Guest Customer'}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-main)' }}>
              <Phone size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
              <span>{order.customer?.phone || 'No phone number'}</span>
            </div>
            {order.customer?.email && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-main)' }}>
                <Mail size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                <span>{order.customer.email}</span>
              </div>
            )}
            <div style={{ marginTop: '0.25rem', paddingTop: '0.5rem', borderTop: '1px dashed var(--border-color)' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <MapPin size={14} style={{ color: 'var(--primary)' }} /> Delivery Address:
              </span>
              <div style={{ marginTop: '0.2rem', color: 'var(--text-main)', lineHeight: 1.4 }}>
                {order.customer?.address || 'Address unavailable'}
                {order.customer?.area && `, ${order.customer.area}`}
                {order.customer?.landmark && ` (Landmark: ${order.customer.landmark})`}
                {(order.customer?.city || order.customer?.state) && (
                  <div>{`${order.customer?.city || ''}${order.customer?.state ? `, ${order.customer.state}` : ''}`}</div>
                )}
              </div>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Pincode: </span>
              <strong style={{ color: 'var(--primary)' }}>{order.customer?.pincode || 'N/A'}</strong>
            </div>
          </div>
        </div>

        {/* Order & Payment Summary */}
        <div style={{ background: 'var(--bg-input)', padding: '1.1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
          <h4 style={{ color: 'var(--primary)', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', fontWeight: 700 }}>
            <CreditCard size={18} /> Order Summary
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.88rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <Hash size={14} style={{ color: 'var(--primary)' }} />
              <span>Order ID: <strong style={{ color: 'var(--text-main)' }}>{order.orderId || order._id}</strong></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <Calendar size={14} style={{ color: 'var(--primary)' }} />
              <span>Date & Time: <strong style={{ color: 'var(--text-main)' }}>{formatDateTime(order.createdAt)}</strong></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Order Status:</span>
              <Badge text={status} />
            </div>
            <div style={{ marginTop: '0.3rem', paddingTop: '0.5rem', borderTop: '1px dashed var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Payment Method:</span>
                <strong style={{ color: 'var(--text-main)' }}>{order.paymentMethod || 'COD'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Payment Status:</span>
                <strong style={{ color: order.paymentStatus === 'Paid' ? '#10b981' : '#f59e0b' }}>
                  {order.paymentStatus || 'Pending'}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Subtotal:</span>
                <span style={{ color: 'var(--text-main)' }}>₹{(order.subtotal || 0).toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Delivery Charge:</span>
                <span style={{ color: order.deliveryCharge === 0 ? '#10b981' : 'var(--text-main)' }}>
                  {order.deliveryCharge !== undefined ? (order.deliveryCharge === 0 ? 'FREE (₹0)' : `₹${order.deliveryCharge.toLocaleString()}`) : '₹0'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', fontWeight: 800, marginTop: '0.4rem', color: 'var(--primary)', paddingTop: '0.4rem', borderTop: '1px solid var(--border-color)' }}>
                <span>Total Amount:</span>
                <span>₹{(order.totalAmount || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Order Status Section */}
      <div style={{ background: 'var(--bg-card-hover)', padding: '1.1rem', borderRadius: '10px', marginBottom: '1.5rem', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Clock size={16} style={{ color: 'var(--primary)' }} /> Order Status Workflow
          </h4>
          <div style={{ fontSize: '0.85rem' }}>
            Current: <Badge text={status} />
          </div>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
          Click any status below to update the order status:
        </p>
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

      {/* Purchased Items Table */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ color: 'var(--text-main)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', fontWeight: 700 }}>
          <ShoppingBag size={18} style={{ color: 'var(--primary)' }} /> Purchased Items ({(order.items || []).length})
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

      {/* Existing Delivery Information & Assignment */}
      <div style={{ background: 'var(--bg-input)', padding: '1.1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
        <h4 style={{ color: 'var(--primary)', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', fontWeight: 700 }}>
          <Truck size={18} /> Existing Delivery Information & Assignment
        </h4>

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

