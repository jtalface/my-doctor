# Deploying MyDoctor Webapp to AWS EC2

This guide extends the main deployment to add the new webapp and webapp-backend packages.

---

## Prerequisites

- EC2 instance already running (from README-deployment.md)
- SSH access to your EC2 instance
- The latest code pushed to GitHub

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    AWS EC2 Instance                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                    NGINX (:80)                        │  │
│  │  ┌─────────────────┐    ┌───────────────────────────┐ │  │
│  │  │  /              │    │  /api                     │ │  │
│  │  │  Webapp         │    │  → localhost:3003         │ │  │
│  │  │  (Static Files) │    │  (webapp-backend)         │ │  │
│  │  └─────────────────┘    └───────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Step 1: SSH into EC2

```bash
ssh -i your-key.pem ec2-user@YOUR_EC2_PUBLIC_IP
```

---

## Step 2: Pull Latest Code

```bash
cd ~/my-doctor
git pull origin main
pnpm install
```

---

## Step 3: Create Webapp Backend Environment File

```bash
nano ~/my-doctor/packages/webapp-backend/.env.production
```

Paste the following (replace with your actual values):

```env
# Server
PORT=3003
NODE_ENV=production

# MongoDB Atlas (same as main backend)
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/mydoctor?retryWrites=true&w=majority

# LLM Provider
DEFAULT_LLM_PROVIDER=openai

# LM Studio (not used in production)
LM_STUDIO_URL=http://localhost:1235/v1
LM_STUDIO_MODEL=meditron-7b
LM_STUDIO_TIMEOUT=30000

# OpenAI
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_MODEL=gpt-4o-mini
OPENAI_TIMEOUT=30000

# Debug (set to false in production)
DEBUG_MODE=false

# CORS - add your EC2 IP and domain
CORS_ORIGINS=http://YOUR_EC2_PUBLIC_IP,https://YOUR_DOMAIN
```

Save: `Ctrl+O`, `Enter`, `Ctrl+X`

---

## Step 4: Build Webapp Backend

```bash
cd ~/my-doctor/packages/webapp-backend
pnpm build
```

---

## Step 5: Build Webapp Frontend

First, create a production environment file for the frontend:

```bash
nano ~/my-doctor/packages/webapp/.env.production
```

Paste:

```env
# API URL - point to your EC2 (via Nginx proxy)
VITE_API_URL=http://YOUR_EC2_PUBLIC_IP/api
```

> Note: If you have HTTPS set up, use `https://` instead.

Save and exit, then build:

```bash
cd ~/my-doctor/packages/webapp
pnpm build
```

---

## Step 6: Update Nginx Configuration

You have two options:

### Option A: Replace Old App with Webapp (Simple)

Use this if you only want the new webapp.

```bash
sudo nano /etc/nginx/conf.d/mydoctor.conf
```

