import React from 'react';
import ContactSection from '../components/ContactSection';
import LocationSection from '../components/LocationSection';
import Footer from '../components/Footer';

export default function ContactPage() {
  return (
    <div className="pt-20">
      <ContactSection />
      <LocationSection />
      <Footer />
    </div>
  );
}
