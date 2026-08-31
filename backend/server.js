require('dotenv').config();

console.log("MongoDB URI =", process.env.MONGODB_URI);

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const inquiryRoutes = require('./routes/inquiryRoutes');
const authRoutes = require('./routes/authRoutes');
const dataEntryRoutes = require('./routes/dataEntryRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const productController = require('./controllers/productController');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── CORS Configuration ──────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'https://litra-king-shoes-zonechomu.vercel.app',
];

if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, mobile apps, Postman)
      if (!origin) return callback(null, true);

      // Allow any localhost/127.0.0.1 port and any vercel preview/prod domain
      if (
        origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:') ||
        origin.endsWith('.vercel.app') ||
        allowedOrigins.includes(origin)
      ) {
        return callback(null, true);
      }

      // Default allow to prevent blocking client requests
      return callback(null, true);
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// ─── Body Parser ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Litra King Backend API is running',
    timestamp: new Date().toISOString(),
  });
});

const authController = require('./controllers/authController');

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/data-entry', dataEntryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

// Direct Route Aliases for maximum compatibility
app.post('/api/verify-pin', authController.verifyPin);
app.post('/api/login', authController.login);
app.post('/api/verify-password', authController.login);
app.get('/api/security-pin/masked-email', authController.getMaskedAdminEmail);
app.post('/api/security-pin/forgot', authController.forgotSecurityPin);
app.post('/api/security-pin/verify-reset-code', authController.verifySecurityPinResetCode);
app.post('/api/security-pin/reset', authController.resetSecurityPin);
app.post('/api/forgot-pin', authController.forgotSecurityPin);
app.post('/api/verify-pin-otp', authController.verifySecurityPinResetCode);
app.post('/api/reset-pin', authController.resetSecurityPin);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ─── Global Error Handler ────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// ─── MongoDB Connection & Server Start ───────────────────────────────────────
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌  MONGODB_URI is not set. Add it to .env (local) or Render Environment Variables (production).');
  process.exit(1);
}

// Guard: reject obvious placeholder values before even trying to connect
if (MONGODB_URI.includes('YOUR_USERNAME') || MONGODB_URI.includes('xxxxx') || MONGODB_URI.includes('YOUR_PASSWORD')) {
  console.error('❌  MONGODB_URI still contains placeholder values (YOUR_USERNAME / xxxxx / YOUR_PASSWORD).');
  console.error('    Open your .env file and replace line MONGODB_URI= with your real Atlas connection string.');
  console.error('    Format: mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority');
  process.exit(1);
}

// Warn if a localhost URI is used in a non-local environment (e.g. Render)
if (
  (MONGODB_URI.includes('127.0.0.1') || MONGODB_URI.includes('localhost')) &&
  process.env.NODE_ENV === 'production'
) {
  console.error('❌  MONGODB_URI points to localhost but NODE_ENV is "production". Use a MongoDB Atlas URI on Render.');
  process.exit(1);
}

// Mongoose connection options — tuned for MongoDB Atlas
const mongooseOptions = {
  serverSelectionTimeoutMS: 10000, // Give up initial connection if Atlas unreachable in 10 s
  socketTimeoutMS: 45000,          // Close idle sockets after 45 s
};

// ── Connection event listeners (runtime, non-fatal) ───────────────────────────
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️   MongoDB disconnected — Mongoose will auto-reconnect.');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅  MongoDB reconnected successfully');
});

mongoose.connection.on('error', (err) => {
  // Log but do NOT crash — Mongoose handles reconnect internally
  console.error('❌  MongoDB runtime error:', err.message);
});

// ── Start HTTP Server Immediately ──────────────────────────────────────────────
const server = app.listen(PORT, () => {
  console.log(`🚀  Server running on http://localhost:${PORT}`);
});

// Handle Port Errors gracefully
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌  Port ${PORT} is already in use by another running Node process.`);
    console.error(`💡  To kill the process on port ${PORT}, run this command in PowerShell:`);
    console.error(`    Stop-Process -Id (Get-NetTCPConnection -LocalPort ${PORT}).OwningProcess -Force`);
    process.exit(1);
  } else {
    console.error('❌  Server listening error:', err.message);
  }
});

// ── Connect MongoDB in background (non-blocking) ────────────────────────────────
mongoose
  .connect(MONGODB_URI, mongooseOptions)
  .then(() => {
    const uriType = MONGODB_URI.startsWith('mongodb+srv') ? 'Atlas (cloud)' : 'local';
    console.log(`✅  MongoDB connected successfully [${uriType}]`);
    productController.seedProductsIfEmpty();
  })
  .catch((err) => {
    console.warn('⚠️   MongoDB initial connection warning:', err.message);
    console.warn('💡  Backend API is active on port ' + PORT + ' (Using fallback storage for face verification).');
  });


