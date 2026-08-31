const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      required: [true, 'Product ID is required'],
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    brand: {
      type: String,
      default: 'LITRA KING',
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'Sports Shoes',
        'Casual Shoes',
        'Sneakers',
        'Running Shoes',
        'Formal Shoes',
        'Slippers',
        'Sandals',
        'Kids Footwear',
      ],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: 0,
    },
    originalPrice: {
      type: Number,
      default: function () {
        return Math.round(this.price * 1.4);
      },
    },
    images: {
      type: [String],
      required: [true, 'At least one product image is required'],
    },
    sizes: {
      type: [Number],
      default: [6, 7, 8, 9, 10],
    },
    colors: {
      type: [String],
      default: ['Black', 'White', 'Navy Blue'],
    },
    stock: {
      type: Number,
      default: 25,
      min: 0,
    },
    rating: {
      type: Number,
      default: 4.8,
      min: 1,
      max: 5,
    },
    tag: {
      type: String,
      default: 'Best Seller',
    },
    isFeatured: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Product', productSchema);
