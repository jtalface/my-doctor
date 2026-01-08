const fs = require('fs');
const path = require('path');

// Helper to load .env.production file
function loadEnvFile(envPath) {
  if (!fs.existsSync(envPath)) {
    console.log(`Warning: ${envPath} does not exist`);
    return {};
  }
  
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const env = {};
  
  envContent.split('\n').forEach(line => {
    line = line.trim();
    // Skip comments and empty lines
    if (!line || line.startsWith('#')) return;
    
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      env[key] = value;
    }
  });
  
  return env;
}

// Load environment variables
const webappBackendEnv = loadEnvFile(path.join(__dirname, 'packages/webapp-backend/.env.production'));
const doctorBackendEnv = loadEnvFile(path.join(__dirname, 'packages/doctor-backend/.env.production'));

console.log('Loaded webapp-backend CORS:', webappBackendEnv.CORS_ORIGINS);
console.log('Loaded doctor-backend CORS:', doctorBackendEnv.CORS_ORIGINS);

module.exports = {
  apps: [
    {
      name: 'webapp-backend',
      script: './packages/webapp-backend/dist/server.js',
      cwd: __dirname,
      env: {
        NODE_ENV: 'production',
        ...webappBackendEnv
      },
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G'
    },
    {
      name: 'doctor-backend',
      script: './packages/doctor-backend/dist/server.js',
      cwd: __dirname,
      env: {
        NODE_ENV: 'production',
        ...doctorBackendEnv
      },
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G'
    }
  ]
};
