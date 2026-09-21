import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Preloader from './components/Preloader';
import Navbar from './components/Navbar';
import MobileActionBar from './components/MobileActionBar';
import ScrollToTop from './components/ScrollToTop';

// Page Components
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import CollectionPage from './pages/CollectionPage';
import WholesalePage from './pages/WholesalePage';
import GalleryPage from './pages/GalleryPage';
import ContactPage from './pages/ContactPage';
import ProductManagement from './pages/ProductManagement';
import DailySalesReportPage from './pages/DailySalesReportPage';
import MonthlySalesReportPage from './pages/MonthlySalesReportPage';
import OrdersReportPage from './pages/OrdersReportPage';

// Security & Admin Modals
import SecurityModal from './components/SecurityModal';
import DataEntryModal from './components/DataEntryModal';

// E-Commerce Modals & Context
import { CartProvider } from './context/CartContext';
import ProductDetailsModal from './components/ProductDetailsModal';
import CartDrawer from './components/CartDrawer';
import CheckoutModal from './components/CheckoutModal';
import OrderConfirmationModal from './components/OrderConfirmationModal';
import OrderTrackingModal from './components/OrderTrackingModal';

import { getApiUrl } from './config/api';

function MainAppContent() {
  const location = useLocation();
  const isReportPage = location.pathname.startsWith('/admin/reports');

  const [loading, setLoading] = useState(() => !window.location.pathname.startsWith('/admin/reports'));

  // Admin & Security States
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);
  const [isDataEntryOpen, setIsDataEntryOpen] = useState(false);
  const [accessToken, setAccessToken] = useState('');

  // E-Commerce Flow States
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);
  const [trackingOrderId, setTrackingOrderId] = useState('');
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);

  useEffect(() => {
    // Route protection and token verification listener
    const verifyAndCheckAuth = async () => {
      const pathname = location.pathname;
      const hash = window.location.hash;

      const isAdminRoute = false;

      if (isAdminRoute) {
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
            sessionStorage.removeItem('lk_access_token');
            localStorage.removeItem('lk_access_token');
            setAccessToken('');
            setIsDataEntryOpen(false);
            setIsSecurityOpen(true);
          }
        } catch {
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
      } else {
        if (hash === '#track' || pathname.includes('/track')) {
          handleOpenTracking();
        } else if (hash === '#cart' || pathname.includes('/cart')) {
          setIsCartOpen(true);
        }
      }
    };

    verifyAndCheckAuth();

    const handleWindowRoute = () => verifyAndCheckAuth();
    window.addEventListener('popstate', handleWindowRoute);
    window.addEventListener('hashchange', handleWindowRoute);
    return () => {
      window.removeEventListener('popstate', handleWindowRoute);
      window.removeEventListener('hashchange', handleWindowRoute);
    };
  }, [location.pathname, location.hash]);

  const handleAuthSuccess = (token) => {
    setAccessToken(token);
    sessionStorage.setItem('lk_access_token', token);
    setIsSecurityOpen(false);

    const pathname = window.location.pathname;
    if (pathname.startsWith('/admin/reports') || pathname === '/product-management' || pathname === '/admin/products') {
      setIsDataEntryOpen(false);
    } else {
      setIsDataEntryOpen(true);
      if (window.location.pathname !== '/admin') {
        window.history.pushState(null, '', '/admin');
      }
    }
  };

  const handleOpenTracking = (orderId = '') => {
    setTrackingOrderId(orderId || '');
    setIsTrackingOpen(true);
  };

  return (
    <>
      {/* ─── RESTORED OPENING / PRELOADER ANIMATION ───────────────────────── */}
      {loading && !isReportPage && (
        <Preloader onComplete={() => setLoading(false)} />
      )}

      <div
        className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-amber-500 selection:text-zinc-950"
        style={{
          opacity: loading && !isReportPage ? 0 : 1,
          transition: 'opacity 0.5s ease',
        }}
      >
        <ScrollToTop />

        {/* Header Navigation - Hidden on Standalone Admin Report Pages */}
        {!isReportPage && (
          <Navbar
            onOpenCart={() => setIsCartOpen(true)}
            onOpenTracking={() => handleOpenTracking('')}
          />
        )}

      <main>
        <Routes>
          <Route path="/" element={<HomePage onProductSelect={(prod) => setSelectedProduct(prod)} />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/collection" element={<CollectionPage onProductSelect={(prod) => setSelectedProduct(prod)} />} />
          <Route path="/wholesale" element={<WholesalePage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="*" element={<HomePage onProductSelect={(prod) => setSelectedProduct(prod)} />} />
        </Routes>
      </main>
      
      {/* Mobile Action Bar - Hidden on Standalone Admin Report Pages */}
      {!isReportPage && (
        <MobileActionBar
          onOpenCart={() => setIsCartOpen(true)}
          onOpenTracking={() => handleOpenTracking('')}
        />
      )}

      {/* ─── E-COMMERCE MODALS ───────────────────────────────────────── */}
      <ProductDetailsModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onBuyNow={() => setIsCheckoutOpen(true)}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onProceedToCheckout={() => setIsCheckoutOpen(true)}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onOrderPlaced={(orderData) => setPlacedOrder(orderData)}
      />

      <OrderConfirmationModal
        order={placedOrder}
        isOpen={!!placedOrder}
        onClose={() => setPlacedOrder(null)}
        onTrackOrder={(id) => handleOpenTracking(id)}
      />

      <OrderTrackingModal
        isOpen={isTrackingOpen}
        onClose={() => setIsTrackingOpen(false)}
        initialOrderId={trackingOrderId}
      />

    </div>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <MainAppContent />
      </CartProvider>
    </BrowserRouter>
  );
}

