import React, { useState } from 'react';
import { AdminLayout } from '../components/Layout/AdminLayout';
import { Card } from '../components/UI/Card';
import { Store, Server, Shield, Bell, Check, RefreshCw } from 'lucide-react';
import { API_BASE_URL } from '../api/apiConfig';

export const Settings = () => {
  const [storeName, setStoreName] = useState('LITRA KING SHOES ZONE');
  const [phone, setPhone] = useState('+91 98290 00000');
  const [city, setCity] = useState('Chomu, Jaipur, Rajasthan');
  const [apiUrl, setApiUrl] = useState(localStorage.getItem('litra_admin_api_url') || API_BASE_URL);
  const [lowStockAlertThreshold, setLowStockAlertThreshold] = useState(5);
  const [currency, setCurrency] = useState('INR (₹)');
  const [savedMsg, setSavedMsg] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState('');

  const handleSaveSettings = (e) => {
    e.preventDefault();
    localStorage.setItem('litra_admin_api_url', apiUrl);
    setSavedMsg('Settings saved successfully!');
    setTimeout(() => setSavedMsg(''), 3000);
  };

  const handleTestBackendConnection = async () => {
    setTesting(true);
    setTestResult('');
    try {
      const res = await fetch(`${apiUrl}/`);
      if (res.ok) {
        const data = await res.json();
        setTestResult(`Connected! Server says: ${data.message || 'API Active'}`);
      } else {
        setTestResult(`Server returned HTTP ${res.status}`);
      }
    } catch (err) {
      setTestResult(`Connection Failed: ${err.message}. Make sure backend server is running on port 5000.`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <AdminLayout title="Admin Panel Settings">
      {savedMsg && (
        <div style={{ padding: '0.8rem 1.2rem', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#10b981', borderRadius: '8px', marginBottom: '1.5rem', fontWeight: 600 }}>
          <Check size={18} style={{ display: 'inline', marginRight: '0.5rem' }} /> {savedMsg}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Store Information */}
        <Card title="Store Profile & Details" subtitle="LITRA KING store identification">
          <form onSubmit={handleSaveSettings}>
            <div className="form-group">
              <label className="form-label">Store Brand Name</label>
              <input
                type="text"
                className="form-control"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Support Phone Number</label>
              <input
                type="text"
                className="form-control"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Store Location / City</label>
              <input
                type="text"
                className="form-control"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
              Save Profile
            </button>
          </form>
        </Card>

        {/* Backend API Configuration */}
        <Card title="Backend API Connection" subtitle="Server configuration for database calls">
          <div className="form-group">
            <label className="form-label">Backend REST API URL</label>
            <input
              type="text"
              className="form-control"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="http://localhost:5000"
            />
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
              Base server URL that routes all MongoDB data operations.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '1rem', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" onClick={handleTestBackendConnection} disabled={testing}>
              <RefreshCw size={16} /> {testing ? 'Testing...' : 'Test Backend Connection'}
            </button>
            <button className="btn btn-primary" onClick={handleSaveSettings}>
              Save API URL
            </button>
          </div>

          {testResult && (
            <div style={{
              marginTop: '1rem',
              padding: '0.75rem',
              background: testResult.includes('Connected') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: testResult.includes('Connected') ? '#10b981' : '#f87171',
              borderRadius: '6px',
              fontSize: '0.85rem'
            }}>
              {testResult}
            </div>
          )}
        </Card>

        {/* Preferences & Thresholds */}
        <Card title="Inventory & Display Preferences" subtitle="Alert thresholds & currency formatting">
          <div className="form-group">
            <label className="form-label">Low Stock Warning Threshold (Pairs)</label>
            <input
              type="number"
              className="form-control"
              value={lowStockAlertThreshold}
              onChange={(e) => setLowStockAlertThreshold(Number(e.target.value))}
            />
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
              Products with stock at or below this count show a warning badge.
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">Store Currency Symbol</label>
            <input
              type="text"
              className="form-control"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              readOnly
            />
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
};
