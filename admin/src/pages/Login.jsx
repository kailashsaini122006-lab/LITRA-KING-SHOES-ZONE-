import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Lock, KeyRound, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Login = () => {
  const [pinOrPass, setPinOrPass] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
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

  return (
    <div className="login-container">
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
                placeholder="Enter PIN (e.g. 122006) or Password"
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

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: '1.5rem', padding: '0.85rem' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Access Admin Dashboard'}
          </button>
        </form>

        <p style={{ marginTop: '2rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Strictly for authorized LITRA KING SHOES ZONE store management.
        </p>
      </div>
    </div>
  );
};

export default Login;
