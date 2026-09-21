import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../components/Layout/AdminLayout';
import { Badge } from '../components/UI/Badge';
import { OrderDetailsModal } from '../components/Orders/OrderDetailsModal';
import { Search, Eye, Filter, RefreshCw, Calendar, Phone, MapPin } from 'lucide-react';
import { fetchOrders, updateOrderStatus } from '../api/orderApi';

export const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const statusList = ['All', 'Order Placed', 'Confirmed', 'Packed', 'Out for Delivery', 'Delivered', 'Cancelled'];

  const loadOrders = async () => {
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
    loadOrders();
  }, []);

  const handleQuickStatusChange = async (orderId, newStatus) => {
    await updateOrderStatus(orderId, newStatus);
    loadOrders();
  };

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.orderId?.toLowerCase().includes(search.toLowerCase()) ||
      o.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
      o.customer?.phone?.includes(search);
    const matchesStatus = statusFilter === 'All' || o.orderStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AdminLayout title="Customer Orders Management">
      {/* Search & Filter Toolbar */}
      <div className="page-toolbar">
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', flex: 1 }}>
          <div className="search-box">
            <Search size={18} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search order ID, customer name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={16} color="var(--text-muted)" />
            <select
              className="form-control"
              style={{ width: 'auto', minWidth: '170px' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {statusList.map((st) => (
                <option key={st} value={st}>{st === 'All' ? 'All Order Statuses' : st}</option>
              ))}
            </select>
          </div>
        </div>

        <button className="btn btn-secondary" onClick={loadOrders}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Orders List Table */}
      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Order ID & Date</th>
              <th>Customer</th>
              <th>Products & Qty</th>
              <th>Total Amount</th>
              <th>Payment</th>
              <th>Delivery Address</th>
              <th>Order Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                  No customer orders match your query.
                </td>
              </tr>
            ) : (
              filteredOrders.map((ord) => (
                <tr key={ord._id || ord.orderId}>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{ord.orderId || ord._id}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.15rem' }}>
                      <Calendar size={12} /> {ord.createdAt ? new Date(ord.createdAt).toLocaleDateString() : 'Today'}
                    </div>
                  </td>

                  <td>
                    <div style={{ fontWeight: 600 }}>{ord.customer?.name || 'Customer'}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <Phone size={12} /> {ord.customer?.phone || 'N/A'}
                    </div>
                  </td>

                  <td>
                    <div style={{ maxWidth: '200px' }}>
                      {(ord.items || []).map((it, idx) => (
                        <div key={idx} style={{ fontSize: '0.82rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          • {it.name} ({it.quantity}x UK{it.size})
                        </div>
                      ))}
                    </div>
                  </td>

                  <td style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>
                    ₹{(ord.totalAmount || 0).toLocaleString()}
                  </td>

                  <td>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{ord.paymentMethod || 'COD'}</div>
                    <span style={{
                      fontSize: '0.72rem',
                      color: ord.paymentStatus === 'Paid' ? '#10b981' : '#f59e0b',
                      fontWeight: 600
                    }}>
                      {ord.paymentStatus || 'Pending'}
                    </span>
                  </td>

                  <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: '180px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.3rem' }}>
                      <MapPin size={12} style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {ord.customer?.address ? `${ord.customer.address}, ${ord.customer.city || ''}` : 'N/A'}
                      </span>
                    </div>
                  </td>

                  <td>
                    <select
                      className="form-control"
                      style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', fontWeight: 600, width: 'auto' }}
                      value={ord.orderStatus || 'Order Placed'}
                      onChange={(e) => handleQuickStatusChange(ord._id || ord.orderId, e.target.value)}
                    >
                      <option value="Order Placed">Order Placed</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Packed">Packed</option>
                      <option value="Out for Delivery">Out for Delivery</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </td>

                  <td>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setSelectedOrder(ord)}
                    >
                      <Eye size={14} /> Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <OrderDetailsModal
        isOpen={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        order={selectedOrder}
        onRefresh={loadOrders}
      />
    </AdminLayout>
  );
};
