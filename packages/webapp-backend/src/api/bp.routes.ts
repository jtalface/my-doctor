/**
 * Blood Pressure Tracking API Routes
 * 
 * All routes require authentication
 * Supports both user and dependent tracking via ?userId=<dependentId>
 */

import { Router } from 'express';
import * as bpService from '../services/bp.service.js';

const router = Router();

// ==================== SETTINGS ====================

/**
 * GET /api/bp/settings?userId=<optional>
 * Get BP settings
 */
router.get('/settings', async (req, res) => {
  try {
    const userId = (req.query.userId as string) || req.user!.id;

    // Authorization: check if user can access this data
    if (userId !== req.user!.id) {
      // TODO: Verify user is guardian of dependent
    }

    const settings = await bpService.getSettings(userId);

    if (!settings) {
      return res.status(404).json({
        error: 'SETTINGS_NOT_FOUND',
        message: 'BP settings not found. Complete onboarding first.',
      });
    }

    res.json(settings);
  } catch (error: any) {
    console.error('[BP API] Error getting settings:', error);
    res.status(500).json({
      error: 'SERVER_ERROR',
      message: error.message || 'Failed to get settings',
    });
  }
});

/**
 * POST /api/bp/settings?userId=<optional>
 * Create BP settings (onboarding)
 */
router.post('/settings', async (req, res) => {
  try {
    const userId = (req.query.userId as string) || req.user!.id;
    const profileType = req.query.userId ? 'dependent' : 'user';

    // Authorization check
    if (userId !== req.user!.id) {
      // TODO: Verify user is guardian of dependent
    }

    const { targets, measurementSchedule, medications, comorbidities } = req.body;

    // Check if settings already exist
    const existing = await bpService.getSettings(userId);
    if (existing) {
      return res.status(409).json({
        error: 'SETTINGS_EXIST',
        message: 'Settings already exist. Use PATCH to update.',
      });
    }

    const settings = await bpService.createSettings(userId, profileType, {
      targets,
      measurementSchedule,
      medications,
      comorbidities,
    });

    res.status(201).json(settings);
  } catch (error: any) {
    console.error('[BP API] Error creating settings:', error);
    res.status(500).json({
      error: 'SERVER_ERROR',
      message: error.message || 'Failed to create settings',
    });
  }
});

/**
 * PATCH /api/bp/settings?userId=<optional>
 * Update BP settings
 */
router.patch('/settings', async (req, res) => {
  try {
    const userId = (req.query.userId as string) || req.user!.id;

    // Authorization check
    if (userId !== req.user!.id) {
      // TODO: Verify user is guardian of dependent
    }

    const settings = await bpService.updateSettings(userId, req.body);

    if (!settings) {
      return res.status(404).json({
        error: 'SETTINGS_NOT_FOUND',
        message: 'Settings not found',
      });
    }

    res.json(settings);
  } catch (error: any) {
    console.error('[BP API] Error updating settings:', error);
    res.status(500).json({
      error: 'SERVER_ERROR',
      message: error.message || 'Failed to update settings',
    });
  }
});

// ==================== SESSIONS ====================

/**
 * POST /api/bp/sessions?userId=<optional>
 * Create a BP session
 */
router.post('/sessions', async (req, res) => {
  try {
    const userId = (req.query.userId as string) || req.user!.id;
    const profileType = req.query.userId ? 'dependent' : 'user';

    // Authorization check
    if (userId !== req.user!.id) {
      // TODO: Verify user is guardian of dependent
    }

    const { timestamp, readings, context, symptoms, measurementQuality, notes } = req.body;

    // Validation
    if (!timestamp || !readings || !Array.isArray(readings) || readings.length === 0 || !context || !measurementQuality) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Missing required fields: timestamp, readings (array), context, measurementQuality',
      });
    }

    const session = await bpService.createSession(userId, profileType, {
      timestamp: new Date(timestamp),
      readings,
      context,
      symptoms,
      measurementQuality,
      notes,
    });

    res.status(201).json(session);
  } catch (error: any) {
    console.error('[BP API] Error creating session:', error);
    res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: error.message || 'Failed to create session',
    });
  }
});

/**
 * GET /api/bp/sessions?userId=<optional>&startDate=<>&endDate=<>&context=<>&classification=<>&limit=<>
 * Get BP sessions
 */
