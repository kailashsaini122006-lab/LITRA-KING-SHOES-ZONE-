import React from 'react';
import { MapPin, Navigation, Phone, Clock, Store } from 'lucide-react';

export default function LocationSection() {
  const mapSearchUrl = "https://www.google.com/maps/search/?api=1&query=LITRA+KING+SHOES+ZONE+Chomu+Rajasthan";

  return (
    <section id="location" className="py-20 bg-zinc-950 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center space-y-3 mb-12">
          <span className="text-amber-400 font-bold uppercase tracking-widest text-xs sm:text-sm">
            Visit Our Store
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white">
            Store <span className="gold-text-gradient">Location</span>
          </h2>
          <p className="text-zinc-400 max-w-xl mx-auto text-sm sm:text-base">
            Located conveniently in Chomu, Rajasthan for easy retail shopping and wholesale pickup.
          </p>
        </div>

        {/* Location Content Box */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-10 shadow-2xl">
          
          {/* Details Column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl inline-flex items-center gap-3 text-amber-400">
              <Store className="w-6 h-6" />
              <span className="font-extrabold text-lg">LITRA KING (SHOES ZONE)</span>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3 text-zinc-300">
                <MapPin className="w-5 h-5 text-red-500 shrink-0 mt-1" />
                <div>
                  <h4 className="text-white font-bold text-base">Store Address</h4>
                  <p className="text-zinc-400 text-sm">Chomu, Rajasthan, India</p>
                  <p className="text-xs text-amber-400/90 mt-1 font-semibold">★ Main Footwear Market Zone</p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-zinc-300">
                <Phone className="w-5 h-5 text-amber-400 shrink-0 mt-1" />
                <div>
                  <h4 className="text-white font-bold text-base">Phone / Wholesale Contact</h4>
                  <a href="tel:9257575393" className="text-amber-400 hover:underline font-extrabold text-lg">
                    9257575393
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3 text-zinc-300">
                <Clock className="w-5 h-5 text-emerald-400 shrink-0 mt-1" />
                <div>
                  <h4 className="text-white font-bold text-base">Store Timings</h4>
                  <p className="text-zinc-400 text-sm">Open All Days: 9:00 AM – 9:00 PM</p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <a
                href={mapSearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-extrabold px-8 py-4 rounded-xl shadow-lg shadow-amber-500/25 transition-all hover:scale-105 w-full sm:w-auto"
              >
                <Navigation className="w-5 h-5" />
                <span>Get Directions on Google Maps</span>
              </a>
            </div>

          </div>

          {/* Map Preview Column */}
          <div className="lg:col-span-7 h-80 sm:h-96 rounded-2xl overflow-hidden border border-zinc-800 relative bg-zinc-950 group">
            <iframe
              title="Litra King Shoes Zone Chomu Location Map"
              src="https://maps.google.com/maps?q=Chomu+Rajasthan+India&t=&z=14&ie=UTF8&iwloc=&output=embed"
              className="w-full h-full border-0 filter grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500"
              allowFullScreen=""
              loading="lazy"
            ></iframe>

            {/* Map Overlay Badge */}
            <div className="absolute top-4 left-4 bg-zinc-950/90 backdrop-blur-md px-4 py-2 rounded-xl border border-amber-500/40 flex items-center gap-2 shadow-xl">
              <MapPin className="w-4 h-4 text-red-500" />
              <span className="text-white font-bold text-xs">Chomu, Rajasthan</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
