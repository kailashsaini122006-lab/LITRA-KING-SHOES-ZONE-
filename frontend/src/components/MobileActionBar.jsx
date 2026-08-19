import React from 'react';
import { Phone, MessageCircle } from 'lucide-react';

export default function MobileActionBar() {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-lg border-t border-zinc-800 p-3 shadow-2xl">
      <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
        <a
          href="tel:9257575393"
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 font-extrabold py-3 rounded-xl shadow-lg text-sm"
        >
          <Phone className="w-4 h-4 fill-zinc-950" />
          <span>Call: 9257575393</span>
        </a>

        <a
          href="https://wa.me/919257575393?text=Hello%20Litra%20King%20Shoes%20Zone,%20I%20am%20interested%20in%20Footwear%20orders."
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 bg-emerald-600 text-white font-bold py-3 rounded-xl shadow-lg text-sm"
        >
          <MessageCircle className="w-4 h-4 fill-white" />
          <span>WhatsApp</span>
        </a>
      </div>
    </div>
  );
}