router.get('/sessions', async (req, res) => {
  try {
    const userId = (req.query.userId as string) || req.user!.id;

    // Authorization check
    if (userId !== req.user!.id) {
      // TODO: Verify user is guardian of dependent
    }

    const options: any = {};

    if (req.query.startDate) {
      options.startDate = new Date(req.query.startDate as string);
    }

    if (req.query.endDate) {
      options.endDate = new Date(req.query.endDate as string);
    }

    if (req.query.context) {
      options.context = req.query.context as string;
    }

    if (req.query.classification) {
      options.classification = req.query.classification as string;
    }

    if (req.query.limit) {
      options.limit = parseInt(req.query.limit as string, 10);
    }

    const sessions = await bpService.getSessions(userId, options);

    res.json(sessions);
  } catch (error: any) {
    console.error('[BP API] Error getting sessions:', error);
    res.status(500).json({
      error: 'SERVER_ERROR',
      message: error.message || 'Failed to get sessions',
    });
  }
});

/**
 * PATCH /api/bp/sessions/:id?userId=<optional>
 * Update a BP session
 */
router.patch('/sessions/:id', async (req, res) => {
  try {
    const userId = (req.query.userId as string) || req.user!.id;
    const sessionId = req.params.id;

    // Authorization check
    if (userId !== req.user!.id) {
      // TODO: Verify user is guardian of dependent
    }

    const session = await bpService.updateSession(sessionId, userId, req.body);

    if (!session) {
      return res.status(404).json({
        error: 'SESSION_NOT_FOUND',
        message: 'Session not found',
      });
    }

    res.json(session);
  } catch (error: any) {
    console.error('[BP API] Error updating session:', error);
    res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: error.message || 'Failed to update session',
    });
  }
});

/**
 * DELETE /api/bp/sessions/:id?userId=<optional>
 * Delete a BP session
 */
router.delete('/sessions/:id', async (req, res) => {
  try {
    const userId = (req.query.userId as string) || req.user!.id;
    const sessionId = req.params.id;

    // Authorization check
    if (userId !== req.user!.id) {
      // TODO: Verify user is guardian of dependent
    }

    const deleted = await bpService.deleteSession(sessionId, userId);

    if (!deleted) {
      return res.status(404).json({
        error: 'SESSION_NOT_FOUND',
        message: 'Session not found',
      });
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('[BP API] Error deleting session:', error);
    res.status(500).json({
      error: 'SERVER_ERROR',
      message: error.message || 'Failed to delete session',
    });
  }
});

// ==================== SUGGESTIONS ====================

/**
 * GET /api/bp/suggestions?userId=<optional>
 * Get suggestions
 */
router.get('/suggestions', async (req, res) => {
  try {
    const userId = (req.query.userId as string) || req.user!.id;

    // Authorization check
    if (userId !== req.user!.id) {
      // TODO: Verify user is guardian of dependent
    }

    const suggestions = await bpService.getSuggestions(userId);

    res.json(suggestions);
  } catch (error: any) {
    console.error('[BP API] Error getting suggestions:', error);
    res.status(500).json({
      error: 'SERVER_ERROR',
      message: error.message || 'Failed to get suggestions',
    });
  }
});

// ==================== ANALYTICS ====================

/**
 * GET /api/bp/analytics?userId=<optional>&days=<>
 * Get analytics and patterns
 */
router.get('/analytics', async (req, res) => {
  try {
    const userId = (req.query.userId as string) || req.user!.id;
    const days = req.query.days ? parseInt(req.query.days as string, 10) : 7;

    // Authorization check
    if (userId !== req.user!.id) {
      // TODO: Verify user is guardian of dependent
    }

    const analytics = await bpService.getAnalytics(userId, days);

    res.json(analytics);
  } catch (error: any) {
    console.error('[BP API] Error getting analytics:', error);
    res.status(500).json({
      error: 'SERVER_ERROR',
      message: error.message || 'Failed to get analytics',
    });
  }
});

// ==================== EXPORT / DELETE ====================

/**
 * GET /api/bp/export?userId=<optional>
 * Export all BP data
 */
router.get('/export', async (req, res) => {
  try {
    const userId = (req.query.userId as string) || req.user!.id;

    // Authorization check
    if (userId !== req.user!.id) {
      // TODO: Verify user is guardian of dependent
    }

    const exportData = await bpService.exportData(userId);

    res.json(exportData);
  } catch (error: any) {
    console.error('[BP API] Error exporting data:', error);
    res.status(500).json({
      error: 'SERVER_ERROR',
      message: error.message || 'Failed to export data',
    });
  }
});

/**
 * DELETE /api/bp/all?userId=<optional>
 * Delete all BP data
 */
router.delete('/all', async (req, res) => {
  try {
    const userId = (req.query.userId as string) || req.user!.id;

    // Authorization check
    if (userId !== req.user!.id) {
      // TODO: Verify user is guardian of dependent
    }

    const result = await bpService.deleteAllData(userId);

    res.json(result);
  } catch (error: any) {
    console.error('[BP API] Error deleting all data:', error);
    res.status(500).json({
      error: 'SERVER_ERROR',
      message: error.message || 'Failed to delete data',
    });
  }
});

export default router;

