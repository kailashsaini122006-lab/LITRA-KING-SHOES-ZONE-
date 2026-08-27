import React, { useState } from 'react';
import { Phone, MessageCircle, Navigation, MapPin, Send, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { getApiUrl } from '../config/api';

const InstagramIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const INITIAL_FORM = {
  name: '',
  phone: '',
  type: 'Wholesale Inquiry',
  message: '',
};

export default function ContactSection() {
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [formData, setFormData] = useState(INITIAL_FORM);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // ── Client-side Field Validation ─────────────────────────────────────────
    if (!formData.name.trim()) {
      setErrorMsg('Please enter your name.');
      return;
    }

    const cleanPhone = formData.phone.toString().trim().replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number (e.g. 9257553930).');
      return;
    }

    if (!formData.type.trim()) {
      setErrorMsg('Please select an inquiry type.');
      return;
    }

    if (!formData.message.trim()) {
      setErrorMsg('Please enter your message or requirements.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(getApiUrl('/inquiries'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          phone: cleanPhone,
          inquiryType: formData.type.trim(),
          message: formData.message.trim(),
        }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data && data.success) {
        setSuccessMsg(data.message || 'Data Added Successfully!');
        setSubmitted(true);
        setFormData(INITIAL_FORM); // Automatically clear form

        setTimeout(() => {
          setSubmitted(false);
          setSuccessMsg('');
        }, 5000);
      } else {
        const msg = data?.message || `Server Error (${res.status}): Failed to save inquiry.`;
        setErrorMsg(msg);
      }
    } catch (err) {
      console.error('[ContactForm] Error submitting inquiry:', err);
      setErrorMsg(`Connection Error (${err.message}). Make sure backend server is running.`);
    } fontally: {
      setIsLoading(false);
    }
  };

  return (
    <section id="contact" className="py-20 bg-zinc-900/40 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <div className="text-center space-y-3 mb-14">
          <span className="text-amber-400 font-bold uppercase tracking-widest text-xs sm:text-sm">
            Connect With Us
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white">
            Contact <span className="gold-text-gradient">LITRA KING</span>
          </h2>
          <p className="text-zinc-400 max-w-xl mx-auto text-sm sm:text-base">
            Reach out for retail inquiries, footwear sizes, or bulk wholesale orders.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left Column: Direct Contact Info & Action Buttons */}
          <div className="lg:col-span-6 bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-8 flex flex-col justify-between shadow-2xl">

            <div className="space-y-6">
              <div className="border-b border-zinc-800 pb-4">
                <h3 className="text-2xl font-black text-white">LITRA KING (SHOES ZONE)</h3>
                <p className="text-amber-400 font-bold text-base flex items-center gap-1.5 mt-1">
                  <MapPin className="w-4 h-4 text-red-500" />
                  Chomu, Rajasthan, India
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Direct Phone / Wholesale Hotline</p>
                <a
                  href="tel:9257575393"
                  className="text-3xl sm:text-4xl font-black text-white hover:text-amber-400 transition-colors inline-block"
                >
                  9257575393
                </a>
              </div>

              <div className="space-y-3">
                <p className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Instagram Profile</p>
                <a
                  href="https://instagram.com/litra_king_shoes_zone_chomu"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-pink-400 hover:text-pink-300 font-bold text-base bg-pink-950/40 border border-pink-500/30 px-4 py-2 rounded-xl transition-all"
                >
                  <InstagramIcon className="w-5 h-5 text-pink-400" />
                  <span>@litra_king_shoes_zone_chomu</span>
                </a>
              </div>
            </div>

            {/* Quick Action Buttons Grid */}
            <div className="space-y-3 pt-4 border-t border-zinc-800">
              <p className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Instant Actions</p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Call Now */}
                <a
                  href="tel:9257575393"
                  className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold py-3.5 px-4 rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20"
                >
                  <Phone className="w-4 h-4 fill-zinc-950" />
                  <span>Call Now</span>
                </a>

                {/* 2. WhatsApp */}
                <a
                  href="https://wa.me/919257575393?text=Hello%20Litra%20King%20Shoes%20Zone,%20I%20want%20to%20inquire%20about%20footwear."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 px-4 rounded-xl text-sm transition-all shadow-lg"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>WhatsApp</span>
                </a>

                {/* 3. Get Directions */}
                <a
                  href="#location"
                  className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-bold py-3.5 px-4 rounded-xl text-sm border border-zinc-700 transition-all"
                >
                  <Navigation className="w-4 h-4 text-amber-400" />
                  <span>Directions</span>
                </a>
              </div>
            </div>

          </div>

          {/* Right Column: Instant Message Form */}
          <div className="lg:col-span-6 bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
            <h3 className="text-2xl font-extrabold text-white mb-2">Send an Instant Message</h3>
            <p className="text-zinc-400 text-xs sm:text-sm mb-6">
              Fill out the details below and we will contact you right away.
            </p>

            {submitted ? (
              <div className="p-8 bg-emerald-950/60 border border-emerald-500/50 rounded-2xl text-center space-y-3 animate-fadeIn">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <h4 className="text-xl font-bold text-white">{successMsg || 'Data Added Successfully!'}</h4>
                <p className="text-zinc-300 text-sm">Thank you for reaching out to Litra King Shoes Zone. Your inquiry has been saved into MongoDB.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>

                {/* Error Banner */}
                {errorMsg && (
                  <div className="flex items-start gap-3 p-3.5 bg-red-950/60 border border-red-500/50 rounded-xl text-red-300 text-sm animate-fadeIn">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-400" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs text-zinc-300 font-semibold mb-1">Your Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => { setFormData({ ...formData, name: e.target.value }); setErrorMsg(''); }}
                    placeholder="Enter your name"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs text-zinc-300 font-semibold mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => { setFormData({ ...formData, phone: e.target.value }); setErrorMsg(''); }}
                    placeholder="9257553930"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs text-zinc-300 font-semibold mb-1">Inquiry Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-400 transition-colors"
                  >
                    <option value="Wholesale Inquiry">Wholesale / Bulk Order Inquiry</option>
                    <option value="Retail Purchase">Retail Shoe Purchase</option>
                    <option value="Store Visit">Store Visit &amp; Address</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-zinc-300 font-semibold mb-1">Message / Requirements *</label>
                  <textarea
                    rows="3"
                    required
                    value={formData.message}
                    onChange={(e) => { setFormData({ ...formData, message: e.target.value }); setErrorMsg(''); }}
                    placeholder="Mention shoe types or bulk quantity requirement..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-400 transition-colors"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 text-zinc-950 font-extrabold py-3.5 rounded-xl shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 fill-zinc-950" />
                      <span>Send Inquiry</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

        </div>

      </div>
    </section>
  );
}
