const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');
const leaderboardRoutes = require('./routes/leaderboard');

dotenv.config();

const app = express();

// Enable reverse proxy support for Render hosting (for accurate client IP detection)
app.set('trust proxy', 1);

// Allowed Origins for Credentialed Cross-Origin Requests
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://algo-learn-tau.vercel.app',
  process.env.FRONTEND_URL,
].filter(Boolean);

// CORS configuration supporting credentials (cookies & auth headers)
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.onrender.com') ||
      origin.endsWith('.vercel.app') ||
      process.env.NODE_ENV !== 'production'
    ) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Set-Cookie'],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

app.use(cookieParser());
app.use(express.json({ limit: '5mb' }));

// Lightweight in-memory rate limiter specifically for login and signup brute-force protection
const authRateLimitMap = new Map();
const authRateLimiter = (req, res, next) => {
  // Never block OPTIONS preflight checks
  if (req.method === 'OPTIONS') {
    return next();
  }

  const ip = req.ip || req.connection?.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 60; // 60 requests per minute per IP

  const record = authRateLimitMap.get(ip);
  if (!record || now - record.startTime > windowMs) {
    authRateLimitMap.set(ip, { count: 1, startTime: now });
    return next();
  }

  record.count += 1;
  if (record.count > maxRequests) {
    return res.status(429).json({
      error: 'Too many requests. Please try again after a minute.',
    });
  }

  next();
};

// Periodic cleanup of rate limiter entries
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of authRateLimitMap.entries()) {
    if (now - record.startTime > 60000) {
      authRateLimitMap.delete(ip);
    }
  }
}, 120000).unref();

// Root & Health Check
app.get('/', (_req, res) => {
  res.json({
    message: 'AlgoLearn Backend is running!',
    status: 'online',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health', (_req, res) => {
  const mongoose = require('mongoose');
  const isConnected = mongoose.connection.readyState === 1;
  res.json({
    status: isConnected ? 'ok' : 'degraded',
    service: 'AlgoLearn Backend API',
    database: isConnected ? 'MongoDB Connected' : 'MongoDB Disconnected',
    readyState: mongoose.connection.readyState,
  });
});

// Import additional routes
const teachersRoutes = require('./routes/teachers');
const questionsRoutes = require('./routes/questions');

// Apply rate limiting specifically to login and signup endpoints (not /me or /logout)
app.use('/api/auth/login', authRateLimiter);
app.use('/api/auth/signup', authRateLimiter);

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/teachers', teachersRoutes);
app.use('/api/questions', questionsRoutes);

// Global Error Handler (Sanitized for production)
app.use((err, _req, res, _next) => {
  console.error('Unhandled Server Error:', err);
  const status = err.status || 500;
  res.status(status).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error.' : err.message,
  });
});

const PORT = process.env.PORT || 5000;

// Start Express server after attempting DB connection
const startServer = async () => {
  try {
    if (process.env.MONGO_URI) {
      await connectDB();
      console.log('✅ Connected to MongoDB successfully.');
    } else {
      console.warn('⚠️ MONGO_URI is missing in backend/.env');
    }
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
  }

  app.listen(PORT, () => {
    console.log(`🚀 AlgoLearn Backend server running on port ${PORT}`);
  });
};

startServer();

module.exports = app;
