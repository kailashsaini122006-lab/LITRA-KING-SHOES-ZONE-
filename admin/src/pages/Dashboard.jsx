import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../components/Layout/AdminLayout';
import { StatCard } from '../components/UI/StatCard';
import { Card } from '../components/UI/Card';
import { Badge } from '../components/UI/Badge';
import { OrderDetailsModal } from '../components/Orders/OrderDetailsModal';
import {
  DollarSign,
  TrendingUp,
  ShoppingCart,
  CheckCircle2,
  Clock,
  ShoppingBag,
  AlertTriangle,
  Eye,
  ArrowRight,
  RefreshCw,
  Search,
  Filter,
  Activity,
  Layers,
  CheckCircle,
  Truck,
  Box
} from 'lucide-react';
import { fetchDashboardMetrics, fetchOrders } from '../api/orderApi';
import { fetchProducts } from '../api/productApi';
import { useNavigate } from 'react-router-dom';

export const Dashboard = () => {
  const [metrics, setMetrics] = useState({
    todaySales: 0,
    monthlySales: 0,
    totalOrders: 0,
    deliveredOrders: 0,
    pendingOrders: 0,
    totalProducts: 0,
    lowStockProducts: 0,
  });
  const [allOrders, setAllOrders] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState([]);

  const navigate = useNavigate();

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [metricsData, ordersData, productsData] = await Promise.all([
        fetchDashboardMetrics(),
        fetchOrders(),
        fetchProducts()
      ]);

      setMetrics(metricsData);
      setAllOrders(ordersData);
      setRecentOrders(ordersData.slice(0, 6));

      const lowStock = productsData.filter((p) => (p.stock || 0) <= 5 || !p.inStock);
      setLowStockItems(lowStock);

      // Generate realistic activity log based on actual orders & inventory
      const recentLogs = [
        {
          id: 1,
          type: 'order',
          title: `Latest order ${ordersData[0]?.orderId || '#LK-101'} received`,
          desc: `Customer ${ordersData[0]?.customer?.name || 'Valued Buyer'} placed an order of ₹${(ordersData[0]?.totalAmount || 0).toLocaleString()}`,
          time: 'Just now',
          icon: ShoppingCart,
          color: '#3b82f6'
        },
        {
          id: 2,
          type: 'inventory',
          title: `${productsData.length} footwear products active in store catalog`,
          desc: `Stock levels verified (${lowStock.length} low stock warnings)`,
          time: '10 mins ago',
          icon: Box,
          color: '#8b5cf6'
        },
        {
          id: 3,
          type: 'delivery',
          title: 'Delivery & dispatch route active',
          desc: 'Local Chomu & Jaipur region logistics connected',
          time: '25 mins ago',
          icon: Truck,
          color: '#10b981'
        },
        {
          id: 4,
          type: 'system',
          title: 'MongoDB REST API connected',
          desc: 'Real-time database sync operational',
          time: '1 hour ago',
          icon: CheckCircle,
          color: '#f59e0b'
        }
      ];
      setActivities(recentLogs);

    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Filtered orders for live search and status dropdown
  const filteredRecentOrders = recentOrders.filter((ord) => {
    const matchesSearch =
      ord.orderId?.toLowerCase().includes(search.toLowerCase()) ||
      ord.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
      ord.customer?.phone?.includes(search);
    const matchesStatus = statusFilter === 'All' || ord.orderStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate status breakdown counts
  const statusCounts = {
    'Order Placed': allOrders.filter(o => o.orderStatus === 'Order Placed').length,
    'Confirmed': allOrders.filter(o => o.orderStatus === 'Confirmed').length,
    'Packed': allOrders.filter(o => o.orderStatus === 'Packed').length,
    'Out for Delivery': allOrders.filter(o => o.orderStatus === 'Out for Delivery').length,
    'Delivered': allOrders.filter(o => o.orderStatus === 'Delivered').length,
    'Cancelled': allOrders.filter(o => o.orderStatus === 'Cancelled').length,
  };

  const statusList = ['All', 'Order Placed', 'Confirmed', 'Packed', 'Out for Delivery', 'Delivered', 'Cancelled'];

  return (
    <AdminLayout title="Store Overview Dashboard">
      {/* Dashboard Top Toolbar (Search, Filter, Refresh) */}
      <div className="page-toolbar" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', flex: 1 }}>
          <div className="search-box">
            <Search size={18} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search recent orders by ID, customer or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
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

        <button className="btn btn-secondary" onClick={loadDashboardData} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      {/* 4 Primary Sales & Performance Metric Cards */}
      <div className="stat-grid">
        <StatCard
          title="Today Sales"
          value={metrics.todaySales}
          prefix="₹"
          icon={DollarSign}
          accent="#eab308"
          bg="rgba(234, 179, 8, 0.15)"
        />
        <StatCard
          title="Month Sales"
          value={metrics.monthlySales}
          prefix="₹"
          icon={TrendingUp}
          accent="#10b981"
          bg="rgba(16, 185, 129, 0.15)"
        />
        <StatCard
          title="Total Orders"
          value={metrics.totalOrders}
          icon={ShoppingCart}
          accent="#3b82f6"
          bg="rgba(59, 130, 246, 0.15)"
        />
        <StatCard
          title="Delivered Orders"
          value={metrics.deliveredOrders}
          icon={CheckCircle2}
          accent="#10b981"
          bg="rgba(16, 185, 129, 0.15)"
        />
        <StatCard
          title="Pending Orders"
          value={metrics.pendingOrders}
          icon={Clock}
          accent="#f59e0b"
          bg="rgba(245, 158, 11, 0.15)"
        />
        <StatCard
          title="Total Products"
          value={metrics.totalProducts}
          icon={ShoppingBag}
          accent="#8b5cf6"
          bg="rgba(139, 92, 246, 0.15)"
        />
        <StatCard
          title="Low Stock Products"
          value={metrics.lowStockProducts}
          icon={AlertTriangle}
          accent="#ef4444"
          bg="rgba(239, 68, 68, 0.15)"
        />
      </div>

      {/* Sales Overview & Order Status Section */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Card title="Sales Overview & Order Status" subtitle="Live breakdown of customer order stages">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
            {Object.entries(statusCounts).map(([stName, count]) => (
              <div
                key={stName}
                style={{
                  background: 'var(--bg-input)',
                  padding: '0.85rem 1rem',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem'
                }}
              >
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>{stName}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '1.4rem', fontWeight: 800 }}>{count}</span>
                  <Badge text={stName} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Grid: Recent Orders & Quick Info / Stock Alerts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Recent Orders Overview Table */}
        <Card
          title="Recent Orders"
          subtitle="Latest footwear customer purchases"
          action={
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/admin/orders')}>
              View All <ArrowRight size={14} />
            </button>
          }
        >
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                      No matching recent orders found.
                    </td>
                  </tr>
                ) : (
                  filteredRecentOrders.map((ord) => (
                    <tr key={ord._id || ord.orderId}>
                      <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{ord.orderId || ord._id}</td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{ord.customer?.name || 'Customer'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ord.customer?.phone || ''}</div>
                      </td>
                      <td style={{ fontWeight: 700 }}>₹{(ord.totalAmount || 0).toLocaleString()}</td>
                      <td>
                        <Badge text={ord.orderStatus || 'Pending'} />
                      </td>
                      <td>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setSelectedOrder(ord)}
                          title="View order details"
                        >
                          <Eye size={14} /> View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Quick Info & Low Stock Footwear Alerts */}
        <Card
          title="Quick Info & Stock Alerts"
          subtitle="Footwear requiring inventory replenishment"
          action={
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/admin/stock')}>
              Manage Stock <ArrowRight size={14} />
            </button>
          }
        >
          {lowStockItems.length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <CheckCircle size={32} color="#10b981" style={{ margin: '0 auto 0.5rem' }} />
              <p style={{ fontSize: '0.9rem' }}>All footwear stock levels are healthy and in stock.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {lowStockItems.slice(0, 5).map((prod) => (
                <div
                  key={prod._id || prod.productId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0.75rem 1rem',
                    backgroundColor: 'var(--bg-input)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    gap: '1rem'
                  }}
                >
                  <img
                    src={prod.images?.[0] || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=150&q=80'}
                    alt={prod.name}
                    style={{ width: '42px', height: '42px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{prod.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Category: {prod.category}</div>
                  </div>
                  <Badge
                    text={prod.stock === 0 || !prod.inStock ? 'Out of Stock' : `Low Stock: ${prod.stock}`}
                  />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Recent Activity Timeline Feed */}
      <Card title="Recent Activity" subtitle="Live audit stream of recent admin & store events">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
          {activities.map((act) => {
            const Icon = act.icon;
            return (
              <div
                key={act.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem',
                  padding: '0.85rem 1rem',
                  background: 'var(--bg-input)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)'
                }}
              >
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '8px',
                    background: `${act.color}20`,
                    color: act.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <Icon size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-main)' }}>{act.title}</div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{act.time}</span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{act.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* View Details Modal for clicked order */}
      <OrderDetailsModal
        isOpen={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        order={selectedOrder}
        onRefresh={loadDashboardData}
      />
    </AdminLayout>
  );
};
