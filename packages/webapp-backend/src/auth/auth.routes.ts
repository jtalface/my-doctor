/**
 * Auth Routes
 * 
 * Express routes for authentication endpoints.
 * All routes are prefixed with /api/auth
 */

import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import { z } from 'zod';
import { authService } from './auth.service.js';
import { authConfig } from './auth.config.js';
import { 
  authenticate, 
  loginRateLimiter, 
  registerRateLimiter 
} from './auth.middleware.js';
import { AuthenticatedRequest, AuthError, AuthErrorCode } from './auth.types.js';
import { passwordService } from './password.service.js';

const router: RouterType = Router();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
  name: z.string().min(1, 'Name is required').max(100),
  language: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', registerRateLimiter, async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      const firstIssue = validation.error.issues?.[0];
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: firstIssue?.message || 'Validation failed',
        details: validation.error.issues,
      });
    }

    const { email, password, name, language } = validation.data;

    // Register user
    const result = await authService.register(
      { email, password, name, language },
      req.headers['user-agent'],
      req.ip
    );

    // Set refresh token in httpOnly cookie
    res.cookie(authConfig.cookie.name, result.refreshToken, {
      httpOnly: authConfig.cookie.httpOnly,
      secure: authConfig.cookie.secure,
      sameSite: authConfig.cookie.sameSite,
      path: authConfig.cookie.path,
      maxAge: authConfig.cookie.maxAge,
    });

    // Return user and access token
    res.status(201).json({
      user: result.user,
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
    });
  } catch (error) {
    console.error('[Auth] Registration error:', error);
    
    if (error instanceof AuthError) {
      return res.status(error.statusCode).json({
        error: error.code,
        message: error.message,
      });
    }
    
    res.status(500).json({
      error: 'REGISTRATION_FAILED',
      message: 'Failed to register. Please try again.',
    });
  }
});

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post('/login', loginRateLimiter, async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      const firstIssue = validation.error.issues?.[0];
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: firstIssue?.message || 'Validation failed',
      });
    }

    const { email, password, rememberMe } = validation.data;

    // Login user
    const result = await authService.login(
      { email, password, rememberMe },
      req.headers['user-agent'],
      req.ip
    );

    // Set refresh token in httpOnly cookie
    // If rememberMe, use full expiry; otherwise, session cookie
    res.cookie(authConfig.cookie.name, result.refreshToken, {
      httpOnly: authConfig.cookie.httpOnly,
      secure: authConfig.cookie.secure,
      sameSite: authConfig.cookie.sameSite,
      path: authConfig.cookie.path,
      maxAge: rememberMe ? authConfig.cookie.maxAge : undefined, // undefined = session cookie
    });

    // Return user and access token
    res.json({
      user: result.user,
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
    });
  } catch (error) {
    console.error('[Auth] Login error:', error);
    
    if (error instanceof AuthError) {
      return res.status(error.statusCode).json({
        error: error.code,
        message: error.message,
      });
    }
    
    res.status(500).json({
      error: 'LOGIN_FAILED',
      message: 'Failed to login. Please try again.',
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout current session
 */
router.post('/logout', async (req: Request, res: Response) => {
  try {
    // Get refresh token from cookie
    const refreshToken = req.cookies?.[authConfig.cookie.name];
    
    if (refreshToken) {
      await authService.logout(refreshToken);
    }

    // Clear the cookie
    res.clearCookie(authConfig.cookie.name, {
      path: authConfig.cookie.path,
    });

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('[Auth] Logout error:', error);
    // Always succeed - user should be logged out even if there's an error
    res.clearCookie(authConfig.cookie.name, {
      path: authConfig.cookie.path,
    });
    res.json({ message: 'Logged out' });
  }
});

/**
 * POST /api/auth/logout-all
 * Logout from all devices
 */
router.post('/logout-all', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await authService.logoutAll(req.user!.userId);

    // Clear the cookie
    res.clearCookie(authConfig.cookie.name, {
      path: authConfig.cookie.path,
    });

    res.json({ message: 'Logged out from all devices' });
  } catch (error) {
    console.error('[Auth] Logout all error:', error);
    res.status(500).json({
      error: 'LOGOUT_FAILED',
      message: 'Failed to logout from all devices',
    });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token from cookie
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    // Get refresh token from cookie
    const refreshToken = req.cookies?.[authConfig.cookie.name];
    
    if (!refreshToken) {
      return res.status(401).json({
        error: AuthErrorCode.INVALID_TOKEN,
        message: 'No refresh token provided',
      });
    }

    // Refresh tokens
    const result = await authService.refresh(
      refreshToken,
      req.headers['user-agent'],
      req.ip
    );

    // Set new refresh token in cookie (token rotation)
    res.cookie(authConfig.cookie.name, result.refreshToken, {
      httpOnly: authConfig.cookie.httpOnly,
      secure: authConfig.cookie.secure,
      sameSite: authConfig.cookie.sameSite,
      path: authConfig.cookie.path,
      maxAge: authConfig.cookie.maxAge,
    });

    // Return new access token
    res.json({
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
    });
  } catch (error) {
    console.error('[Auth] Refresh error:', error);
    
    // Clear invalid cookie
    res.clearCookie(authConfig.cookie.name, {
      path: authConfig.cookie.path,
    });
    
    if (error instanceof AuthError) {
      return res.status(error.statusCode).json({
        error: error.code,
        message: error.message,
      });
    }
    
    res.status(401).json({
      error: AuthErrorCode.INVALID_TOKEN,
      message: 'Failed to refresh token',
    });
  }
});

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
router.get('/me', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await authService.getCurrentUser(req.user!.userId);
    res.json({ user });
  } catch (error) {
    console.error('[Auth] Get user error:', error);
    
    if (error instanceof AuthError) {
      return res.status(error.statusCode).json({
        error: error.code,
        message: error.message,
      });
    }
    
    res.status(500).json({
      error: 'USER_FETCH_FAILED',
      message: 'Failed to get user data',
    });
  }
});

/**
 * GET /api/auth/password-requirements
 * Get password requirements for display
 */
router.get('/password-requirements', (_req: Request, res: Response) => {
  res.json({
    requirements: passwordService.getRequirements(),
  });
});

/**
 * POST /api/auth/check-email
 * Check if email is already registered
 */
router.post('/check-email', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    
    if (!email || typeof email !== 'string') {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Email is required',
      });
    }

    const exists = await authService.emailExists(email);
    res.json({ exists });
  } catch (error) {
    console.error('[Auth] Check email error:', error);
    res.status(500).json({
      error: 'CHECK_FAILED',
      message: 'Failed to check email',
    });
  }
});

export default router;

