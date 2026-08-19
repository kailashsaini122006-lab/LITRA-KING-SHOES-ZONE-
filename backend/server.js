require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const inquiryRoutes = require('./routes/inquiryRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── CORS Configuration ──────────────────────────────────────────────────────
// In production, only allow requests from your deployed Vercel frontend URL.
// In development, allow localhost:5173 (Vite default).
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  // Production Vercel frontend (hardcoded as safety fallback)
  'https://litra-king-shoes-zonechomu.vercel.app',
];

// Also add any extra URL from .env (useful if domain changes)
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., Postman, curl) in development
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked: Origin ${origin} not allowed.`));
      }
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// ─── Body Parser ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Litra King Backend API is running',
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/inquiries', inquiryRoutes);

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
  console.error('❌  MONGODB_URI is not set in .env file. Please add it and restart.');
  process.exit(1);
}

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('✅  MongoDB connected successfully');
    app.listen(PORT, () => {
      console.log(`🚀  Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌  MongoDB connection failed:', err.message);
    process.exit(1);
  });
