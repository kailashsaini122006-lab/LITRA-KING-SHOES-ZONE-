import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../components/Layout/AdminLayout';
import { Search, User, Phone, Mail, MapPin, ShoppingBag, Calendar } from 'lucide-react';
import { fetchOrders } from '../api/orderApi';

export const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadCustomerDirectory = async () => {
    setLoading(true);
    try {
      const orders = await fetchOrders();
      // Aggregate customer information by phone/email
      const map = {};
      orders.forEach((ord) => {
        const phone = ord.customer?.phone || 'Unknown Phone';
        if (!map[phone]) {
          map[phone] = {
            name: ord.customer?.name || 'Valued Customer',
            phone: phone,
            email: ord.customer?.email || 'N/A',
            address: ord.customer?.address ? `${ord.customer.address}, ${ord.customer.city || ''}` : 'N/A',
            totalOrders: 0,
            totalSpent: 0,
            lastOrderDate: ord.createdAt
          };
        }
        map[phone].totalOrders += 1;
        map[phone].totalSpent += (ord.totalAmount || 0);
        if (ord.createdAt && new Date(ord.createdAt) > new Date(map[phone].lastOrderDate)) {
          map[phone].lastOrderDate = ord.createdAt;
        }
      });
      setCustomers(Object.values(map));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomerDirectory();
  }, []);

  const filteredCustomers = customers.filter((c) => {
    return (
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.email.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <AdminLayout title="Users & Customer Directory">
      {/* Search Toolbar */}
      <div className="page-toolbar">
        <div className="search-box">
          <Search size={18} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search users by name, phone or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Customer Directory Table */}
      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Customer Name</th>
              <th>Phone Number</th>
              <th>Email Address</th>
              <th>Primary Address</th>
              <th>Total Orders</th>
              <th>Total Spent</th>
              <th>Last Order Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                  No customer records found.
                </td>
              </tr>
            ) : (
              filteredCustomers.map((cust, idx) => (
                <tr key={idx}>
                  <td>
                    <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <User size={16} color="var(--primary)" />
                      {cust.name}
                    </div>
                  </td>

                  <td>
                    <div style={{ fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Phone size={14} color="var(--text-muted)" />
                      {cust.phone}
                    </div>
                  </td>

                  <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {cust.email}
                  </td>

                  <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: '200px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.3rem' }}>
                      <MapPin size={12} style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {cust.address}
                      </span>
                    </div>
                  </td>

                  <td style={{ fontWeight: 700 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                      <ShoppingBag size={14} color="var(--primary)" />
                      {cust.totalOrders} order(s)
                    </span>
                  </td>

                  <td style={{ fontWeight: 700, color: '#10b981', fontSize: '0.98rem' }}>
                    ₹{cust.totalSpent.toLocaleString()}
                  </td>

                  <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    {cust.lastOrderDate ? new Date(cust.lastOrderDate).toLocaleDateString() : 'N/A'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
};
