const mongoose = require('mongoose');

const dataEntrySchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      required: [true, 'User Name is required'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    mobileNumber: {
      type: String,
      required: [true, 'Mobile Number is required'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Message / Requirements is required'],
      trim: true,
    },
    // Optional product details for inventory management
    itemName: {
      type: String,
      trim: true,
      default: '',
    },
    category: {
      type: String,
      trim: true,
      default: 'General Entry',
    },
    price: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: String,
      default: 'Authorized Admin',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('DataEntry', dataEntrySchema);
