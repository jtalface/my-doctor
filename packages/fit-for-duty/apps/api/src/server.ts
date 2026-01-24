import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import { config } from './config/index.js';
import {
  authRoutes,
  userRoutes,
  locationRoutes,
  jobRoleRoutes,
  templateRoutes,
  assessmentRoutes,
  reportRoutes,
} from './routes/index.js';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.isDev ? ['http://localhost:3007', 'http://localhost:5173'] : process.env.ALLOWED_ORIGINS?.split(','),
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts
  message: { error: 'Too many login attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Request logging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Fit for Duty API',
    version: '1.0.0',
    endpoints: {
      auth: '/auth',
      users: '/users (admin)',
      locations: '/locations',
      jobroles: '/jobroles',
      templates: '/templates',
      assessments: '/assessments',
      reports: '/reports',
    },
  });
});

// Routes
app.use('/auth', authLimiter, authRoutes);
app.use('/users', userRoutes);
app.use('/locations', locationRoutes);
app.use('/jobroles', jobRoleRoutes);
app.use('/templates', templateRoutes);
app.use('/assessments', assessmentRoutes);
app.use('/reports', reportRoutes);

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Error]', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
async function start() {
  try {
    console.log('[Server] Connecting to MongoDB...');
    await mongoose.connect(config.mongodbUri);
    console.log('[Server] MongoDB connected');
    
    app.listen(config.port, '0.0.0.0', () => {
      console.log('');
      console.log('='.repeat(50));
      console.log('  Fit for Duty API Server');
      console.log('='.repeat(50));
      console.log(`  URL: http://localhost:${config.port}`);
      console.log(`  Environment: ${config.nodeEnv}`);
      console.log('='.repeat(50));
      console.log('');
    });
  } catch (error) {
    console.error('[Server] Failed to start:', error);
    process.exit(1);
  }
}

start();
