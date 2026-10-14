const aiVideoService = require('../services/aiVideoService');
const SiteSettings = require('../models/SiteSettings');
const Product = require('../models/Product');

/**
 * GET /api/ai-video/status
 * Check if an AI video generation service is connected and get masked settings
 */
exports.getStatus = async (req, res) => {
  try {
    const config = await aiVideoService.getActiveProviderConfig();
    return res.json({
      success: true,
      isConfigured: config.isConfigured,
      provider: config.provider,
      maskedKey: config.maskedKey,
      model: config.model,
      source: config.source,
      supportedProviders: [
        { id: 'luma', name: 'Luma Dream Machine', description: 'Best for 360° camera spin & cinematic turntable' },
        { id: 'replicate', name: 'Replicate (MiniMax / SVD)', description: 'Fast GPU predictions for image-to-video' },
        { id: 'fal', name: 'Fal.ai (Kling 1.6 / Fast-SVD)', description: 'High-speed cloud image-to-video' },
        { id: 'runway', name: 'RunwayML (Gen-3 Alpha)', description: 'Hollywood-grade cinematic motion' },
        { id: 'stability', name: 'Stability AI (Stable Video)', description: 'Stable Video Diffusion API' },
      ],
    });
  } catch (err) {
    console.error('Error in getStatus:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/ai-video/config
 * Save or update AI Video Provider & API Key securely in MongoDB SiteSettings
 */
exports.updateConfig = async (req, res) => {
  try {
    const { provider, apiKey, model } = req.body;

    if (!provider) {
      return res.status(400).json({ success: false, message: 'Provider is required.' });
    }

    const settings = await SiteSettings.getSettings();
    settings.aiVideoProvider = provider;
    if (apiKey !== undefined && apiKey !== null) {
      // If user typed a new key (not the masked placeholder)
      if (!apiKey.includes('••••••••')) {
        settings.aiVideoApiKey = apiKey.trim();
      }
    }
    if (model !== undefined) {
      settings.aiVideoModel = model.trim();
    }

    await settings.save();

    const config = await aiVideoService.getActiveProviderConfig();

    return res.json({
      success: true,
      message: 'AI Video Service configuration saved successfully.',
      isConfigured: config.isConfigured,
      provider: config.provider,
      maskedKey: config.maskedKey,
    });
  } catch (err) {
    console.error('Error in updateConfig:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/ai-video/test-connection
 * Test connection to the AI video service with provided or stored credentials
 */
exports.testConnection = async (req, res) => {
  try {
    const { provider, apiKey } = req.body;

    let targetProvider = provider;
    let targetKey = apiKey;

    if (!targetKey || targetKey.includes('••••••••')) {
      const active = await aiVideoService.getActiveProviderConfig();
      targetProvider = targetProvider || active.provider;
      targetKey = active.apiKey;
    }

    if (!targetKey) {
      return res.status(400).json({
        success: false,
        message: 'No API key provided to test. Please enter your API key.',
      });
    }

    const result = await aiVideoService.testProviderConnection(targetProvider, targetKey);
    return res.json(result);
  } catch (err) {
    console.error('Error testing connection:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/ai-video/generate
 * Initiate real AI image-to-video generation for a shoe product
 */
exports.generate = async (req, res) => {
  try {
    const { productId, image, prompt, motionType } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        message: 'A shoe image reference is required to generate the video.',
      });
    }

    const result = await aiVideoService.startGeneration({
      productId,
      image,
      prompt,
      motionType,
    });

    return res.json({
      success: true,
      message: 'Video generation started successfully.',
      ...result,
    });
  } catch (err) {
    console.error('Error in generate:', err);
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

/**
 * GET /api/ai-video/job/:jobId
 * Poll status and progress of an active generation job
 */
exports.getJobStatus = async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await aiVideoService.pollJobStatus(jobId);

    return res.json({
      success: true,
      job,
    });
  } catch (err) {
    console.error('Error in getJobStatus:', err);
    return res.status(404).json({
      success: false,
      message: err.message,
    });
  }
};

/**
 * POST /api/ai-video/save
 * Download generated video to local storage and link it to the specified product in MongoDB
 */
exports.saveVideo = async (req, res) => {
  try {
    const { productId, videoUrl } = req.body;

    if (!productId || !videoUrl) {
      return res.status(400).json({
        success: false,
        message: 'productId and videoUrl are required to save the video.',
      });
    }

    const updatedProduct = await aiVideoService.saveVideoToProduct(productId, videoUrl);

    return res.json({
      success: true,
      message: 'AI promotional video saved and attached to product successfully!',
      product: updatedProduct,
      video: updatedProduct.video,
    });
  } catch (err) {
    console.error('Error in saveVideo:', err);
    return res.status(500).json({
      success: false,
      message: `Failed to save video: ${err.message}`,
    });
  }
};

/**
 * DELETE /api/ai-video/:productId
 * Remove video from product
 */
exports.deleteVideo = async (req, res) => {
  try {
    const { productId } = req.params;
    const updatedProduct = await aiVideoService.removeVideoFromProduct(productId);

    return res.json({
      success: true,
      message: 'Product promotional video removed successfully.',
      product: updatedProduct,
    });
  } catch (err) {
    console.error('Error in deleteVideo:', err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/**
 * PATCH /api/ai-video/:productId/toggle
 * Enable or disable video on product page
 */
exports.toggleVideo = async (req, res) => {
  try {
    const { productId } = req.params;
    const { videoEnabled } = req.body;

    let product = null;
    if (productId.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(productId);
    }
    if (!product) {
      product = await Product.findOne({ productId });
    }

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    product.videoEnabled = typeof videoEnabled === 'boolean' ? videoEnabled : !product.videoEnabled;
    await product.save();

    return res.json({
      success: true,
      message: `Product video is now ${product.videoEnabled ? 'enabled' : 'disabled'} on product page.`,
      product,
    });
  } catch (err) {
    console.error('Error in toggleVideo:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/ai-video/:productId/hero
 * Toggle or set product video as the Home Page hero media
 */
exports.setHeroVideo = async (req, res) => {
  try {
    const { productId } = req.params;
    const { enabled } = req.body;

    let product = null;
    if (productId.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(productId);
    }
    if (!product) {
      product = await Product.findOne({ productId });
    }

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    if (!product.video) {
      return res.status(400).json({
        success: false,
        message: 'Product does not have a video attached yet. Please generate or save a video first.',
      });
    }

    const settings = await SiteSettings.getSettings();

    const shouldEnable = typeof enabled === 'boolean' ? enabled : !product.isHeroVideo;

    // Reset all products isHeroVideo
    await Product.updateMany({}, { isHeroVideo: false });

    if (shouldEnable) {
      product.isHeroVideo = true;
      settings.heroVideoEnabled = true;
      settings.heroVideoProductId = product.productId;
    } else {
      product.isHeroVideo = false;
      settings.heroVideoEnabled = false;
      settings.heroVideoProductId = '';
    }

    await product.save();
    await settings.save();

    return res.json({
      success: true,
      message: shouldEnable
        ? `"${product.name}" video is now set as the Home Page Hero Video!`
        : 'Home Page Hero Video has been disabled (Store photo restored).',
      heroVideoEnabled: settings.heroVideoEnabled,
      heroProduct: shouldEnable ? product : null,
      product,
    });
  } catch (err) {
    console.error('Error in setHeroVideo:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
