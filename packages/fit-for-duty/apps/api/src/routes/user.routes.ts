import { Router, Response } from 'express';
import { createUserSchema, updateUserSchema } from '@ffd/shared';
import { User } from '../models/index.js';
import { hashPassword } from '../services/auth.service.js';
import {
  authenticate,
  requireAdmin,
  type AuthRequest,
} from '../middleware/auth.middleware.js';
import { createAuditLog } from '../middleware/audit.middleware.js';

const router = Router();

// All routes require admin
router.use(authenticate, requireAdmin);

/**
 * GET /users
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
    
    res.json(
      users.map((u) => ({
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        role: u.role,
        locationIds: u.locationIds.map((id) => id.toString()),
        isActive: u.isActive,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      }))
    );
  } catch (error) {
    console.error('[Users] Get all error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

/**
 * GET /users/:id
 */
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash');
    
    if (!user) {
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
    console.error('[Users] Get one error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

/**
 * POST /users
 */
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const validation = createUserSchema.safeParse(req.body);
    
    if (!validation.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validation.error.issues,
      });
      return;
    }
    
    const { password, ...userData } = validation.data;
    
    // Check if email exists
    const existing = await User.findOne({ email: userData.email.toLowerCase() });
    if (existing) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }
    
    const passwordHash = await hashPassword(password);
    
    const user = await User.create({
      ...userData,
      email: userData.email.toLowerCase(),
      passwordHash,
    });
    
    await createAuditLog(
      req.user!.userId,
      'create',
      'User',
      user._id.toString(),
      req
    );
    
    res.status(201).json({
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
    console.error('[Users] Create error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

/**
 * PUT /users/:id
 */
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const validation = updateUserSchema.safeParse(req.body);
    
    if (!validation.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validation.error.issues,
      });
      return;
    }
    
    const { password, ...updateData } = validation.data;
    
    const updatePayload: any = { ...updateData };
    
    if (password) {
      updatePayload.passwordHash = await hashPassword(password);
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updatePayload },
      { new: true }
    ).select('-passwordHash');
    
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    
    await createAuditLog(
      req.user!.userId,
      'update',
      'User',
      user._id.toString(),
      req
    );
    
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
    console.error('[Users] Update error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

/**
 * DELETE /users/:id
 */
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    // Soft delete - just set isActive to false
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { isActive: false } },
      { new: true }
    );
    
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    
    await createAuditLog(
      req.user!.userId,
      'delete',
      'User',
      user._id.toString(),
      req
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('[Users] Delete error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;
