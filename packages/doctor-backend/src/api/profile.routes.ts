/**
 * Profile Routes
 * 
 * Endpoints for managing doctor profile.
 */

import { Router, Request, Response } from 'express';
import { requireAuth } from '../auth/index.js';
import { Provider } from '../models/index.js';

const router = Router();

/**
 * GET /api/profile
 * Get current doctor's full profile
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const providerId = req.doctor!.providerId;

    const profile = await Provider.findById(providerId)
      .select('-passwordHash')
      .lean();

    if (!profile) {
      res.status(404).json({ 
        error: 'NOT_FOUND',
        message: 'Profile not found' 
      });
      return;
    }

    res.json({ profile });
  } catch (error) {
    console.error('[Profile] Get error:', error);
    res.status(500).json({ 
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch profile' 
    });
  }
});

/**
 * PATCH /api/profile
 * Update current doctor's profile
 */
router.patch('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const providerId = req.doctor!.providerId;
    const {
      name,
      phone,
      bio,
      specialty,
      title,
      licenseNumber,
      languages,
      workingHours,
      preferences,
    } = req.body;

    const update: Record<string, unknown> = {};
    if (name) update.name = name;
    if (phone !== undefined) update.phone = phone;
    if (bio !== undefined) update.bio = bio;
    if (specialty) update.specialty = specialty;
    if (title) update.title = title;
    if (licenseNumber !== undefined) update.licenseNumber = licenseNumber;
    if (languages) update.languages = languages;
    if (workingHours) update.workingHours = workingHours;
    if (preferences) update.preferences = preferences;

    const profile = await Provider.findByIdAndUpdate(
      providerId,
      { $set: update },
      { new: true }
    ).select('-passwordHash');

    if (!profile) {
      res.status(404).json({ 
        error: 'NOT_FOUND',
        message: 'Profile not found' 
      });
      return;
    }

    res.json({ profile });
  } catch (error) {
    console.error('[Profile] Update error:', error);
    res.status(500).json({ 
      error: 'INTERNAL_ERROR',
      message: 'Failed to update profile' 
    });
  }
});

/**
 * POST /api/profile/availability
 * Update availability status
 */
router.post('/availability', requireAuth, async (req: Request, res: Response) => {
  try {
    const providerId = req.doctor!.providerId;
    const { isAvailable } = req.body;

    if (typeof isAvailable !== 'boolean') {
      res.status(400).json({ 
        error: 'VALIDATION_ERROR',
        message: 'isAvailable must be a boolean' 
      });
      return;
    }

    const profile = await Provider.findByIdAndUpdate(
      providerId,
      { $set: { isAvailable } },
      { new: true }
    ).select('isAvailable');

    res.json({ isAvailable: profile?.isAvailable });
  } catch (error) {
    console.error('[Profile] Update availability error:', error);
    res.status(500).json({ 
      error: 'INTERNAL_ERROR',
      message: 'Failed to update availability' 
    });
  }
});

/**
 * POST /api/profile/avatar
 * Upload avatar (placeholder - would need file upload)
 */
router.post('/avatar', requireAuth, async (req: Request, res: Response) => {
  // TODO: Implement avatar upload
  res.status(501).json({ 
    error: 'NOT_IMPLEMENTED',
    message: 'Avatar upload not implemented yet' 
  });
});

export default router;

