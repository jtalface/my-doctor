/**
 * Configuration
 * 
 * Loads environment variables and provides typed config.
 * Shares the same MongoDB connection as webapp-backend.
 */

import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment files in order of priority
const envFiles = [
  // Check doctor-backend specific env files first
  path.resolve(__dirname, '../../.env.development'),
  path.resolve(__dirname, '../../.env.local'),
  // Then check webapp-backend env files (shared MongoDB)
  path.resolve(__dirname, '../../../webapp-backend/.env.development'),
  path.resolve(__dirname, '../../../webapp-backend/.env.local'),
  // Finally check root directory
  path.resolve(__dirname, '../../../../.env.local'),
];

for (const envPath of envFiles) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: true });
    console.log(`[Config] Loaded ${path.basename(envPath)} from ${path.dirname(envPath)}`);
  }
}

export const config = {
  // Server
  port: parseInt(process.env.DOCTOR_PORT || '3004', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // MongoDB - Use same database as webapp-backend
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/mydoctor',
  
  // JWT
  jwtSecret: process.env.JWT_SECRET || 'doctor-dev-secret-change-in-prod',
  jwtAccessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
  jwtRefreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  
  // CORS - Parse comma-separated origins into array
  corsOrigin: process.env.DOCTOR_CORS_ORIGIN 
    ? process.env.DOCTOR_CORS_ORIGIN.split(',').map(o => o.trim())
    : ['http://localhost:3005'],
  
  // Cookie
  cookieDomain: process.env.COOKIE_DOMAIN || 'localhost',
  cookieSecure: process.env.NODE_ENV === 'production',
  
  // File uploads
  uploadDir: path.resolve(__dirname, '../../uploads/messages'),
  maxFileSize: 10 * 1024 * 1024, // 10MB
};

export default config;

