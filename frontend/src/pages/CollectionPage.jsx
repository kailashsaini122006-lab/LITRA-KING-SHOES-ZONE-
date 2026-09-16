import React from 'react';
import Collection from '../components/Collection';
import Footer from '../components/Footer';

export default function CollectionPage({ onProductSelect }) {
  return (
    <div className="pt-20">
      <Collection onProductSelect={onProductSelect} />
      <Footer />
    </div>
  );
}
