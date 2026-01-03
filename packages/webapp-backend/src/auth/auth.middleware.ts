/**
 * Auth Middleware
 * 
 * Express middleware for authentication and authorization.
 * Includes JWT verification and rate limiting.
 */

import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { tokenService } from './token.service.js';
import { authConfig } from './auth.config.js';
import { AuthenticatedRequest, AuthError, AuthErrorCode } from './auth.types.js';

// Check if we're in development mode
const isDev = process.env.NODE_ENV !== 'production';

/**
 * Middleware to verify JWT access token
 * Adds user info to request if valid
 */
export function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthError(
        AuthErrorCode.INVALID_TOKEN,
        'No authorization token provided',
        401
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const payload = tokenService.verifyAccessToken(token);

    // Add user info to request
    req.user = {
      userId: payload.userId,
      email: payload.email,
    };

    next();
  } catch (error) {
    if (error instanceof AuthError) {
      res.status(error.statusCode).json({
        error: error.code,
        message: error.message,
      });
      return;
    }
    res.status(401).json({
      error: AuthErrorCode.INVALID_TOKEN,
      message: 'Invalid or expired token',
    });
  }
}

/**
 * Middleware to optionally authenticate (doesn't fail if no token)
 * Useful for routes that work for both authenticated and anonymous users
 */
export function optionalAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = tokenService.verifyAccessToken(token);
      req.user = {
        userId: payload.userId,
        email: payload.email,
      };
    }
  } catch (error) {
    // Ignore errors - just proceed without user
  }
  next();
}

/**
 * Rate limiter for login attempts
 * Disabled in development for easier testing
 */
export const loginRateLimiter = rateLimit({
  windowMs: authConfig.rateLimit.login.windowMs,
  max: isDev ? 100 : authConfig.rateLimit.login.maxAttempts,
  message: {
    error: AuthErrorCode.RATE_LIMITED,
    message: 'Too many login attempts. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    // Rate limit by IP + email (if provided)
    const email = req.body?.email || '';
    return `${req.ip}-${email.toLowerCase()}`;
  },
  skip: () => isDev, // Skip rate limiting in development
});

/**
 * Rate limiter for registration
 */
export const registerRateLimiter = rateLimit({
  windowMs: authConfig.rateLimit.register.windowMs,
  max: authConfig.rateLimit.register.maxAttempts,
  message: {
    error: AuthErrorCode.RATE_LIMITED,
    message: 'Too many registration attempts. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for password reset requests
 */
export const passwordResetRateLimiter = rateLimit({
  windowMs: authConfig.rateLimit.passwordReset.windowMs,
  max: authConfig.rateLimit.passwordReset.maxAttempts,
  message: {
    error: AuthErrorCode.RATE_LIMITED,
    message: 'Too many password reset requests. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * General API rate limiter (for all authenticated routes)
 * More lenient in development to avoid issues during testing
 */
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: isDev ? 1000 : 200, // 1000 req/min in dev, 200 in production
  message: {
    error: 'RATE_LIMITED',
    message: 'Too many requests. Please slow down.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDev, // Skip rate limiting entirely in development
});

/**
 * Error handler for auth errors
 */
export function authErrorHandler(
  error: Error,
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  if (error instanceof AuthError) {
    res.status(error.statusCode).json({
      error: error.code,
      message: error.message,
    });
    return;
  }
  next(error);
}

