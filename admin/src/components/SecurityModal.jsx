import React, { useState, useEffect } from 'react';
import { Lock, Mail, Eye, EyeOff, X, RefreshCw, AlertTriangle, CheckCircle2, ArrowLeft, KeyRound, ShieldCheck } from 'lucide-react';
import { getApiUrl } from '../config/api';

export default function SecurityModal({ isOpen, onClose, onAuthSuccess }) {
  // Modal View States: 'login' | 'forgot-request' | 'verify-code' | 'create-new-password' | 'reset-success'
  const [viewState, setViewState] = useState('login');

  // Login Input States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Forgot Password States
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // UI Feedback States
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setViewState('login');
      setEmail('');
      setPassword('');
      setShowPassword(false);
      setForgotEmail('');
      setResetCode('');
      setNewPassword('');
      setConfirmPassword('');
      setShowNewPassword(false);
      setErrorMessage('');
      setSuccessMessage('');
    }
  }, [isOpen]);

  // Handle Admin Email + Password Login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanInput = email.trim();
    const cleanPassword = password.trim();

    if (!cleanInput || !cleanPassword) {
      setErrorMessage('Invalid Admin ID or Password');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(getApiUrl('/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: cleanInput,
          email: cleanInput,
          password: cleanPassword,
        }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data && data.success) {
        setSuccessMessage('Admin login verified successfully!');
        if (data.accessToken) {
          sessionStorage.setItem('lk_access_token', data.accessToken);
        }

        setTimeout(() => {
          onAuthSuccess(data.accessToken);
        }, 500);
      } else {
        setErrorMessage(data?.message || 'Invalid Admin ID or Password');
      }
    } catch (err) {
      console.error('Login connection error:', err);
      setErrorMessage(`Connection Error (${err.message}). Make sure backend server is running.`);
    } finally {
      setLoading(false);
    }
  };

  // Open Forgot Password View
  const handleOpenForgot = () => {
    setErrorMessage('');
    setSuccessMessage('');
    setForgotEmail(email || '');
    setViewState('forgot-request');
  };

  // Send Password Reset OTP
  const handleSendResetOtp = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!forgotEmail.trim()) {
      setErrorMessage('Please enter your admin email.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(getApiUrl('/auth/forgot-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data && data.success) {
        setSuccessMessage(data.message || 'OTP code sent to your registered admin email.');
        setTimeout(() => {
          setSuccessMessage('');
          setViewState('verify-code');
        }, 1200);
      } else {
        setErrorMessage(data?.message || 'Failed to send reset OTP. Please try again.');
      }
    } catch (err) {
      setErrorMessage(`Connection Error (${err.message}).`);
    } finally {
      setLoading(false);
    }
  };

  // Verify Reset OTP Code
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!resetCode || resetCode.trim().length !== 6) {
      setErrorMessage('Please enter a valid 6-digit OTP code.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(getApiUrl('/auth/verify-otp'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim(), otp: resetCode.trim() }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data && data.success) {
        setSuccessMessage('OTP code verified successfully.');
        setTimeout(() => {
          setSuccessMessage('');
          setViewState('create-new-password');
        }, 800);
      } else {
        setErrorMessage(data?.message || 'Invalid or expired OTP code.');
      }
    } catch (err) {
      setErrorMessage('Invalid or expired OTP code.');
    } finally {
      setLoading(false);
    }
  };

  // Submit New Password
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!newPassword || !confirmPassword) {
      setErrorMessage('Please fill in both password fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#_\-.,;:!+=])[A-Za-z\d@$!%*?&#_\-.,;:!+=]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      setErrorMessage('Password must be at least 8 characters long and contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character (e.g. @$!%*?&#).');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(getApiUrl('/auth/reset-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotEmail.trim(),
          otp: resetCode.trim(),
          newPassword: newPassword.trim(),
          confirmPassword: confirmPassword.trim(),
        }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data && data.success) {
        setSuccessMessage('Password reset successfully.');
        setTimeout(() => {
          setViewState('reset-success');
        }, 600);
      } else {
        setErrorMessage(data?.message || 'Failed to reset password.');
      }
    } catch (err) {
      setErrorMessage(`Connection Error (${err.message}).`);
    } finally {
      setLoading(false);
    }
  };

  const handleReturnToLogin = () => {
    setViewState('login');
    setPassword('');
    setShowPassword(false);
    setResetCode('');
    setNewPassword('');
    setConfirmPassword('');
    setErrorMessage('');
    setSuccessMessage('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
      {/* Container: #121212 background, rounded-3xl corners, dark shadow */}
      <div className="relative w-full max-w-md bg-[#121212] border border-zinc-800/90 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.9)] overflow-hidden text-zinc-100 transition-all">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800/80 bg-[#121212]">
          <div className="flex items-center gap-3.5">
            {/* Top-left: yellow lock icon inside a rounded square box with yellow border */}
            <div className="w-11 h-11 flex items-center justify-center bg-amber-400/10 border-2 border-amber-400 rounded-xl text-amber-400 shrink-0 shadow-[0_0_12px_rgba(251,191,36,0.2)]">
              <Lock className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-wider uppercase leading-tight">
                {viewState === 'login' && 'ADMIN LOGIN'}
                {viewState === 'forgot-request' && 'FORGOT PASSWORD'}
                {viewState === 'verify-code' && 'VERIFY OTP CODE'}
                {viewState === 'create-new-password' && 'CREATE NEW PASSWORD'}
                {viewState === 'reset-success' && 'PASSWORD RESET SUCCESSFUL'}
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5 leading-snug">
                {viewState === 'login' && 'Enter Admin Credentials to access Admin Portal'}
                {viewState === 'forgot-request' && 'Enter your admin email to receive reset OTP'}
                {viewState === 'verify-code' && 'Enter 6-digit OTP code sent to your email'}
                {viewState === 'create-new-password' && 'Set your new admin password'}
                {viewState === 'reset-success' && 'Your admin password has been updated'}
              </p>
            </div>
          </div>

          {/* Top-right X close button */}
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/80 rounded-xl transition-colors shrink-0"
            aria-label="Close Admin Login Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 sm:p-7 space-y-6">
          
          {/* Error Alert */}
          {errorMessage && (
            <div className="flex items-start gap-3 p-3.5 bg-red-950/80 border border-red-800 rounded-2xl text-red-300 text-xs animate-shake">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Alert */}
          {successMessage && (
            <div className="flex items-center gap-3 p-3.5 bg-emerald-950/80 border border-emerald-800 rounded-2xl text-emerald-300 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* VIEW 1: Main Admin Login Form */}
          {viewState === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-5">
              
              {/* ADMIN EMAIL / ID Section */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>ADMIN ID *</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrorMessage('');
                    }}
                    placeholder="Enter admin email"
                    required
                    autoFocus
                    className="w-full bg-[#0a0a0a] border-2 border-zinc-800 rounded-2xl px-4 py-3.5 pl-11 text-sm font-medium text-white placeholder-zinc-600 transition-all duration-200 focus:outline-none focus:border-[#FF8C00] focus:ring-2 focus:ring-[#FF8C00]/30 focus:shadow-[0_0_20px_rgba(255,140,0,0.25)]"
                  />
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* PASSWORD Section */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>PASSWORD *</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrorMessage('');
                    }}
                    placeholder="Enter admin password"
                    required
                    className="w-full bg-[#0a0a0a] border-2 border-zinc-800 rounded-2xl px-4 py-3.5 pl-11 pr-11 text-sm font-medium text-white placeholder-zinc-600 transition-all duration-200 focus:outline-none focus:border-[#FF8C00] focus:ring-2 focus:ring-[#FF8C00]/30 focus:shadow-[0_0_20px_rgba(255,140,0,0.25)]"
                  />
                  <Lock className="w-4 h-4 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-white transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* LOGIN BUTTON */}
              <button
                type="submit"
                disabled={loading || !email.trim() || !password.trim()}
                className="w-full py-4 mt-2 bg-[#FF8C00] hover:bg-[#e57d00] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none text-black font-bold uppercase rounded-2xl text-sm sm:text-base tracking-wider transition-all duration-200 shadow-[0_4px_20px_rgba(255,140,0,0.35)] hover:shadow-[0_6px_25px_rgba(255,140,0,0.5)] hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2.5"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin text-black" />
                    <span>VERIFYING...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5 fill-black text-black shrink-0" />
                    <span>LOGIN / VERIFY</span>
                  </>
                )}
              </button>

              {/* FORGOT PASSWORD Link */}
              <div className="flex items-center justify-center text-xs pt-2">
                <button
                  type="button"
                  onClick={handleOpenForgot}
                  className="text-[#FFD700] hover:text-amber-300 hover:underline font-bold transition-colors cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>

            </form>
          )}

          {/* VIEW 2: Forgot Password - Request OTP */}
          {viewState === 'forgot-request' && (
            <form onSubmit={handleSendResetOtp} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-amber-400">
                  Registered Admin Email *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="Enter admin email address"
                    required
                    className="w-full bg-[#0a0a0a] border-2 border-zinc-800 rounded-2xl px-4 py-3.5 pl-11 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#FF8C00]"
                  />
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
                </div>
                <p className="text-[11px] text-zinc-500 leading-relaxed pt-1">
                  We will send a 6-digit OTP reset code to your registered admin email address.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || !forgotEmail.trim()}
                className="w-full py-3.5 bg-[#FF8C00] hover:bg-[#e57d00] disabled:opacity-50 text-black font-bold uppercase tracking-wider rounded-2xl text-sm transition-all shadow-[0_4px_20px_rgba(255,140,0,0.35)] flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-black" /> SENDING OTP...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 text-black" /> Send Reset OTP
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleReturnToLogin}
                className="w-full py-2 text-xs text-zinc-400 hover:text-white flex items-center justify-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Admin Login
              </button>
            </form>
          )}

          {/* VIEW 3: Verify OTP Code */}
          {viewState === 'verify-code' && (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="space-y-2 text-center">
                <label className="text-xs font-bold uppercase tracking-widest text-amber-400 flex items-center justify-center gap-1.5">
                  <Mail className="w-4 h-4 text-amber-400" /> Enter 6-digit OTP code
                </label>

                <div className="relative max-w-xs mx-auto">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="1 2 3 4 5 6"
                    required
                    className="w-full bg-[#0a0a0a] border-2 border-zinc-800 rounded-2xl px-4 py-3.5 text-center text-2xl font-mono font-bold tracking-[0.5em] text-amber-400 placeholder-zinc-700 focus:outline-none focus:border-[#FF8C00] focus:ring-2 focus:ring-[#FF8C00]/30 transition-all"
                    autoFocus
                  />
                </div>
                <p className="text-[11px] text-zinc-500">
                  Check your inbox for the 6-digit OTP code (valid for 10 min)
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || resetCode.length !== 6}
                className="w-full py-3.5 bg-[#FF8C00] hover:bg-[#e57d00] disabled:opacity-50 text-black font-bold uppercase tracking-wider rounded-2xl text-sm transition-all shadow-[0_4px_20px_rgba(255,140,0,0.35)] flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-black" /> VERIFYING OTP...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-black" /> Verify OTP
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={handleSendResetOtp}
                  disabled={loading}
                  className="text-amber-400 hover:underline"
                >
                  Resend OTP
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

          {/* VIEW 4: Create New Password */}
          {viewState === 'create-new-password' && (
            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-amber-400 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      required
                      className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-xl px-4 py-3 pr-10 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#FF8C00] transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-amber-400 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    required
                    className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#FF8C00] transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !newPassword || !confirmPassword}
                className="w-full py-3.5 bg-[#FF8C00] hover:bg-[#e57d00] disabled:opacity-50 text-black font-bold uppercase tracking-wider rounded-2xl text-sm transition-all shadow-[0_4px_20px_rgba(255,140,0,0.35)] flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-black" /> SAVING PASSWORD...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5 text-black" /> Reset Password
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
                <h4 className="text-base font-bold text-white">Password changed successfully.</h4>
                <p className="text-xs text-zinc-400 mt-1">
                  You can now log in using your NEW password to access the Admin Portal.
                </p>
              </div>

              <button
                type="button"
                onClick={handleReturnToLogin}
                className="w-full py-3.5 bg-[#FF8C00] hover:bg-[#e57d00] text-black font-bold uppercase tracking-wider rounded-2xl text-sm transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <KeyRound className="w-4 h-4 text-black" /> Return to Admin Login
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