```nginx
server {
    listen 80;
    server_name YOUR_EC2_PUBLIC_IP;

    # Webapp Frontend (static files)
    location / {
        root /home/ec2-user/my-doctor/packages/webapp/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # API proxy to webapp-backend (port 3003)
    location /api {
        proxy_pass http://localhost:3003;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

### Option B: Run Both Apps Simultaneously (Recommended)

Use this to keep both the old app and new webapp running:

```bash
sudo nano /etc/nginx/conf.d/mydoctor.conf
```

```nginx
server {
    listen 80;
    server_name YOUR_EC2_PUBLIC_IP;

    # ===========================================
    # NEW WEBAPP (default - root path)
    # ===========================================
    
    # Webapp Frontend (static files)
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

    # Webapp API proxy (port 3003)
    location /api {
        proxy_pass http://localhost:3003;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # PWA files
    location /manifest.json {
        root /home/ec2-user/my-doctor/packages/webapp/dist;
        add_header Cache-Control "no-cache";
    }
    
    location /sw.js {
        root /home/ec2-user/my-doctor/packages/webapp/dist;
        add_header Cache-Control "no-cache";
    }

    # ===========================================
    # OLD APP (accessible via /v1 path)
    # ===========================================
    
    # Old App Frontend (static files)
    location /v1 {
        alias /home/ec2-user/my-doctor/packages/app/dist;
        index index.html;
        try_files $uri $uri/ /v1/index.html;
    }

    # Old App API proxy (port 3002)
    location /v1/api {
        rewrite ^/v1/api(.*)$ /api$1 break;
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

With this configuration:
- **New Webapp**: `http://YOUR_EC2_IP/` → webapp + webapp-backend (port 3003)
- **Old App**: `http://YOUR_EC2_IP/v1/` → app + backend (port 3002)

---

### Option C: Use Different Ports

If you prefer accessing each app on a different port:

```nginx
# New Webapp on port 80
server {
    listen 80;
    server_name YOUR_EC2_PUBLIC_IP;

    location / {
        root /home/ec2-user/my-doctor/packages/webapp/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3003;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Old App on port 8080
server {
    listen 8080;
    server_name YOUR_EC2_PUBLIC_IP;

    location / {
        root /home/ec2-user/my-doctor/packages/app/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

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

With this configuration:
- **New Webapp**: `http://YOUR_EC2_IP/` (port 80)
- **Old App**: `http://YOUR_EC2_IP:8080/` (port 8080)

> ⚠️ Don't forget to add port 8080 to your EC2 Security Group if using Option C!

---

### Apply Configuration

After editing, test and restart Nginx:

```bash
sudo nginx -t
sudo systemctl restart nginx
```

---

## Step 7: Start Backends with PM2

### Start Webapp Backend (port 3003)

```bash
cd ~/my-doctor/packages/webapp-backend
NODE_ENV=production pm2 start dist/server.js --name mydoctor-webapp-api
```

### Start Old Backend (port 3002) - if running both apps

```bash
cd ~/my-doctor/packages/backend
NODE_ENV=production pm2 start dist/server.js --name mydoctor-api
```

### Save PM2 Configuration

```bash
pm2 save
```

### Verify Both Are Running

```bash
pm2 status
```

Expected output:
```
┌─────────────────────┬────┬─────────┬──────┬───────┐
│ name                │ id │ status  │ cpu  │ port  │
├─────────────────────┼────┼─────────┼──────┼───────┤
│ mydoctor-api        │ 0  │ online  │ 0%   │ 3002  │
│ mydoctor-webapp-api │ 1  │ online  │ 0%   │ 3003  │
└─────────────────────┴────┴─────────┴──────┴───────┘
```

---

## Step 8: Verify Deployment

### Check PM2 Status

```bash
pm2 status
```

### Test Endpoints

```bash
# Test webapp-backend (port 3003)
curl http://localhost:3003/api/health

# Test old backend (port 3002)
curl http://localhost:3002/api/health

# Test webapp via Nginx
curl http://YOUR_EC2_PUBLIC_IP/api/health

# Test old app via Nginx (if using Option B with /v1 path)
curl http://YOUR_EC2_PUBLIC_IP/v1/api/health
```

### Access from Browser/Phone

| App | URL | Backend Port |
|-----|-----|--------------|
| **New Webapp** | `http://YOUR_EC2_PUBLIC_IP/` | 3003 |
| **Old App (Option B)** | `http://YOUR_EC2_PUBLIC_IP/v1/` | 3002 |
| **Old App (Option C)** | `http://YOUR_EC2_PUBLIC_IP:8080/` | 3002 |

---

## Step 9: Install as PWA on Your Phone

1. Open `http://YOUR_EC2_PUBLIC_IP` on your phone
2. **iPhone (Safari)**: Tap Share → "Add to Home Screen"
3. **Android (Chrome)**: Tap menu → "Install app" or "Add to Home Screen"

The app will now work from anywhere, not just your local network!

---

## Updating the Webapp (Future Deployments)

```bash
# SSH into EC2
ssh -i your-key.pem ec2-user@YOUR_EC2_PUBLIC_IP

# Pull latest code
cd ~/my-doctor
git pull origin main

# Rebuild webapp frontend
cd packages/webapp
pnpm build

# Rebuild webapp backend (if changed)
cd ../webapp-backend
pnpm build

# Restart webapp backend
pm2 restart mydoctor-webapp-api

# Check logs
pm2 logs mydoctor-webapp-api --lines 50
```

---

## Quick Commands Reference

### PM2 Commands

```bash
# View all processes
pm2 status

# View webapp-backend logs
pm2 logs mydoctor-webapp-api

# Restart webapp-backend
pm2 restart mydoctor-webapp-api

# Stop webapp-backend
pm2 stop mydoctor-webapp-api
```

### Nginx Commands

```bash
# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# View error logs
sudo tail -f /var/log/nginx/error.log
```

---

## Troubleshooting

### "Failed to sign in" or API errors

1. Check webapp-backend is running:
   ```bash
   pm2 status
   curl http://localhost:3003/api/health
   ```

2. Check Nginx is proxying correctly:
   ```bash
   curl http://YOUR_EC2_PUBLIC_IP/api/health
   ```

3. Check CORS settings in `.env.production`

### 502 Bad Gateway

Backend not running:
```bash
pm2 restart mydoctor-webapp-api
pm2 logs mydoctor-webapp-api
```

### 403 Forbidden

Permission issue:
```bash
sudo chmod 755 /home/ec2-user
sudo chmod -R 755 /home/ec2-user/my-doctor/packages/webapp/dist
```

### PWA not installing

- Make sure you're accessing via HTTP (not HTTPS) or have valid SSL
- Check that `/manifest.json` is accessible
- Clear browser cache and try again

---

## Optional: Enable HTTPS

For PWA to work best and for security, enable HTTPS:

```bash
# Install Certbot
sudo yum install certbot python3-certbot-nginx -y

# Get SSL certificate (requires a domain name)
sudo certbot --nginx -d yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 0 * * * certbot renew --quiet
```

Update your `.env.production` files to use `https://` URLs.

---

## Security Group Settings

Make sure your EC2 Security Group allows:

| Type | Port | Source | Description |
|------|------|--------|-------------|
| SSH | 22 | Your IP | SSH access |
| HTTP | 80 | 0.0.0.0/0 | Web traffic |
| HTTPS | 443 | 0.0.0.0/0 | Secure web traffic (if using SSL) |

---

*Last updated: December 2024*

