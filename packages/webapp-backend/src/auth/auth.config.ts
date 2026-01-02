/**
 * Authentication Configuration
 * 
 * Contains all auth-related settings including JWT secrets, token expiry,
 * password requirements, and rate limiting configuration.
 */

// Load from environment variables with secure defaults
export const authConfig = {
  /**
   * JWT Configuration
   */
  jwt: {
    // Secret for signing access tokens - MUST be set in production
    accessSecret: process.env.JWT_ACCESS_SECRET || 'dev-access-secret-change-in-production',
    // Secret for signing refresh tokens - MUST be set in production
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-in-production',
    // Access token expiry (short-lived for security)
    accessExpiresIn: '15m',
    // Refresh token expiry (longer-lived, stored in httpOnly cookie)
    refreshExpiresIn: '7d',
    // Token algorithm
    algorithm: 'HS256' as const,
  },

  /**
   * Password Requirements
   */
  password: {
    minLength: 8,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumber: true,
    requireSpecial: false, // Better UX, still secure with other requirements
    // bcrypt salt rounds (12 is industry standard, ~250ms to hash)
    saltRounds: 12,
  },

  /**
   * Rate Limiting Configuration
   */
  rateLimit: {
    // Login attempts
    login: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxAttempts: 5,          // 5 attempts per window
    },
    // Registration attempts
    register: {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxAttempts: 3,           // 3 registrations per hour per IP
    },
    // Password reset requests
    passwordReset: {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxAttempts: 3,           // 3 reset requests per hour
    },
  },

  /**
   * Cookie Configuration
   */
  cookie: {
    name: 'mydoctor_refresh_token',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'lax' as const,
    path: '/api/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  },

  /**
   * Account Security
   */
  account: {
    // Lock account after this many failed attempts
    lockoutThreshold: 10,
    // Lockout duration in milliseconds (30 minutes)
    lockoutDuration: 30 * 60 * 1000,
  },
} as const;

// Validate critical environment variables in production
if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_ACCESS_SECRET || process.env.JWT_ACCESS_SECRET.length < 32) {
    throw new Error('JWT_ACCESS_SECRET must be set and at least 32 characters in production');
  }
  if (!process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET.length < 32) {
    throw new Error('JWT_REFRESH_SECRET must be set and at least 32 characters in production');
  }
}

export type AuthConfig = typeof authConfig;

