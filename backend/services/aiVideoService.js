const fs = require('fs');
const path = require('path');
const Product = require('../models/Product');
const SiteSettings = require('../models/SiteSettings');

// Directory for permanently storing generated promotional shoe videos
const VIDEOS_DIR = path.join(__dirname, '../uploads/videos');
if (!fs.existsSync(VIDEOS_DIR)) {
  fs.mkdirSync(VIDEOS_DIR, { recursive: true });
}

// In-memory active generation jobs tracking
const activeJobs = new Map();

/**
 * Mask API key for secure frontend display (never expose secret in full)
 */
function maskApiKey(key) {
  if (!key || typeof key !== 'string') return '';
  const trimmed = key.trim();
  if (trimmed.length <= 8) return '••••••••';
  return `${trimmed.substring(0, 4)}••••••••${trimmed.substring(trimmed.length - 4)}`;
}

/**
 * Retrieve active AI video provider credentials from SiteSettings or process.env
 */
async function getActiveProviderConfig() {
  let settings = null;
  try {
    settings = await SiteSettings.getSettings();
  } catch (err) {
    console.warn('Could not read SiteSettings from DB:', err.message);
  }

  // 1. Check DB settings first
  if (settings && settings.aiVideoApiKey && settings.aiVideoApiKey.trim()) {
    return {
      isConfigured: true,
      provider: settings.aiVideoProvider || 'luma',
      apiKey: settings.aiVideoApiKey.trim(),
      maskedKey: maskApiKey(settings.aiVideoApiKey),
      model: settings.aiVideoModel || '',
      source: 'database',
    };
  }

  // 2. Fallback to process.env credentials
  if (process.env.LUMA_API_KEY && process.env.LUMA_API_KEY.trim()) {
    return {
      isConfigured: true,
      provider: 'luma',
      apiKey: process.env.LUMA_API_KEY.trim(),
      maskedKey: maskApiKey(process.env.LUMA_API_KEY),
      model: 'dream-machine',
      source: 'environment',
    };
  }

  if (process.env.REPLICATE_API_TOKEN && process.env.REPLICATE_API_TOKEN.trim()) {
    return {
      isConfigured: true,
      provider: 'replicate',
      apiKey: process.env.REPLICATE_API_TOKEN.trim(),
      maskedKey: maskApiKey(process.env.REPLICATE_API_TOKEN),
      model: 'minimax/video-01',
      source: 'environment',
    };
  }

  if (process.env.FAL_KEY && process.env.FAL_KEY.trim()) {
    return {
      isConfigured: true,
      provider: 'fal',
      apiKey: process.env.FAL_KEY.trim(),
      maskedKey: maskApiKey(process.env.FAL_KEY),
      model: 'fal-ai/kling-video/v1/standard/image-to-video',
      source: 'environment',
    };
  }

  if (process.env.RUNWAYML_API_SECRET && process.env.RUNWAYML_API_SECRET.trim()) {
    return {
      isConfigured: true,
      provider: 'runway',
      apiKey: process.env.RUNWAYML_API_SECRET.trim(),
      maskedKey: maskApiKey(process.env.RUNWAYML_API_SECRET),
      model: 'gen3a_turbo',
      source: 'environment',
    };
  }

  if (process.env.STABILITY_API_KEY && process.env.STABILITY_API_KEY.trim()) {
    return {
      isConfigured: true,
      provider: 'stability',
      apiKey: process.env.STABILITY_API_KEY.trim(),
      maskedKey: maskApiKey(process.env.STABILITY_API_KEY),
      model: 'stable-video-diffusion',
      source: 'environment',
    };
  }

  return {
    isConfigured: false,
    provider: (settings && settings.aiVideoProvider) || 'luma',
    apiKey: '',
    maskedKey: '',
    model: '',
    source: 'none',
  };
}

/**
 * Resolve local image path to base64 Data URI or return public URL
 */
