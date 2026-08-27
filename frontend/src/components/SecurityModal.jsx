import React, { useState, useEffect } from 'react';
import { Lock, KeyRound, X, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { getApiUrl } from '../config/api';

export default function SecurityModal({ isOpen, onClose, onAuthSuccess }) {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setErrorMessage('');
      setSuccessMessage('');
    }
  }, [isOpen]);

  const handlePinChange = (e) => {
    const val = e.target.value.replace(/\D/g, ''); // Numbers only (no letters)
    if (val.length <= 4) {
      setPin(val);
      setErrorMessage('');
    }
  };

  const handleVerifyPin = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!pin || pin.length !== 4) {
      setErrorMessage('Please enter a valid 4-digit PIN');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(getApiUrl('/auth/verify-pin'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data && data.success) {
        setSuccessMessage('PIN verified successfully');
        sessionStorage.setItem('lk_access_token', data.accessToken);

        setTimeout(() => {
          onAuthSuccess(data.accessToken);
        }, 600);
      } else {
        const msg = data?.message || 'Incorrect Security PIN. Access Denied!';
        setErrorMessage(msg);
      }
    } catch (err) {
      console.error('PIN verify error:', err);
      setErrorMessage(`Connection Error (${err.message}). Make sure backend server is running.`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden text-zinc-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white tracking-wider uppercase">
                SECURITY PIN VERIFICATION
              </h3>
              <p className="text-xs text-zinc-400">
                Enter 4-Digit Security PIN to unlock Saved Records
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors"
            aria-label="Close Security Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          
          {/* Error Alert */}
          {errorMessage && (
            <div className="flex items-start gap-3 p-3.5 bg-red-950/70 border border-red-800/80 rounded-2xl text-red-300 text-xs animate-shake">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Alert */}
          {successMessage && (
            <div className="flex items-center gap-3 p-3.5 bg-emerald-950/70 border border-emerald-800/80 rounded-2xl text-emerald-300 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleVerifyPin} className="space-y-5">
            <div className="space-y-2 text-center">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center justify-center gap-1.5">
                <KeyRound className="w-4 h-4 text-amber-400" /> Enter 4-Digit Security Key
              </label>

              {/* 4-Digit PIN Input Box */}
              <div className="relative max-w-xs mx-auto">
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength="4"
                  value={pin}
                  onChange={handlePinChange}
                  placeholder="• • • •"
                  required
                  className="w-full bg-zinc-950 border-2 border-zinc-800 rounded-2xl px-4 py-3.5 text-center text-3xl font-mono font-black tracking-[1em] text-amber-400 placeholder-zinc-700 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                  autoFocus
                />
              </div>
              <p className="text-[11px] text-zinc-500">
                Only numbers allowed (4 digits)
              </p>
            </div>

            {/* VERIFY / UNLOCK Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
                !loading
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 shadow-amber-500/25 hover:scale-[1.01]'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
              }`}
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> VERIFYING PIN...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" /> VERIFY / UNLOCK
                </>
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
