const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const AdminUser = require('../models/AdminUser');

const targetEmail = process.argv[2] || process.env.ADMIN_EMAIL || 'kailashsaini122006@gmail.com';
const newPassword = process.argv[3] || process.env.ADMIN_PASSWORD || 'litra123';

async function resetAdmin() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/litraking';
  console.log(`Connecting to MongoDB... (${uri})`);

  try {
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB.');

    let admin = await AdminUser.findOne({
      $or: [
        { email: targetEmail.toLowerCase() },
        { adminId: targetEmail },
      ],
    });

    if (!admin) {
      admin = await AdminUser.findOne({});
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    if (admin) {
      admin.email = targetEmail.toLowerCase();
      admin.adminId = admin.adminId || 'admin';
      admin.password = hashedPassword;
      admin.role = 'admin';
      await admin.save();
      console.log(`🎉 Admin User updated successfully!`);
    } else {
      admin = await AdminUser.create({
        adminId: 'admin',
        email: targetEmail.toLowerCase(),
        password: hashedPassword,
        role: 'admin',
      });
      console.log(`🎉 New Admin User created successfully!`);
    }

    console.log('--------------------------------------------------');
    console.log(`Admin ID : ${admin.adminId}`);
    console.log(`Email    : ${admin.email}`);
    console.log(`Password : ${newPassword}`);
    console.log(`Role     : ${admin.role}`);
    console.log('--------------------------------------------------');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error resetting Admin User:', err.message);
    process.exit(1);
  }
}

resetAdmin();
