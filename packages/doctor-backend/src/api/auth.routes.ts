/**
 * Auth Routes
 * 
 * Doctor authentication endpoints.
 */

import { Router, Request, Response } from 'express';
import { authService, AuthError, requireAuth } from '../auth/index.js';
import config from '../config/index.js';

const router: Router = Router();

/**
 * POST /api/auth/register
 * Register a new doctor
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, specialty, title, licenseNumber, phone, language } = req.body;

    if (!email || !password || !firstName || !lastName || !specialty) {
      res.status(400).json({ 
        error: 'VALIDATION_ERROR',
        message: 'Email, password, first name, last name, and specialty are required' 
      });
      return;
    }

    const result = await authService.register(
      { email, password, firstName, lastName, specialty, title, licenseNumber, phone, language },
      req.headers['user-agent'],
      req.ip
    );

    // Set refresh token as httpOnly cookie
    res.cookie('doctor_refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: config.cookieSecure,
      sameSite: 'lax',
      maxAge: result.refreshExpiresAt.getTime() - Date.now(),
      path: '/doctor-api', // Scoped to doctor API endpoints
    });

    res.status(201).json({
      doctor: result.doctor,
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
    });
  } catch (error) {
    console.error('[Auth] Register error:', error);
    
    if (error instanceof AuthError) {
      res.status(error.statusCode).json({
        error: error.code,
        message: error.message,
      });
      return;
    }
    
    res.status(500).json({ 
      error: 'INTERNAL_ERROR',
      message: 'Failed to register' 
    });
  }
});

/**
 * POST /api/auth/login
 * Login a doctor
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ 
        error: 'VALIDATION_ERROR',
        message: 'Email and password are required' 
      });
      return;
    }

    const result = await authService.login(
      { email, password },
      req.headers['user-agent'],
      req.ip
    );

    // Set refresh token as httpOnly cookie
    res.cookie('doctor_refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: config.cookieSecure,
      sameSite: 'lax',
      maxAge: result.refreshExpiresAt.getTime() - Date.now(),
      path: '/doctor-api', // Scoped to doctor API endpoints
    });

    res.json({
      doctor: result.doctor,
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
    });
  } catch (error) {
    console.error('[Auth] Login error:', error);
    
    if (error instanceof AuthError) {
      res.status(error.statusCode).json({
        error: error.code,
        message: error.message,
      });
      return;
    }
    
    res.status(500).json({ 
      error: 'INTERNAL_ERROR',
      message: 'Failed to login' 
    });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.doctor_refresh_token;

    if (!refreshToken) {
      res.status(401).json({ 
        error: 'INVALID_TOKEN',
        message: 'No refresh token provided' 
      });
      return;
    }

    const result = await authService.refresh(refreshToken);

    res.json({
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
    });
  } catch (error) {
    console.error('[Auth] Refresh error:', error);
    
    if (error instanceof AuthError) {
      res.status(error.statusCode).json({
        error: error.code,
        message: error.message,
      });
      return;
    }
    
    res.status(500).json({ 
      error: 'INTERNAL_ERROR',
      message: 'Failed to refresh token' 
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout (revoke refresh token)
 */
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.doctor_refresh_token;

    if (refreshToken) {
      await authService.logout(refreshToken);
    }

    res.clearCookie('doctor_refresh_token', { path: '/doctor-api' });
    res.json({ success: true });
  } catch (error) {
    console.error('[Auth] Logout error:', error);
    res.json({ success: true }); // Still return success to clear client state
  }
});

/**
 * GET /api/auth/me
 * Get current doctor profile
 */
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const doctor = await authService.getProfile(req.doctor!.providerId);
    res.json({ doctor });
  } catch (error) {
    console.error('[Auth] Get profile error:', error);
    
    if (error instanceof AuthError) {
      res.status(error.statusCode).json({
        error: error.code,
        message: error.message,
      });
      return;
    }
    
    res.status(500).json({ 
      error: 'INTERNAL_ERROR',
      message: 'Failed to get profile' 
    });
  }
});

export default router;

