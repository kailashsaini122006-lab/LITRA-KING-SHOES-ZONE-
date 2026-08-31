import React, { useState } from 'react';
import { X, CheckCircle2, ShieldCheck, MapPin, Truck, AlertCircle, RefreshCw, Lock, Zap, QrCode, AlertTriangle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { getApiUrl } from '../config/api';

const INITIAL_FORM = {
  name: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  state: 'Rajasthan',
  pincode: '',
};

export default function CheckoutModal({ isOpen, onClose, onOrderPlaced }) {
  const { cartItems, getCartSubtotal, clearCart } = useCart();

  const [formData, setFormData] = useState(INITIAL_FORM);
  const [paymentMethod, setPaymentMethod] = useState('UPI'); // 'UPI' | 'COD'
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // UPI Specific State
  const [hasClickedCompletedPayment, setHasClickedCompletedPayment] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [userConfirmedPayment, setUserConfirmedPayment] = useState(false);

  if (!isOpen) return null;

  const subtotal = getCartSubtotal();
  const deliveryCharge = subtotal >= 1000 || subtotal === 0 ? 0 : 99;
  const grandTotal = subtotal + deliveryCharge;

  const handleFormChange = (field, val) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
    setErrorMessage('');
  };

  const validateAddressForm = () => {
    if (!formData.name.trim()) {
      setErrorMessage('Please enter your full name.');
      return false;
    }

    const cleanPhone = formData.phone.toString().trim().replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number (e.g. 9257575393).');
      return false;
    }

    if (!formData.address.trim()) {
      setErrorMessage('Please enter your House/Shop/Street Address.');
      return false;
    }

    if (!formData.city.trim()) {
      setErrorMessage('Please enter your City name.');
      return false;
    }

    const cleanPincode = formData.pincode.toString().trim().replace(/\D/g, '');
    if (!cleanPincode || cleanPincode.length !== 6) {
      setErrorMessage('Please enter a valid 6-digit postal pincode.');
      return false;
    }

    if (cartItems.length === 0) {
      setErrorMessage('Your shopping cart is empty.');
      return false;
    }

    return true;
  };

  // Triggered when customer clicks "I Have Completed Payment" or submits form
  const handleInitiateUpiConfirmation = (e) => {
    if (e) e.preventDefault();
    setErrorMessage('');

    if (!validateAddressForm()) {
      return;
    }

    setHasClickedCompletedPayment(true);
    setShowConfirmationModal(true);
  };

  // Final submission of order to backend MongoDB API
  const executeOrderSubmission = async () => {
    setErrorMessage('');

    if (!validateAddressForm()) {
      setShowConfirmationModal(false);
      return;
    }

    const cleanPhone = formData.phone.toString().trim().replace(/\D/g, '');
    const cleanPincode = formData.pincode.toString().trim().replace(/\D/g, '');

    const payloadCustomer = {
      name: formData.name.trim(),
      phone: cleanPhone,
      email: formData.email.trim(),
      address: formData.address.trim(),
      city: formData.city.trim(),
      state: formData.state.trim() || 'Rajasthan',
      pincode: cleanPincode,
    };

    const payloadItems = cartItems.map((item) => ({
      productId: item.productId,
      name: item.name,
      price: item.price,
      size: item.size,
      color: item.color,
      quantity: item.quantity,
      image: item.image,
    }));

    try {
      setLoading(true);
      const res = await fetch(getApiUrl('/orders'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: payloadCustomer,
          items: payloadItems,
          paymentMethod: paymentMethod === 'UPI' ? 'UPI' : 'COD',
        }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data && data.success) {
        clearCart();
        setFormData(INITIAL_FORM);
        setShowConfirmationModal(false);
        setHasClickedCompletedPayment(false);
        setUserConfirmedPayment(false);
        onClose();
        if (onOrderPlaced) {
          onOrderPlaced(data.order);
        }
      } else {
        setErrorMessage(data?.message || 'Order creation failed. Please try again.');
        setShowConfirmationModal(false);
      }
    } catch (err) {
      console.error('Order creation error:', err);
      setErrorMessage(`Connection Error (${err.message}). Make sure backend server is running.`);
      setShowConfirmationModal(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitForm = (e) => {
    e.preventDefault();
    if (paymentMethod === 'UPI') {
      if (!userConfirmedPayment) {
        handleInitiateUpiConfirmation(e);
      } else {
        executeOrderSubmission();
      }
    } else {
      executeOrderSubmission();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden text-zinc-100 flex flex-col max-h-[94vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl text-zinc-950 font-bold shadow-md shadow-amber-500/20">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-white tracking-wider">
                CHECKOUT &amp; PAYMENT SELECTION
              </h3>
              <p className="text-xs text-zinc-400">Complete your shipping address and select payment method</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-4 sm:p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
          
          {/* Left Column: Shipping Address Form & Payment Method */}
          <div className="lg:col-span-7 space-y-5">
            {errorMessage && (
              <div className="flex items-start gap-3 p-3.5 bg-red-950/70 border border-red-800/80 rounded-2xl text-red-300 text-xs animate-shake">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form id="checkout-form" onSubmit={handleSubmitForm} className="space-y-4">
              <h4 className="text-xs font-extrabold text-amber-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-zinc-800 pb-2">
                <MapPin className="w-4 h-4" /> 1. Shipping Address Information
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white text-xs focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Mobile Number (Contact) *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => handleFormChange('phone', e.target.value)}
                    placeholder="10-digit mobile number"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white text-xs font-mono focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">Email Address (Optional)</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleFormChange('email', e.target.value)}
                  placeholder="yourname@gmail.com"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white text-xs focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">House / Shop / Street Address *</label>
                <textarea
                  rows="2"
                  required
                  value={formData.address}
                  onChange={(e) => handleFormChange('address', e.target.value)}
                  placeholder="Mention shop number, landmark, area..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white text-xs focus:outline-none focus:border-amber-400 transition-colors"
                ></textarea>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">City / Town *</label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => handleFormChange('city', e.target.value)}
                    placeholder="Chomu"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white text-xs focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">State *</label>
                  <input
                    type="text"
                    required
                    value={formData.state}
                    onChange={(e) => handleFormChange('state', e.target.value)}
                    placeholder="Rajasthan"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white text-xs focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Pincode *</label>
                  <input
                    type="text"
                    required
                    maxLength="6"
                    value={formData.pincode}
                    onChange={(e) => handleFormChange('pincode', e.target.value)}
                    placeholder="303702"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white text-xs font-mono focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-extrabold text-amber-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-zinc-800 pb-2">
                  <ShieldCheck className="w-4 h-4" /> 2. Select Payment Method
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Option 1: Online Payment (UPI) */}
                  <label
                    className={`p-4 border-2 rounded-2xl cursor-pointer transition-all flex items-start gap-3 ${
                      paymentMethod === 'UPI'
                        ? 'bg-amber-500/10 border-amber-500 text-white shadow-md shadow-amber-500/10'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="UPI"
                      checked={paymentMethod === 'UPI'}
                      onChange={() => setPaymentMethod('UPI')}
                      className="accent-amber-500 w-4 h-4 mt-0.5"
                    />
                    <div>
                      <div className="text-xs font-extrabold text-white flex items-center gap-1.5 flex-wrap">
                        Online Payment (UPI)
                        <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-bold uppercase">
                          Paytm QR
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-1">Scan Paytm QR using GPay, PhonePe, Paytm, or any UPI app</p>
                    </div>
                  </label>

                  {/* Option 2: Cash on Delivery */}
                  <label
                    className={`p-4 border-2 rounded-2xl cursor-pointer transition-all flex items-start gap-3 ${
                      paymentMethod === 'COD'
                        ? 'bg-amber-500/10 border-amber-500 text-white shadow-md'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="COD"
                      checked={paymentMethod === 'COD'}
                      onChange={() => setPaymentMethod('COD')}
                      className="accent-amber-500 w-4 h-4 mt-0.5"
                    />
                    <div>
                      <div className="text-xs font-extrabold text-white flex items-center gap-1.5 flex-wrap">
                        Cash on Delivery (COD)
                        <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-bold uppercase">
                          Pay on Delivery
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-1">Pay cash when shoes arrive at your doorstep</p>
                    </div>
                  </label>
                </div>
              </div>
            </form>

            {/* ── PAYTM UPI QR CODE SECTION (Renders when paymentMethod === 'UPI') ── */}
            {paymentMethod === 'UPI' && (
              <div className="p-4 sm:p-5 bg-zinc-950 border border-amber-500/30 rounded-2xl space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-amber-400" />
                    <h5 className="font-extrabold text-white text-xs uppercase tracking-wider">
                      Paytm UPI Payment QR Code
                    </h5>
                  </div>
                  <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded font-bold">
                    Scan &amp; Pay
                  </span>
                </div>

                {/* QR Code Display & Dynamic Grand Total */}
                <div className="flex flex-col sm:flex-row items-center gap-5 justify-center">
                  <div className="relative group shrink-0">
                    <img
                      src="/assets/paytm-qr.png"
                      alt="Paytm UPI QR Code"
                      className="w-52 h-52 sm:w-60 sm:h-60 rounded-2xl border-2 border-amber-500/50 shadow-2xl object-contain bg-white p-1"
                    />
                  </div>

                  <div className="space-y-3 text-center sm:text-left max-w-xs">
                    <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl space-y-1">
                      <span className="text-[10px] text-zinc-400 uppercase font-bold block">Exact Amount to Pay:</span>
                      <div className="text-2xl font-mono font-black text-amber-400">
                        ₹{grandTotal}
                      </div>
                    </div>

                    <div className="space-y-1 text-xs">
                      <span className="text-zinc-400 text-[11px] block font-semibold">Scan QR using any UPI app:</span>
                      <div className="flex items-center justify-center sm:justify-start gap-1.5 flex-wrap">
                        <span className="bg-zinc-900 border border-zinc-800 px-2 py-1 rounded text-[10px] font-bold text-blue-400">
                          Google Pay
                        </span>
                        <span className="bg-zinc-900 border border-zinc-800 px-2 py-1 rounded text-[10px] font-bold text-purple-400">
                          PhonePe
                        </span>
                        <span className="bg-zinc-900 border border-zinc-800 px-2 py-1 rounded text-[10px] font-bold text-cyan-400">
                          Paytm
                        </span>
                        <span className="bg-zinc-900 border border-zinc-800 px-2 py-1 rounded text-[10px] font-bold text-emerald-400">
                          BHIM UPI
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Completion Action */}
                <div className="pt-2 border-t border-zinc-800/80 flex flex-col items-center gap-2">
                  <button
                    type="button"
                    onClick={handleInitiateUpiConfirmation}
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>I Have Completed Payment</span>
                  </button>
                  <p className="text-[10px] text-zinc-400 text-center">
                    Click after scanning &amp; transferring ₹{grandTotal} via your UPI app
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Order Summary & Action Buttons */}
          <div className="lg:col-span-5 bg-zinc-950/70 border border-zinc-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <h4 className="text-xs font-extrabold text-white uppercase tracking-wider border-b border-zinc-800 pb-2">
                Order Summary ({cartItems.length} items)
              </h4>

              {/* Items List */}
              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {cartItems.map((item) => (
                  <div key={item.key} className="flex items-center gap-3 text-xs border-b border-zinc-800/60 pb-2.5">
                    <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover bg-zinc-900 border border-zinc-800" />
                    <div className="flex-1">
                      <div className="font-bold text-white leading-snug line-clamp-1">{item.name}</div>
                      <div className="text-[11px] text-zinc-400">
                        Size: <span className="text-amber-400 font-mono font-bold">{item.size}</span> | Color: {item.color} | Qty: {item.quantity}
                      </div>
                    </div>
                    <div className="font-mono font-bold text-amber-400">
                      ₹{item.price * item.quantity}
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2 text-xs pt-2 border-t border-zinc-800">
                <div className="flex justify-between text-zinc-400">
                  <span>Subtotal</span>
                  <span className="font-mono font-bold text-zinc-200">₹{subtotal}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Delivery Charge</span>
                  <span className="font-mono font-bold text-zinc-200">
                    {deliveryCharge === 0 ? <span className="text-emerald-400">FREE</span> : `₹${deliveryCharge}`}
                  </span>
                </div>
                <div className="pt-2 border-t border-zinc-800 flex justify-between text-base font-black text-white">
                  <span>Grand Total</span>
                  <span className="font-mono text-amber-400 text-xl">₹{grandTotal}</span>
                </div>
              </div>
            </div>

            {/* Submit Action Button */}
            <div className="space-y-3 pt-4 border-t border-zinc-800">
              <button
                type="submit"
                form="checkout-form"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black rounded-2xl text-sm shadow-xl shadow-amber-500/25 transition-all hover:scale-[1.01] flex items-center justify-center gap-2 uppercase tracking-wider"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>PLACING ORDER...</span>
                  </>
                ) : paymentMethod === 'UPI' ? (
                  <>
                    <QrCode className="w-5 h-5" />
                    <span>PLACE ORDER (ONLINE PAYMENT)</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 fill-zinc-950" />
                    <span>PLACE ORDER (COD)</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-zinc-500">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>SSL Secured Checkout &amp; Manual Verification</span>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* ─── UPI PAYMENT CONFIRMATION WARNING MODAL ───────────────────────── */}
      {showConfirmationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fadeIn">
          <div className="relative w-full max-w-md bg-zinc-900 border border-amber-500/40 rounded-3xl shadow-2xl p-6 text-zinc-100 space-y-5 text-center">
            
            <div className="w-16 h-16 bg-amber-500/20 border border-amber-500/50 rounded-full flex items-center justify-center mx-auto text-amber-400 shadow-lg shadow-amber-500/20">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-black text-white">
                Confirm UPI Payment Completion
              </h3>
              <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-red-300 text-xs font-semibold leading-relaxed">
                ⚠️ Please make sure you have completed the UPI payment before placing the order.
              </div>
            </div>

            <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl text-left space-y-2 text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>Grand Total Amount:</span>
                <span className="font-mono font-black text-amber-400 text-sm">₹{grandTotal}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Payment Method:</span>
                <span className="font-bold text-white">Paytm UPI QR Code</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Payment Status after order:</span>
                <span className="font-bold text-amber-300 bg-amber-950 border border-amber-800 px-2 py-0.5 rounded text-[10px]">
                  Pending Verification
                </span>
              </div>
            </div>

            {/* Confirmation Checkbox */}
            <label className="flex items-start gap-3 p-3 bg-zinc-950 border border-zinc-800 rounded-xl cursor-pointer text-left">
              <input
                type="checkbox"
                checked={userConfirmedPayment}
                onChange={(e) => setUserConfirmedPayment(e.target.checked)}
                className="accent-amber-500 w-4 h-4 mt-0.5 shrink-0"
              />
              <span className="text-xs text-zinc-300 leading-snug">
                I confirm that I have scanned the Paytm QR code and transferred <strong>₹{grandTotal}</strong> using my UPI app.
              </span>
            </label>

            {/* Modal Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setUserConfirmedPayment(true);
                  executeOrderSubmission();
                }}
                disabled={loading}
                className="py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-1.5"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>PLACE ORDER (ONLINE PAYMENT)</span>
              </button>

              <button
                type="button"
                onClick={() => setShowConfirmationModal(false)}
                className="py-3.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors border border-zinc-700"
              >
                Cancel / Check QR
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
