const mongoose = require('mongoose');

/**
 * Ensure MongoDB/Mongoose connection is active (readyState === 1).
 * If disconnected or connecting, awaits or triggers connection using process.env.MONGODB_URI.
 */
async function ensureDbConnected() {
  if (mongoose.connection.readyState === 1) {
    return true;
  }

  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is not set in environment variables.');
  }

  console.log(`🔄 [DB Check] MongoDB connection not ready (readyState=${mongoose.connection.readyState}). Reconnecting...`);

  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log(`✅ [DB Check] MongoDB reconnected successfully. readyState=${mongoose.connection.readyState}`);
    return mongoose.connection.readyState === 1;
  } catch (err) {
    console.error(`❌ [DB Check] Connection attempt failed: ${err.message}`);
    throw new Error(`Database connection failed: ${err.message}`);
  }
}

module.exports = ensureDbConnected;
