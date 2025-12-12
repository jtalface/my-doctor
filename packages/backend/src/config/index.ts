/**
 * Configuration Module
 * 
 * Loads environment-specific configuration from .env files.
 * 
 * File structure:
 *   .env.development   - Local dev (MongoDB local, LM Studio)
 *   .env.production    - Production (Atlas, OpenAI)
 *   .env.local         - Personal overrides (gitignored, for secrets)
 *   .env.example       - Template (committed to repo)
 * 
 * Loading order:
 *   1. .env.{NODE_ENV} (required: .env.development or .env.production)
 *   2. .env.local (optional overrides)
 */

import path from "path";
import dotenv from "dotenv";
import fs from "fs";

// Determine environment
const NODE_ENV = process.env.NODE_ENV || "development";
const backendRoot = path.resolve(__dirname, "../../");

// 1. Load environment-specific .env file (required)
const envFile = `.env.${NODE_ENV}`;
const envPath = path.join(backendRoot, envFile);

if (!fs.existsSync(envPath)) {
  console.error(`
╔══════════════════════════════════════════════════════════════╗
║  ERROR: Missing environment file                             ║
╠══════════════════════════════════════════════════════════════╣
║  Expected: ${envFile.padEnd(47)}║
║  Path: ${envPath.substring(0, 50).padEnd(51)}║
║                                                              ║
║  Create this file or copy from .env.example                  ║
╚══════════════════════════════════════════════════════════════╝
  `);
  process.exit(1);
}

dotenv.config({ path: envPath });
console.log(`[Config] Loaded: ${envFile}`);

// 2. Load .env.local for personal overrides (optional, gitignored)
const localEnvPath = path.join(backendRoot, ".env.local");
if (fs.existsSync(localEnvPath)) {
  dotenv.config({ path: localEnvPath, override: true });
  console.log("[Config] Loaded: .env.local (overrides)");
}

// Export configuration object
export const config = {
  // Environment
  nodeEnv: NODE_ENV,
  isProduction: NODE_ENV === "production",
  isDevelopment: NODE_ENV === "development",

  // Server
  port: parseInt(process.env.PORT || "3002", 10),

  // MongoDB
  mongoUri: process.env.MONGODB_URI || "mongodb://localhost:27017/mydoctor",

  // LLM Providers
  llm: {
    defaultProvider: (process.env.DEFAULT_LLM_PROVIDER || "lm-studio") as "lm-studio" | "openai",
    
    // LM Studio (local)
    lmStudio: {
      url: process.env.LM_STUDIO_URL || "http://localhost:1235/v1",
      model: process.env.LM_STUDIO_MODEL || "meditron-7b",
      timeout: parseInt(process.env.LM_STUDIO_TIMEOUT || "30000", 10),
    },

    // OpenAI
    openai: {
      apiKey: process.env.OPENAI_API_KEY || "",
      model: process.env.OPENAI_MODEL || "gpt-5-nano",
      timeout: parseInt(process.env.OPENAI_TIMEOUT || "30000", 10),
    },
  },

  // Debug
  debugMode: process.env.DEBUG_MODE === "true",

  // CORS
  corsOrigins: process.env.CORS_ORIGINS?.split(",") || ["http://localhost:1234"],
};

// Log configuration on startup (hide sensitive data)
export function logConfig(): void {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║  Configuration Loaded                                      ║
╠════════════════════════════════════════════════════════════╣
║  Environment: ${config.nodeEnv.padEnd(43)}║
║  Port: ${String(config.port).padEnd(50)}║
║  MongoDB: ${config.mongoUri.substring(0, 45).padEnd(47)}║
║  LLM Provider: ${config.llm.defaultProvider.padEnd(42)}║
║  Debug Mode: ${String(config.debugMode).padEnd(44)}║
╚════════════════════════════════════════════════════════════╝
  `);
}

export default config;

