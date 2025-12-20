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

```bash
sudo nano /etc/nginx/conf.d/mydoctor.conf
```

Replace the entire contents with:

```nginx
server {
    listen 80;
    server_name YOUR_EC2_PUBLIC_IP;

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

    # API proxy to webapp-backend
    location /api {
        proxy_pass http://localhost:3003;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support (if needed)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # PWA manifest and service worker
    location /manifest.json {
        root /home/ec2-user/my-doctor/packages/webapp/dist;
        add_header Cache-Control "no-cache";
    }
    
    location /sw.js {
        root /home/ec2-user/my-doctor/packages/webapp/dist;
        add_header Cache-Control "no-cache";
    }
}
```

Replace `YOUR_EC2_PUBLIC_IP` with your actual EC2 public IP.

Test and restart Nginx:

```bash
sudo nginx -t
sudo systemctl restart nginx
```

---

## Step 7: Start Webapp Backend with PM2

```bash
cd ~/my-doctor/packages/webapp-backend
NODE_ENV=production pm2 start dist/server.js --name mydoctor-webapp-api
```

Save the PM2 configuration:

```bash
pm2 save
```

---

## Step 8: Verify Deployment

### Check PM2 Status

```bash
pm2 status
```

You should see:
```
┌─────────────────────┬────┬─────────┬──────┐
│ name                │ id │ status  │ cpu  │
├─────────────────────┼────┼─────────┼──────┤
│ mydoctor-api        │ 0  │ online  │ 0%   │
│ mydoctor-webapp-api │ 1  │ online  │ 0%   │
└─────────────────────┴────┴─────────┴──────┘
```

### Test Endpoints

```bash
# Test webapp backend health
curl http://localhost:3003/api/health

# Test via Nginx
curl http://YOUR_EC2_PUBLIC_IP/api/health
```

### Access from Browser/Phone

Open in your browser or phone:

| Endpoint | URL |
|----------|-----|
| Webapp | `http://YOUR_EC2_PUBLIC_IP` |
| API Health | `http://YOUR_EC2_PUBLIC_IP/api/health` |

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

