import React, { useState } from 'react';
import { X, CheckCircle2, ShieldCheck, MapPin, Truck, AlertCircle, RefreshCw, Lock, Zap, CreditCard } from 'lucide-react';
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
  const [paymentMethod, setPaymentMethod] = useState('COD'); // 'COD' | 'Online Payment'
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const subtotal = getCartSubtotal();
  const deliveryCharge = subtotal >= 1000 || subtotal === 0 ? 0 : 99;
  const grandTotal = subtotal + deliveryCharge;

  const handleFormChange = (field, val) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
    setErrorMessage('');
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    // ── Client-side Field Validation ───────────────────────────────────────────
    if (!formData.name.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    const cleanPhone = formData.phone.toString().trim().replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number (e.g. 9257575393).');
      return;
    }

    if (!formData.address.trim()) {
      setErrorMessage('Please enter your House/Shop/Street Address.');
      return;
    }

    if (!formData.city.trim()) {
      setErrorMessage('Please enter your City name.');
      return;
    }

    const cleanPincode = formData.pincode.toString().trim().replace(/\D/g, '');
    if (!cleanPincode || cleanPincode.length !== 6) {
      setErrorMessage('Please enter a valid 6-digit postal pincode.');
      return;
    }

    if (cartItems.length === 0) {
      setErrorMessage('Your shopping cart is empty.');
      return;
    }

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

    // ── FLOW A: CASH ON DELIVERY (COD) ────────────────────────────────────────
    if (paymentMethod === 'COD') {
      try {
        setLoading(true);
        const res = await fetch(getApiUrl('/orders'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer: payloadCustomer,
            items: payloadItems,
            paymentMethod: 'COD',
          }),
        });

        const data = await res.json().catch(() => null);

        if (res.ok && data && data.success) {
          clearCart();
          setFormData(INITIAL_FORM);
          onClose();
          if (onOrderPlaced) {
            onOrderPlaced(data.order);
          }
        } else {
          setErrorMessage(data?.message || 'Order creation failed. Please try again.');
        }
      } catch (err) {
        console.error('COD Order error:', err);
        setErrorMessage(`Connection Error (${err.message}). Make sure backend server is running.`);
      } finally {
        setLoading(false);
      }
      return;
    }

    // ── FLOW B: RAZORPAY ONLINE PAYMENT (UPI / CARDS / NETBANKING) ───────────
    try {
      setLoading(true);

      // 1. Initialize Razorpay Order on Backend
      const initRes = await fetch(getApiUrl('/orders/razorpay-init'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: payloadCustomer,
          items: payloadItems,
        }),
      });

      const initData = await initRes.json().catch(() => null);

      if (!initRes.ok || !initData || !initData.success) {
        setErrorMessage(initData?.message || 'Failed to initialize online payment.');
        setLoading(false);
        return;
      }

      // Handler callback to verify payment on backend
      const handlePaymentVerification = async (rzpPaymentId, rzpOrderId, rzpSignature) => {
        try {
          const verifyRes = await fetch(getApiUrl('/orders/razorpay-verify'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: rzpOrderId,
              razorpay_payment_id: rzpPaymentId,
              razorpay_signature: rzpSignature,
              customer: payloadCustomer,
              items: payloadItems,
            }),
          });

          const verifyData = await verifyRes.json().catch(() => null);

          if (verifyRes.ok && verifyData && verifyData.success) {
            clearCart();
            setFormData(INITIAL_FORM);
            onClose();
            if (onOrderPlaced) {
              onOrderPlaced(verifyData.order);
            }
          } else {
            setErrorMessage(verifyData?.message || 'Payment verification failed on backend.');
          }
        } catch (vErr) {
          console.error('Verification error:', vErr);
          setErrorMessage(`Payment verification error (${vErr.message}).`);
        } finally {
          setLoading(false);
        }
      };

      // Check if Razorpay Checkout SDK is loaded in window
      if (window.Razorpay) {
        const options = {
          key: initData.keyId,
          amount: initData.amount,
          currency: initData.currency || 'INR',
          name: 'LITRA KING (SHOES ZONE)',
          description: `Footwear Order Payment (₹${grandTotal})`,
          order_id: initData.razorpayOrderId.startsWith('order_') ? undefined : initData.razorpayOrderId,
          handler: function (response) {
            handlePaymentVerification(
              response.razorpay_payment_id,
              response.razorpay_order_id || initData.razorpayOrderId,
              response.razorpay_signature || 'test_signature'
            );
          },
          prefill: {
            name: formData.name,
            email: formData.email || '',
            contact: cleanPhone,
          },
          theme: {
            color: '#f59e0b',
          },
          modal: {
            ondismiss: function () {
              setLoading(false);
              setErrorMessage('Payment cancelled by user. Order was not placed.');
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response) {
          setLoading(false);
          setErrorMessage(`Payment Failed: ${response.error?.description || 'Transaction declined'}`);
        });
        rzp.open();
      } else {
        // Fallback simulator for offline/script blocked testing
        console.warn('Razorpay SDK script not present in window, using backend test simulator');
        const simPaymentId = 'pay_' + Math.random().toString(36).substring(2, 14);
        const simSignature = 'simulated_valid_signature_' + Date.now();
        await handlePaymentVerification(simPaymentId, initData.razorpayOrderId, simSignature);
      }
    } catch (err) {
      console.error('Razorpay process error:', err);
      setErrorMessage(`Online Payment Error (${err.message}).`);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden text-zinc-100 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/70">
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
        <div className="p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Shipping Address Form */}
          <div className="lg:col-span-7 space-y-5">
            {errorMessage && (
              <div className="flex items-start gap-3 p-3.5 bg-red-950/70 border border-red-800/80 rounded-2xl text-red-300 text-xs animate-shake">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form id="checkout-form" onSubmit={handleSubmitOrder} className="space-y-4">
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
                  <ShieldCheck className="w-4 h-4" /> 2. Payment Method Selection
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Option 1: Cash on Delivery */}
                  <label
                    className={`p-4 border-2 rounded-2xl cursor-pointer transition-all flex items-center gap-3 ${
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
                      className="accent-amber-500 w-4 h-4"
                    />
                    <div>
                      <div className="text-xs font-extrabold text-white flex items-center gap-1.5">
                        Cash on Delivery (COD)
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-bold uppercase">
                          Pay on Delivery
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5">Pay cash when shoes arrive at doorstep</p>
                    </div>
                  </label>

                  {/* Option 2: Razorpay Online Payment */}
                  <label
                    className={`p-4 border-2 rounded-2xl cursor-pointer transition-all flex items-center gap-3 ${
                      paymentMethod === 'Online Payment'
                        ? 'bg-amber-500/10 border-amber-500 text-white shadow-md'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="Online Payment"
                      checked={paymentMethod === 'Online Payment'}
                      onChange={() => setPaymentMethod('Online Payment')}
                      className="accent-amber-500 w-4 h-4"
                    />
                    <div>
                      <div className="text-xs font-extrabold text-white flex items-center gap-1.5">
                        Online Payment (Razorpay)
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-bold uppercase">
                          Instant Paid
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5">UPI (GPay/PhonePe), Credit/Debit Cards, NetBanking</p>
                    </div>
                  </label>
                </div>
              </div>
            </form>
          </div>

          {/* Right Column: Order Summary & Place Order Button */}
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
                    <span>{paymentMethod === 'Online Payment' ? 'INITIALIZING RAZORPAY...' : 'PLACING ORDER...'}</span>
                  </>
                ) : paymentMethod === 'Online Payment' ? (
                  <>
                    <CreditCard className="w-5 h-5" />
                    <span>PAY ₹{grandTotal} VIA RAZORPAY</span>
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
                <span>SSL 256-bit Secured &amp; HMAC Verified Checkout</span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
