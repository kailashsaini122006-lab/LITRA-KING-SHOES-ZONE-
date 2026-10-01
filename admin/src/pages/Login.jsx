import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Lock, KeyRound, AlertCircle, Mail, CheckCircle, RefreshCw, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { forgotPassword, verifyOtp, resetPassword } from '../api/authApi';

export const Login = () => {
  const [pinOrPass, setPinOrPass] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot Password / OTP Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [resetEmail, setResetEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [modalMessage, setModalMessage] = useState({ type: '', text: '' });
  const [modalLoading, setModalLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pinOrPass) {
      setError('Please enter your Admin PIN or Password');
      return;
    }
    setError('');
    setLoading(true);

    try {
      await login({ password: pinOrPass, pin: pinOrPass });
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid Security PIN or Password');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!resetEmail) {
      setModalMessage({ type: 'error', text: 'Please enter registered admin email' });
      return;
    }
    setModalLoading(true);
    setModalMessage({ type: '', text: '' });

    try {
      const res = await forgotPassword(resetEmail);
      setModalMessage({ type: 'success', text: res.message || 'OTP sent to your email.' });
      setForgotStep(2);
    } catch (err) {
      setModalMessage({ type: 'error', text: err.message || 'Failed to send OTP.' });
    } finally {
      setModalLoading(false);
    }
  };

  const handleVerifyOtpCode = async (e) => {
    e.preventDefault();
    if (!resetOtp || resetOtp.length !== 6) {
      setModalMessage({ type: 'error', text: 'Enter valid 6-digit OTP code' });
      return;
    }
    setModalLoading(true);
    setModalMessage({ type: '', text: '' });

    try {
      const res = await verifyOtp({ email: resetEmail, otp: resetOtp });
      setModalMessage({ type: 'success', text: res.message || 'OTP verified! Enter new password.' });
      setForgotStep(3);
    } catch (err) {
      setModalMessage({ type: 'error', text: err.message || 'Invalid OTP code.' });
    } finally {
      setModalLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword !== confirmPassword) {
      setModalMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }
    setModalLoading(true);
    setModalMessage({ type: '', text: '' });

    try {
      const res = await resetPassword({ email: resetEmail, otp: resetOtp, newPassword, confirmPassword });
      setModalMessage({ type: 'success', text: res.message || 'Password reset successfully! Log in now.' });
      setTimeout(() => {
        setShowForgotModal(false);
        setForgotStep(1);
        setResetEmail('');
        setResetOtp('');
        setNewPassword('');
        setConfirmPassword('');
      }, 2000);
    } catch (err) {
      setModalMessage({ type: 'error', text: err.message || 'Failed to reset password.' });
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="login-container relative">
      <div className="login-card">
        <div className="login-logo">
          <Crown size={32} />
        </div>
        <h2 className="login-title">LITRA KING</h2>
        <p className="login-subtitle">Shop Owner Admin Dashboard</p>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            marginBottom: '1.25rem',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ textAlign: 'left' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Lock size={14} /> Admin Security PIN / Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                className="form-control"
                placeholder="Enter 4-digit PIN or Password"
                value={pinOrPass}
                onChange={(e) => setPinOrPass(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
                autoFocus
              />
              <KeyRound
                size={18}
                style={{
                  position: 'absolute',
                  left: '0.8rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)'
                }}
              />
            </div>
          </div>

          <div style={{ textAlign: 'right', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={() => {
                setShowForgotModal(true);
                setForgotStep(1);
                setModalMessage({ type: '', text: '' });
              }}
              style={{ background: 'none', border: 'none', color: '#fbbf24', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Forgot PIN / Password?
            </button>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: '1.25rem', padding: '0.85rem' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Access Admin Dashboard'}
          </button>
        </form>

        <p style={{ marginTop: '2rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Strictly for authorized LITRA KING SHOES ZONE store management.
        </p>
      </div>

      {/* Forgot Password / OTP Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#131b2e] border border-amber-500/30 rounded-2xl max-w-md w-full p-6 text-zinc-100 relative shadow-2xl">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-bold text-amber-400 mb-1 flex items-center gap-2">
              <Mail size={20} /> Admin Security Reset
            </h3>
            <p className="text-xs text-zinc-400 mb-4">
              {forgotStep === 1 && 'Enter your registered email address to receive an OTP.'}
              {forgotStep === 2 && 'Enter the 6-digit OTP code sent to your email.'}
              {forgotStep === 3 && 'Set a strong new password for your admin account.'}
            </p>

            {modalMessage.text && (
              <div className={`p-3 rounded-lg text-xs mb-4 flex items-center gap-2 ${
                modalMessage.type === 'error'
                  ? 'bg-red-500/20 border border-red-500/40 text-red-300'
                  : 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
              }`}>
                {modalMessage.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
                <span>{modalMessage.text}</span>
              </div>
            )}

            {forgotStep === 1 && (
              <form onSubmit={handleRequestOtp}>
                <div className="mb-4">
                  <label className="block text-xs text-zinc-300 mb-1">Registered Email Address</label>
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="kailashsaini122006@gmail.com"
                    className="w-full bg-[#0b0f19] border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold py-2 px-4 rounded-lg text-sm flex items-center justify-center gap-2"
                >
                  {modalLoading ? <RefreshCw className="animate-spin" size={16} /> : 'Send OTP Code'}
                </button>
              </form>
            )}

            {forgotStep === 2 && (
              <form onSubmit={handleVerifyOtpCode}>
                <div className="mb-4">
                  <label className="block text-xs text-zinc-300 mb-1">6-Digit Verification OTP</label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={resetOtp}
                    onChange={(e) => setResetOtp(e.target.value)}
                    placeholder="123456"
                    className="w-full bg-[#0b0f19] border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white tracking-widest text-center font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setForgotStep(1)}
                    className="w-1/3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-2 rounded-lg text-xs"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={modalLoading}
                    className="w-2/3 bg-amber-500 hover:bg-amber-600 text-black font-bold py-2 px-4 rounded-lg text-sm flex items-center justify-center gap-2"
                  >
                    {modalLoading ? <RefreshCw className="animate-spin" size={16} /> : 'Verify OTP'}
                  </button>
                </div>
              </form>
            )}

            {forgotStep === 3 && (
              <form onSubmit={handleResetPasswordSubmit}>
                <div className="mb-3">
                  <label className="block text-xs text-zinc-300 mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 chars (1 upper, 1 lower, 1 num, 1 symbol)"
                    className="w-full bg-[#0b0f19] border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-xs text-zinc-300 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full bg-[#0b0f19] border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold py-2 px-4 rounded-lg text-sm flex items-center justify-center gap-2"
                >
                  {modalLoading ? <RefreshCw className="animate-spin" size={16} /> : 'Reset Password'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
