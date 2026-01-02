# 🔐 MyDoctor Authentication System

A production-ready JWT-based authentication system for the MyDoctor webapp.

## Overview

This document describes the authentication architecture implemented for MyDoctor, a health companion web application. The system uses industry-standard security practices including JWT tokens, bcrypt password hashing, token rotation, and rate limiting.

---

## 🏗️ Architecture

### Backend Structure

```
packages/webapp-backend/src/
├── auth/                           # Auth module
│   ├── index.ts                    # Barrel export
│   ├── auth.config.ts              # JWT secrets, token expiry, rate limits
│   ├── auth.types.ts               # TypeScript interfaces
│   ├── auth.routes.ts              # Express routes for /api/auth/*
│   ├── auth.service.ts             # Main business logic
│   ├── auth.middleware.ts          # JWT verification, rate limiting
│   ├── password.service.ts         # bcrypt hashing, validation
│   └── token.service.ts            # JWT generation/verification
│
├── models/
│   ├── user.model.ts               # User schema with auth fields
│   └── refresh-token.model.ts      # Refresh token storage
│
└── server.ts                       # Route protection integration
```

### Frontend Structure

```
packages/webapp/src/
├── auth/                           # Auth module
│   ├── index.ts                    # Barrel export
│   ├── authService.ts              # API calls, token management
│   ├── AuthContext.tsx             # React context for auth state
│   └── ProtectedRoute.tsx          # Route guard component
│
├── pages/
│   ├── LoginPage.tsx               # Email/password login
│   └── RegisterPage.tsx            # User registration
│
└── App.tsx                         # Protected route integration
```

---

## 🔐 Token Strategy

