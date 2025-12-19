import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { config } from './config/index.js';
import { sessionRoutes, userRoutes, healthRoutes } from './api/index.js';
import { llmManager } from './services/llm/manager.js';
import { stateLoader } from './core/state-loader.js';

const app = express();

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list
    if (config.corsOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // In development, allow all 192.168.x.x origins for local network testing
    if (config.debugMode && origin.match(/^http:\/\/192\.168\.\d+\.\d+:\d+$/)) {
      console.log(`[CORS] Allowing local network origin: ${origin}`);
      return callback(null, true);
    }
    
    console.log(`[CORS] Blocked origin: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());

// Request logging in debug mode
if (config.debugMode) {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// API Routes
app.use('/api/session', sessionRoutes);
app.use('/api/user', userRoutes);
app.use('/api/health', healthRoutes);

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    name: 'MyDoctor Webapp API',
    version: '1.0.0',
    environment: config.nodeEnv,
    description: 'Backend API for MyDoctor Web Application',
    endpoints: {
      health: '/api/health',
      session: '/api/session',
      user: '/api/user',
    },
  });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Server] Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: config.debugMode ? err.message : undefined,
  });
});

// Start server
async function start() {
  try {
    // Connect to MongoDB
    console.log('[Server] Connecting to MongoDB...');
    await mongoose.connect(config.mongodbUri);
    console.log('[Server] MongoDB connected');

    // Initialize LLM Manager
    console.log('[Server] Initializing LLM providers...');
    await llmManager.initialize();
    console.log(`[Server] Active LLM provider: ${llmManager.getActiveProviderName()}`);

    // Load state machine
    console.log('[Server] Loading state machine...');
    const machine = stateLoader.load();
    console.log(`[Server] State machine loaded: ${machine.metadata.name} v${machine.metadata.version}`);

    // Start Express server
    app.listen(config.port, '0.0.0.0', () => {
      console.log('');
      console.log('='.repeat(50));
      console.log(`  MyDoctor Webapp Backend`);
      console.log(`  Port: ${config.port}`);
      console.log(`  Environment: ${config.nodeEnv}`);
      console.log(`  Debug: ${config.debugMode}`);
      console.log('='.repeat(50));
      console.log('');
    });
  } catch (error) {
    console.error('[Server] Failed to start:', error);
    process.exit(1);
  }
}

start();
