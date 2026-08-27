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

import SecurityModal from './components/SecurityModal';
import DataEntryModal from './components/DataEntryModal';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);
  const [isDataEntryOpen, setIsDataEntryOpen] = useState(false);
  const [accessToken, setAccessToken] = useState('');

  useEffect(() => {
    // Direct URL route protection (#register or #data-add or /register or /data-add)
    const checkDirectUrlRoute = () => {
      const hash = window.location.hash;
      const pathname = window.location.pathname;

      if (
        hash === '#register' ||
        hash === '#data-add' ||
        pathname.includes('/register') ||
        pathname.includes('/data-add')
      ) {
        handleDataAddClick();
      }
    };

    checkDirectUrlRoute();
    window.addEventListener('hashchange', checkDirectUrlRoute);
    return () => window.removeEventListener('hashchange', checkDirectUrlRoute);
  }, []);

  const handleDataAddClick = () => {
    // Always prompt for 4-Digit Security PIN when Data Add is clicked
    setIsDataEntryOpen(false);
    setIsSecurityOpen(true);
  };

  const handleAuthSuccess = (token) => {
    setAccessToken(token);
    sessionStorage.setItem('lk_access_token', token);
    setIsSecurityOpen(false);
    setIsDataEntryOpen(true);
  };

  return (
    <>
      {loading && <Preloader onComplete={() => setLoading(false)} />}
      <div
        className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-amber-500 selection:text-zinc-950"
        style={{
          opacity: loading ? 0 : 1,
          transition: 'opacity 0.5s ease',
        }}
      >
        <Navbar onDataAddClick={handleDataAddClick} />
        <main>
          <Hero />
          <AboutUs />
          <WholesaleSection />
          <Collection />
          <WhyChooseUs />
          <Gallery />
          <LocationSection />
          <ContactSection />
        </main>
        <Footer />
        <MobileActionBar />

        {/* 4-Digit Security PIN Verification Modal */}
        <SecurityModal
          isOpen={isSecurityOpen}
          onClose={() => setIsSecurityOpen(false)}
          onAuthSuccess={handleAuthSuccess}
        />

        {/* Saved Records Portal (Opens only after successful PIN verification) */}
        <DataEntryModal
          isOpen={isDataEntryOpen}
          onClose={() => {
            setIsDataEntryOpen(false);
            setAccessToken('');
            sessionStorage.removeItem('lk_access_token');
          }}
          accessToken={accessToken}
        />
      </div>
    </>
  );
}
