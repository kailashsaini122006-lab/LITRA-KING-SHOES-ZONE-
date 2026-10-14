const SiteSettings = require('../models/SiteSettings');
const Product = require('../models/Product');
const aiVideoService = require('../services/aiVideoService');

/**
 * GET /api/settings
 * Fetch public store settings (e.g., heroVideoEnabled, heroProduct)
 * If authenticated admin, also return admin-level metadata
 */
exports.getSettings = async (req, res) => {
  try {
    const settings = await SiteSettings.getSettings();

    let heroProduct = null;
    if (settings.heroVideoProductId) {
      if (settings.heroVideoProductId.match(/^[0-9a-fA-F]{24}$/)) {
        heroProduct = await Product.findById(settings.heroVideoProductId).lean();
      }
      if (!heroProduct) {
        heroProduct = await Product.findOne({ productId: settings.heroVideoProductId }).lean();
      }
    }

    // Fallback: If heroVideoProductId was not explicitly set but a product has isHeroVideo: true
    if (!heroProduct && settings.heroVideoEnabled) {
      heroProduct = await Product.findOne({ isHeroVideo: true, video: { $ne: '' } }).lean();
    }

    const responseData = {
      success: true,
      storeName: settings.storeName,
      phone: settings.phone,
      city: settings.city,
      heroVideoEnabled: Boolean(settings.heroVideoEnabled && heroProduct && heroProduct.video),
      heroProduct: heroProduct
        ? {
            productId: heroProduct.productId,
            name: heroProduct.name,
            brand: heroProduct.brand,
            category: heroProduct.category,
            price: heroProduct.price,
            originalPrice: heroProduct.originalPrice,
            video: heroProduct.video,
            images: heroProduct.images,
          }
        : null,
    };

    // If request has admin token, append admin details
    if (req.user && (req.user.role === 'admin' || req.user.scope === 'data-entry-authorized')) {
      const aiConfig = await aiVideoService.getActiveProviderConfig();
      responseData.adminSettings = {
        lowStockThreshold: settings.lowStockThreshold,
        heroVideoProductId: settings.heroVideoProductId,
        aiVideoProvider: aiConfig.provider,
        aiVideoConfigured: aiConfig.isConfigured,
        aiVideoMaskedKey: aiConfig.maskedKey,
      };
    }

    return res.json(responseData);
  } catch (err) {
    console.error('Error in getSettings:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * PUT /api/settings
 * Update settings (Admin protected)
 */
exports.updateSettings = async (req, res) => {
  try {
    const { heroVideoEnabled, heroVideoProductId, storeName, phone, city, lowStockThreshold } = req.body;

    const settings = await SiteSettings.getSettings();

    if (heroVideoEnabled !== undefined) {
      settings.heroVideoEnabled = Boolean(heroVideoEnabled);
    }

    if (heroVideoProductId !== undefined) {
      settings.heroVideoProductId = heroVideoProductId ? heroVideoProductId.trim() : '';

      // Sync product isHeroVideo
      await Product.updateMany({}, { isHeroVideo: false });
      if (settings.heroVideoProductId) {
        await Product.updateOne(
          {
            $or: [
              { productId: settings.heroVideoProductId },
              ...(settings.heroVideoProductId.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: settings.heroVideoProductId }] : []),
            ],
          },
          { isHeroVideo: true }
        );
      }
    }

    if (storeName !== undefined) settings.storeName = storeName.trim();
    if (phone !== undefined) settings.phone = phone.trim();
    if (city !== undefined) settings.city = city.trim();
    if (lowStockThreshold !== undefined && !isNaN(Number(lowStockThreshold))) {
      settings.lowStockThreshold = Number(lowStockThreshold);
    }

    await settings.save();

    return res.json({
      success: true,
      message: 'Store settings updated successfully.',
      settings,
    });
  } catch (err) {
    console.error('Error in updateSettings:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
