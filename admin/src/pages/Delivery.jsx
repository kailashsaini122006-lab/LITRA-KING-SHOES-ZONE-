import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../components/Layout/AdminLayout';
import { Badge } from '../components/UI/Badge';
import { OrderDetailsModal } from '../components/Orders/OrderDetailsModal';
import { Search, Truck, Phone, MapPin, Calendar, Clock, UserCheck, Eye, Edit3 } from 'lucide-react';
import { fetchOrders, updateDeliveryAssignment } from '../api/orderApi';

export const Delivery = () => {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editingDelivery, setEditingDelivery] = useState(null);
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [loading, setLoading] = useState(true);

  const loadDeliveries = async () => {
    setLoading(true);
    try {
      const data = await fetchOrders();
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeliveries();
  }, []);

  const handleOpenAssignModal = (ord) => {
    setEditingDelivery(ord);
    setDriverName(ord.deliveryBoyName || '');
    setDriverPhone(ord.deliveryBoyPhone || '');
  };

  const handleSaveDeliveryPerson = async (e) => {
    e.preventDefault();
    if (!editingDelivery) return;
    await updateDeliveryAssignment(editingDelivery._id || editingDelivery.orderId, {
      deliveryBoyName: driverName,
      deliveryBoyPhone: driverPhone,
      orderStatus: editingDelivery.orderStatus === 'Order Placed' || editingDelivery.orderStatus === 'Confirmed' ? 'Out for Delivery' : editingDelivery.orderStatus
    });
    setEditingDelivery(null);
    loadDeliveries();
  };

  const filteredDeliveries = orders.filter((o) => {
    const matchesSearch =
      o.orderId?.toLowerCase().includes(search.toLowerCase()) ||
      o.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
      o.customer?.phone?.includes(search) ||
      o.deliveryBoyName?.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  return (
    <AdminLayout title="Delivery & Dispatch Management">
      {/* Search Toolbar */}
      <div className="page-toolbar">
        <div className="search-box">
          <Search size={18} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search Order ID, customer phone, address or driver name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Deliveries Table */}
      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer Phone</th>
              <th>Delivery Address</th>
              <th>Delivery Estimate</th>
              <th>Assigned Delivery Person</th>
              <th>Delivery Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDeliveries.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                  No active dispatches or delivery records found.
                </td>
              </tr>
            ) : (
              filteredDeliveries.map((ord) => (
                <tr key={ord._id || ord.orderId}>
                  <td style={{ fontWeight: 700, color: 'var(--primary)' }}>
                    {ord.orderId || ord._id}
                  </td>

                  <td>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Phone size={14} color="var(--primary)" />
                      {ord.customer?.phone || 'N/A'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {ord.customer?.name || 'Customer'}
                    </div>
                  </td>

                  <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: '220px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.3rem' }}>
                      <MapPin size={12} style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {ord.customer?.address ? `${ord.customer.address}, ${ord.customer.city || ''} ${ord.customer.pincode || ''}` : 'N/A'}
                      </span>
                    </div>
                  </td>

                  <td style={{ fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-muted)' }}>
                      <Clock size={14} />
                      {ord.estimatedDeliveryTime || 'Same Day / 24 Hours'}
                    </div>
                  </td>

                  <td>
                    {ord.deliveryBoyName ? (
                      <div>
                        <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <UserCheck size={14} color="#10b981" />
                          {ord.deliveryBoyName}
                        </div>
                        {ord.deliveryBoyPhone && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {ord.deliveryBoyPhone}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: 'var(--status-pending)', fontStyle: 'italic' }}>
                        Not Assigned
                      </span>
                    )}
                  </td>

                  <td>
                    <Badge text={ord.orderStatus || 'Pending'} />
                  </td>

                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleOpenAssignModal(ord)}
                        title="Assign / Update Delivery Boy"
                      >
                        <Edit3 size={14} /> Assign Driver
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setSelectedOrder(ord)}
                      >
                        <Eye size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Assign Delivery Boy Inline Form Modal */}
      {editingDelivery && (
        <div className="modal-overlay" onClick={() => setEditingDelivery(null)}>
          <div className="modal-container" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Assign Delivery Person</h3>
            </div>
            <form onSubmit={handleSaveDeliveryPerson} className="modal-body">
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Order ID: <strong style={{ color: 'var(--primary)' }}>{editingDelivery.orderId || editingDelivery._id}</strong>
              </p>
              <div className="form-group">
                <label className="form-label">Delivery Person Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Vikram Singh"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Delivery Person Mobile Phone</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. +91 94140 88776"
                  value={driverPhone}
                  onChange={(e) => setDriverPhone(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingDelivery(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <OrderDetailsModal
        isOpen={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        order={selectedOrder}
        onRefresh={loadDeliveries}
      />
    </AdminLayout>
  );
};
