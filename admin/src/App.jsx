import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import SecurityModal from './components/SecurityModal';
import DataEntryModal from './components/DataEntryModal';
import ProductManagement from './pages/ProductManagement';
import DailySalesReportPage from './pages/DailySalesReportPage';
import MonthlySalesReportPage from './pages/MonthlySalesReportPage';
import OrdersReportPage from './pages/OrdersReportPage';
import { getApiUrl } from './config/api';

function AdminMainContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const isReportPage = location.pathname.startsWith('/admin/reports');

  // Admin & Security States
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);
  const [isDataEntryOpen, setIsDataEntryOpen] = useState(false);
  const [accessToken, setAccessToken] = useState('');

  useEffect(() => {
    const verifyAndCheckAuth = async () => {
      const pathname = location.pathname;
      const savedToken = sessionStorage.getItem('lk_access_token') || localStorage.getItem('lk_access_token') || '';

      if (!savedToken) {
        setAccessToken('');
        setIsDataEntryOpen(false);
        setIsSecurityOpen(true);
        return;
      }

      try {
        const res = await fetch(getApiUrl('/auth/verify-token'), {
          headers: { Authorization: `Bearer ${savedToken}` },
        });
        const data = await res.json().catch(() => null);

        if (res.ok && data && data.valid) {
          setAccessToken(savedToken);
          if (pathname.startsWith('/admin/reports') || pathname === '/product-management' || pathname === '/admin/products') {
            setIsDataEntryOpen(false);
            setIsSecurityOpen(false);
          } else {
            setIsDataEntryOpen(true);
            setIsSecurityOpen(false);
          }
        } else {
          // Token payload check fallback
          try {
            const payload = JSON.parse(atob(savedToken.split('.')[1]));
            if (payload && payload.exp && payload.exp * 1000 > Date.now()) {
              setAccessToken(savedToken);
              if (pathname.startsWith('/admin/reports') || pathname === '/product-management' || pathname === '/admin/products') {
                setIsDataEntryOpen(false);
                setIsSecurityOpen(false);
              } else {
                setIsDataEntryOpen(true);
                setIsSecurityOpen(false);
              }
            } else {
              throw new Error('Expired token');
            }
          } catch {
            sessionStorage.removeItem('lk_access_token');
            localStorage.removeItem('lk_access_token');
            setAccessToken('');
            setIsDataEntryOpen(false);
            setIsSecurityOpen(true);
          }
        }
      } catch {
        setAccessToken(savedToken);
        setIsDataEntryOpen(true);
        setIsSecurityOpen(false);
      }
    };

    verifyAndCheckAuth();
  }, [location.pathname]);

  const handleAuthSuccess = (token) => {
    setAccessToken(token);
    sessionStorage.setItem('lk_access_token', token);
    setIsSecurityOpen(false);

    const pathname = window.location.pathname;
    if (pathname.startsWith('/admin/reports') || pathname === '/product-management' || pathname === '/admin/products') {
      setIsDataEntryOpen(false);
    } else {
      setIsDataEntryOpen(true);
    }
  };

  const handleCloseDataEntry = () => {
    setIsDataEntryOpen(false);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-amber-500 selection:text-zinc-950">
      <Routes>
        <Route path="/" element={<Navigate to="/admin" replace />} />
        <Route
          path="/admin"
          element={
            <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
              {!isDataEntryOpen && !isSecurityOpen && (
                <button
                  onClick={() => setIsSecurityOpen(true)}
                  className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-black font-bold uppercase rounded-xl transition-all shadow-lg"
                >
                  Open Admin Portal
                </button>
              )}
            </div>
          }
        />
        <Route path="/product-management" element={<ProductManagement />} />
        <Route path="/admin/products" element={<ProductManagement />} />
        <Route path="/admin/reports/daily" element={<DailySalesReportPage accessToken={accessToken} />} />
        <Route path="/admin/reports/monthly" element={<MonthlySalesReportPage accessToken={accessToken} />} />
        <Route path="/admin/reports/orders" element={<OrdersReportPage accessToken={accessToken} />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>

      {/* Security Login Modal */}
      <SecurityModal
        isOpen={isSecurityOpen}
        onClose={() => {
          if (!accessToken) {
            setIsSecurityOpen(true);
          } else {
            setIsSecurityOpen(false);
          }
        }}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Main Admin Data Entry Portal Modal */}
      <DataEntryModal
        isOpen={isDataEntryOpen}
        onClose={handleCloseDataEntry}
        accessToken={accessToken}
      />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AdminMainContent />
    </BrowserRouter>
  );
}
