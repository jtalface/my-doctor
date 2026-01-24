import { Router, Response } from 'express';
import { createLocationSchema, updateLocationSchema } from '@ffd/shared';
import { Location } from '../models/index.js';
import {
  authenticate,
  requireAdmin,
  requireViewer,
  type AuthRequest,
} from '../middleware/auth.middleware.js';
import { createAuditLog } from '../middleware/audit.middleware.js';

const router = Router();

router.use(authenticate);

/**
 * GET /locations
 */
router.get('/', requireViewer, async (req: AuthRequest, res: Response) => {
  try {
    const filter: any = {};
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    }
    
    const locations = await Location.find(filter).sort({ name: 1 });
    
    res.json(
      locations.map((l) => ({
        id: l._id.toString(),
        name: l.name,
        type: l.type,
        region: l.region,
        isActive: l.isActive,
        createdAt: l.createdAt,
        updatedAt: l.updatedAt,
      }))
    );
  } catch (error) {
    console.error('[Locations] Get all error:', error);
    res.status(500).json({ error: 'Failed to get locations' });
  }
});

/**
 * GET /locations/:id
 */
router.get('/:id', requireViewer, async (req: AuthRequest, res: Response) => {
  try {
    const location = await Location.findById(req.params.id);
    
    if (!location) {
      res.status(404).json({ error: 'Location not found' });
      return;
    }
    
    res.json({
      id: location._id.toString(),
      name: location.name,
      type: location.type,
      region: location.region,
      isActive: location.isActive,
      createdAt: location.createdAt,
      updatedAt: location.updatedAt,
    });
  } catch (error) {
    console.error('[Locations] Get one error:', error);
    res.status(500).json({ error: 'Failed to get location' });
  }
});

/**
 * POST /locations
 */
router.post('/', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const validation = createLocationSchema.safeParse(req.body);
    
    if (!validation.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validation.error.issues,
      });
      return;
    }
    
    const location = await Location.create(validation.data);
    
    await createAuditLog(
      req.user!.userId,
      'create',
      'Location',
      location._id.toString(),
      req
    );
    
    res.status(201).json({
      id: location._id.toString(),
      name: location.name,
      type: location.type,
      region: location.region,
      isActive: location.isActive,
      createdAt: location.createdAt,
      updatedAt: location.updatedAt,
    });
  } catch (error) {
    console.error('[Locations] Create error:', error);
    res.status(500).json({ error: 'Failed to create location' });
  }
});

/**
 * PUT /locations/:id
 */
router.put('/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const validation = updateLocationSchema.safeParse(req.body);
    
    if (!validation.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validation.error.issues,
      });
      return;
    }
    
    const location = await Location.findByIdAndUpdate(
      req.params.id,
      { $set: validation.data },
      { new: true }
    );
    
    if (!location) {
      res.status(404).json({ error: 'Location not found' });
      return;
    }
    
    await createAuditLog(
      req.user!.userId,
      'update',
      'Location',
      location._id.toString(),
      req
    );
    
    res.json({
      id: location._id.toString(),
      name: location.name,
      type: location.type,
      region: location.region,
      isActive: location.isActive,
      createdAt: location.createdAt,
      updatedAt: location.updatedAt,
    });
  } catch (error) {
    console.error('[Locations] Update error:', error);
    res.status(500).json({ error: 'Failed to update location' });
  }
});

/**
 * DELETE /locations/:id
 */
router.delete('/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const location = await Location.findByIdAndUpdate(
      req.params.id,
      { $set: { isActive: false } },
      { new: true }
    );
    
    if (!location) {
      res.status(404).json({ error: 'Location not found' });
      return;
    }
    
    await createAuditLog(
      req.user!.userId,
      'delete',
      'Location',
      location._id.toString(),
      req
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('[Locations] Delete error:', error);
    res.status(500).json({ error: 'Failed to delete location' });
  }
});

export default router;
