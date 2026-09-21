import React, { useState } from 'react';
import { Modal } from '../UI/Modal';
import { Badge } from '../UI/Badge';
import { User, Phone, MapPin, CreditCard, Truck, Calendar, ShoppingBag } from 'lucide-react';
import { updateOrderStatus, updateDeliveryAssignment } from '../../api/orderApi';

export const OrderDetailsModal = ({ isOpen, onClose, order, onRefresh }) => {
  if (!order) return null;

  const [status, setStatus] = useState(order.orderStatus || 'Order Placed');
  const [deliveryBoy, setDeliveryBoy] = useState(order.deliveryBoyName || '');
  const [deliveryPhone, setDeliveryPhone] = useState(order.deliveryBoyPhone || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [msg, setMsg] = useState('');

  const statusOptions = [
    'Order Placed',
    'Confirmed',
    'Packed',
    'Out for Delivery',
    'Delivered',
    'Cancelled'
  ];

  const handleUpdateStatus = async (newStatus) => {
    setIsSubmitting(true);
    try {
      await updateOrderStatus(order._id || order.orderId, newStatus);
      setStatus(newStatus);
      setMsg('Order status updated successfully');
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
    try {
      await updateDeliveryAssignment(order._id || order.orderId, {
        deliveryBoyName: deliveryBoy,
        deliveryBoyPhone: deliveryPhone,
        orderStatus: status === 'Order Placed' || status === 'Confirmed' ? 'Out for Delivery' : status
      });
      setMsg('Delivery person assigned successfully!');
      if (onRefresh) onRefresh();
    } catch (err) {
      setMsg('Failed to assign delivery person');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Order Details: ${order.orderId || order._id}`}
      maxWidth="750px"
    >
      {msg && (
        <div style={{ padding: '0.6rem 1rem', background: 'rgba(234, 179, 8, 0.15)', color: 'var(--primary)', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.85rem' }}>
          {msg}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        {/* Customer Information */}
        <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
          <h4 style={{ color: 'var(--primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }}>
            <User size={18} /> Customer Details
          </h4>
          <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>{order.customer?.name || 'Guest Customer'}</p>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.3rem' }}>
            <Phone size={14} /> {order.customer?.phone || 'No phone'}
          </p>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'flex-start', gap: '0.4rem', marginTop: '0.3rem' }}>
            <MapPin size={14} style={{ flexShrink: 0, marginTop: '3px' }} /> 
            {order.customer?.address ? `${order.customer.address}, ${order.customer.city || ''} ${order.customer.pincode || ''}` : 'Address unavailable'}
          </p>
        </div>

        {/* Order & Payment Meta */}
        <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
          <h4 style={{ color: 'var(--primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }}>
            <CreditCard size={18} /> Order Summary
          </h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Calendar size={14} /> Date: {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Today'}
          </p>
          <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Status:</span>
            <Badge text={status} />
          </div>
          <div style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
            <span>Payment: </span>
            <strong style={{ color: 'var(--text-main)' }}>{order.paymentMethod || 'COD'}</strong> ({order.paymentStatus || 'Pending'})
          </div>
          <div style={{ marginTop: '0.5rem', fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)' }}>
            Total: ₹{(order.totalAmount || 0).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Status Action Workflow Stepper */}
      <div style={{ background: 'var(--bg-card-hover)', padding: '1rem', borderRadius: '10px', marginBottom: '1.5rem', border: '1px solid var(--border-color)' }}>
        <h4 style={{ fontSize: '0.9rem', marginBottom: '0.75rem', fontWeight: 600 }}>Update Order Status</h4>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {statusOptions.map((opt) => (
            <button
              key={opt}
              className={`btn btn-sm ${status === opt ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => handleUpdateStatus(opt)}
              disabled={isSubmitting}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Ordered Products Table */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ color: 'var(--text-main)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }}>
          <ShoppingBag size={18} /> Purchased Items
        </h4>
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Size</th>
                <th>Color</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {(order.items || []).map((item, idx) => (
                <tr key={idx}>
                  <td style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px' }}
                      />
                    )}
                    <span style={{ fontWeight: 600 }}>{item.name}</span>
                  </td>
                  <td>{item.size || 'N/A'}</td>
                  <td>{item.color || 'Standard'}</td>
                  <td>{item.quantity}</td>
                  <td>₹{(item.price || 0).toLocaleString()}</td>
                  <td style={{ fontWeight: 700, color: 'var(--primary)' }}>
                    ₹{((item.price || 0) * (item.quantity || 1)).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delivery Assignment */}
      <form onSubmit={handleAssignDelivery} style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
        <h4 style={{ color: 'var(--primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }}>
          <Truck size={18} /> Assign / Update Delivery Person
        </h4>
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
    </Modal>
  );
};
