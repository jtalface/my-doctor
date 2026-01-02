import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import { User } from '../models/user.model.js';
import { PatientProfile } from '../models/patient-profile.model.js';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../auth/auth.types.js';

const router: RouterType = Router();

/**
 * All routes in this file require authentication.
 * The authenticate middleware in server.ts adds req.user with userId and email.
 */

// GET /api/user - Get current authenticated user
router.get('/', async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      isGuest: user.isGuest,
      preferences: user.preferences,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error('[API] Error getting user:', error);
    res.status(500).json({ 
      error: 'Failed to get user',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/user/:id - Get user by ID (for backward compatibility)
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;
    
    // Users can only access their own data
    if (authReq.user?.userId !== id) {
      return res.status(403).json({ error: 'Forbidden: Cannot access other users data' });
    }
    
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      isGuest: user.isGuest,
      preferences: user.preferences,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error('[API] Error getting user:', error);
    res.status(500).json({ 
      error: 'Failed to get user',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PATCH /api/user - Update current user
router.patch('/', async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const updates = req.body;

    // Don't allow updating sensitive fields
    delete updates.passwordHash;
    delete updates.email;
    delete updates.failedLoginAttempts;
    delete updates.lockoutUntil;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      preferences: user.preferences,
    });
  } catch (error) {
    console.error('[API] Error updating user:', error);
    res.status(500).json({ 
      error: 'Failed to update user',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PATCH /api/user/:id - Update user by ID (for backward compatibility)
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;
    
    // Users can only update their own data
    if (authReq.user?.userId !== id) {
      return res.status(403).json({ error: 'Forbidden: Cannot modify other users' });
    }

    const updates = req.body;

    // Don't allow updating sensitive fields
    delete updates.passwordHash;
    delete updates.email;
    delete updates.failedLoginAttempts;
    delete updates.lockoutUntil;

    const user = await User.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      preferences: user.preferences,
    });
  } catch (error) {
    console.error('[API] Error updating user:', error);
    res.status(500).json({ 
      error: 'Failed to update user',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/user/profile - Get current user's patient profile
router.get('/me/profile', async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const profile = await PatientProfile.findOne({ userId });
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json(profile);
  } catch (error) {
    console.error('[API] Error getting profile:', error);
    res.status(500).json({ 
      error: 'Failed to get profile',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/user/:id/profile - Get patient profile by user ID (for backward compatibility)
router.get('/:id/profile', async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;
    
    // Users can only access their own profile
    if (authReq.user?.userId !== id) {
      return res.status(403).json({ error: 'Forbidden: Cannot access other users profile' });
    }
    
    const profile = await PatientProfile.findOne({ userId: id });
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json(profile);
  } catch (error) {
    console.error('[API] Error getting profile:', error);
    res.status(500).json({ 
      error: 'Failed to get profile',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PATCH /api/user/profile - Update current user's patient profile
router.patch('/me/profile', async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const updates = req.body;

    const profile = await PatientProfile.findOneAndUpdate(
      { userId },
      { $set: { ...updates, lastUpdated: new Date() } },
      { new: true, upsert: true }
    );

    res.json(profile);
  } catch (error) {
    console.error('[API] Error updating profile:', error);
    res.status(500).json({ 
      error: 'Failed to update profile',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PATCH /api/user/:id/profile - Update patient profile by user ID (for backward compatibility)
router.patch('/:id/profile', async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;
    
    // Users can only update their own profile
    if (authReq.user?.userId !== id) {
      return res.status(403).json({ error: 'Forbidden: Cannot modify other users profile' });
    }

    const updates = req.body;

    const profile = await PatientProfile.findOneAndUpdate(
      { userId: id },
      { $set: { ...updates, lastUpdated: new Date() } },
      { new: true, upsert: true }
    );

    res.json(profile);
  } catch (error) {
    console.error('[API] Error updating profile:', error);
    res.status(500).json({ 
      error: 'Failed to update profile',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/user/sessions - Get all sessions for current user
router.get('/me/sessions', async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Import Session model dynamically to avoid circular dependencies
    const { Session } = await import('../models/session.model.js');
    
    const sessions = await Session.find({ userId })
      .sort({ startedAt: -1 })
      .select('_id status startedAt completedAt summary.redFlags')
      .lean();

    res.json(sessions);
  } catch (error) {
    console.error('[API] Error getting sessions:', error);
    res.status(500).json({ 
      error: 'Failed to get sessions',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/user/:id/sessions - Get sessions by user ID (for backward compatibility)
router.get('/:id/sessions', async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;
    
    // Users can only access their own sessions
    if (authReq.user?.userId !== id) {
      return res.status(403).json({ error: 'Forbidden: Cannot access other users sessions' });
    }

    // Import Session model dynamically to avoid circular dependencies
    const { Session } = await import('../models/session.model.js');
    
    const sessions = await Session.find({ userId: id })
      .sort({ startedAt: -1 })
      .select('_id status startedAt completedAt summary.redFlags')
      .lean();

    res.json(sessions);
  } catch (error) {
    console.error('[API] Error getting sessions:', error);
    res.status(500).json({ 
      error: 'Failed to get sessions',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
