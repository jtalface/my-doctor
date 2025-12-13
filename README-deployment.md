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
8. [Part 6: Start Backend with PM2](#part-6-start-backend-with-pm2)
9. [Part 7: Verify Deployment](#part-7-verify-deployment)
10. [Updating Code](#updating-code-future-deployments)
11. [Quick Reference Commands](#quick-reference-commands)
12. [Troubleshooting](#troubleshooting)
13. [Security Checklist](#security-checklist)
14. [Costs](#costs-approximate)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    USERS (Browser)                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    AWS EC2 Instance                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                    NGINX (:80)                        │  │
│  │  ┌─────────────────┐    ┌───────────────────────────┐ │  │
│  │  │  /              │    │  /api                     │ │  │
│  │  │  React Frontend │    │  → localhost:3002         │ │  │
│  │  │  (Static Files) │    │  (Express + Node.js)      │ │  │
│  │  └─────────────────┘    └───────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                    │                           │
                    ▼                           ▼
     ┌─────────────────────────┐  ┌─────────────────────────┐
     │     MongoDB Atlas       │  │      OpenAI API         │
     │     (Cloud Database)    │  │      (ChatGPT LLM)      │
     └─────────────────────────┘  └─────────────────────────┘
```

---

## Prerequisites

- AWS Account
- MongoDB Atlas Account
- OpenAI API Key
- Domain name (optional, for HTTPS)

---

## Part 1: AWS EC2 Setup

### 1.1 Launch EC2 Instance

1. Go to **AWS Console** → **EC2** → **Launch Instance**
2. Configure:
   - **Name:** `mydoctor-server`
   - **AMI:** Amazon Linux 2023
   - **Instance Type:** t3.small (or t3.micro for testing)
   - **Key Pair:** Create or select existing (.pem file)
   - **Storage:** 20 GB gp3

3. **Security Group** - Create new with these inbound rules:

| Type | Port | Source | Description |
|------|------|--------|-------------|
| SSH | 22 | Your IP | SSH access |
| HTTP | 80 | 0.0.0.0/0 | Web traffic |
| Custom TCP | 3002 | 0.0.0.0/0 | API direct access (optional) |

4. Click **Launch Instance**

### 1.2 Connect to EC2

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

# Install Git (if not present)
sudo yum install git -y

# Verify installations
node --version    # Should show v20.x.x
pnpm --version    # Should show 8.x.x or higher
pm2 --version     # Should show 5.x.x
nginx -v          # Should show nginx/1.x.x
```

---

## Part 3: Clone and Build Project

### 3.1 Clone Repository

```bash
cd ~
git clone https://github.com/YOUR_USERNAME/my-doctor.git
cd my-doctor
pnpm install
```

### 3.2 Create Production Environment File

```bash
nano ~/my-doctor/packages/backend/.env.production
```

Paste the following (replace with your actual values):

```env
# Server
PORT=3002

# MongoDB Atlas (replace with your connection string)
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/mydoctor?retryWrites=true&w=majority

# LLM Provider
DEFAULT_LLM_PROVIDER=openai

# LM Studio (not used in production, but required)
LM_STUDIO_URL=http://localhost:1235/v1
LM_STUDIO_MODEL=meditron-7b
LM_STUDIO_TIMEOUT=30000

# OpenAI (replace with your API key)
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_MODEL=gpt-4o-mini
OPENAI_TIMEOUT=30000

# Debug
DEBUG_MODE=false

# CORS (add your frontend URLs)
CORS_ORIGINS=http://localhost:1234,http://YOUR_EC2_PUBLIC_IP
```

Save: `Ctrl+O`, then `Enter`, then `Ctrl+X`

### 3.3 Build Backend

```bash
cd ~/my-doctor/packages/backend
pnpm build
```

### 3.4 Build Frontend

```bash
cd ~/my-doctor/packages/app
pnpm build
```

---

## Part 4: MongoDB Atlas Setup

### 4.1 Create Atlas Account and Cluster

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com)
2. Sign up or log in
3. Click **"Build a Database"**
4. Select **M0 FREE** tier
5. Choose **AWS** as provider
6. Select a region close to your EC2
7. Name your cluster (e.g., `mydoctor-cluster`)
8. Click **Create**

### 4.2 Create Database User

1. Go to **Database Access** in sidebar
2. Click **Add New Database User**
3. Choose **Password** authentication
4. Enter username and password
5. Set privileges to **Read and write to any database**
6. Click **Add User**

### 4.3 Whitelist EC2 IP Address

1. Go to **Network Access** in sidebar
2. Click **Add IP Address**
3. Enter your EC2's public IP address
4. Add comment: "EC2 Production Server"
5. Click **Confirm**

> ⚠️ For testing, you can use `0.0.0.0/0` (allow all), but this is less secure.

### 4.4 Get Connection String

1. Go to **Database** → Click **Connect**
2. Choose **Connect your application**
3. Copy the connection string
4. Replace `<password>` with your actual password
5. Add database name before the `?`: `.../mydoctor?retryWrites=true`

---

## Part 5: Configure Nginx

### 5.1 Create Nginx Configuration

```bash
sudo nano /etc/nginx/conf.d/mydoctor.conf
```

Paste:

```nginx
server {
    listen 80;
    server_name YOUR_EC2_PUBLIC_IP;

    # Frontend (static files)
    location / {
        root /home/ec2-user/my-doctor/packages/app/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # API proxy to backend
    location /api {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Replace `YOUR_EC2_PUBLIC_IP` with your actual EC2 public IP.

### 5.2 Fix File Permissions

Nginx needs permission to read the frontend files:

```bash
sudo chmod 755 /home/ec2-user
sudo chmod -R 755 /home/ec2-user/my-doctor
sudo usermod -a -G ec2-user nginx
```

### 5.3 Test and Start Nginx

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

## Part 6: Start Backend with PM2

### 6.1 Start the Backend Server

```bash
cd ~/my-doctor/packages/backend
NODE_ENV=production pm2 start dist/server.js --name mydoctor-api
```

### 6.2 Configure PM2 Auto-Restart

```bash
# Save current PM2 process list
pm2 save

# Generate startup script
pm2 startup

# Copy and run the command it outputs (looks like):
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ec2-user --hp /home/ec2-user
```

### 6.3 Verify PM2 Status

```bash
pm2 status
pm2 logs mydoctor-api
```

---

## Part 7: Verify Deployment

### 7.1 Check All Services

```bash
# Check PM2 (backend)
pm2 status

# Check Nginx
sudo systemctl status nginx

# Test backend locally
curl http://localhost:3002/api/health

# Test via Nginx
curl http://localhost/api/health
```

### 7.2 Access Your Application

Open in browser:

| Endpoint | URL |
|----------|-----|
| Frontend | `http://YOUR_EC2_PUBLIC_IP` |
| API Health | `http://YOUR_EC2_PUBLIC_IP/api/health` |
| LLM Providers | `http://YOUR_EC2_PUBLIC_IP/api/llm/providers` |

---

## Updating Code (Future Deployments)

When you push new code to GitHub:

```bash
# SSH into EC2
ssh -i your-key.pem ec2-user@YOUR_EC2_PUBLIC_IP

# Pull latest code
cd ~/my-doctor
git pull

# Rebuild frontend (if changed)
cd packages/app
pnpm build

# Rebuild backend (if changed)
cd ../backend
pnpm build

# Restart backend
pm2 restart mydoctor-api

# Check logs
pm2 logs mydoctor-api --lines 50
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
| View logs | `pm2 logs mydoctor-api` |
| Restart | `pm2 restart mydoctor-api` |
| Stop | `pm2 stop mydoctor-api` |
| Delete | `pm2 delete mydoctor-api` |
| Monitor | `pm2 monit` |

### Nginx (Web Server)

| Action | Command |
|--------|---------|
| Status | `sudo systemctl status nginx` |
| Start | `sudo systemctl start nginx` |
| Stop | `sudo systemctl stop nginx` |
| Restart | `sudo systemctl restart nginx` |
| Test config | `sudo nginx -t` |
| View error logs | `sudo tail -f /var/log/nginx/error.log` |
| View access logs | `sudo tail -f /var/log/nginx/access.log` |

### System

| Action | Command |
|--------|---------|
| Check disk space | `df -h` |
| Check memory | `free -m` |
| Check running processes | `htop` or `top` |
| Reboot server | `sudo reboot` |

---

## Troubleshooting

### Backend not starting

```bash
# Check logs
pm2 logs mydoctor-api --lines 100

# Common issues:
# - Missing .env.production file
# - MongoDB connection string incorrect
# - Port already in use
```

### Nginx 502 Bad Gateway

```bash
# Backend not running
pm2 status
pm2 restart mydoctor-api

# Check if backend is listening
sudo ss -tlnp | grep 3002
```

### Nginx 500 Internal Error

```bash
# Check error logs
sudo tail -50 /var/log/nginx/error.log

# Usually permission issue - run:
sudo chmod 755 /home/ec2-user
sudo chmod -R 755 /home/ec2-user/my-doctor
```

### MongoDB Connection Failed

1. Check Atlas Network Access - is EC2 IP whitelisted?
2. Verify connection string in `.env.production`
3. Check username/password are correct

### Cannot Access from Browser

1. Check EC2 Security Group has port 80 open
2. Turn off VPN (can interfere with connections)
3. Try: `curl http://YOUR_EC2_IP/api/health`

---

## Security Checklist

- [ ] Use strong MongoDB password
- [ ] Store OpenAI API key securely (never commit to git)
- [ ] Restrict SSH access to your IP only
- [ ] Set up SSL/HTTPS with Let's Encrypt
- [ ] Use Elastic IP (so IP doesn't change on reboot)
- [ ] Enable MongoDB Atlas IP whitelist (not 0.0.0.0/0)
- [ ] Regularly update system packages (`sudo yum update -y`)
- [ ] Set up automated backups for MongoDB
- [ ] Monitor logs for suspicious activity

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

**Estimated Monthly Cost (Production):** $10-30/month

---

## Next Steps (Optional Enhancements)

1. **Set up HTTPS with Let's Encrypt**
   ```bash
   sudo yum install certbot python3-certbot-nginx -y
   sudo certbot --nginx -d yourdomain.com
   ```

2. **Use a Custom Domain**
   - Buy domain from Route 53, Namecheap, etc.
   - Point A record to EC2 IP
   - Update Nginx `server_name`

3. **Set up Elastic IP**
   - EC2 → Elastic IPs → Allocate
   - Associate with your instance
   - Update DNS and configs

4. **Enable CloudWatch Monitoring**
   - Monitor CPU, memory, disk
   - Set up alarms for issues

5. **Set up CI/CD with GitHub Actions**
   - Auto-deploy on push to main
   - Run tests before deploying

---

## Support

For issues with this deployment, check:
- PM2 logs: `pm2 logs mydoctor-api`
- Nginx logs: `sudo tail -f /var/log/nginx/error.log`
- System logs: `sudo journalctl -xe`

---

*Last updated: December 2024*

