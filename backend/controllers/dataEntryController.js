const DataEntry = require('../models/DataEntry');
const Inquiry = require('../models/Inquiry');

/**
 * Create a new registration / data entry record in MongoDB
 */
exports.createDataEntry = async (req, res) => {
  try {
    const { userName, address, mobileNumber, message, itemName, category, price } = req.body;

    if (!userName || !mobileNumber || !message) {
      return res.status(400).json({
        success: false,
        message: 'User Name, Mobile Number, and Message/Requirements are required.',
      });
    }

    const cleanMobile = mobileNumber.toString().trim().replace(/\D/g, '');
    if (cleanMobile.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid 10-digit mobile number.',
      });
    }

    const newRecord = await DataEntry.create({
      userName: userName.trim(),
      address: address ? address.trim() : 'N/A',
      mobileNumber: cleanMobile,
      message: message.trim(),
      itemName: itemName ? itemName.trim() : 'Registration Entry',
      category: category ? category.trim() : 'Data Entry',
      price: price ? Number(price) : 0,
      createdBy: 'Authorized Admin',
    });

    return res.status(201).json({
      success: true,
      message: 'Data Added Successfully!',
      data: newRecord,
    });
  } catch (err) {
    console.error('Error creating DataEntry record:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to save record to MongoDB: ' + err.message,
    });
  }
};

/**
 * Get all saved records (Inquiries + Data Entries) from MongoDB sorted newest first
 */
exports.getDataEntries = async (req, res) => {
  try {
    const inquiries = await Inquiry.find().sort({ createdAt: -1 }).lean();
    const dataEntries = await DataEntry.find().sort({ createdAt: -1 }).lean();

    const mappedInquiries = inquiries.map((item) => ({
      _id: item._id,
      userName: item.name,
      mobileNumber: item.phone,
      inquiryType: item.inquiryType || 'Wholesale Inquiry',
      message: item.message,
      createdAt: item.createdAt,
    }));

    const mappedDataEntries = dataEntries.map((item) => ({
      _id: item._id,
      userName: item.userName,
      mobileNumber: item.mobileNumber,
      inquiryType: item.category || 'Data Entry',
      message: item.message,
      createdAt: item.createdAt,
    }));

    // Combine and sort newest first
    const allRecords = [...mappedInquiries, ...mappedDataEntries].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    return res.json({
      success: true,
      count: allRecords.length,
      data: allRecords,
    });
  } catch (err) {
    console.error('Error fetching DataEntry records:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch saved records: ' + err.message,
    });
  }
};
