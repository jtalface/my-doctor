import { Router, Response } from 'express';
import { createJobRoleSchema, updateJobRoleSchema } from '@ffd/shared';
import { JobRole } from '../models/index.js';
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
 * GET /jobroles
 */
router.get('/', requireViewer, async (req: AuthRequest, res: Response) => {
  try {
    const filter: any = {};
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    }
    if (req.query.safetyCritical !== undefined) {
      filter.safetyCritical = req.query.safetyCritical === 'true';
    }
    
    const jobRoles = await JobRole.find(filter).sort({ name: 1 });
    
    res.json(
      jobRoles.map((j) => ({
        id: j._id.toString(),
        name: j.name,
        safetyCritical: j.safetyCritical,
        tags: j.tags,
        isActive: j.isActive,
        createdAt: j.createdAt,
        updatedAt: j.updatedAt,
      }))
    );
  } catch (error) {
    console.error('[JobRoles] Get all error:', error);
    res.status(500).json({ error: 'Failed to get job roles' });
  }
});

/**
 * GET /jobroles/:id
 */
router.get('/:id', requireViewer, async (req: AuthRequest, res: Response) => {
  try {
    const jobRole = await JobRole.findById(req.params.id);
    
    if (!jobRole) {
      res.status(404).json({ error: 'Job role not found' });
      return;
    }
    
    res.json({
      id: jobRole._id.toString(),
      name: jobRole.name,
      safetyCritical: jobRole.safetyCritical,
      tags: jobRole.tags,
      isActive: jobRole.isActive,
      createdAt: jobRole.createdAt,
      updatedAt: jobRole.updatedAt,
    });
  } catch (error) {
    console.error('[JobRoles] Get one error:', error);
    res.status(500).json({ error: 'Failed to get job role' });
  }
});

/**
 * POST /jobroles
 */
router.post('/', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const validation = createJobRoleSchema.safeParse(req.body);
    
    if (!validation.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validation.error.issues,
      });
      return;
    }
    
    const jobRole = await JobRole.create(validation.data);
    
    await createAuditLog(
      req.user!.userId,
      'create',
      'JobRole',
      jobRole._id.toString(),
      req
    );
    
    res.status(201).json({
      id: jobRole._id.toString(),
      name: jobRole.name,
      safetyCritical: jobRole.safetyCritical,
      tags: jobRole.tags,
      isActive: jobRole.isActive,
      createdAt: jobRole.createdAt,
      updatedAt: jobRole.updatedAt,
    });
  } catch (error) {
    console.error('[JobRoles] Create error:', error);
    res.status(500).json({ error: 'Failed to create job role' });
  }
});

/**
 * PUT /jobroles/:id
 */
router.put('/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const validation = updateJobRoleSchema.safeParse(req.body);
    
    if (!validation.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validation.error.issues,
      });
      return;
    }
    
    const jobRole = await JobRole.findByIdAndUpdate(
      req.params.id,
      { $set: validation.data },
      { new: true }
    );
    
    if (!jobRole) {
      res.status(404).json({ error: 'Job role not found' });
      return;
    }
    
    await createAuditLog(
      req.user!.userId,
      'update',
      'JobRole',
      jobRole._id.toString(),
      req
    );
    
    res.json({
      id: jobRole._id.toString(),
      name: jobRole.name,
      safetyCritical: jobRole.safetyCritical,
      tags: jobRole.tags,
      isActive: jobRole.isActive,
      createdAt: jobRole.createdAt,
      updatedAt: jobRole.updatedAt,
    });
  } catch (error) {
    console.error('[JobRoles] Update error:', error);
    res.status(500).json({ error: 'Failed to update job role' });
  }
});

/**
 * DELETE /jobroles/:id
 */
router.delete('/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const jobRole = await JobRole.findByIdAndUpdate(
      req.params.id,
      { $set: { isActive: false } },
      { new: true }
    );
    
    if (!jobRole) {
      res.status(404).json({ error: 'Job role not found' });
      return;
    }
    
    await createAuditLog(
      req.user!.userId,
      'delete',
      'JobRole',
      jobRole._id.toString(),
      req
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('[JobRoles] Delete error:', error);
    res.status(500).json({ error: 'Failed to delete job role' });
  }
});

export default router;
