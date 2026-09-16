const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/litraking';

async function checkAllFields() {
  try {
    await mongoose.connect(MONGO_URI);
    const Order = require('./models/Order');
    const orders = await Order.find({}).lean();
    console.log(`Total orders in DB: ${orders.length}`);

    let emailsFound = [];
    orders.forEach(o => {
      const jsonStr = JSON.stringify(o);
      if (jsonStr.toLowerCase().includes('gmail') || jsonStr.toLowerCase().includes('@')) {
        console.log(`FOUND EMAIL/GMAIL IN ORDER ${o.orderId}:`, jsonStr);
        emailsFound.push(o);
      }
    });

    if (emailsFound.length === 0) {
      console.log('NO order document in MongoDB contains any email address containing "@" or "gmail".');
    }

    console.log('\nKeys present in first order document:');
    if (orders[0]) {
      console.log(Object.keys(orders[0]));
      console.log('Customer object keys:', Object.keys(orders[0].customer || {}));
      console.log('Sample customer object:', orders[0].customer);
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkAllFields();
