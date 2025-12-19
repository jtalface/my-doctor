import * as dotenv from 'dotenv';
import * as dotenvExpand from 'dotenv-expand';
import * as path from 'path';
import * as fs from 'fs';

// Determine environment
const nodeEnv = process.env.NODE_ENV || 'development';

// Load environment-specific file
const envFile = nodeEnv === 'production' ? '.env.production' : '.env.development';
const envPath = path.resolve(process.cwd(), envFile);

if (fs.existsSync(envPath)) {
  const env = dotenv.config({ path: envPath });
  dotenvExpand.expand(env);
  console.log(`[Config] Loaded ${envFile}`);
} else {
  console.log(`[Config] ${envFile} not found, using environment variables`);
}

// Load .env.local for overrides (not committed to git)
const localEnvPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(localEnvPath)) {
  const localEnv = dotenv.config({ path: localEnvPath });
  dotenvExpand.expand(localEnv);
  console.log('[Config] Loaded .env.local overrides');
}

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3003', 10),
  nodeEnv,
  isProduction: nodeEnv === 'production',
  debugMode: process.env.DEBUG_MODE === 'true',

  // MongoDB
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/mydoctor',

  // CORS
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:5173')
    .split(',')
    .map(origin => origin.trim()),

  // LLM
  defaultLLMProvider: process.env.DEFAULT_LLM_PROVIDER || 'lm-studio',

  // LM Studio
  lmStudio: {
    url: process.env.LM_STUDIO_URL || 'http://localhost:1235',
    model: process.env.LM_STUDIO_MODEL || 'meditron-7b-q5',
    timeout: parseInt(process.env.LM_STUDIO_TIMEOUT || '30000', 10),
  },

  // OpenAI
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-5-nano',
    timeout: parseInt(process.env.OPENAI_TIMEOUT || '30000', 10),
  },
};

export type Config = typeof config;
