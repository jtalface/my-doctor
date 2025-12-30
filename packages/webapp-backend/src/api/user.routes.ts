import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import { User } from '../models/user.model.js';
import { PatientProfile } from '../models/patient-profile.model.js';
import mongoose from 'mongoose';

const router: RouterType = Router();

// POST /api/user - Create or get guest user
router.post('/', async (req: Request, res: Response) => {
  try {
    const { email, name, isGuest = true, preferences } = req.body;

    // For guests, create a temporary user
    if (isGuest) {
      const guestUser = new User({
        email: `guest_${Date.now()}@mydoctor.temp`,
        name: name || 'Guest User',
        isGuest: true,
      });
      await guestUser.save();

      // Create empty patient profile
      const profile = new PatientProfile({
        userId: guestUser._id,
      });
      await profile.save();

      return res.json({
        id: guestUser._id,
        name: guestUser.name,
        isGuest: true,
      });
    }

    // For registered users
    if (!email) {
      return res.status(400).json({ error: 'Email is required for non-guest users' });
    }

    let user = await User.findOne({ email });
    
    if (!user) {
      user = new User({
        email,
        name: name || email.split('@')[0],
        isGuest: false,
        preferences: preferences || {
          notifications: true,
          dataSharing: false,
          language: 'en',
        },
      });
      await user.save();

      // Create empty patient profile
      const profile = new PatientProfile({
        userId: user._id,
      });
      await profile.save();
    }

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      isGuest: false,
      preferences: user.preferences,
    });
  } catch (error) {
    console.error('[API] Error creating user:', error);
    res.status(500).json({ 
      error: 'Failed to create user',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/user/:id - Get user details
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
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

// PATCH /api/user/:id - Update user
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

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

// GET /api/user/:id/profile - Get patient profile
router.get('/:id/profile', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
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

// PATCH /api/user/:id/profile - Update patient profile
router.patch('/:id/profile', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
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

export default router;

