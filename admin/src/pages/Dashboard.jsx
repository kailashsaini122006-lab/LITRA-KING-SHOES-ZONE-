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
  ArrowRight
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
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const metricsData = await fetchDashboardMetrics();
      const ordersData = await fetchOrders();
      const productsData = await fetchProducts();

      setMetrics(metricsData);
      setRecentOrders(ordersData.slice(0, 5));
      setLowStockItems(productsData.filter((p) => (p.stock || 0) <= 5 || !p.inStock));
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  return (
    <AdminLayout title="Store Overview Dashboard">
      {/* 7 Core Metric Cards */}
      <div className="stat-grid">
        <StatCard
          title="Today's Sales"
          value={metrics.todaySales}
          prefix="₹"
          icon={DollarSign}
          accent="#eab308"
          bg="rgba(234, 179, 8, 0.15)"
        />
        <StatCard
          title="Monthly Sales"
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Recent Orders Overview */}
        <Card
          title="Recent Store Orders"
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
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      No recent orders recorded yet.
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((ord) => (
                    <tr key={ord._id || ord.orderId}>
                      <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{ord.orderId || ord._id}</td>
                      <td>{ord.customer?.name || 'Customer'}</td>
                      <td style={{ fontWeight: 600 }}>₹{(ord.totalAmount || 0).toLocaleString()}</td>
                      <td>
                        <Badge text={ord.orderStatus || 'Pending'} />
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
        </Card>

        {/* Low Stock Alerts */}
        <Card
          title="Low Stock Footwear Alerts"
          subtitle="Products requiring inventory re-stocking"
          action={
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/admin/stock')}>
              Manage Stock <ArrowRight size={14} />
            </button>
          }
        >
          {lowStockItems.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>All footwear stock levels are healthy.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {lowStockItems.map((prod) => (
                <div
                  key={prod._id || prod.productId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyConstraint: 'space-between',
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
                    style={{ width: '42px', height: '42px', objectFit: 'cover', borderRadius: '6px' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{prod.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{prod.category}</div>
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

      <OrderDetailsModal
        isOpen={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        order={selectedOrder}
        onRefresh={loadDashboardData}
      />
    </AdminLayout>
  );
};
