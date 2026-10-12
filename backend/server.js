const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');
const leaderboardRoutes = require('./routes/leaderboard');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

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

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

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
