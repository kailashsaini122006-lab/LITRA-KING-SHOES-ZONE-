import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Pages
import { Dashboard } from './pages/Dashboard';
import { Orders } from './pages/Orders';
import { Products } from './pages/Products';
import { Customers } from './pages/Customers';
import { Settings } from './pages/Settings';
import { Stock } from './pages/Stock';
import { Delivery } from './pages/Delivery';
import ProductManagement from './pages/ProductManagement';
import DailySalesReportPage from './pages/DailySalesReportPage';
import MonthlySalesReportPage from './pages/MonthlySalesReportPage';
import OrdersReportPage from './pages/OrdersReportPage';
import Login from './pages/Login';

// Modals
import SecurityModal from './components/SecurityModal';
import DataEntryModal from './components/DataEntryModal';

export default function App() {
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);
  const [isDataEntryOpen, setIsDataEntryOpen] = useState(false);
  const [accessToken, setAccessToken] = useState(() => {
    return sessionStorage.getItem('lk_access_token') || localStorage.getItem('lk_access_token') || '';
  });

  const handleAuthSuccess = (token) => {
    setAccessToken(token);
    sessionStorage.setItem('lk_access_token', token);
    setIsSecurityOpen(false);
  };

  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-[#0b0f19] text-zinc-100 font-sans">
          <Routes>
            {/* Requirement 1: Dashboard is DEFAULT when opening /admin */}
            <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/dashboard" element={<Dashboard />} />

            {/* Requirement 3 & 5: Navigation routes */}
            <Route path="/admin/orders" element={<Orders />} />
            <Route path="/admin/products" element={<Products />} />
            <Route path="/admin/users" element={<Customers />} />
            <Route path="/admin/customers" element={<Customers />} />
            <Route path="/admin/settings" element={<Settings />} />

            {/* Inventory, Delivery & Detailed Reports */}
            <Route path="/admin/stock" element={<Stock />} />
            <Route path="/admin/delivery" element={<Delivery />} />
            <Route path="/admin/reports/daily" element={<DailySalesReportPage accessToken={accessToken} />} />
            <Route path="/admin/reports/monthly" element={<MonthlySalesReportPage accessToken={accessToken} />} />
            <Route path="/admin/reports/orders" element={<OrdersReportPage accessToken={accessToken} />} />
            <Route path="/product-management" element={<ProductManagement />} />
            <Route path="/admin/login" element={<Login />} />

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
          </Routes>

          {/* Optional Security Modal if explicitly triggered */}
          {isSecurityOpen && (
            <SecurityModal
              isOpen={isSecurityOpen}
              onClose={() => setIsSecurityOpen(false)}
              onAuthSuccess={handleAuthSuccess}
            />
          )}

          {/* Optional Legacy Data Entry Modal if explicitly triggered */}
          {isDataEntryOpen && (
            <DataEntryModal
              isOpen={isDataEntryOpen}
              onClose={() => setIsDataEntryOpen(false)}
              accessToken={accessToken}
            />
          )}
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
