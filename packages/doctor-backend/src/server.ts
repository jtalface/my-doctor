/**
 * Doctor Backend Server
 * 
 * API server for the doctor-facing application.
 * Connects to the same MongoDB as webapp-backend to share:
 * - providers (doctor profiles)
 * - conversations
 * - messages
 * 
 * Reads patient data from:
 * - users
 * - patientprofiles
 */

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';

import config from './config/index.js';
import {
  authRoutes,
  conversationRoutes,
  messageRoutes,
  patientRoutes,
  profileRoutes,
} from './api/index.js';

const app = express();

// ===========================================
// Middleware
// ===========================================

// CORS
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Cookies
app.use(cookieParser());

// Rate limiting - general API
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per window
  message: { error: 'RATE_LIMITED', message: 'Too many requests' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Auth rate limiting (stricter for login/register)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // 20 auth attempts per 15 minutes
  message: { error: 'RATE_LIMITED', message: 'Too many authentication attempts' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// More lenient limiter for refresh endpoint (called automatically)
const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // 100 refresh attempts per 15 minutes
  message: { error: 'RATE_LIMITED', message: 'Too many refresh attempts' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth/refresh', refreshLimiter);

// ===========================================
// Routes
// ===========================================

// Health check
app.get('/health', (_req, res) => {
  res.json({ 
    status: 'ok',
    service: 'doctor-backend',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/profile', profileRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ 
    error: 'NOT_FOUND',
    message: 'Endpoint not found' 
  });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Server] Error:', err);
  res.status(500).json({ 
    error: 'INTERNAL_ERROR',
    message: 'Internal server error' 
  });
});

// ===========================================
// Database & Server Start
// ===========================================

async function start() {
  try {
    // Connect to MongoDB (same database as webapp-backend)
    console.log('[Doctor Backend] Connecting to MongoDB...');
    await mongoose.connect(config.mongoUri);
    console.log('[Doctor Backend] MongoDB connected');

    // Start server
    app.listen(config.port, () => {
      console.log(`[Doctor Backend] Server running on port ${config.port}`);
      console.log(`[Doctor Backend] CORS origin: ${config.corsOrigin}`);
      console.log(`[Doctor Backend] Environment: ${config.nodeEnv}`);
    });
  } catch (error) {
    console.error('[Doctor Backend] Failed to start:', error);
    process.exit(1);
  }
}

start();

export default app;

