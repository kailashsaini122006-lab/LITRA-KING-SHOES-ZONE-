import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Video,
  Upload,
  Play,
  Pause,
  RotateCw,
  Check,
  AlertCircle,
  RefreshCw,
  X,
  Volume2,
  VolumeX,
  Eye,
  Settings as SettingsIcon,
  ShieldCheck,
  Film,
  Camera,
  Maximize2
} from 'lucide-react';
import {
  fetchAiVideoStatus,
  saveAiVideoConfig,
  testAiVideoConnection,
  generateShoeVideo,
  pollJobStatus,
  saveShoeVideo
} from '../api/aiVideoApi';

export default function AIVideoGeneratorModal({
  isOpen,
  onClose,
  product,
  onVideoSaved
}) {
  // Reference Image State
  const [availableImages, setAvailableImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState('');
  const [customUploadedImage, setCustomUploadedImage] = useState('');
  const [uploadError, setUploadError] = useState('');

  // AI Service Config State
  const [serviceStatus, setServiceStatus] = useState(null);
  const [checkingService, setCheckingService] = useState(true);
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [configProvider, setConfigProvider] = useState('luma');
  const [configApiKey, setConfigApiKey] = useState('');
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [savingConfig, setSavingConfig] = useState(false);

  // Generation State
  const [motionType, setMotionType] = useState('turntable');
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationJob, setGenerationJob] = useState(null);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationMessage, setGenerationMessage] = useState('');
  const [generationError, setGenerationError] = useState('');

  // Generated Video Preview State
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState('');
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isSavingVideo, setIsSavingVideo] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState('');

  const videoRef = useRef(null);
  const pollTimerRef = useRef(null);

  // Load existing images from product when modal opens
  useEffect(() => {
    if (isOpen && product) {
      const imgs = [];
      if (Array.isArray(product.images) && product.images.length > 0) {
        imgs.push(...product.images.filter(Boolean));
      } else if (product.image) {
        imgs.push(product.image);
      }
      if (imgs.length === 0) {
        imgs.push('https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80');
      }
      setAvailableImages(imgs);
      setSelectedImage(imgs[0]);
      setCustomUploadedImage('');
      setUploadError('');
      setGeneratedVideoUrl('');
      setGenerationError('');
      setSaveSuccessMessage('');
      setGenerationProgress(0);
      setIsGenerating(false);

      loadServiceStatus();
    }

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, [isOpen, product]);

  const loadServiceStatus = async () => {
    setCheckingService(true);
    try {
      const data = await fetchAiVideoStatus();
      setServiceStatus(data);
      if (data && data.provider) {
        setConfigProvider(data.provider);
      }
      if (!data?.isConfigured) {
        setShowConfigPanel(true);
      } else {
        setShowConfigPanel(false);
      }
    } catch (err) {
      console.error('Error fetching AI status:', err);
      setServiceStatus({ isConfigured: false, provider: 'luma' });
      setShowConfigPanel(true);
    } finally {
      setCheckingService(false);
    }
  };

  // Handle local image file upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError('');
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Please select a valid image file (JPG, PNG, or WebP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Image file size must be less than 10 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target?.result;
      if (base64Data && typeof base64Data === 'string') {
        setCustomUploadedImage(base64Data);
        setSelectedImage(base64Data);
        setAvailableImages((prev) => [base64Data, ...prev.filter((img) => img !== base64Data)]);
      }
    };
    reader.onerror = () => {
      setUploadError('Failed to read image file. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  // Save config
  const handleSaveConfig = async (e) => {
    e?.preventDefault();
    if (!configApiKey.trim() && !serviceStatus?.isConfigured) {
      setTestResult({ success: false, message: 'Please enter a valid API key.' });
      return;
    }

    setSavingConfig(true);
    try {
      const res = await saveAiVideoConfig({
        provider: configProvider,
        apiKey: configApiKey.trim(),
      });
      if (res.success) {
        await loadServiceStatus();
        setShowConfigPanel(false);
        setTestResult({ success: true, message: 'Configuration saved successfully!' });
      } else {
        setTestResult({ success: false, message: res.message || 'Failed to save config.' });
      }
    } catch (err) {
      setTestResult({ success: false, message: err.message });
    } finally {
      setSavingConfig(false);
    }
  };

  // Test connection
  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    try {
      const res = await testAiVideoConnection(configProvider, configApiKey);
      setTestResult(res);
    } catch (err) {
      setTestResult({ success: false, message: err.message });
    } finally {
      setTestingConnection(false);
    }
  };

  // Start Generation
  const handleStartGeneration = async () => {
    if (!selectedImage) {
      setGenerationError('Please select or upload a shoe photo first.');
      return;
    }

    if (!serviceStatus?.isConfigured) {
      setShowConfigPanel(true);
      setGenerationError('Please configure your AI video API key before generating.');
      return;
    }

    setIsGenerating(true);
    setGenerationError('');
    setGenerationProgress(15);
    setGenerationMessage('Contacting AI Video Engine...');
    setGeneratedVideoUrl('');

    try {
      const targetProductId = product?._id || product?.productId || 'shoe-preview';
      const res = await generateShoeVideo({
        productId: targetProductId,
        image: selectedImage,
        prompt: customPrompt,
        motionType,
      });

      if (!res.success) {
        throw new Error(res.message || 'Failed to start video generation.');
      }

      setGenerationJob(res);
      setGenerationProgress(res.progress || 25);
      setGenerationMessage(res.statusMessage || 'Generation in progress...');

      startPolling(res.jobId);
    } catch (err) {
      console.error('Generation start failed:', err);
      setIsGenerating(false);
      setGenerationError(err.message || 'Failed to start generation.');
    }
  };

  // Poll Job Progress
  const startPolling = (jobId) => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);

    pollTimerRef.current = setInterval(async () => {
      try {
        const res = await pollJobStatus(jobId);
        if (res && res.success && res.job) {
          const job = res.job;
          setGenerationProgress(job.progress || 30);
          setGenerationMessage(job.statusMessage || 'Processing 360° video...');

          if (job.status === 'completed' && job.videoUrl) {
            clearInterval(pollTimerRef.current);
            setIsGenerating(false);
            setGenerationProgress(100);
            setGeneratedVideoUrl(job.videoUrl);
          } else if (job.status === 'failed') {
            clearInterval(pollTimerRef.current);
            setIsGenerating(false);
            setGenerationError(job.error || 'Video generation failed.');
          }
        }
      } catch (pollErr) {
        console.warn('Polling error:', pollErr.message);
      }
    }, 3000);
  };

  // Save generated video to product
  const handleSaveVideoToProduct = async () => {
    if (!generatedVideoUrl) return;

    setIsSavingVideo(true);
    setSaveSuccessMessage('');
    try {
      const targetProductId = product?._id || product?.productId;
      const res = await saveShoeVideo(targetProductId, generatedVideoUrl);

      if (res.success) {
        setSaveSuccessMessage('Video successfully saved and attached to this shoe product!');
        if (onVideoSaved) {
          onVideoSaved(res.product || { ...product, video: res.video || generatedVideoUrl, videoEnabled: true });
        }
        setTimeout(() => {
          onClose();
        }, 1800);
      } else {
        setGenerationError(res.message || 'Failed to save video to database.');
      }
    } catch (err) {
      console.error('Save video failed:', err);
      setGenerationError(err.message || 'Failed to save video.');
    } finally {
      setIsSavingVideo(false);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1050,
        backgroundColor: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          maxWidth: '820px',
          width: '100%',
          background: '#0d131f',
          border: '1px solid #1e293b',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.2rem 1.5rem',
            borderBottom: '1px solid #1e293b',
            background: 'linear-gradient(90deg, #111827 0%, #1e1b4b 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#000',
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
              }}
            >
              <Sparkles size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.01em' }}>
                AI Shoe-to-Video Generator
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
                Transform shoe photography into a 360° promotional commercial
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <button
              type="button"
              onClick={() => setShowConfigPanel(!showConfigPanel)}
              title="Configure AI API Service"
              style={{
                background: showConfigPanel ? '#334155' : 'rgba(255,255,255,0.06)',
                border: '1px solid #334155',
                color: '#cbd5e1',
                padding: '0.45rem 0.75rem',
                borderRadius: '8px',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                cursor: 'pointer',
              }}
            >
              <SettingsIcon size={14} />
              <span>{serviceStatus?.isConfigured ? 'API Configured' : 'Configure API'}</span>
            </button>

            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '0.4rem',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Service Configuration Panel */}
          {showConfigPanel && (
            <div
              style={{
                background: 'rgba(30, 41, 59, 0.7)',
                border: '1px solid #3b82f6',
                borderRadius: '12px',
                padding: '1.2rem',
                color: '#f8fafc',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldCheck size={18} color="#3b82f6" />
                  <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>AI Video Generation API Credentials</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Stored securely in backend</span>
              </div>

              <p style={{ fontSize: '0.82rem', color: '#cbd5e1', lineHeight: '1.4', margin: '0 0 1rem 0' }}>
                Connect a real AI Image-to-Video generation provider. Recommended: <strong>Luma AI Dream Machine</strong> (lumalabs.ai) for realistic 360° shoe turntable rotations, or <strong>Replicate</strong> / <strong>Fal.ai</strong>.
              </p>

              <form onSubmit={handleSaveConfig}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.35rem' }}>
                      AI Video Service Provider
                    </label>
                    <select
                      value={configProvider}
                      onChange={(e) => setConfigProvider(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', color: '#fff' }}
                    >
                      <option value="luma">Luma Dream Machine (Best for 360° Spin)</option>
                      <option value="replicate">Replicate (MiniMax / SVD)</option>
                      <option value="fal">Fal.ai (Kling / Fast-SVD)</option>
                      <option value="runway">RunwayML (Gen-3 Alpha)</option>
                      <option value="stability">Stability AI (Stable Video Diffusion)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.35rem' }}>
                      API Key / Secret Token
                    </label>
                    <input
                      type="password"
                      placeholder={serviceStatus?.maskedKey || 'Enter API Key (e.g. sk-luma-...)'}
                      value={configApiKey}
                      onChange={(e) => setConfigApiKey(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', color: '#fff' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testingConnection}
                    style={{ background: '#334155', border: 'none', color: '#fff', fontSize: '0.8rem', padding: '0.45rem 0.8rem', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <RefreshCw size={14} className={testingConnection ? 'animate-spin' : ''} />
                    {testingConnection ? 'Verifying...' : 'Test Connection'}
                  </button>

                  <button
                    type="submit"
                    disabled={savingConfig}
                    style={{ background: '#f59e0b', border: 'none', color: '#000', fontWeight: 700, fontSize: '0.8rem', padding: '0.45rem 1rem', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <Check size={14} />
                    {savingConfig ? 'Saving...' : 'Save & Connect Provider'}
                  </button>

                  {serviceStatus?.isConfigured && (
                    <span style={{ fontSize: '0.78rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Check size={14} /> Connected via {serviceStatus.provider} ({serviceStatus.maskedKey})
                    </span>
                  )}
                </div>

                {testResult && (
                  <div
                    style={{
                      marginTop: '0.8rem',
                      padding: '0.6rem 0.9rem',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      background: testResult.success ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: testResult.success ? '#10b981' : '#f87171',
                      border: `1px solid ${testResult.success ? '#10b981' : '#ef4444'}`,
                    }}
                  >
                    {testResult.message}
                  </div>
                )}
              </form>
            </div>
          )}

          {/* Missing Key Warning */}
          {!checkingService && !serviceStatus?.isConfigured && !showConfigPanel && (
            <div
              style={{
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid #f59e0b',
                borderRadius: '10px',
                padding: '0.9rem 1.2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: '#f59e0b',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <AlertCircle size={20} />
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  AI Video Generation service is not connected yet.
                </span>
              </div>
              <button
                type="button"
                style={{ background: '#f59e0b', color: '#000', border: 'none', borderRadius: '6px', fontWeight: 700, fontSize: '0.75rem', padding: '0.35rem 0.75rem', cursor: 'pointer' }}
                onClick={() => setShowConfigPanel(true)}
              >
                Configure API Key
              </button>
            </div>
          )}

          {/* Main Studio Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            
            {/* Left Column: Image Reference Selector & Preview */}
            <div style={{ background: '#111827', borderRadius: '12px', padding: '1.2rem', border: '1px solid #1e293b' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Camera size={16} color="#f59e0b" /> 1. Shoe Image Reference
                </span>
                <label
                  style={{
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    color: '#f59e0b',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}
                >
                  <Upload size={14} /> Upload New Photo
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    style={{ display: 'none' }}
                    onChange={handleFileUpload}
                  />
                </label>
              </div>

              {/* Main Image Preview Card */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '240px',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  background: '#0a0f1d',
                  border: '2px solid #334155',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '0.8rem',
                }}
              >
                {selectedImage ? (
                  <img
                    src={selectedImage}
                    alt="Shoe reference"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                ) : (
                  <div style={{ textAlign: 'center', color: '#64748b' }}>
                    <Camera size={36} />
                    <p style={{ fontSize: '0.8rem', marginTop: '0.4rem' }}>Select or upload a shoe photo</p>
                  </div>
                )}
                
                <span
                  style={{
                    position: 'absolute',
                    top: '8px',
                    left: '8px',
                    background: 'rgba(0,0,0,0.75)',
                    color: '#fbbf24',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                  }}
                >
                  Reference Source
                </span>
              </div>

              {uploadError && (
                <div style={{ color: '#f87171', fontSize: '0.75rem', marginBottom: '0.6rem' }}>
                  {uploadError}
                </div>
              )}

              {/* Thumbnails Row */}
              <div style={{ marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.4rem' }}>
                  Available Angles & Uploads ({availableImages.length}):
                </span>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {availableImages.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImage(img)}
                      style={{
                        padding: 0,
                        border: selectedImage === img ? '2px solid #f59e0b' : '1px solid #334155',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        width: '50px',
                        height: '50px',
                        background: '#0a0f1d',
                      }}
                    >
                      <img
                        src={img}
                        alt={`Angle ${idx + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Motion Settings, Prompt & Action */}
            <div style={{ background: '#111827', borderRadius: '12px', padding: '1.2rem', border: '1px solid #1e293b', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.8rem' }}>
                  <Film size={16} color="#f59e0b" /> 2. 360° Motion & Promotion Style
                </span>

                {/* Motion Type Selection */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.4rem' }}>
                    Camera Presentation Mode
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => setMotionType('turntable')}
                      style={{
                        padding: '0.6rem',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        textAlign: 'left',
                        background: motionType === 'turntable' ? 'rgba(245, 158, 11, 0.15)' : '#0f172a',
                        border: `1px solid ${motionType === 'turntable' ? '#f59e0b' : '#334155'}`,
                        color: motionType === 'turntable' ? '#f59e0b' : '#cbd5e1',
                      }}
                    >
                      🔄 360° Turntable Spin
                      <span style={{ display: 'block', fontSize: '0.65rem', color: '#94a3b8', fontWeight: 400, marginTop: '2px' }}>
                        Smooth rotating pedestal showcase
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMotionType('orbit')}
                      style={{
                        padding: '0.6rem',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        textAlign: 'left',
                        background: motionType === 'orbit' ? 'rgba(245, 158, 11, 0.15)' : '#0f172a',
                        border: `1px solid ${motionType === 'orbit' ? '#f59e0b' : '#334155'}`,
                        color: motionType === 'orbit' ? '#f59e0b' : '#cbd5e1',
                      }}
                    >
                      🎥 Studio Camera Orbit
                      <span style={{ display: 'block', fontSize: '0.65rem', color: '#94a3b8', fontWeight: 400, marginTop: '2px' }}>
                        Cinematic 360° camera orbit
                      </span>
                    </button>
                  </div>
                </div>

                {/* Prompt Preview */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                    Commercial Scene Prompt (Auto-Tuned)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Smooth 360-degree turntable rotation of this shoe on a luxury studio platform, cinematic studio commercial lighting..."
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', color: '#cbd5e1', fontSize: '0.78rem' }}
                  />
                  <span style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '3px', display: 'block' }}>
                    Leave blank to use calibrated LITRA KING footwear 360° commercial prompt.
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <div>
                <button
                  type="button"
                  onClick={handleStartGeneration}
                  disabled={isGenerating || !selectedImage}
                  style={{
                    width: '100%',
                    padding: '0.85rem',
                    fontSize: '0.95rem',
                    fontWeight: 800,
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: '#000',
                    border: 'none',
                    borderRadius: '10px',
                    boxShadow: '0 4px 15px rgba(245, 158, 11, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    cursor: isGenerating ? 'not-allowed' : 'pointer',
                  }}
                >
                  <Sparkles size={18} />
                  {isGenerating ? 'Generating AI Video...' : 'Generate AI Shoe Video'}
                </button>
              </div>
            </div>

          </div>

          {/* Real-time Generation Progress Bar */}
          {isGenerating && (
            <div
              style={{
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '12px',
                padding: '1.2rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <RefreshCw size={16} className="animate-spin" /> {generationMessage || 'Generating promotional video...'}
                </span>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff' }}>
                  {generationProgress}%
                </span>
              </div>

              <div style={{ width: '100%', height: '10px', background: '#1e293b', borderRadius: '5px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${generationProgress}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #f59e0b 0%, #10b981 100%)',
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.72rem', color: '#64748b' }}>
                <span>Step 1: Referencing Shoe Photo</span>
                <span>Step 2: 360° AI Mesh & Geometry</span>
                <span>Step 3: Rendering Commercial Lighting</span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {generationError && (
            <div
              style={{
                padding: '0.8rem 1rem',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#f87171',
                border: '1px solid #ef4444',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <AlertCircle size={18} />
              <span>{generationError}</span>
            </div>
          )}

          {/* Success Message */}
          {saveSuccessMessage && (
            <div
              style={{
                padding: '0.8rem 1rem',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                border: '1px solid #10b981',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <Check size={18} />
              <span>{saveSuccessMessage}</span>
            </div>
          )}

          {/* Video Preview Section */}
          {generatedVideoUrl && (
            <div
              style={{
                background: '#0a0f1d',
                border: '2px solid #10b981',
                borderRadius: '14px',
                padding: '1.2rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Check size={18} /> Generated Video Ready — Preview Before Saving
                </span>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  High-definition 360° footwear commercial
                </span>
              </div>

              {/* Video Player Stage */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  maxHeight: '380px',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  background: '#000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <video
                  ref={videoRef}
                  src={generatedVideoUrl}
                  style={{ width: '100%', maxHeight: '380px', objectFit: 'contain' }}
                  autoPlay
                  loop
                  muted={isMuted}
                  playsInline
                />

                {/* Overlaid Controls Bar */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '12px',
                    left: '12px',
                    right: '12px',
                    background: 'rgba(15, 23, 42, 0.85)',
                    backdropFilter: 'blur(8px)',
                    padding: '0.5rem 0.9rem',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <button
                      type="button"
                      onClick={togglePlay}
                      style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '2px' }}
                    >
                      {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                    </button>
                    <button
                      type="button"
                      onClick={toggleMute}
                      style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '2px' }}
                    >
                      {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                    </button>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>
                      360° Commercial Preview
                    </span>
                  </div>

                  <span
                    style={{
                      background: 'rgba(16, 185, 129, 0.2)',
                      color: '#10b981',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      border: '1px solid #10b981',
                    }}
                  >
                    AI Promo Video
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleStartGeneration}
                  disabled={isSavingVideo}
                  style={{ background: '#334155', border: 'none', color: '#fff', fontSize: '0.85rem', padding: '0.55rem 1rem', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <RotateCw size={15} /> Regenerate Video
                </button>

                <button
                  type="button"
                  onClick={handleSaveVideoToProduct}
                  disabled={isSavingVideo}
                  style={{
                    fontSize: '0.85rem',
                    padding: '0.55rem 1.4rem',
                    background: '#10b981',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#fff',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <Check size={16} />
                  {isSavingVideo ? 'Saving Video to Product...' : 'Save Video to Product'}
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid #1e293b',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#090d16',
          }}
        >
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
            LITRA KING SHOES ZONE — AI Video Engine
          </span>

          <button
            type="button"
            onClick={onClose}
            style={{ background: '#334155', border: 'none', color: '#fff', fontSize: '0.85rem', padding: '0.45rem 1.1rem', borderRadius: '6px', cursor: 'pointer' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
