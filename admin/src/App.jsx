import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

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
    return sessionStorage.getItem('lk_access_token') || localStorage.getItem('lk_access_token') || localStorage.getItem('litra_admin_token') || '';
  });

  const handleAuthSuccess = (token) => {
    setAccessToken(token);
    sessionStorage.setItem('lk_access_token', token);
    localStorage.setItem('litra_admin_token', token);
    setIsSecurityOpen(false);
  };

  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="min-h-screen bg-[#0b0f19] text-zinc-100 font-sans">
          <Routes>
            <Route path="/admin/login" element={<Login />} />

            {/* All Protected Admin Routes */}
            <Route path="/" element={<ProtectedRoute><Navigate to="/admin/dashboard" replace /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><Navigate to="/admin/dashboard" replace /></ProtectedRoute>} />
            <Route path="/admin/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/admin/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
            <Route path="/admin/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
            <Route path="/admin/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
            <Route path="/admin/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/admin/stock" element={<ProtectedRoute><Stock /></ProtectedRoute>} />
            <Route path="/admin/delivery" element={<ProtectedRoute><Delivery /></ProtectedRoute>} />
            <Route path="/admin/reports/daily" element={<ProtectedRoute><DailySalesReportPage accessToken={accessToken} /></ProtectedRoute>} />
            <Route path="/admin/reports/monthly" element={<ProtectedRoute><MonthlySalesReportPage accessToken={accessToken} /></ProtectedRoute>} />
            <Route path="/admin/reports/orders" element={<ProtectedRoute><OrdersReportPage accessToken={accessToken} /></ProtectedRoute>} />
            <Route path="/product-management" element={<ProtectedRoute><ProductManagement /></ProtectedRoute>} />

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
          </Routes>

          {/* Optional Security Modal */}
          {isSecurityOpen && (
            <SecurityModal
              isOpen={isSecurityOpen}
              onClose={() => setIsSecurityOpen(false)}
              onAuthSuccess={handleAuthSuccess}
            />
          )}

          {/* Optional Legacy Data Entry Modal */}
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