```
┌──────────────────────────────────────────────────────────────────┐
│                        TOKEN FLOW                                 │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  LOGIN                                                           │
│  ┌─────┐    email/password    ┌──────────┐                       │
│  │ App │ ──────────────────▶ │  Server  │                       │
│  └─────┘                      └──────────┘                       │
│     │                              │                             │
│     │      ┌────────────────────────┘                            │
│     │      ▼                                                     │
│     │  ┌──────────────────────────────────────┐                  │
│     │  │ Returns:                              │                  │
│     │  │  - Access Token (15 min, in memory)   │                  │
│     │  │  - Refresh Token (7 days, httpOnly)   │                  │
│     │  └──────────────────────────────────────┘                  │
│     │                                                            │
│  API CALLS                                                       │
│  ┌─────┐   Authorization: Bearer <access_token>  ┌──────────┐    │
│  │ App │ ────────────────────────────────────▶  │  Server  │    │
│  └─────┘                                         └──────────┘    │
│                                                                  │
│  TOKEN REFRESH (automatic when access token expires)             │
│  ┌─────┐   Cookie: refresh_token                 ┌──────────┐    │
│  │ App │ ────────────────────────────────────▶  │  Server  │    │
│  └─────┘   Returns: new access + refresh tokens  └──────────┘    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Why This Approach?

| Token | Storage | Lifetime | Purpose |
|-------|---------|----------|---------|
| Access Token | Memory (React state) | 15 minutes | API authentication |
| Refresh Token | httpOnly Cookie | 7 days | Get new access tokens |

**Benefits:**
- ✅ Access token in memory = XSS can't steal it
- ✅ Refresh token in httpOnly cookie = JavaScript can't access
- ✅ Short access token = Limited damage if stolen
- ✅ Token rotation = Refresh tokens change after use

---

## 📡 API Endpoints

### Auth Routes (`/api/auth/*`)

| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|---------------|
| POST | `/api/auth/register` | Create new account | ❌ |
| POST | `/api/auth/login` | Email/password login | ❌ |
| POST | `/api/auth/logout` | Invalidate current session | ❌ |
| POST | `/api/auth/logout-all` | Logout from all devices | ✅ |
| POST | `/api/auth/refresh` | Get new access token | ❌ (uses cookie) |
| GET | `/api/auth/me` | Get current user | ✅ |
| POST | `/api/auth/check-email` | Check if email exists | ❌ |
| GET | `/api/auth/password-requirements` | Get password rules | ❌ |

### Protected Routes

All routes under `/api/user/*` and `/api/session/*` require authentication via the `Authorization: Bearer <token>` header.

---

## 🔒 Security Features

### Password Security

```typescript
// bcrypt with cost factor 12 (industry standard)
const SALT_ROUNDS = 12;

// Password requirements
const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: false, // Optional for better UX
};
```

### Rate Limiting

```typescript
// Login attempts
const LOGIN_RATE_LIMIT = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxAttempts: 5,           // 5 attempts per window
};

// Account lockout
const ACCOUNT_LOCKOUT = {
  threshold: 10,            // Lock after 10 failed attempts
  duration: 30 * 60 * 1000, // 30 minute lockout
};
```

### Token Rotation & Reuse Detection

When a refresh token is used:
1. The old token is marked as "used"
2. A new refresh token is issued
3. If someone tries to reuse an old token, **all tokens for that user are revoked** (security feature to detect token theft)

---

## 🔧 Configuration

### Environment Variables

Add these to `packages/webapp-backend/.env`:

```env
# JWT Secrets (REQUIRED in production - minimum 32 characters)
JWT_ACCESS_SECRET=your-super-secret-access-token-key-here-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-token-key-here-min-32-chars

# Existing variables
MONGODB_URI=mongodb://localhost:27017/mydoctor
PORT=3003
```

> ⚠️ **Important:** In production, the server will refuse to start if JWT secrets are missing or too short.

### Generate Secure Secrets

```bash
# Generate random 64-character secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🚀 Usage

### Backend

```typescript
// Routes are automatically protected via middleware in server.ts

// Access authenticated user in route handlers:
router.get('/profile', (req, res) => {
  const userId = (req as AuthenticatedRequest).user?.userId;
  // ... fetch user data
});
```

### Frontend

```tsx
import { useAuth, ProtectedRoute } from './auth';

// In components
function Dashboard() {
  const { user, logout, isAuthenticated } = useAuth();
  
  return (
    <div>
      <h1>Welcome, {user?.name}</h1>
      <button onClick={logout}>Sign Out</button>
    </div>
  );
}

// In App.tsx - protect routes
<Route path="/dashboard" element={
  <ProtectedRoute>
    <DashboardPage />
  </ProtectedRoute>
} />
```

### Making Authenticated API Calls

```typescript
import { authFetch } from './auth';

// authFetch automatically:
// - Adds Authorization header
// - Refreshes token if expired
// - Retries failed requests after refresh

const profile = await authFetch('/api/user/me/profile');
```

---

## 📱 User Flows

### New User Registration

```
Register Page → Create Account → Profile Setup → Dashboard
```

### Returning User Login

```
Login Page → Sign In → Dashboard
              ↓ (if forgot password)
       Forgot Password → Email → Reset Password → Login
```

### Session Restoration

When a user returns to the app:
1. Frontend checks for refresh token cookie
2. If present, calls `/api/auth/refresh`
3. If successful, user is automatically logged in
4. If failed, user is redirected to login

---

## 🧪 Testing

### Start Development Servers

```bash
# Terminal 1: Backend
cd packages/webapp-backend
pnpm dev

# Terminal 2: Frontend
cd packages/webapp
pnpm dev
```

### Test Registration

1. Visit `http://localhost:3000/register`
2. Fill in name, email, password
3. Click "Create Account"
4. You should be redirected to profile setup

### Test Login

1. Visit `http://localhost:3000/login`
2. Enter registered email and password
3. Click "Sign In"
4. You should be redirected to dashboard

### Test with cURL

```bash
# Register
curl -X POST http://localhost:3003/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234","name":"Test User"}'

# Login
curl -X POST http://localhost:3003/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"test@example.com","password":"Test1234"}'

# Access protected route
curl http://localhost:3003/api/auth/me \
  -H "Authorization: Bearer <access_token_from_login>"

# Refresh token
curl -X POST http://localhost:3003/api/auth/refresh \
  -b cookies.txt \
  -c cookies.txt
```

---

## 🔮 Future Enhancements (Phase 2+)

- [ ] Email verification
- [ ] Password reset flow
- [ ] OAuth providers (Google, Apple)
- [ ] Two-Factor Authentication (2FA/MFA)
- [ ] Magic link login
- [ ] Session management UI (view/revoke devices)

---

## 📚 Dependencies

### Backend
- `bcrypt` - Password hashing
- `jsonwebtoken` - JWT generation/verification
- `cookie-parser` - Parse cookies for refresh token
- `express-rate-limit` - Rate limiting
- `zod` - Request validation
- `uuid` - Generate unique token IDs

### Frontend
- React Context API - State management
- React Router - Protected routes
- Fetch API - HTTP requests

---

## 🛡️ Security Checklist

- [x] Passwords hashed with bcrypt (cost factor 12)
- [x] JWT tokens with appropriate expiry
- [x] Refresh token rotation
- [x] Token reuse detection
- [x] Rate limiting on auth endpoints
- [x] Account lockout after failed attempts
- [x] httpOnly cookies for refresh tokens
- [x] CORS properly configured
- [x] Input validation with Zod
- [x] Protected routes on backend
- [x] Protected routes on frontend
- [ ] HTTPS enforcement (deploy-time)
- [ ] Email verification (Phase 2)
- [ ] 2FA/MFA (Phase 2)