function resolveImagePayload(imageRef) {
  if (!imageRef) return null;

  if (imageRef.startsWith('data:image/')) {
    return { type: 'dataUri', dataUri: imageRef };
  }

  if (imageRef.startsWith('/uploads/')) {
    const filename = imageRef.replace(/^\/uploads\//, '');
    const localFilePath = path.join(__dirname, '../uploads', filename);
    if (fs.existsSync(localFilePath)) {
      const ext = path.extname(filename).toLowerCase().replace('.', '') || 'jpeg';
      const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
      const fileBuf = fs.readFileSync(localFilePath);
      return {
        type: 'dataUri',
        dataUri: `data:${mime};base64,${fileBuf.toString('base64')}`,
        localPath: localFilePath,
      };
    }
  }

  if (imageRef.startsWith('/assets/')) {
    const filename = imageRef.replace(/^\/assets\//, '');
    const localFilePath = path.join(__dirname, '../public/assets', filename);
    if (fs.existsSync(localFilePath)) {
      const ext = path.extname(filename).toLowerCase().replace('.', '') || 'jpeg';
      const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
      const fileBuf = fs.readFileSync(localFilePath);
      return {
        type: 'dataUri',
        dataUri: `data:${mime};base64,${fileBuf.toString('base64')}`,
        localPath: localFilePath,
      };
    }
  }

  // Already a full HTTP/HTTPS URL
  return { type: 'url', url: imageRef };
}

/**
 * Test credentials against provider's API
 */
async function testProviderConnection(provider, apiKey) {
  if (!apiKey || !apiKey.trim()) {
    return { success: false, message: 'API key is required.' };
  }

  const cleanKey = apiKey.trim();

  try {
    switch (provider) {
      case 'luma': {
        const res = await fetch('https://api.lumalabs.ai/dream-machine/v1/generations', {
          headers: {
            Authorization: `Bearer ${cleanKey}`,
            Accept: 'application/json',
          },
        });
        if (res.status === 401 || res.status === 403) {
          return { success: false, message: 'Invalid Luma AI API key. Please verify your credentials at lumalabs.ai' };
        }
        return { success: true, message: 'Luma Dream Machine API credentials verified successfully!' };
      }
      case 'replicate': {
        const res = await fetch('https://api.replicate.com/v1/models/stability-ai/stable-video-diffusion', {
          headers: {
            Authorization: `Bearer ${cleanKey}`,
          },
        });
        if (res.status === 401 || res.status === 403) {
          return { success: false, message: 'Invalid Replicate API token. Check your token at replicate.com/account/api-tokens' };
        }
        return { success: true, message: 'Replicate API credentials verified successfully!' };
      }
      case 'fal': {
        const res = await fetch('https://rest.alpha.fal.ai/models', {
          headers: {
            Authorization: `Key ${cleanKey}`,
          },
        });
        if (res.status === 401 || res.status === 403) {
          return { success: false, message: 'Invalid Fal.ai API key. Check your key at fal.ai/dashboard/keys' };
        }
        return { success: true, message: 'Fal.ai API credentials verified successfully!' };
      }
      case 'runway': {
        const res = await fetch('https://api.runwayml.com/v1/tasks', {
          headers: {
            Authorization: `Bearer ${cleanKey}`,
            'X-Runway-Version': '2024-09-13',
          },
        });
        if (res.status === 401 || res.status === 403) {
          return { success: false, message: 'Invalid RunwayML API secret. Check your key at dev.runwayml.com' };
        }
        return { success: true, message: 'RunwayML API credentials verified successfully!' };
      }
      case 'stability': {
        const res = await fetch('https://api.stability.ai/v1/user/account', {
          headers: {
            Authorization: `Bearer ${cleanKey}`,
          },
        });
        if (res.status === 401 || res.status === 403) {
          return { success: false, message: 'Invalid Stability AI key. Check your key at platform.stability.ai' };
        }
        return { success: true, message: 'Stability AI credentials verified successfully!' };
      }
      default:
        return { success: false, message: `Unsupported provider: ${provider}` };
    }
  } catch (err) {
    return { success: false, message: `Connection test error: ${err.message}` };
  }
}

/**
 * Dispatch real generation request to the chosen AI provider
 */
async function startGeneration({ productId, image, prompt, motionType = 'turntable' }) {
  const config = await getActiveProviderConfig();

  if (!config.isConfigured || !config.apiKey) {
    throw new Error(
      'AI Video Generation service is not configured. Please add an API key for Luma Dream Machine, Replicate, Fal.ai, or Runway in Admin Settings.'
    );
  }

  const resolved = resolveImagePayload(image);
  if (!resolved) {
    throw new Error('Valid shoe image reference is required to generate AI video.');
  }

  const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  // Construct tailored footwear advertisement 360-degree prompt
  const rotationPrompts = {
    turntable:
      'Smooth continuous 360-degree turntable rotation of this shoe on a luxury studio platform, cinematic studio commercial lighting, ultra-clean neutral background, pristine 4K footwear advertisement, strictly preserving the exact shoe design, color, laces, branding, and shape.',
    orbit:
      'Seamless 360-degree slow camera orbit around this shoe, high-end footwear commercial, dramatic studio key light and soft shadows, clean luxury showroom setting, exact shoe appearance preserved.',
    dynamic:
      'Dynamic 360-degree rotating showcase of this sneaker, premium sports commercial aesthetic, smooth rotational motion, studio background, sharp focus on shoe silhouette and sole.',
  };

  const finalPrompt = prompt && prompt.trim() ? prompt.trim() : (rotationPrompts[motionType] || rotationPrompts.turntable);

  const jobRecord = {
    id: jobId,
    productId,
    provider: config.provider,
    status: 'processing',
    progress: 10,
    statusMessage: 'Initiating AI video model...',
    createdAt: Date.now(),
    videoUrl: null,
    error: null,
    providerJobId: null,
  };

  activeJobs.set(jobId, jobRecord);

  try {
    switch (config.provider) {
      case 'luma': {
        // Luma Dream Machine API
        const imageUrl = resolved.type === 'url' ? resolved.url : resolved.dataUri;
        const payload = {
          prompt: finalPrompt,
          keyframes: {
            frame0: {
              type: 'image',
              url: imageUrl,
            },
          },
        };

        const res = await fetch('https://api.lumalabs.ai/dream-machine/v1/generations', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || data.error || `Luma API error: ${res.status}`);
        }

        jobRecord.providerJobId = data.id;
        jobRecord.statusMessage = 'Luma Dream Machine is generating 360° rotation...';
        jobRecord.progress = 25;
        break;
      }

      case 'replicate': {
        // Replicate API (MiniMax or Stable Video Diffusion)
        const imageUrl = resolved.type === 'url' ? resolved.url : resolved.dataUri;
        const payload = {
          version: 'video-01',
          input: {
            input_image: imageUrl,
            prompt: finalPrompt,
          },
        };

        const res = await fetch('https://api.replicate.com/v1/models/minimax/video-01/predictions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.detail || data.error || `Replicate API error: ${res.status}`);
        }

        jobRecord.providerJobId = data.id;
        jobRecord.statusMessage = 'Replicate is rendering shoe video...';
        jobRecord.progress = 25;
        break;
      }

      case 'fal': {
        // Fal.ai API
        const imageUrl = resolved.type === 'url' ? resolved.url : resolved.dataUri;
        const payload = {
          image_url: imageUrl,
          prompt: finalPrompt,
        };

        const res = await fetch('https://queue.fal.run/fal-ai/kling-video/v1/standard/image-to-video', {
          method: 'POST',
          headers: {
            Authorization: `Key ${config.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.detail || `Fal.ai API error: ${res.status}`);
        }

        jobRecord.providerJobId = data.request_id;
        jobRecord.statusMessage = 'Fal.ai queue processing...';
        jobRecord.progress = 25;
        break;
      }

      case 'runway': {
        // RunwayML API
        const imageUrl = resolved.type === 'url' ? resolved.url : resolved.dataUri;
        const payload = {
          promptImage: imageUrl,
          promptText: finalPrompt,
          model: 'gen3a_turbo',
        };

        const res = await fetch('https://api.runwayml.com/v1/image_to_video', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json',
            'X-Runway-Version': '2024-09-13',
          },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || `RunwayML API error: ${res.status}`);
        }

        jobRecord.providerJobId = data.id;
        jobRecord.statusMessage = 'Runway Gen-3 rendering video...';
        jobRecord.progress = 25;
        break;
      }

      default:
        throw new Error(`Unsupported provider: ${config.provider}`);
    }

    return {
      jobId,
      productId,
      provider: config.provider,
      status: 'processing',
      progress: jobRecord.progress,
      statusMessage: jobRecord.statusMessage,
    };
  } catch (err) {
    jobRecord.status = 'failed';
    jobRecord.error = err.message;
    jobRecord.statusMessage = `Generation failed: ${err.message}`;
    throw err;
  }
}

/**
 * Poll AI provider for generation status
 */
async function pollJobStatus(jobId) {
  const job = activeJobs.get(jobId);
  if (!job) {
    throw new Error('Generation job not found or expired.');
  }

  if (job.status === 'completed' || job.status === 'failed') {
    return job;
  }

  const config = await getActiveProviderConfig();
  if (!config.apiKey) {
    job.status = 'failed';
    job.error = 'API Key configuration missing during polling.';
    return job;
  }

  try {
    switch (job.provider) {
      case 'luma': {
        const res = await fetch(`https://api.lumalabs.ai/dream-machine/v1/generations/${job.providerJobId}`, {
          headers: {
            Authorization: `Bearer ${config.apiKey}`,
          },
        });
        const data = await res.json();

        if (data.state === 'completed') {
          job.status = 'completed';
          job.progress = 100;
          job.statusMessage = 'AI Shoe Video generated successfully!';
          job.videoUrl = data.assets?.video || data.video_url;
        } else if (data.state === 'failed') {
          job.status = 'failed';
          job.error = data.failure_reason || 'Luma video generation failed.';
          job.statusMessage = job.error;
        } else {
          // dreaming / queued
          job.progress = Math.min(95, job.progress + 15);
          job.statusMessage = 'Rendering 360° footwear frames...';
        }
        break;
      }

      case 'replicate': {
        const res = await fetch(`https://api.replicate.com/v1/predictions/${job.providerJobId}`, {
          headers: {
            Authorization: `Bearer ${config.apiKey}`,
          },
        });
        const data = await res.json();

        if (data.status === 'succeeded') {
          job.status = 'completed';
          job.progress = 100;
          job.statusMessage = 'AI Shoe Video generated successfully!';
          job.videoUrl = Array.isArray(data.output) ? data.output[0] : data.output;
        } else if (data.status === 'failed' || data.status === 'canceled') {
          job.status = 'failed';
          job.error = data.error || 'Replicate video generation failed.';
          job.statusMessage = job.error;
        } else {
          job.progress = Math.min(95, job.progress + 12);
          job.statusMessage = 'Processing video prediction on GPU...';
        }
        break;
      }

      case 'fal': {
        const res = await fetch(
          `https://queue.fal.run/fal-ai/kling-video/v1/standard/image-to-video/requests/${job.providerJobId}/status`,
          {
            headers: {
              Authorization: `Key ${config.apiKey}`,
            },
          }
        );
        const data = await res.json();

        if (data.status === 'COMPLETED') {
          // Fetch final result
          const resultRes = await fetch(
            `https://queue.fal.run/fal-ai/kling-video/v1/standard/image-to-video/requests/${job.providerJobId}`,
            {
              headers: {
                Authorization: `Key ${config.apiKey}`,
              },
            }
          );
          const resultData = await resultRes.json();
          job.status = 'completed';
          job.progress = 100;
          job.statusMessage = 'AI Shoe Video generated successfully!';
          job.videoUrl = resultData.video?.url || resultData.output?.video_url;
        } else if (data.status === 'FAILED') {
          job.status = 'failed';
          job.error = data.error || 'Fal.ai video generation failed.';
          job.statusMessage = job.error;
        } else {
          job.progress = Math.min(95, job.progress + 15);
          job.statusMessage = 'Generating video frames on Fal.ai...';
        }
        break;
      }

      case 'runway': {
        const res = await fetch(`https://api.runwayml.com/v1/tasks/${job.providerJobId}`, {
          headers: {
            Authorization: `Bearer ${config.apiKey}`,
            'X-Runway-Version': '2024-09-13',
          },
        });
        const data = await res.json();

        if (data.status === 'SUCCEEDED') {
          job.status = 'completed';
          job.progress = 100;
          job.statusMessage = 'AI Shoe Video generated successfully!';
          job.videoUrl = data.output?.[0] || data.output;
        } else if (data.status === 'FAILED' || data.status === 'CANCELLED') {
          job.status = 'failed';
          job.error = data.failure || data.failureCode || 'Runway video generation failed.';
          job.statusMessage = job.error;
        } else {
          job.progress = Math.min(95, job.progress + 15);
          job.statusMessage = 'Rendering motion on Runway Gen-3...';
        }
        break;
      }

      default:
        job.status = 'failed';
        job.error = 'Unknown provider.';
    }

    return job;
  } catch (err) {
    console.error('Error polling AI video job:', err.message);
    return job;
  }
}

/**
 * Download generated video and save to local permanent uploads storage, attaching to product in DB
 */
async function saveVideoToProduct(productId, externalVideoUrl) {
  if (!productId) {
    throw new Error('Product ID is required.');
  }
  if (!externalVideoUrl) {
    throw new Error('Valid video URL is required.');
  }

  // Find product in DB
  let product = null;
  if (productId.match(/^[0-9a-fA-F]{24}$/)) {
    product = await Product.findById(productId);
  }
  if (!product) {
    product = await Product.findOne({ productId });
  }

  if (!product) {
    throw new Error(`Product not found with ID: ${productId}`);
  }

  const previousVideo = product.video;

  // Generate safe filename for local storage
  const videoFileName = `shoe-video-${product.productId}-${Date.now()}.mp4`;
  const targetFilePath = path.join(VIDEOS_DIR, videoFileName);

  // If external video URL is already a local upload path, just update
  if (externalVideoUrl.startsWith('/uploads/videos/')) {
    product.video = externalVideoUrl;
    product.videoEnabled = true;
    await product.save();
    return product;
  }

  // Download video file buffer
  const videoRes = await fetch(externalVideoUrl);
  if (!videoRes.ok) {
    throw new Error(`Failed to download video file from AI provider: HTTP ${videoRes.status}`);
  }

  const arrayBuffer = await videoRes.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Write video to disk
  fs.writeFileSync(targetFilePath, buffer);

  // Construct relative URL served by backend
  const localVideoUrl = `/uploads/videos/${videoFileName}`;

  // Attach video to product in DB
  product.video = localVideoUrl;
  product.videoEnabled = true;
  await product.save();

  // Safely cleanup previous local video file only after new one is successfully saved
  if (previousVideo && previousVideo.startsWith('/uploads/videos/') && previousVideo !== localVideoUrl) {
    try {
      const oldFilename = previousVideo.replace(/^\/uploads\/videos\//, '');
      const oldFilePath = path.join(VIDEOS_DIR, oldFilename);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    } catch (cleanupErr) {
      console.warn('Could not remove old video file:', cleanupErr.message);
    }
  }

  return product;
}

/**
 * Remove video from product in DB and disk
 */
async function removeVideoFromProduct(productId) {
  let product = null;
  if (productId.match(/^[0-9a-fA-F]{24}$/)) {
    product = await Product.findById(productId);
  }
  if (!product) {
    product = await Product.findOne({ productId });
  }

  if (!product) {
    throw new Error(`Product not found with ID: ${productId}`);
  }

  const currentVideo = product.video;

  product.video = '';
  product.videoEnabled = false;
  product.isHeroVideo = false;
  await product.save();

  // Remove file from disk
  if (currentVideo && currentVideo.startsWith('/uploads/videos/')) {
    try {
      const filename = currentVideo.replace(/^\/uploads\/videos\//, '');
      const filePath = path.join(VIDEOS_DIR, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {
      console.warn('Could not remove video file:', err.message);
    }
  }

  return product;
}

module.exports = {
  getActiveProviderConfig,
  testProviderConnection,
  startGeneration,
  pollJobStatus,
  saveVideoToProduct,
  removeVideoFromProduct,
  maskApiKey,
};
