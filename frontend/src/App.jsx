import React, { useState } from 'react';
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

export default function App() {
  const [loading, setLoading] = useState(true);

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
        <Navbar />
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
      </div>
    </>
  );
}
