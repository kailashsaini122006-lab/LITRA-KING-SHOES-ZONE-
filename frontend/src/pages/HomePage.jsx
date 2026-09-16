import React from 'react';
import Hero from '../components/Hero';
import Collection from '../components/Collection';
import WhyChooseUs from '../components/WhyChooseUs';
import LocationSection from '../components/LocationSection';
import Footer from '../components/Footer';

export default function HomePage({ onProductSelect }) {
  return (
    <>
      <Hero />
      <Collection onProductSelect={onProductSelect} />
      <WhyChooseUs />
      <LocationSection />
      <Footer />
    </>
  );
}
