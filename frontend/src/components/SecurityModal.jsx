import React, { useState, useEffect } from 'react';
import { Lock, KeyRound, X, RefreshCw, AlertTriangle, CheckCircle2, Mail, ArrowLeft, ShieldCheck, Eye, EyeOff, User } from 'lucide-react';
import { getApiUrl } from '../config/api';

export default function SecurityModal({ isOpen, onClose, onAuthSuccess }) {
  // Modal View States: 'verify' | 'forgot-request' | 'verify-code' | 'create-new-pin' | 'reset-success'
  const [viewState, setViewState] = useState('verify');

  // Input States
  const [pin, setPin] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  // UI Feedback States
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setViewState('verify');
      setPin('');
      setResetCode('');
      setResetToken('');
      setNewPin('');
      setConfirmPin('');
      setErrorMessage('');
      setSuccessMessage('');
      fetchMaskedEmail();
    }
  }, [isOpen]);

  const fetchMaskedEmail = async () => {
    try {
      const res = await fetch(getApiUrl('/auth/security-pin/masked-email'));
      const data = await res.json().catch(() => null);
      if (res.ok && data && data.maskedEmail) {
        setMaskedEmail(data.maskedEmail);
      }
    } catch {
      // Fallback display if fetch fails
      setMaskedEmail('ka****@gmail.com');
    }
  };

  const handlePinChange = (e) => {
    const val = e.target.value.replace(/\D/g, ''); // Numbers only
    if (val.length <= 4) {
      setPin(val);
      setErrorMessage('');
    }
  };

  const handleNewPinChange = (e) => {
    const val = e.target.value.replace(/\D/g, '');
    if (val.length <= 4) {
      setNewPin(val);
      setErrorMessage('');
    }
  };

  const handleConfirmPinChange = (e) => {
    const val = e.target.value.replace(/\D/g, '');
    if (val.length <= 4) {
      setConfirmPin(val);
      setErrorMessage('');
    }
  };

  const handleCodeChange = (e) => {
    const val = e.target.value.replace(/\D/g, '');
    if (val.length <= 6) {
      setResetCode(val);
      setErrorMessage('');
    }
  };

  // 1. Admin Login & PIN Verification Handler
  const handleVerifyPin = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!pin || pin.length !== 4) {
      setErrorMessage('Security PIN must be exactly 4 digits');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(getApiUrl('/auth/verify-pin'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin: pin.trim(),
        }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data && data.success) {
        setSuccessMessage('Admin Login verified successfully');
        sessionStorage.setItem('lk_access_token', data.accessToken);

        setTimeout(() => {
          onAuthSuccess(data.accessToken);
        }, 500);
      } else {
        const msg = data?.message || 'Invalid Security PIN';
        setErrorMessage(msg);
      }
    } catch (err) {
      console.error('PIN verify error:', err);
      setErrorMessage(`Connection Error (${err.message}). Make sure backend server is running.`);
    } finally {
      setLoading(false);
    }
  };

  // 2. Open Forgot Flow
  const handleOpenForgot = () => {
    setErrorMessage('');
    setSuccessMessage('');
    setViewState('forgot-request');
  };

  // 3. Send Reset Code Handler
  const handleSendResetCode = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    try {
      setLoading(true);
      const res = await fetch(getApiUrl('/auth/security-pin/forgot'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data && data.success) {
        if (data.maskedEmail) setMaskedEmail(data.maskedEmail);
        setSuccessMessage(data.message || 'Reset code sent to your registered email.');
        setTimeout(() => {
          setSuccessMessage('');
          setViewState('verify-code');
        }, 1200);
      } else {
        setErrorMessage(data?.message || 'Failed to send reset code. Please try again.');
      }
    } catch (err) {
      console.error('Forgot PIN error:', err);
      setErrorMessage(`Connection Error (${err.message}).`);
    } finally {
      setLoading(false);
    }
  };

  // 4. Verify Reset Code Handler
  const handleVerifyResetCode = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!resetCode || resetCode.length !== 6) {
      setErrorMessage('Invalid or expired verification code.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(getApiUrl('/auth/security-pin/verify-reset-code'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: resetCode }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data && data.success) {
        if (data.resetToken) setResetToken(data.resetToken);
        setSuccessMessage('Code verified successfully.');
        setTimeout(() => {
          setSuccessMessage('');
          setViewState('create-new-pin');
        }, 800);
      } else {
        setErrorMessage(data?.message || 'Invalid or expired verification code.');
      }
    } catch (err) {
      console.error('Verify code error:', err);
      setErrorMessage('Invalid or expired verification code.');
    } finally {
      setLoading(false);
    }
  };

  // 5. Save New Security PIN Handler
  const handleResetPinSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!newPin || newPin.length !== 4 || !confirmPin || confirmPin.length !== 4) {
      setErrorMessage('Security PIN must contain exactly 4 digits.');
      return;
    }

    if (newPin !== confirmPin) {
      setErrorMessage('Security PINs do not match.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(getApiUrl('/auth/security-pin/reset'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resetToken,
          code: resetCode,
          newPin,
          confirmPin,
        }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data && data.success) {
        setSuccessMessage('Security PIN changed successfully.');
        setTimeout(() => {
          setViewState('reset-success');
        }, 600);
      } else {
        setErrorMessage(data?.message || 'Failed to update Security PIN.');
      }
    } catch (err) {
      console.error('Reset PIN error:', err);
      setErrorMessage(`Connection Error (${err.message}).`);
    } finally {
      setLoading(false);
    }
  };

  const handleReturnToLogin = () => {
    setViewState('verify');
    setPin('');
    setNewPin('');
    setConfirmPin('');
    setResetCode('');
    setResetToken('');
    setErrorMessage('');
    setSuccessMessage('');
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
                {viewState === 'verify' && 'ADMIN LOGIN'}
                {viewState === 'forgot-request' && 'FORGOT CREDENTIALS'}
                {viewState === 'verify-code' && 'VERIFY RESET CODE'}
                {viewState === 'create-new-pin' && 'CREATE NEW SECURITY PIN'}
                {viewState === 'reset-success' && 'PIN RESET SUCCESSFUL'}
              </h3>
              <p className="text-xs text-zinc-400">
                {viewState === 'verify' && 'Enter 4-digit Security PIN to access Admin Portal'}
                {viewState === 'forgot-request' && 'Send 6-digit verification code to admin email'}
                {viewState === 'verify-code' && 'Enter 6-digit code sent to your email'}
                {viewState === 'create-new-pin' && 'Set your new 4-digit Security PIN'}
                {viewState === 'reset-success' && 'Your Security PIN has been updated'}
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

          {/* VIEW 1: Main Admin Login Form */}
          {viewState === 'verify' && (
            <form onSubmit={handleVerifyPin} className="space-y-5">
              
              {/* Security PIN Field */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" /> Security PIN * (4 Digits)
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength="4"
                  value={pin}
                  onChange={handlePinChange}
                  placeholder="• • • •"
                  required
                  autoFocus
                  className="w-full bg-zinc-950 border-2 border-zinc-800 rounded-xl px-4 py-3 text-center text-xl font-mono font-black tracking-[0.5em] text-amber-400 placeholder-zinc-700 focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>

              {/* LOGIN / VERIFY PIN Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-zinc-950 font-extrabold rounded-2xl text-xs sm:text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-zinc-950" />
                    <span>VERIFYING...</span>
                  </>
                ) : (
                  <>
                    <span>🔐 LOGIN / VERIFY PIN</span>
                  </>
                )}
              </button>

              {/* Forgot Security PIN Link */}
              <div className="flex items-center justify-center text-xs pt-3 border-t border-zinc-800/80">
                <button
                  type="button"
                  onClick={handleOpenForgot}
                  className="text-amber-400 hover:text-amber-300 hover:underline font-bold transition-colors"
                >
                  Forgot Security PIN?
                </button>
              </div>

            </form>
          )}

          {/* VIEW 2: Forgot Security PIN - Request Code */}
          {viewState === 'forgot-request' && (
            <form onSubmit={handleSendResetCode} className="space-y-5">
              <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-2">
                <div className="text-xs text-zinc-400 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-amber-400" />
                  <span>Registered Admin Email:</span>
                </div>
                <div className="text-sm font-mono font-bold text-amber-300 tracking-wider">
                  {maskedEmail || 'ka****@gmail.com'}
                </div>
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  Click below to send a 6-digit verification code to your registered admin email address.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold rounded-2xl text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> SENDING RESET CODE...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" /> Send Reset Code
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleReturnToLogin}
                className="w-full py-2.5 text-xs text-zinc-400 hover:text-white flex items-center justify-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to PIN Login
              </button>
            </form>
          )}

          {/* VIEW 3: Verify 6-Digit Code */}
          {viewState === 'verify-code' && (
            <form onSubmit={handleVerifyResetCode} className="space-y-5">
              <div className="space-y-2 text-center">
                <label className="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center justify-center gap-1.5">
                  <Mail className="w-4 h-4 text-amber-400" /> Enter 6-digit verification code
                </label>

                <div className="relative max-w-xs mx-auto">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength="6"
                    value={resetCode}
                    onChange={handleCodeChange}
                    placeholder="1 2 3 4 5 6"
                    required
                    className="w-full bg-zinc-950 border-2 border-zinc-800 rounded-2xl px-4 py-3.5 text-center text-2xl font-mono font-bold tracking-[0.5em] text-amber-400 placeholder-zinc-700 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                    autoFocus
                  />
                </div>
                <p className="text-[11px] text-zinc-500">
                  Check your inbox for the 6-digit code (valid for 10 min)
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || resetCode.length !== 6}
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-800 disabled:text-zinc-500 text-zinc-950 font-extrabold rounded-2xl text-sm transition-all shadow-lg flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> VERIFYING CODE...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Verify Code
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={handleSendResetCode}
                  disabled={loading}
                  className="text-amber-400 hover:underline"
                >
                  Resend Code
                </button>
                <button
                  type="button"
                  onClick={handleReturnToLogin}
                  className="text-zinc-400 hover:text-white flex items-center gap-1"
                >
                  <ArrowLeft className="w-3 h-3" /> Back
                </button>
              </div>
            </form>
          )}

          {/* VIEW 4: Create New Security PIN */}
          {viewState === 'create-new-pin' && (
            <form onSubmit={handleResetPinSubmit} className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">
                    New Security PIN (4 Digits)
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength="4"
                    value={newPin}
                    onChange={handleNewPinChange}
                    placeholder="••••"
                    required
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-center text-xl font-mono text-amber-400 tracking-[0.5em] focus:outline-none focus:border-amber-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">
                    Confirm New Security PIN
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength="4"
                    value={confirmPin}
                    onChange={handleConfirmPinChange}
                    placeholder="••••"
                    required
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-center text-xl font-mono text-amber-400 tracking-[0.5em] focus:outline-none focus:border-amber-500 transition-all"
                  />
                </div>

                <p className="text-[11px] text-zinc-500 text-center">
                  PIN must be exactly 4 digits (numbers only)
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-extrabold rounded-2xl text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> SAVING NEW PIN...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" /> Reset Security PIN
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleReturnToLogin}
                className="w-full py-2 text-xs text-zinc-400 hover:text-white flex items-center justify-center gap-1 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Cancel
              </button>
            </form>
          )}

          {/* VIEW 5: Reset Success */}
          {viewState === 'reset-success' && (
            <div className="text-center space-y-4 py-2 animate-fadeIn">
              <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Security PIN changed successfully.</h4>
                <p className="text-xs text-zinc-400 mt-1">
                  You can now log in using your NEW 4-digit Security PIN to unlock Saved Records.
                </p>
              </div>

              <button
                type="button"
                onClick={handleReturnToLogin}
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold rounded-2xl text-sm transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <KeyRound className="w-4 h-4" /> Return to PIN Verification
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
