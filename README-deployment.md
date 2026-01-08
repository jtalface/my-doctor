# MyDoctor AWS Deployment Guide

Complete guide for deploying the MyDoctor application to AWS EC2 with MongoDB Atlas and OpenAI.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Part 1: AWS EC2 Setup](#part-1-aws-ec2-setup)
4. [Part 2: Install Dependencies on EC2](#part-2-install-dependencies-on-ec2)
5. [Part 3: Clone and Build Project](#part-3-clone-and-build-project)
6. [Part 4: MongoDB Atlas Setup](#part-4-mongodb-atlas-setup)
7. [Part 5: Configure Nginx](#part-5-configure-nginx)
8. [Part 6: Start Backends with PM2](#part-6-start-backends-with-pm2)
9. [Part 7: Set up HTTPS with Let's Encrypt](#part-7-set-up-https-with-lets-encrypt)
10. [Part 8: Verify Deployment](#part-8-verify-deployment)
11. [Updating Code](#updating-code-future-deployments)
12. [Quick Reference Commands](#quick-reference-commands)
13. [Troubleshooting](#troubleshooting)
14. [Security Checklist](#security-checklist)
15. [Costs](#costs-approximate)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         USERS (Browser/Phone)                            │
│                    Patients              Doctors                         │
└─────────────────────────────────────────────────────────────────────────┘
                         │                    │
                         ▼                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         AWS EC2 Instance                                 │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                      NGINX (:80/:443)                             │  │
│  │  ┌─────────────────────────────────────────────────────────────┐  │  │
│  │  │  /                    │  /doctor                            │  │  │
│  │  │  Patient Webapp       │  Doctor UI                          │  │  │
│  │  │  (Static Files)       │  (Static Files)                     │  │  │
│  │  └─────────────────────────────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────────────────────────────┐  │  │
│  │  │  /api                 │  /doctor-api                        │  │  │
│  │  │  → localhost:3003     │  → localhost:3004                   │  │  │
│  │  │  (webapp-backend)     │  (doctor-backend)                   │  │  │
│  │  └─────────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                    │                           │
                    ▼                           ▼
     ┌─────────────────────────┐  ┌─────────────────────────┐
     │     MongoDB Atlas       │  │      OpenAI API         │
     │     (Cloud Database)    │  │      (ChatGPT LLM)      │
     └─────────────────────────┘  └─────────────────────────┘
```

### Services Overview

| Service | Port | Purpose |
|---------|------|---------|
| webapp | - | Patient frontend (React static files) |
| doctor-ui | - | Doctor frontend (React static files) |
| webapp-backend | 3003 | Patient API (Express + Node.js) |
| doctor-backend | 3004 | Doctor API (Express + Node.js) |
| MongoDB Atlas | - | Cloud database (shared by both backends) |
| Nginx | 80/443 | Reverse proxy + static file serving + SSL |

---

## Prerequisites

- ✅ AWS Account
- ✅ EC2 Instance running (Amazon Linux 2023 recommended)
- ✅ MongoDB Atlas cluster set up
- OpenAI API Key
- Domain name (required for HTTPS and WebRTC calls)

---

## Part 1: AWS EC2 Setup

> Skip this if you already have an EC2 instance running.

### 1.1 Launch EC2 Instance

1. Go to **AWS Console** → **EC2** → **Launch Instance**
2. Configure:
   - **Name:** `mydoctor-server`
   - **AMI:** Amazon Linux 2023
   - **Instance Type:** t3.small (recommended) or t3.micro (testing)
   - **Key Pair:** Create or select existing (.pem file)
   - **Storage:** 20 GB gp3

3. **Security Group** - Create new with these inbound rules:

| Type | Port | Source | Description |
|------|------|--------|-------------|
| SSH | 22 | Your IP | SSH access |
| HTTP | 80 | 0.0.0.0/0 | Web traffic |
| HTTPS | 443 | 0.0.0.0/0 | Secure web traffic |
| Custom TCP | 3003 | 0.0.0.0/0 | Webapp API (optional, for debugging) |
| Custom TCP | 3004 | 0.0.0.0/0 | Doctor API (optional, for debugging) |

4. Click **Launch Instance**

### 1.2 Allocate Elastic IP (Recommended)

1. Go to **EC2** → **Elastic IPs** → **Allocate Elastic IP address**
2. Click **Allocate**
3. Select the new IP → **Actions** → **Associate Elastic IP address**
4. Select your EC2 instance and associate

> This ensures your IP doesn't change when the instance restarts.

### 1.3 Connect to EC2

```bash
# Make key file secure
chmod 400 your-key.pem

# Connect via SSH
ssh -i your-key.pem ec2-user@YOUR_EC2_PUBLIC_IP
```

---

## Part 2: Install Dependencies on EC2

Run these commands after SSHing into your EC2 instance:

```bash
# Update system
sudo yum update -y

# Install Node.js 20
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

# Install pnpm (package manager)
sudo npm install -g pnpm

# Install PM2 (process manager)
sudo npm install -g pm2

# Install Nginx (web server)
sudo yum install nginx -y

# Install Git
sudo yum install git -y

# Install certbot for SSL (optional, for HTTPS)
sudo yum install certbot python3-certbot-nginx -y

# Verify installations
node --version    # Should show v20.x.x
pnpm --version    # Should show 9.x.x or higher
pm2 --version     # Should show 5.x.x
nginx -v          # Should show nginx/1.x.x
```

---

## Part 3: Clone and Build Project

### 3.1 Clone Repository

```bash
cd ~
git clone https://github.com/jtalface/my-doctor.git
cd my-doctor
pnpm install
```

### 3.2 Create Production Environment Files

#### Webapp Backend Environment

```bash
nano ~/my-doctor/packages/webapp-backend/.env.production
```

Paste (replace with your actual values):

```env
# Server
PORT=3003

# MongoDB Atlas
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/mydoctor?retryWrites=true&w=majority

# JWT Secrets (generate secure random strings with: openssl rand -base64 48)
JWT_ACCESS_SECRET=your-super-secure-jwt-access-secret-at-least-32-chars
JWT_REFRESH_SECRET=your-super-secure-jwt-refresh-secret-at-least-32-chars

# LLM Provider
DEFAULT_LLM_PROVIDER=openai

# LM Studio (placeholder, not used in production)
LM_STUDIO_URL=http://localhost:1235/v1
LM_STUDIO_MODEL=meditron-7b
LM_STUDIO_TIMEOUT=30000

# OpenAI
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_MODEL=gpt-4o-mini
OPENAI_TIMEOUT=30000

# Debug (set to false in production)
DEBUG_MODE=false

# CORS (your EC2 IP or domain)
CORS_ORIGINS=http://YOUR_EC2_IP,http://localhost
```

**Important:** Use `JWT_ACCESS_SECRET` (not `JWT_SECRET`) for webapp-backend!

Save: `Ctrl+O`, `Enter`, `Ctrl+X`

#### Doctor Backend Environment

```bash
nano ~/my-doctor/packages/doctor-backend/.env.production
```

Paste:

```env
# Server
PORT=3004

# MongoDB Atlas (same as webapp-backend)
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/mydoctor?retryWrites=true&w=majority

# JWT Secrets (can be same as webapp-backend or different)
JWT_SECRET=your-super-secure-jwt-secret-at-least-32-chars
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-at-least-32-chars

# Debug
DEBUG_MODE=false

# CORS (your EC2 IP or domain)
DOCTOR_CORS_ORIGIN=http://YOUR_EC2_IP,http://localhost
```

**Important Notes:**
- Doctor backend uses `JWT_SECRET` (not `JWT_ACCESS_SECRET`)
- Doctor backend uses `DOCTOR_CORS_ORIGIN` (not `CORS_ORIGINS`)

### 3.3 Build All Packages

```bash
cd ~/my-doctor

# Build shared packages first
pnpm --filter @mydoctor/country-data build 2>/dev/null || true

# Build backends
cd packages/webapp-backend
pnpm build

cd ../doctor-backend
pnpm build

# Build frontends
cd ../webapp
pnpm build

cd ../doctor-ui
pnpm build
```

---

## Part 4: MongoDB Atlas Setup

> Skip if already configured.

### 4.1 Create Database User

1. Go to **Database Access** in Atlas sidebar
2. Click **Add New Database User**
3. Choose **Password** authentication
4. Enter username and strong password
5. Set privileges to **Read and write to any database**
6. Click **Add User**

### 4.2 Whitelist EC2 IP Address

1. Go to **Network Access** in sidebar
2. Click **Add IP Address**
3. Enter your EC2's Elastic IP address
4. Add comment: "EC2 Production Server"
5. Click **Confirm**

### 4.3 Get Connection String

1. Go to **Database** → Click **Connect**
2. Choose **Connect your application**
3. Copy the connection string
4. Replace `<password>` with your actual password
5. Replace `<dbname>` with `mydoctor`

---

## Part 5: Configure Nginx

### 5.1 Create Nginx Configuration

```bash
sudo nano /etc/nginx/conf.d/mydoctor.conf
```

Paste (replace `yourdomain.com` with your actual domain or EC2 IP):

```nginx
# Patient Webapp
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Patient Frontend (React SPA)
    location / {
        root /home/ec2-user/my-doctor/packages/webapp/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Patient API
    location /api {
        proxy_pass http://localhost:3003;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support (for future use)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Doctor Frontend (React SPA)
    location /doctor {
        alias /home/ec2-user/my-doctor/packages/doctor-ui/dist;
        index index.html;
        try_files $uri $uri/ /doctor/index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Doctor API
    location /doctor-api/ {
        rewrite ^/doctor-api/(.*)$ /api/$1 break;
        proxy_pass http://localhost:3004;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /health {
        return 200 'OK';
        add_header Content-Type text/plain;
    }
}
```

### 5.2 Update Frontend Build for Production URLs

Before building, update the frontend API URLs:

```bash
# Webapp - create production env
echo 'VITE_API_URL=https://yourdomain.com' > ~/my-doctor/packages/webapp/.env.production

# Doctor UI - create production env  
echo 'VITE_API_URL=https://yourdomain.com/doctor-api' > ~/my-doctor/packages/doctor-ui/.env.production

# Rebuild frontends with production URLs
cd ~/my-doctor/packages/webapp && pnpm build
cd ~/my-doctor/packages/doctor-ui && pnpm build
```

### 5.3 Fix File Permissions

```bash
sudo chmod 755 /home/ec2-user
sudo chmod -R 755 /home/ec2-user/my-doctor
sudo usermod -a -G ec2-user nginx
```

### 5.4 Test and Start Nginx

```bash
# Test configuration
sudo nginx -t

# Start Nginx
sudo systemctl start nginx

# Enable auto-start on reboot
sudo systemctl enable nginx

# Check status
sudo systemctl status nginx
```

---

## Part 6: Start Backends with PM2

### 6.1 Create PM2 Ecosystem File

```bash
nano ~/my-doctor/ecosystem.config.js
```

Paste:

```javascript
module.exports = {
  apps: [
    {
      name: 'webapp-backend',
      cwd: '/home/ec2-user/my-doctor/packages/webapp-backend',
      script: 'dist/server.js',
      env: {
        NODE_ENV: 'production',
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      error_file: '/home/ec2-user/logs/webapp-backend-error.log',
      out_file: '/home/ec2-user/logs/webapp-backend-out.log',
    },
    {
      name: 'doctor-backend',
      cwd: '/home/ec2-user/my-doctor/packages/doctor-backend',
      script: 'dist/server.js',
      env: {
        NODE_ENV: 'production',
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      error_file: '/home/ec2-user/logs/doctor-backend-error.log',
      out_file: '/home/ec2-user/logs/doctor-backend-out.log',
    },
  ],
};
```

### 6.2 Create Logs Directory

```bash
mkdir -p ~/logs
```

### 6.3 Start All Backends

```bash
cd ~/my-doctor
pm2 start ecosystem.config.js

# Verify both are running
pm2 status
```

### 6.4 Configure PM2 Auto-Restart

```bash
# Save current PM2 process list
pm2 save

# Generate startup script
pm2 startup

# Run the command it outputs (looks like):
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ec2-user --hp /home/ec2-user
```

---

## Part 7: Set up HTTPS with Let's Encrypt

> **Required for WebRTC calls to work on mobile devices!**

### 7.1 Point Domain to EC2

1. In your domain registrar (Route 53, Namecheap, etc.):
2. Create an **A record** pointing to your EC2 Elastic IP
3. Wait for DNS propagation (5-30 minutes)

### 7.2 Get SSL Certificate

```bash
# Request certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow the prompts:
# - Enter email address
# - Agree to terms
# - Choose whether to redirect HTTP to HTTPS (recommended: yes)
```

### 7.3 Auto-Renewal

Certbot sets up auto-renewal automatically. Test it:

```bash
sudo certbot renew --dry-run
```

---

## Part 8: Verify Deployment

### 8.1 Check All Services

```bash
# Check PM2 (backends)
pm2 status

# Check Nginx
sudo systemctl status nginx

# Test webapp-backend locally
curl http://localhost:3003/api/health

# Test doctor-backend locally
curl http://localhost:3004/api/health

# Test via Nginx
curl http://localhost/api/health
curl http://localhost/doctor-api/health
```

### 8.2 Access Your Application

Open in browser:

| Endpoint | URL |
|----------|-----|
| Patient Webapp | `https://yourdomain.com` |
| Doctor UI | `https://yourdomain.com/doctor` |
| Patient API Health | `https://yourdomain.com/api/health` |
| Doctor API Health | `https://yourdomain.com/doctor-api/health` |

### 8.3 Test Features

1. **Patient Registration/Login** - Create account at `/`
2. **Doctor Registration/Login** - Create account at `/doctor`
3. **Messaging** - Send messages between patient and doctor
4. **Audio Calls** - Test WebRTC calls (requires HTTPS!)
5. **Health Checkups** - Run through the AI health checkup flow

---

## Updating Code (Future Deployments)

When you push new code to GitHub:

```bash
# SSH into EC2
ssh -i your-key.pem ec2-user@YOUR_EC2_PUBLIC_IP

# Pull latest code
cd ~/my-doctor
git pull

# Install any new dependencies
pnpm install

# Rebuild backends
cd packages/webapp-backend && pnpm build
cd ../doctor-backend && pnpm build

# Rebuild frontends
cd ../webapp && pnpm build
cd ../doctor-ui && pnpm build

# Restart backends
pm2 restart all

# Check logs
pm2 logs --lines 50
```

### Quick Update Script

Create a script for easy updates:

```bash
nano ~/update-mydoctor.sh
```

Paste:

```bash
#!/bin/bash
set -e

echo "🔄 Updating MyDoctor..."

cd ~/my-doctor
git pull

echo "📦 Installing dependencies..."
pnpm install

echo "🔨 Building backends..."
cd packages/webapp-backend && pnpm build
cd ../doctor-backend && pnpm build

echo "🎨 Building frontends..."
cd ../webapp && pnpm build
cd ../doctor-ui && pnpm build

echo "🔄 Restarting services..."
pm2 restart all

echo "✅ Update complete!"
pm2 status
```

Make executable:

```bash
chmod +x ~/update-mydoctor.sh
```

Run updates with:

```bash
~/update-mydoctor.sh
```

---

## Quick Reference Commands

### SSH Access

```bash
ssh -i your-key.pem ec2-user@YOUR_EC2_PUBLIC_IP
```

### PM2 (Backend Process Manager)

| Action | Command |
|--------|---------|
| View status | `pm2 status` |
| View all logs | `pm2 logs` |
| View webapp-backend logs | `pm2 logs webapp-backend` |
| View doctor-backend logs | `pm2 logs doctor-backend` |
| Restart all | `pm2 restart all` |
| Restart one | `pm2 restart webapp-backend` |
| Stop all | `pm2 stop all` |
| Monitor | `pm2 monit` |

### Nginx (Web Server)

| Action | Command |
|--------|---------|
| Status | `sudo systemctl status nginx` |
| Start | `sudo systemctl start nginx` |
| Stop | `sudo systemctl stop nginx` |
| Restart | `sudo systemctl restart nginx` |
| Reload config | `sudo systemctl reload nginx` |
| Test config | `sudo nginx -t` |
| Error logs | `sudo tail -f /var/log/nginx/error.log` |
| Access logs | `sudo tail -f /var/log/nginx/access.log` |

### System

| Action | Command |
|--------|---------|
| Check disk space | `df -h` |
| Check memory | `free -m` |
| Check processes | `htop` or `top` |
| Reboot server | `sudo reboot` |

---

## Troubleshooting

### Backend not starting

```bash
# Check logs
pm2 logs webapp-backend --lines 100
pm2 logs doctor-backend --lines 100

# Common issues:
# - Missing .env.production file
# - MongoDB connection string incorrect
# - Port already in use
# - Build not completed
```

### Nginx 502 Bad Gateway

```bash
# Backend not running
pm2 status
pm2 restart all

# Check if backends are listening
sudo ss -tlnp | grep 3003
sudo ss -tlnp | grep 3004
```

### Nginx 403 Forbidden

```bash
# Permission issue
sudo chmod 755 /home/ec2-user
sudo chmod -R 755 /home/ec2-user/my-doctor

# Check SELinux (Amazon Linux)
sudo setsebool -P httpd_read_user_content 1
```

### MongoDB Connection Failed

1. Check Atlas Network Access - is EC2 IP whitelisted?
2. Verify connection string in `.env.production`
3. Check username/password are correct
4. Ensure database name is in the connection string

### WebRTC Calls Not Working

1. **HTTPS required** - Ensure SSL is set up
2. Check browser console for errors
3. Verify STUN servers are accessible
4. Consider adding TURN server for restrictive networks

### CORS Errors

1. Check CORS variables in `.env.production` files:
   - `webapp-backend`: Uses `CORS_ORIGINS`
   - `doctor-backend`: Uses `DOCTOR_CORS_ORIGIN`
2. Ensure domain matches exactly (with/without www)
3. Use `pm2 delete all && pm2 start ecosystem.config.cjs` to reload env vars (restart alone doesn't work!)

---

## Security Checklist

- [ ] Use strong MongoDB password
- [ ] Generate secure JWT secrets (32+ characters)
- [ ] Store OpenAI API key securely
- [ ] Restrict SSH access to your IP only
- [ ] Set up SSL/HTTPS with Let's Encrypt
- [ ] Use Elastic IP
- [ ] Enable MongoDB Atlas IP whitelist
- [ ] Set `DEBUG_MODE=false` in production
- [ ] Regularly update system: `sudo yum update -y`
- [ ] Set up automated backups for MongoDB
- [ ] Monitor logs for suspicious activity
- [ ] Consider AWS WAF for additional protection

---

## Costs (Approximate)

| Service | Free Tier | Paid |
|---------|-----------|------|
| EC2 t3.micro | 750 hrs/month (1 year) | ~$8/month |
| EC2 t3.small | - | ~$15/month |
| MongoDB Atlas M0 | 512MB forever | - |
| MongoDB Atlas M10 | - | ~$60/month |
| OpenAI API | - | ~$0.002/1K tokens |
| Elastic IP | Free when attached | $3.60/month if unused |
| Data Transfer | 100GB/month | $0.09/GB |
| Domain (.com) | - | ~$12/year |
| SSL Certificate | Free (Let's Encrypt) | - |

**Estimated Monthly Cost (Production):** $15-40/month

---

## Troubleshooting Common Issues

### Backend Won't Start

**Error:** `JWT_ACCESS_SECRET must be set and at least 32 characters in production`

**Solution:** 
- webapp-backend requires `JWT_ACCESS_SECRET` (not `JWT_SECRET`)
- doctor-backend requires `JWT_SECRET` (not `JWT_ACCESS_SECRET`)
- Generate secure secrets: `openssl rand -base64 48`

**Error:** `MongooseServerSelectionError: Could not connect to any servers`

**Solution:**
1. Whitelist EC2 IP in MongoDB Atlas Network Access
2. Verify connection string has correct password
3. Ensure password special characters are URL-encoded

### Frontend Shows 500 Error

**Error:** `Permission denied` in Nginx error logs

**Solution:**
```bash
# Fix directory permissions
chmod 755 /home/ec2-user
chmod -R 755 /home/ec2-user/my-doctor/packages/webapp/dist
chmod -R 755 /home/ec2-user/my-doctor/packages/doctor-ui/dist
sudo systemctl restart nginx
```

### Doctor UI Shows Blank Page

**Error:** Assets loading from `/assets/` instead of `/doctor/assets/`

**Solution:** Already fixed in codebase - ensure you've pulled latest changes:
- `vite.config.ts` has `base: '/doctor/'`
- `main.tsx` has `basename="/doctor"` in BrowserRouter
- Rebuild: `cd packages/doctor-ui && pnpm build`

### Login Doesn't Redirect

**Error:** Doctor UI hitting `/api` instead of `/doctor-api`

**Solution:** Already fixed in codebase - `api.ts` uses `import.meta.env.VITE_API_URL`

Ensure `.env.production` exists:
```bash
echo 'VITE_API_URL=http://YOUR_EC2_IP/doctor-api' > packages/doctor-ui/.env.production
```

### Rate Limit Errors

**Error:** `Too many requests` on login/register

**Solution:**
```bash
pm2 restart all  # Resets rate limiters
```

### CORS Errors in Browser Console

**Solution:** Update backend `.env.production` CORS variables to include your EC2 IP or domain:

**For webapp-backend:**
```env
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

**For doctor-backend:**
```env
DOCTOR_CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com
```

**Critical:** After changing env files, use `pm2 delete all && pm2 start ecosystem.config.cjs` (not just `pm2 restart`!)

### Environment Variables Not Loading in PM2

**Symptoms:** 
- Backend logs show default/old values despite updating `.env.production`
- Example: CORS showing `http://localhost:3005` when you set `https://yourdomain.com`

**Root Cause:** PM2 caches environment variables. Using `pm2 restart` does NOT reload them!

**Solution:**
```bash
cd ~/my-doctor

# Method 1: Delete and restart (cleanest)
pm2 delete all
pm2 start ecosystem.config.cjs

# Method 2: Force reload ecosystem file
pm2 delete all && pm2 start ecosystem.config.cjs --update-env

# Verify env vars are loaded
pm2 logs --lines 20 | grep -i "CORS\|loaded"
```

**Prevention:** Always use `pm2 delete all && pm2 start` when changing `.env.production` files.

---

## Support

For issues with this deployment, check:

```bash
# Backend logs
pm2 logs webapp-backend
pm2 logs doctor-backend

# Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# System logs
sudo journalctl -xe
```

---

*Last updated: January 2026*
