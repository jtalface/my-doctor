import { Router, Response } from 'express';
import { createTemplateSchema, updateTemplateSchema } from '@ffd/shared';
import { Template } from '../models/index.js';
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
 * GET /templates
 */
router.get('/', requireViewer, async (req: AuthRequest, res: Response) => {
  try {
    const filter: any = {};
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    }
    
    const templates = await Template.find(filter).sort({ name: 1, version: -1 });
    
    res.json(
      templates.map((t) => ({
        id: t._id.toString(),
        name: t.name,
        version: t.version,
        sections: t.sections,
        isActive: t.isActive,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      }))
    );
  } catch (error) {
    console.error('[Templates] Get all error:', error);
    res.status(500).json({ error: 'Failed to get templates' });
  }
});

/**
 * GET /templates/active
 * Get the active template (for assessors to use)
 */
router.get('/active', requireViewer, async (req: AuthRequest, res: Response) => {
  try {
    const template = await Template.findOne({ isActive: true }).sort({ version: -1 });
    
    if (!template) {
      res.status(404).json({ error: 'No active template found' });
      return;
    }
    
    res.json({
      id: template._id.toString(),
      name: template.name,
      version: template.version,
      sections: template.sections,
      isActive: template.isActive,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    });
  } catch (error) {
    console.error('[Templates] Get active error:', error);
    res.status(500).json({ error: 'Failed to get active template' });
  }
});

/**
 * GET /templates/:id
 */
router.get('/:id', requireViewer, async (req: AuthRequest, res: Response) => {
  try {
    const template = await Template.findById(req.params.id);
    
    if (!template) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }
    
    res.json({
      id: template._id.toString(),
      name: template.name,
      version: template.version,
      sections: template.sections,
      isActive: template.isActive,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    });
  } catch (error) {
    console.error('[Templates] Get one error:', error);
    res.status(500).json({ error: 'Failed to get template' });
  }
});

/**
 * POST /templates
 */
router.post('/', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const validation = createTemplateSchema.safeParse(req.body);
    
    if (!validation.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validation.error.issues,
      });
      return;
    }
    
    // Find the latest version for this template name
    const latestVersion = await Template.findOne({ name: validation.data.name })
      .sort({ version: -1 })
      .select('version');
    
    const version = latestVersion ? latestVersion.version + 1 : 1;
    
    // If creating a new active template, deactivate others with same name
    if (validation.data.isActive) {
      await Template.updateMany(
        { name: validation.data.name },
        { $set: { isActive: false } }
      );
    }
    
    const template = await Template.create({
      ...validation.data,
      version,
    });
    
    await createAuditLog(
      req.user!.userId,
      'create',
      'Template',
      template._id.toString(),
      req
    );
    
    res.status(201).json({
      id: template._id.toString(),
      name: template.name,
      version: template.version,
      sections: template.sections,
      isActive: template.isActive,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    });
  } catch (error) {
    console.error('[Templates] Create error:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

/**
 * PUT /templates/:id
 */
router.put('/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const validation = updateTemplateSchema.safeParse(req.body);
    
    if (!validation.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validation.error.issues,
      });
      return;
    }
    
    // If activating this template, deactivate others
    if (validation.data.isActive) {
      const currentTemplate = await Template.findById(req.params.id);
      if (currentTemplate) {
        await Template.updateMany(
          { name: currentTemplate.name, _id: { $ne: req.params.id } },
          { $set: { isActive: false } }
        );
      }
    }
    
    const template = await Template.findByIdAndUpdate(
      req.params.id,
      { $set: validation.data },
      { new: true }
    );
    
    if (!template) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }
    
    await createAuditLog(
      req.user!.userId,
      'update',
      'Template',
      template._id.toString(),
      req
    );
    
    res.json({
      id: template._id.toString(),
      name: template.name,
      version: template.version,
      sections: template.sections,
      isActive: template.isActive,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    });
  } catch (error) {
    console.error('[Templates] Update error:', error);
    res.status(500).json({ error: 'Failed to update template' });
  }
});

/**
 * DELETE /templates/:id
 */
router.delete('/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const template = await Template.findByIdAndUpdate(
      req.params.id,
      { $set: { isActive: false } },
      { new: true }
    );
    
    if (!template) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }
    
    await createAuditLog(
      req.user!.userId,
      'delete',
      'Template',
      template._id.toString(),
      req
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('[Templates] Delete error:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

export default router;
