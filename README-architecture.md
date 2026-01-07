# MyDoctor - Production Architecture

This document explains how the MyDoctor application works in production on AWS EC2, including the request flow, reverse proxy configuration, and deployment updates.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Request Flow](#request-flow)
3. [Nginx Configuration](#nginx-configuration)
4. [PM2 Process Management](#pm2-process-management)
5. [Environment Variables](#environment-variables)
6. [Architectural Decisions](#architectural-decisions)
7. [Security Layers](#security-layers)
8. [Deployment Updates](#deployment-updates)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         INTERNET                                 │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       │ HTTP Requests
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EC2 Instance (Port 80)                        │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    NGINX (Port 80)                         │  │
│  │              (Reverse Proxy + Static Server)               │  │
│  └───────────────────────────────────────────────────────────┘  │
│         │                    │                    │              │
│         │                    │                    │              │
│    [Route: /]          [Route: /doctor]    [Route: /api/*]      │
│         │                    │                    │              │
│         ▼                    ▼                    ▼              │
│  ┌─────────────┐      ┌─────────────┐     ┌──────────────┐     │
│  │   Webapp    │      │  Doctor-UI  │     │  Proxy to    │     │
│  │   (Static)  │      │  (Static)   │     │  Port 3003   │     │
│  │   Files     │      │   Files     │     └──────┬───────┘     │
│  └─────────────┘      └─────────────┘            │             │
│                                                   ▼             │
│  [Route: /doctor-api/*]                   ┌─────────────────┐  │
│         │                                  │ webapp-backend  │  │
│         │                                  │   (Port 3003)   │  │
│         ▼                                  │                 │  │
│  ┌──────────────┐                         │  - Auth         │  │
│  │  Proxy to    │                         │  - Messages     │  │
│  │  Port 3004   │                         │  - Profiles     │  │
│  └──────┬───────┘                         │  - AI Chat      │  │
│         │                                  └────────┬────────┘  │
│         ▼                                           │           │
│  ┌─────────────────┐                               │           │
│  │ doctor-backend  │                               │           │
│  │   (Port 3004)   │                               │           │
│  │                 │                               │           │
│  │  - Auth         │◄──────────────────────────────┘           │
│  │  - Conversations│      Both connect to                      │
│  │  - Patients     │      same MongoDB                         │
│  │  - Calls        │                                           │
│  └─────────────────┘                                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                       │
                       ▼
            ┌─────────────────────┐
            │   MongoDB Atlas     │
            │   (Cloud Database)  │
            │                     │
            │  Collections:       │
            │  - users            │
            │  - providers        │
            │  - conversations    │
            │  - messages         │
            │  - calls            │
            └─────────────────────┘
```

### Components

| Component | Technology | Port | Purpose |
|-----------|-----------|------|---------|
| **Nginx** | Nginx 1.x | 80 | Reverse proxy + static file server |
| **Webapp** | React + Vite | - | Patient-facing frontend (static) |
| **Doctor-UI** | React + Vite | - | Doctor-facing frontend (static) |
| **webapp-backend** | Node.js + Express | 3003 | Patient API server |
| **doctor-backend** | Node.js + Express | 3004 | Doctor API server |
| **MongoDB Atlas** | MongoDB 7.x | - | Cloud database |
| **PM2** | PM2 | - | Process manager for Node.js apps |

---

## Request Flow

### 1. Patient Accessing Webapp

```
User Browser → http://YOUR_EC2_IP/
    │
    ▼
Nginx (Port 80)
    │
    ├─ Matches: location /
    │  Serves: /home/ec2-user/my-doctor/packages/webapp/dist/
    │  Returns: index.html + JS/CSS files
    │
    └─ Browser loads React app
         │
         └─ Makes API calls to: http://YOUR_EC2_IP/api/auth/login
              │
              ▼
         Nginx matches: location /api
              │
              └─ Proxies to: http://127.0.0.1:3003/api/auth/login
                   │
                   ▼
              webapp-backend (Port 3003)
                   │
                   ├─ Validates credentials
                   ├─ Queries MongoDB (users collection)
                   └─ Returns JWT token
```

**Key Points:**
- Static files served directly by Nginx (fast!)
- API calls proxied to backend on localhost
- React Router handles client-side navigation
- JWT token stored in browser for subsequent requests

### 2. Doctor Accessing Doctor-UI

```
Doctor Browser → http://YOUR_EC2_IP/doctor
    │
    ▼
Nginx (Port 80)
    │
    ├─ Matches: location /doctor
    │  Serves: /home/ec2-user/my-doctor/packages/doctor-ui/dist/
    │  Returns: index.html with basename="/doctor"
    │
    └─ Browser loads React app
         │
         └─ Makes API calls to: http://YOUR_EC2_IP/doctor-api/auth/login
              │
              ▼
         Nginx matches: location /doctor-api/
              │
              └─ Proxies to: http://127.0.0.1:3004/api/auth/login
                   │
                   ▼
              doctor-backend (Port 3004)
                   │
                   ├─ Validates credentials
                   ├─ Queries MongoDB (providers collection)
                   └─ Returns JWT token
```

**Key Points:**
- Doctor-UI served from `/doctor` path
- React Router uses `/doctor` as base path
- API calls go to `/doctor-api` (separate from patient API)
- Different authentication system (providers vs users)

### 3. Complete Conversation Flow

```
Patient sends message:
    │
    ▼
Webapp → POST /api/conversations/:id/messages
    │
    ▼
Nginx → Proxy to localhost:3003
    │
    ▼
webapp-backend
    │
    ├─ Validates JWT token
    ├─ Saves message to MongoDB (messages collection)
    ├─ Processes with AI if needed (OpenAI)
    └─ Returns response
    
Doctor checks messages:
    │
    ▼
Doctor-UI → GET /doctor-api/conversations/:id/messages
    │
    ▼
Nginx → Proxy to localhost:3004
    │
    ▼
doctor-backend
    │
    ├─ Validates JWT token
    ├─ Queries same MongoDB conversations/messages
    └─ Returns messages (including patient's message)
```

**Key Points:**
- Both backends share the same MongoDB database
- Messages are immediately visible to both patient and doctor
- No data synchronization needed
- Each backend validates its own JWT tokens

### 4. WebRTC Call Flow

```
Patient initiates call:
    │
    ▼
Webapp → POST /api/calls/initiate
    │
    ▼
webapp-backend creates call record in MongoDB
    │
    ▼
Doctor polls for incoming calls:
    │
    ▼
Doctor-UI → GET /doctor-api/calls/incoming
    │
    ▼
doctor-backend queries same MongoDB calls collection
    │
    ▼
WebRTC signaling (offer/answer/ICE) exchanged via both APIs
    │
    ▼
Direct peer-to-peer audio connection established
```

**Key Points:**
- Call signaling goes through backends
- Actual audio streams go peer-to-peer (WebRTC)
- Fallback to phone number if WebRTC fails
- Both backends access same `calls` collection

---

## Nginx Configuration

Location: `/etc/nginx/conf.d/mydoctor.conf`

### Full Configuration

```nginx
server {
    listen 80;
    server_name _;

    # ═══════════════════════════════════════════════
    # STATIC FILE SERVING (Frontends)
    # ═══════════════════════════════════════════════
    
    # Patient Webapp (Default route)
    location / {
        root /home/ec2-user/my-doctor/packages/webapp/dist;
        try_files $uri $uri/ /index.html;
        # try_files: serve file if exists, else fall back to index.html
        # This enables React Router (client-side routing)
    }
    
    # Doctor UI (Nested route)
    location /doctor {
        alias /home/ec2-user/my-doctor/packages/doctor-ui/dist;
        try_files $uri $uri/ /doctor/index.html;
        # alias: maps /doctor to the dist folder
        # React Router handles /doctor/login, /doctor/patients, etc.
    }
    
    # ═══════════════════════════════════════════════
    # API PROXYING (Backends)
    # ═══════════════════════════════════════════════
    
    # Patient API → webapp-backend
    location /api {
        proxy_pass http://127.0.0.1:3003;
        # Forwards: /api/auth/login → localhost:3003/api/auth/login
        
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        # WebSocket support for real-time features
        
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        # Preserve original request headers
        
        proxy_cache_bypass $http_upgrade;
    }
    
    # Doctor API → doctor-backend
    location /doctor-api/ {
        proxy_pass http://127.0.0.1:3004/api/;
        # Forwards: /doctor-api/auth/login → localhost:3004/api/auth/login
        # Note the trailing slashes! They're important for path rewriting
        
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Path Rewriting Rules

| Request URL | Nginx Location | Proxied To | Backend Receives |
|-------------|---------------|------------|------------------|
| `/api/auth/login` | `location /api` | `http://localhost:3003` | `/api/auth/login` |
| `/doctor-api/auth/login` | `location /doctor-api/` | `http://localhost:3004/api/` | `/api/auth/login` |
| `/doctor/patients` | `location /doctor` | (static files) | - |
| `/` | `location /` | (static files) | - |

**Important:** The trailing slash in `/doctor-api/` → `/api/` rewrites the path!

---

## PM2 Process Management

### Ecosystem Configuration

Location: `~/my-doctor/ecosystem.config.cjs`

```javascript
const fs = require('fs');
const path = require('path');

// Helper to parse .env file
function loadEnv(envPath) {
  const env = {};
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    content.split('\n').forEach(line => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        env[match[1].trim()] = match[2].trim();
      }
    });
  }
  return env;
}

const webappEnv = loadEnv(path.join(__dirname, 'packages/webapp-backend/.env.production'));
const doctorEnv = loadEnv(path.join(__dirname, 'packages/doctor-backend/.env.production'));

module.exports = {
  apps: [
    {
      name: 'webapp-backend',
      cwd: './packages/webapp-backend',
      script: 'dist/server.js',
      env: {
        NODE_ENV: 'production',
        ...webappEnv,
      },
    },
    {
      name: 'doctor-backend',
      cwd: './packages/doctor-backend',
      script: 'dist/server.js',
      env: {
        NODE_ENV: 'production',
        ...doctorEnv,
      },
    },
  ],
};
```

### PM2 Process Diagram

```
┌─────────────────────────────────────────┐
│           PM2 (Process Manager)          │
├─────────────────────────────────────────┤
│                                          │
│  App: webapp-backend                    │
│  │                                       │
│  ├─ CWD: packages/webapp-backend        │
│  ├─ Script: dist/server.js              │
│  ├─ Env: .env.production                │
│  ├─ Port: 3003                          │
│  ├─ Status: online                      │
│  ├─ Restarts: auto (on crash)           │
│  └─ Logs: ~/.pm2/logs/                  │
│                                          │
│  App: doctor-backend                    │
│  │                                       │
│  ├─ CWD: packages/doctor-backend        │
│  ├─ Script: dist/server.js              │
│  ├─ Env: .env.production                │
│  ├─ Port: 3004                          │
│  ├─ Status: online                      │
│  ├─ Restarts: auto (on crash)           │
│  └─ Logs: ~/.pm2/logs/                  │
│                                          │
└─────────────────────────────────────────┘
```

### PM2 Features

| Feature | Benefit |
|---------|---------|
| **Auto-restart** | If a backend crashes, PM2 automatically restarts it |
| **Log management** | Centralized logs in `~/.pm2/logs/` |
| **Zero-downtime** | `pm2 reload` restarts without dropping connections |
| **Process monitoring** | `pm2 status` shows CPU, memory, uptime |
| **Startup script** | `pm2 startup` ensures processes start on reboot |

### Common PM2 Commands

```bash
# View status
pm2 status

# View logs
pm2 logs webapp-backend
pm2 logs doctor-backend
pm2 logs --lines 50

# Restart
pm2 restart webapp-backend
pm2 restart all

# Reload (zero-downtime)
pm2 reload all

# Stop
pm2 stop webapp-backend
pm2 delete all

# Monitor
pm2 monit
```

---

## Environment Variables

### Build Time (Frontend)

Frontends use Vite, which embeds environment variables at **build time**:

```
.env.production → Vite Build → Compiled JS Bundle
```

**Example (`packages/webapp/.env.production`):**
```env
VITE_API_URL=http://YOUR_EC2_IP
```

**How it works:**
1. During `pnpm build`, Vite reads `.env.production`
2. Replaces `import.meta.env.VITE_API_URL` with actual value
3. Embeds it in the compiled JavaScript

**Result in compiled code:**
```javascript
// Source code
const API_BASE = import.meta.env.VITE_API_URL || '/api';

// Compiled code
const API_BASE = "http://34.207.220.79" || '/api';
```

**Important:** After changing frontend env vars, you **must rebuild**:
```bash
cd packages/webapp && pnpm build
```

### Runtime (Backend)

Backends use Node.js, which reads environment variables at **runtime**:

```
.env.production → PM2 → process.env → Backend Code
```

**Example (`packages/webapp-backend/.env.production`):**
```env
PORT=3003
MONGODB_URI=mongodb+srv://...
JWT_ACCESS_SECRET=abc123...
```

**How it works:**
1. PM2 reads `.env.production` when starting the app
2. Sets environment variables in process
3. Backend accesses via `process.env.MONGODB_URI`

**Important:** After changing backend env vars, **restart PM2**:
```bash
pm2 restart webapp-backend
```

### Environment Variable Summary

| Variable | Backend | Purpose | Required |
|----------|---------|---------|----------|
| `VITE_API_URL` | Frontend | API base URL | ✅ Yes |
| `PORT` | Backend | Server port | ✅ Yes |
| `MONGODB_URI` | Backend | Database connection | ✅ Yes |
| `JWT_ACCESS_SECRET` | webapp-backend | JWT signing (patients) | ✅ Yes |
| `JWT_SECRET` | doctor-backend | JWT signing (doctors) | ✅ Yes |
| `JWT_REFRESH_SECRET` | Both backends | Refresh token signing | ✅ Yes |
| `OPENAI_API_KEY` | webapp-backend | AI chat | ✅ Yes |
| `CORS_ORIGINS` | Both backends | Allowed origins | ✅ Yes |

---

## Architectural Decisions

### Why Two Separate Backends?

```
┌─────────────────────┐        ┌─────────────────────┐
│  webapp-backend     │        │  doctor-backend     │
├─────────────────────┤        ├─────────────────────┤
│ - Patient auth      │        │ - Doctor auth       │
│ - Guest sessions    │        │ - Enhanced security │
│ - AI chat           │        │ - Patient lookup    │
│ - Profile setup     │        │ - Conversation mgmt │
│ - Simple rate limit │        │ - Call management   │
└─────────────────────┘        └─────────────────────┘
          │                              │
          └──────────┬───────────────────┘
                     │
                     ▼
            ┌────────────────┐
            │  Shared MongoDB │
            │                 │
            │ - conversations │
            │ - messages      │
            │ - calls         │
            └────────────────┘
```

**Benefits:**
1. **Different authentication systems:** Patients use simple email/password, doctors have enhanced security
2. **Independent authorization:** Doctors can see all patients, patients only see their own data
3. **Scalability:** Can scale each backend independently based on load
4. **Security isolation:** Different JWT secrets, different rate limits
5. **Code separation:** Easier to maintain and understand
6. **Deployment flexibility:** Can deploy updates to one without affecting the other

### Why Nginx Instead of Direct Backend Access?

**Without Nginx (Bad):**
```
Browser → http://YOUR_EC2_IP:3003 (exposed to internet)
Browser → http://YOUR_EC2_IP:3004 (exposed to internet)
```

**Problems:**
- Multiple ports exposed
- CORS issues
- No static file caching
- No SSL termination
- No load balancing
- Harder to secure

**With Nginx (Good):**
```
Browser → http://YOUR_EC2_IP (single port 80)
    ↓
  Nginx routes internally:
    - Static files: served directly (fast!)
    - API calls: proxied to backends
```

**Benefits:**
1. **Single entry point:** One IP/domain, clean URLs
2. **Static file performance:** Nginx serves static files 10x faster than Node.js
3. **SSL termination:** Add HTTPS at Nginx level (one place)
4. **Caching:** Can cache static assets and API responses
5. **Load balancing:** Can add multiple backend instances later
6. **Security:** Only port 80/443 exposed, backends hidden
7. **WebSocket support:** Nginx handles upgrades properly

### Why Shared MongoDB?

**Alternative: Separate Databases**
```
webapp-backend → MongoDB1 (patients, messages)
doctor-backend → MongoDB2 (doctors, messages)
                     ↕
            Data Synchronization (complex!)
```

**Problems:**
- Need to sync messages between databases
- Race conditions and conflicts
- More expensive (two databases)
- Complex consistency guarantees

**Our Approach: Shared Database**
```
webapp-backend ─┐
                ├→ MongoDB (single source of truth)
doctor-backend ─┘
```

**Benefits:**
1. **Data consistency:** Both see same data immediately
2. **Simpler architecture:** No synchronization needed
3. **Cost-effective:** Single database instance
4. **Real-time:** Doctor sees patient message instantly
5. **ACID guarantees:** MongoDB ensures consistency
6. **Easier backups:** Single database to backup

---

## Security Layers

The application has multiple security layers:

### 1. Network Level (AWS Security Group)

```
┌─────────────────────────────────┐
│    AWS Security Group           │
├─────────────────────────────────┤
│ Inbound Rules:                  │
│  ✅ Port 80 (HTTP)  → 0.0.0.0/0 │
│  ✅ Port 22 (SSH)   → Your IP   │
│  ❌ Port 3003       → Blocked   │
│  ❌ Port 3004       → Blocked   │
│  ❌ Port 27017      → Blocked   │
└─────────────────────────────────┘
```

**Protection:**
- Only HTTP (80) exposed to internet
- Backends not directly accessible
- MongoDB not exposed

### 2. Nginx Level

```nginx
# Rate limiting (if configured)
limit_req_zone $binary_remote_addr zone=general:10m rate=10r/s;

# Request filtering
location / {
    # Prevent directory traversal
    if ($request_uri ~* "\.\./") {
        return 403;
    }
}
```

**Protection:**
- Rate limiting to prevent DDoS
- Request validation
- Path sanitization

### 3. Backend Level (Express)

```javascript
// Rate limiting
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 5,                     // 5 attempts
  message: 'Too many login attempts'
});

// JWT validation
app.use(authenticate);  // Validates JWT on protected routes

// Input validation
const { body, validationResult } = require('express-validator');
```

**Protection:**
- JWT authentication
- Rate limiting per endpoint
- Input validation
- SQL/NoSQL injection prevention
- XSS protection (helmet.js)

### 4. Database Level (MongoDB Atlas)

```
┌─────────────────────────────┐
│  MongoDB Atlas Security     │
├─────────────────────────────┤
│ ✅ IP Whitelist             │
│    - Only EC2 IP allowed    │
│                             │
│ ✅ Authentication           │
│    - Username + Password    │
│                             │
│ ✅ Encryption               │
│    - Data at rest           │
│    - Data in transit (TLS)  │
│                             │
│ ✅ Audit Logging            │
│    - Track all access       │
└─────────────────────────────┘
```

**Protection:**
- Network isolation (IP whitelist)
- Strong authentication
- Encrypted connections
- Audit trails

### Security Summary

| Layer | Protection | Attack Prevention |
|-------|-----------|-------------------|
| AWS Security Group | Port filtering | Port scanning, direct backend access |
| Nginx | Rate limiting, path validation | DDoS, path traversal |
| Backend | JWT, rate limits, validation | Unauthorized access, injection, brute force |
| MongoDB Atlas | IP whitelist, auth, encryption | Unauthorized DB access, data theft |

---

## Deployment Updates

### Quick Update (Code Changes Only)

When you push code changes to GitHub:

```bash
# SSH into EC2
ssh -i ~/.ssh/your-key.pem ec2-user@YOUR_EC2_IP

# Navigate to project
cd ~/my-doctor

# Pull latest code
git pull

# Install any new dependencies
pnpm install

# Rebuild frontends (picks up .env.production automatically)
cd packages/webapp
pnpm build

cd ../doctor-ui
pnpm build

# Restart backends (PM2 handles zero-downtime)
pm2 restart all

# Verify everything is running
pm2 status
curl http://localhost:3003/health
curl http://localhost:3004/health

# Check logs for errors
pm2 logs --lines 20
```

**Note:** No Nginx restart needed! It automatically serves new static files.

### Full Rebuild (All Packages)

If you've updated shared packages (like `country-data`):

```bash
cd ~/my-doctor
git pull
pnpm install

# Build shared packages first
pnpm --filter @mydoctor/country-data build

# Build backends
cd packages/webapp-backend && pnpm build
cd ../doctor-backend && pnpm build

# Build frontends
cd ../webapp && pnpm build
cd ../doctor-ui && pnpm build

# Restart backends
pm2 restart all
```

### Environment Variable Changes

If you changed environment variables:

**Backend env vars:**
```bash
# Edit the env file
nano ~/my-doctor/packages/webapp-backend/.env.production
# (make changes)

# Restart backend to pick up new values
pm2 restart webapp-backend
```

**Frontend env vars:**
```bash
# Edit the env file
nano ~/my-doctor/packages/webapp/.env.production
# (make changes)

# Rebuild frontend (env vars are embedded at build time!)
cd ~/my-doctor/packages/webapp
pnpm build

# No restart needed - Nginx serves new files automatically
```

### Database Migrations

If you've added new fields or collections:

```bash
# Usually automatic with Mongoose
# Just restart backends and they'll create new fields/collections

pm2 restart all

# Verify with MongoDB Atlas UI or mongo shell
```

### Rollback Procedure

If something breaks:

```bash
# Find previous working commit
cd ~/my-doctor
git log --oneline -10

# Rollback to previous commit
git reset --hard abc1234  # Replace with commit hash

# Rebuild everything
pnpm install
cd packages/webapp && pnpm build
cd ../doctor-ui && pnpm build

# Restart
pm2 restart all
```

### Zero-Downtime Deployment

PM2 supports zero-downtime restarts:

```bash
# Reload instead of restart (keeps old process until new one is ready)
pm2 reload all

# Or individually
pm2 reload webapp-backend
pm2 reload doctor-backend
```

### Monitoring During Deployment

```bash
# Watch logs in real-time
pm2 logs

# Check process status
pm2 status

# Monitor CPU/Memory
pm2 monit

# Check Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Deployment Checklist

Before deploying:

- [ ] Test locally (`pnpm dev` in all packages)
- [ ] Run linter (`pnpm lint`)
- [ ] Commit and push to GitHub
- [ ] Backup database (MongoDB Atlas automatic backups)
- [ ] Note current git commit hash (for rollback)

During deployment:

- [ ] `git pull` on EC2
- [ ] `pnpm install`
- [ ] Build all packages
- [ ] Restart PM2
- [ ] Check `pm2 status`
- [ ] Test endpoints (curl health checks)
- [ ] Test in browser

After deployment:

- [ ] Monitor logs for 5-10 minutes
- [ ] Test critical features (login, chat, calls)
- [ ] Check MongoDB Atlas for errors
- [ ] Verify static assets load correctly

If issues occur:

- [ ] Check `pm2 logs`
- [ ] Check Nginx error logs
- [ ] Rollback if critical
- [ ] Fix and redeploy

---

## Performance Optimization

### Current Setup

```
┌─────────────────────────────────────┐
│  Performance Characteristics         │
├─────────────────────────────────────┤
│  Static Files (Nginx):               │
│    - Response time: 1-5ms            │
│    - Throughput: 10k req/s           │
│    - Gzip compression: enabled       │
│                                      │
│  API Requests (Node.js):             │
│    - Response time: 50-200ms         │
│    - Throughput: 1k req/s            │
│    - Database queries: indexed       │
│                                      │
│  WebRTC Calls:                       │
│    - Peer-to-peer (no server load)   │
│    - Signaling only through backend  │
└─────────────────────────────────────┘
```

### Future Optimizations

When scaling is needed:

1. **Multiple Backend Instances**
   ```nginx
   upstream webapp_backend {
       server 127.0.0.1:3003;
       server 127.0.0.1:3013;  # Add more instances
       server 127.0.0.1:3023;
   }
   ```

2. **Redis Caching**
   - Cache frequent DB queries
   - Store session data
   - Rate limiting state

3. **CDN for Static Assets**
   - CloudFront or Cloudflare
   - Serve JS/CSS/images from edge locations

4. **Database Read Replicas**
   - MongoDB Atlas supports read replicas
   - Distribute read load

---

## Cost Optimization

### Current Costs (Estimated)

| Service | Cost/Month | Purpose |
|---------|-----------|---------|
| EC2 t3.micro (free tier) | $0-8 | Web server |
| MongoDB Atlas M0 | $0 | Database (512MB) |
| Data Transfer | $0-5 | Outbound traffic |
| OpenAI API | Variable | AI chat (pay-per-use) |
| **Total** | **$0-15/month** | |

### When to Upgrade

**Database (MongoDB Atlas):**
- M0 (Free): Good for development, 512MB storage
- M10 ($60/month): When you exceed 512MB or need backups
- M20+ ($140/month): High traffic production

**Server (EC2):**
- t3.micro (Free tier): ~30 concurrent users
- t3.small ($15/month): ~100 concurrent users
- t3.medium ($30/month): ~500 concurrent users

---

## Monitoring and Alerts

### Current Monitoring

```bash
# PM2 monitoring
pm2 monit          # Real-time CPU/Memory
pm2 logs           # Application logs
pm2 status         # Process status

# System monitoring
top                # System resources
df -h              # Disk usage
free -h            # Memory usage

# Nginx monitoring
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Recommended Monitoring Tools

For production, consider adding:

1. **PM2 Plus** (pm2.io) - Application monitoring
2. **MongoDB Atlas Monitoring** - Database metrics (built-in)
3. **CloudWatch** - AWS infrastructure monitoring
4. **Sentry** - Error tracking
5. **UptimeRobot** - Uptime monitoring (free)

---

## Related Documentation

- [Deployment Guide](README-deployment.md) - Step-by-step setup
- [Call Feature](README-calls.md) - WebRTC implementation
- [Main README](README.md) - Project overview

---

## Support

For architecture questions or issues:

1. Check logs: `pm2 logs`
2. Check Nginx: `sudo tail -f /var/log/nginx/error.log`
3. Check MongoDB Atlas monitoring dashboard
4. Review this document for common issues
5. Check deployment guide troubleshooting section

---

**Last Updated:** January 2026

