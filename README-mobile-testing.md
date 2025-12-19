# Running MyDoctor on Your Phone (Local Network Testing)

This guide explains how to run the MyDoctor webapp on your phone for testing during development.

## Prerequisites

- Node.js and pnpm installed
- MongoDB running locally
- Your phone and computer on the **same WiFi network**

---

## Step 1: Find Your Computer's IP Address

```bash
# On macOS
ipconfig getifaddr en0

# On Linux
hostname -I | awk '{print $1}'

# On Windows (PowerShell)
(Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias Wi-Fi).IPAddress
```

Note your IP address (e.g., `192.168.86.249`). You'll need it for the next steps.

---

## Step 2: Configure the Frontend

Create a `.env.local` file in the webapp package to point to your computer's IP:

```bash
# Replace YOUR_IP with your actual IP address
echo 'VITE_API_URL=http://YOUR_IP:3003' > packages/webapp/.env.local

# Example:
echo 'VITE_API_URL=http://192.168.86.249:3003' > packages/webapp/.env.local
```

Alternatively, you can edit `packages/webapp/src/services/api.ts` and change the fallback URL:

```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://YOUR_IP:3003';
```

---

## Step 3: Configure the Backend CORS

Create a `.env.local` file in the webapp-backend package to allow your phone's requests:

```bash
# Replace YOUR_IP with your actual IP address
echo 'CORS_ORIGINS=http://localhost:3000,http://localhost:5173,http://YOUR_IP:3000
DEBUG_MODE=true' > packages/webapp-backend/.env.local

# Example:
echo 'CORS_ORIGINS=http://localhost:3000,http://localhost:5173,http://192.168.86.249:3000
DEBUG_MODE=true' > packages/webapp-backend/.env.local
```

> **Note**: The backend server (`packages/webapp-backend/src/server.ts`) is already configured to listen on `0.0.0.0` which allows network access. It also has dynamic CORS that allows any `192.168.x.x` origin when `DEBUG_MODE=true`.

---

## Step 4: Start the Backend

```bash
cd packages/webapp-backend
pnpm dev
```

You should see output like:
```
==================================================
  MyDoctor Webapp Backend
  Port: 3003
  Environment: development
  Debug: true
==================================================
```

---

## Step 5: Start the Frontend with Network Access

```bash
cd packages/webapp
pnpm dev:host
```

Or alternatively:
```bash
pnpm dev -- --host
```

You should see output like:
```
  VITE v5.x.x  ready in XXX ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: http://192.168.86.249:3000/
```

---

## Step 6: Access on Your Phone

1. Open your phone's browser (Safari on iPhone, Chrome on Android)
2. Navigate to the **Network URL** shown in the terminal (e.g., `http://192.168.86.249:3000`)
3. The app should load and work just like on your computer!

---

## Step 7: Install as a PWA (Optional)

The app is configured as a Progressive Web App (PWA), so you can install it on your home screen:

### iPhone (Safari)
1. Tap the **Share** button (□↑)
2. Scroll down and tap **"Add to Home Screen"**
3. Tap **"Add"**

### Android (Chrome)
1. Tap the **three-dot menu** (⋮)
2. Tap **"Add to Home Screen"** or **"Install app"**
3. Confirm the installation

The app will now appear on your home screen with the MyDoctor icon and open in full-screen mode.

---

## Troubleshooting

### "Failed to sign in" or Network Errors

**Cause**: CORS is blocking requests from your phone.

**Solution**: 
1. Make sure `.env.local` exists in `packages/webapp-backend/` with your IP in `CORS_ORIGINS`
2. Restart the backend: `pnpm dev`
3. Check the backend logs for `[CORS] Blocked origin:` messages

### Cannot Connect to Backend

**Cause**: Backend not accessible from the network.

**Solution**:
1. Verify the backend is running on port 3003: `lsof -i:3003`
2. Test from your computer: `curl http://YOUR_IP:3003/api/health`
3. Check your firewall settings

### App Uses Wrong API URL

**Cause**: Frontend using `localhost` instead of your IP.

**Solution**:
1. Verify `.env.local` exists in `packages/webapp/`
2. Restart the frontend (Vite needs restart to pick up new env files)
3. Check the browser console for `[API] Using API URL:` log

### Phone Can't Reach Computer

**Cause**: Devices not on the same network, or firewall blocking.

**Solution**:
1. Confirm both devices are on the same WiFi network
2. Try pinging your computer from another device
3. Temporarily disable firewall to test

---

## Quick Start Script

For convenience, you can create a script to start everything:

```bash
#!/bin/bash
# start-mobile-dev.sh

# Get local IP
IP=$(ipconfig getifaddr en0 2>/dev/null || hostname -I | awk '{print $1}')
echo "Your IP: $IP"

# Create env files
echo "VITE_API_URL=http://$IP:3003" > packages/webapp/.env.local
echo "CORS_ORIGINS=http://localhost:3000,http://$IP:3000
DEBUG_MODE=true" > packages/webapp-backend/.env.local

echo "Environment configured for IP: $IP"
echo ""
echo "Now run in separate terminals:"
echo "  Terminal 1: cd packages/webapp-backend && pnpm dev"
echo "  Terminal 2: cd packages/webapp && pnpm dev:host"
echo ""
echo "Then open on your phone: http://$IP:3000"
```

---

## File Reference

| File | Purpose |
|------|---------|
| `packages/webapp/.env.local` | Frontend API URL configuration |
| `packages/webapp-backend/.env.local` | Backend CORS and debug settings |
| `packages/webapp/public/manifest.json` | PWA configuration |
| `packages/webapp/vite.config.ts` | Vite config with PWA plugin |

---

## Notes

- The `.env.local` files are gitignored and won't be committed
- Your IP address may change if you reconnect to WiFi
- For production deployment, see `README-deployment.md`

