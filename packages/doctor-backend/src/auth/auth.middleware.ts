/**
 * Authentication Middleware
 * 
 * Protects routes that require doctor authentication.
 */

import { Request, Response, NextFunction } from 'express';
import { tokenService } from './token.service.js';
import { authService } from './auth.service.js';

// Extend Express Request to include doctor info
declare global {
  namespace Express {
    interface Request {
      doctor?: {
        providerId: string;
        email: string;
      };
    }
  }
}

/**
 * Require authentication for a route
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ 
        error: 'INVALID_TOKEN',
        message: 'No authorization token provided' 
      });
      return;
    }

    const token = authHeader.substring(7);
    
    // Verify token
    const payload = tokenService.verifyAccessToken(token);
    if (!payload) {
      res.status(401).json({ 
        error: 'INVALID_TOKEN',
        message: 'Invalid or expired token' 
      });
      return;
    }

    // Attach doctor info to request
    req.doctor = {
      providerId: payload.providerId,
      email: payload.email,
    };

    // Update last active
    await authService.updateLastActive(payload.providerId);

    next();
  } catch (error) {
    console.error('[Auth] Middleware error:', error);
    res.status(500).json({ 
      error: 'AUTH_ERROR',
      message: 'Authentication error' 
    });
  }
}

/**
 * Optional authentication - doesn't fail if no token
 */
export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = tokenService.verifyAccessToken(token);
      if (payload) {
        req.doctor = {
          providerId: payload.providerId,
          email: payload.email,
        };
        await authService.updateLastActive(payload.providerId);
      }
    }
    next();
  } catch {
    next();
  }
}

