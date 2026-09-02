import React, { useState, useEffect } from 'react';
import Preloader from './components/Preloader';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import AboutUs from './components/AboutUs';
import WholesaleSection from './components/WholesaleSection';
import Collection from './components/Collection';
import WhyChooseUs from './components/WhyChooseUs';
import Gallery from './components/Gallery';
import LocationSection from './components/LocationSection';
import ContactSection from './components/ContactSection';
import MobileActionBar from './components/MobileActionBar';
import Footer from './components/Footer';

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

export default function App() {
  const [loading, setLoading] = useState(true);

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
    // Direct URL Path & Hash listener (/admin, #track, #cart, etc.)
    const checkDirectUrlRoute = () => {
      const pathname = window.location.pathname;
      const hash = window.location.hash;

      if (pathname.includes('/admin') || hash === '#admin' || hash === '#register' || hash === '#data-add' || pathname.includes('/register')) {
        const savedToken = sessionStorage.getItem('lk_access_token');
        if (savedToken) {
          setAccessToken(savedToken);
          setIsDataEntryOpen(true);
          setIsSecurityOpen(false);
        } else {
          setIsDataEntryOpen(false);
          setIsSecurityOpen(true);
        }
      } else if (hash === '#track' || pathname.includes('/track')) {
        handleOpenTracking();
      } else if (hash === '#cart' || pathname.includes('/cart')) {
        setIsCartOpen(true);
      }
    };

    checkDirectUrlRoute();
    window.addEventListener('popstate', checkDirectUrlRoute);
    window.addEventListener('hashchange', checkDirectUrlRoute);
    return () => {
      window.removeEventListener('popstate', checkDirectUrlRoute);
      window.removeEventListener('hashchange', checkDirectUrlRoute);
    };
  }, []);

  const handleDataAddClick = () => {
    const savedToken = sessionStorage.getItem('lk_access_token');
    if (savedToken) {
      setAccessToken(savedToken);
      setIsDataEntryOpen(true);
      setIsSecurityOpen(false);
    } else {
      setIsDataEntryOpen(false);
      setIsSecurityOpen(true);
    }
    if (window.location.pathname !== '/admin') {
      window.history.pushState(null, '', '/admin');
    }
  };

  const handleAuthSuccess = (token) => {
    setAccessToken(token);
    sessionStorage.setItem('lk_access_token', token);
    setIsSecurityOpen(false);
    setIsDataEntryOpen(true);
    if (window.location.pathname !== '/admin') {
      window.history.pushState(null, '', '/admin');
    }
  };

  const handleOpenTracking = (orderId = '') => {
    setTrackingOrderId(orderId || '');
    setIsTrackingOpen(true);
  };

  return (
    <CartProvider>
      {loading && <Preloader onComplete={() => setLoading(false)} />}
      
      <div
        className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-amber-500 selection:text-zinc-950"
        style={{
          opacity: loading ? 0 : 1,
          transition: 'opacity 0.5s ease',
        }}
      >
        {/* Header Navigation */}
        <Navbar
          onOpenCart={() => setIsCartOpen(true)}
          onOpenTracking={() => handleOpenTracking('')}
        />

        <main>
          <Hero />
          <AboutUs />
          <WholesaleSection />

          {/* Footwear Collection Grid with Product Selection */}
          <Collection
            onProductSelect={(prod) => setSelectedProduct(prod)}
          />

          <WhyChooseUs />
          <Gallery />
          <LocationSection />
          <ContactSection />
        </main>

        <Footer />
        
        {/* Mobile Action Bar */}
        <MobileActionBar />

        {/* ─── E-COMMERCE MODALS ───────────────────────────────────────── */}

        {/* 1. Product Details Viewer */}
        <ProductDetailsModal
          product={selectedProduct}
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onBuyNow={() => setIsCheckoutOpen(true)}
        />

        {/* 2. Shopping Cart Drawer */}
        <CartDrawer
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          onProceedToCheckout={() => setIsCheckoutOpen(true)}
        />

        {/* 3. Checkout & COD Form */}
        <CheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          onOrderPlaced={(orderData) => setPlacedOrder(orderData)}
        />

        {/* 4. Order Confirmation Banner */}
        <OrderConfirmationModal
          order={placedOrder}
          isOpen={!!placedOrder}
          onClose={() => setPlacedOrder(null)}
          onTrackOrder={(id) => handleOpenTracking(id)}
        />

        {/* 5. Customer Order Tracking */}
        <OrderTrackingModal
          isOpen={isTrackingOpen}
          onClose={() => setIsTrackingOpen(false)}
          initialOrderId={trackingOrderId}
        />

        {/* ─── ADMIN & SECURITY MODALS ──────────────────────────────────── */}

        {/* 4-Digit Security PIN & Forgot PIN Modal */}
        <SecurityModal
          isOpen={isSecurityOpen}
          onClose={() => {
            setIsSecurityOpen(false);
            if (window.location.pathname.includes('/admin')) {
              window.history.pushState(null, '', '/');
            }
          }}
          onAuthSuccess={handleAuthSuccess}
        />

        {/* Admin Portal (Orders Dashboard & Inquiries) */}
        <DataEntryModal
          isOpen={isDataEntryOpen}
          onClose={() => {
            setIsDataEntryOpen(false);
            setAccessToken('');
            sessionStorage.removeItem('lk_access_token');
            if (window.location.pathname.includes('/admin')) {
              window.history.pushState(null, '', '/');
            }
          }}
          accessToken={accessToken}
        />

      </div>
    </CartProvider>
  );
}
