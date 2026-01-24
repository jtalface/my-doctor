import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from api directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '3006', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/fit-for-duty',
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  },
  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@ffd.local',
    password: process.env.ADMIN_PASSWORD || 'Admin123!',
    name: process.env.ADMIN_NAME || 'System Administrator',
  },
  isDev: process.env.NODE_ENV !== 'production',
};

export default config;
