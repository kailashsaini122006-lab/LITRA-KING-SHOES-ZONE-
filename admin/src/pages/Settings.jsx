import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../components/Layout/AdminLayout';
import { Card } from '../components/UI/Card';
import {
  Store,
  Server,
  Shield,
  Bell,
  Check,
  RefreshCw,
  Video,
  Sparkles,
  Play,
  Film,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { API_BASE_URL } from '../api/apiConfig';
import {
  fetchSiteSettings,
  updateSiteSettings,
  fetchAiVideoStatus,
  saveAiVideoConfig,
  testAiVideoConnection
} from '../api/aiVideoApi';
import { fetchProducts } from '../api/productApi';

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

  // Hero Video State
  const [heroVideoEnabled, setHeroVideoEnabled] = useState(false);
  const [heroVideoProductId, setHeroVideoProductId] = useState('');
  const [productsWithVideo, setProductsWithVideo] = useState([]);
  const [savingHeroSettings, setSavingHeroSettings] = useState(false);

  // AI Video Service Config State
  const [aiProvider, setAiProvider] = useState('luma');
  const [aiApiKey, setAiApiKey] = useState('');
  const [aiConfigured, setAiConfigured] = useState(false);
  const [aiMaskedKey, setAiMaskedKey] = useState('');
  const [testingAi, setTestingAi] = useState(false);
  const [aiTestResult, setAiTestResult] = useState(null);
  const [savingAiConfig, setSavingAiConfig] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const [settingsRes, aiRes, prodsRes] = await Promise.all([
        fetchSiteSettings().catch(() => null),
        fetchAiVideoStatus().catch(() => null),
        fetchProducts().catch(() => []),
      ]);

      if (settingsRes) {
        if (settingsRes.storeName) setStoreName(settingsRes.storeName);
        if (settingsRes.phone) setPhone(settingsRes.phone);
        if (settingsRes.city) setCity(settingsRes.city);
        if (settingsRes.heroVideoEnabled !== undefined) setHeroVideoEnabled(settingsRes.heroVideoEnabled);
        if (settingsRes.adminSettings?.heroVideoProductId) setHeroVideoProductId(settingsRes.adminSettings.heroVideoProductId);
        if (settingsRes.adminSettings?.lowStockThreshold) setLowStockAlertThreshold(settingsRes.adminSettings.lowStockThreshold);
      }

      if (aiRes) {
        setAiConfigured(aiRes.isConfigured);
        setAiProvider(aiRes.provider || 'luma');
        setAiMaskedKey(aiRes.maskedKey || '');
      }

      const allProds = Array.isArray(prodsRes) ? prodsRes : (prodsRes?.products || []);
      const withVideo = allProds.filter((p) => p.video && p.video.trim());
      setProductsWithVideo(withVideo);

      // If hero video product id is set, sync
      const heroProd = allProds.find((p) => p.isHeroVideo);
      if (heroProd && !heroVideoProductId) {
        setHeroVideoProductId(heroProd.productId || heroProd._id);
        setHeroVideoEnabled(true);
      }
    } catch (err) {
      console.error('Error loading settings:', err);
    }
  };

  const handleSaveStoreProfile = async (e) => {
    e.preventDefault();
    localStorage.setItem('litra_admin_api_url', apiUrl);
    try {
      await updateSiteSettings({
        storeName,
        phone,
        city,
        lowStockThreshold: lowStockAlertThreshold,
      });
      setSavedMsg('Store profile and preferences saved successfully!');
      setTimeout(() => setSavedMsg(''), 3500);
    } catch (err) {
      setSavedMsg(`Profile saved locally (${err.message})`);
      setTimeout(() => setSavedMsg(''), 3500);
    }
  };

  const handleSaveHeroSettings = async () => {
    setSavingHeroSettings(true);
    try {
      const res = await updateSiteSettings({
        heroVideoEnabled,
        heroVideoProductId,
      });
      if (res.success) {
        setSavedMsg('Home Page Hero video settings saved successfully!');
        setTimeout(() => setSavedMsg(''), 3500);
      }
    } catch (err) {
      alert('Error updating Hero settings: ' + err.message);
    } finally {
      setSavingHeroSettings(false);
    }
  };

  const handleSaveAiConfig = async (e) => {
    e.preventDefault();
    setSavingAiConfig(true);
    setAiTestResult(null);
    try {
      const res = await saveAiVideoConfig({
        provider: aiProvider,
        apiKey: aiApiKey.trim(),
      });
      if (res.success) {
        setAiConfigured(res.isConfigured);
        setAiMaskedKey(res.maskedKey);
        setSavedMsg('AI Video Generation Service configured successfully!');
        setTimeout(() => setSavedMsg(''), 3500);
      } else {
        setAiTestResult({ success: false, message: res.message || 'Failed to save configuration.' });
      }
    } catch (err) {
      setAiTestResult({ success: false, message: err.message });
    } finally {
      setSavingAiConfig(false);
    }
  };

  const handleTestAiConnection = async () => {
    setTestingAi(true);
    setAiTestResult(null);
    try {
      const res = await testAiVideoConnection(aiProvider, aiApiKey);
      setAiTestResult(res);
    } catch (err) {
      setAiTestResult({ success: false, message: err.message });
    } finally {
      setTestingAi(false);
    }
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

  const selectedHeroProduct = productsWithVideo.find(
    (p) => p.productId === heroVideoProductId || p._id === heroVideoProductId
  );

  return (
    <AdminLayout title="Admin Panel Settings">
      {savedMsg && (
        <div style={{ padding: '0.8rem 1.2rem', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#10b981', borderRadius: '8px', marginBottom: '1.5rem', fontWeight: 600 }}>
          <Check size={18} style={{ display: 'inline', marginRight: '0.5rem' }} /> {savedMsg}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
        
        {/* Home Page Hero Video Settings Card */}
        <Card title="Home Page Hero Media" subtitle="Select featured shoe video for Home Page right hero card">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              Choose whether to display a customer-facing 360° promotional shoe video in place of the shop exterior photo on the Home Page hero section.
            </p>

            {/* Toggle Switch */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', padding: '0.6rem', background: 'var(--bg-input)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <input
                type="checkbox"
                checked={heroVideoEnabled}
                onChange={(e) => setHeroVideoEnabled(e.target.checked)}
                style={{ width: '18px', height: '18px' }}
              />
              <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>
                Enable AI Shoe Video on Home Page Hero
              </span>
            </label>

            {/* Product Selector Dropdown */}
            <div className="form-group">
              <label className="form-label">Featured Shoe Product</label>
              <select
                className="form-control"
                value={heroVideoProductId}
                onChange={(e) => setHeroVideoProductId(e.target.value)}
                disabled={!heroVideoEnabled || productsWithVideo.length === 0}
              >
                <option value="">-- Select a shoe product with video --</option>
                {productsWithVideo.map((p) => (
                  <option key={p._id || p.productId} value={p.productId || p._id}>
                    {p.name} ({p.productId}) — ₹{p.price}
                  </option>
                ))}
              </select>
              {productsWithVideo.length === 0 && (
                <p style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: '0.3rem' }}>
                  No products currently have an AI video. Open Products and click "Generate AI Shoe Video".
                </p>
              )}
            </div>

            {/* Video Preview */}
            {selectedHeroProduct && selectedHeroProduct.video && heroVideoEnabled && (
              <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #10b981', background: '#000', maxHeight: '180px', display: 'flex', justifyContent: 'center' }}>
                <video
                  src={selectedHeroProduct.video.startsWith('http') || selectedHeroProduct.video.startsWith('data:') ? selectedHeroProduct.video : `http://localhost:5000${selectedHeroProduct.video}`}
                  autoPlay
                  loop
                  muted
                  style={{ maxHeight: '180px', maxWidth: '100%', objectFit: 'contain' }}
                />
              </div>
            )}

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSaveHeroSettings}
              disabled={savingHeroSettings}
              style={{ marginTop: '0.5rem' }}
            >
              <Check size={16} />
              {savingHeroSettings ? 'Saving Hero Media...' : 'Save Hero Media Settings'}
            </button>
          </div>
        </Card>

        {/* AI Video Generator API Configuration Card */}
        <Card title="AI Shoe-to-Video Engine" subtitle="Real AI Image-to-Video provider configuration">
          <form onSubmit={handleSaveAiConfig}>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.4', marginBottom: '1rem' }}>
              Connect your AI service for 360-degree promotional footwear generation. API keys are encrypted and handled exclusively by backend server.
            </p>

            <div className="form-group">
              <label className="form-label">AI Video Service Provider</label>
              <select
                className="form-control"
                value={aiProvider}
                onChange={(e) => setAiProvider(e.target.value)}
              >
                <option value="luma">Luma Dream Machine (Recommended for 360° Spin)</option>
                <option value="replicate">Replicate (MiniMax / SVD)</option>
                <option value="fal">Fal.ai (Kling / Fast-SVD)</option>
                <option value="runway">RunwayML (Gen-3 Alpha)</option>
                <option value="stability">Stability AI (Stable Video Diffusion)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                API Key / Secret Token {aiConfigured && <span style={{ color: '#10b981', fontWeight: 600 }}>({aiMaskedKey})</span>}
              </label>
              <input
                type="password"
                className="form-control"
                placeholder={aiConfigured ? aiMaskedKey : 'Paste provider API key here...'}
                value={aiApiKey}
                onChange={(e) => setAiApiKey(e.target.value)}
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                Never exposed to frontend clients. Stored securely in database.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleTestAiConnection}
                disabled={testingAi}
              >
                <RefreshCw size={15} className={testingAi ? 'animate-spin' : ''} />
                {testingAi ? 'Verifying...' : 'Test API Key'}
              </button>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={savingAiConfig}
              >
                <Check size={16} />
                {savingAiConfig ? 'Saving...' : 'Save AI Credentials'}
              </button>
            </div>

            {aiTestResult && (
              <div
                style={{
                  marginTop: '1rem',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.82rem',
                  background: aiTestResult.success ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  color: aiTestResult.success ? '#10b981' : '#f87171',
                  border: `1px solid ${aiTestResult.success ? '#10b981' : '#ef4444'}`,
                }}
              >
                {aiTestResult.message}
              </div>
            )}
          </form>
        </Card>

        {/* Store Profile Information */}
        <Card title="Store Profile & Details" subtitle="LITRA KING store identification">
          <form onSubmit={handleSaveStoreProfile}>
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

        {/* Backend API Connection & Inventory Preferences */}
        <Card title="Backend & Inventory Preferences" subtitle="Server configuration and alert thresholds">
          <div className="form-group">
            <label className="form-label">Backend REST API URL</label>
            <input
              type="text"
              className="form-control"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="http://localhost:5000"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Low Stock Warning Threshold (Pairs)</label>
            <input
              type="number"
              className="form-control"
              value={lowStockAlertThreshold}
              onChange={(e) => setLowStockAlertThreshold(Number(e.target.value))}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '1rem', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" onClick={handleTestBackendConnection} disabled={testing}>
              <RefreshCw size={16} /> {testing ? 'Testing...' : 'Test Backend Connection'}
            </button>
            <button className="btn btn-primary" onClick={handleSaveStoreProfile}>
              Save Settings
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
      </div>
    </AdminLayout>
  );
};
