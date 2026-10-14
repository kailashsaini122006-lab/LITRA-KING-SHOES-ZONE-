const mongoose = require('mongoose');

const siteSettingsSchema = new mongoose.Schema(
  {
    heroVideoEnabled: {
      type: Boolean,
      default: false,
    },
    heroVideoProductId: {
      type: String,
      default: '',
      trim: true,
    },
    aiVideoProvider: {
      type: String,
      enum: ['luma', 'replicate', 'fal', 'runway', 'stability'],
      default: 'luma',
    },
    aiVideoApiKey: {
      type: String,
      default: '',
      trim: true,
    },
    aiVideoModel: {
      type: String,
      default: '',
      trim: true,
    },
    storeName: {
      type: String,
      default: 'LITRA KING SHOES ZONE',
      trim: true,
    },
    phone: {
      type: String,
      default: '+91 98290 00000',
      trim: true,
    },
    city: {
      type: String,
      default: 'Chomu, Jaipur, Rajasthan',
      trim: true,
    },
    lowStockThreshold: {
      type: Number,
      default: 5,
    },
  },
  {
    timestamps: true,
  }
);

// Singleton helper to get or initialize settings
siteSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.model('SiteSettings', siteSettingsSchema);
