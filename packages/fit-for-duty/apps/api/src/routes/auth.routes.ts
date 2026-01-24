import { Router, Request, Response } from 'express';
import { loginSchema } from '@ffd/shared';
import { login } from '../services/auth.service.js';
import { createAuditLog } from '../middleware/audit.middleware.js';
import { authenticate, type AuthRequest } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * POST /auth/login
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const validation = loginSchema.safeParse(req.body);
    
    if (!validation.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validation.error.issues,
      });
      return;
    }
    
    const { email, password } = validation.data;
    const result = await login(email, password);
    
    if (!result) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }
    
    // Audit log
    await createAuditLog(
      result.user.id,
      'login',
      'User',
      result.user.id,
      req as AuthRequest
    );
    
    res.json(result);
  } catch (error) {
    console.error('[Auth] Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * GET /auth/me
 */
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { User } = await import('../models/index.js');
    const user = await User.findById(req.user?.userId);
    
    if (!user || !user.isActive) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    
    res.json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      locationIds: user.locationIds.map((id) => id.toString()),
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (error) {
    console.error('[Auth] Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

export default router;
