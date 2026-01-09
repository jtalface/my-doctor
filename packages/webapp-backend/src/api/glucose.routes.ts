/**
 * Glucose Tracking API Routes
 * 
 * All routes require authentication
 * Supports both user and dependent tracking via ?userId=<dependentId>
 */

import { Router } from 'express';
import * as glucoseService from '../services/glucose.service.js';

const router = Router();

// ==================== SETTINGS ====================

/**
 * GET /api/glucose/settings?userId=<optional>
 * Get glucose settings
 */
router.get('/settings', async (req, res) => {
  try {
    const userId = (req.query.userId as string) || req.user!.id;

    // Authorization: check if user can access this data
    if (userId !== req.user!.id) {
      // TODO: Verify user is guardian of dependent
      // For now, allow if userId is provided
    }

    const settings = await glucoseService.getSettings(userId);

    if (!settings) {
      return res.status(404).json({
        error: 'SETTINGS_NOT_FOUND',
        message: 'Glucose settings not found. Complete onboarding first.',
      });
    }

    res.json(settings);
  } catch (error: any) {
    console.error('[Glucose API] Error getting settings:', error);
    res.status(500).json({
      error: 'SERVER_ERROR',
      message: error.message || 'Failed to get settings',
    });
  }
});

/**
 * POST /api/glucose/settings?userId=<optional>
 * Create glucose settings (onboarding)
 */
router.post('/settings', async (req, res) => {
  try {
    const userId = (req.query.userId as string) || req.user!.id;
    const profileType = req.query.userId ? 'dependent' : 'user';

    // Authorization check
    if (userId !== req.user!.id) {
      // TODO: Verify user is guardian of dependent
    }

    const { diabetesType, unitPreference, targetRanges, medications } = req.body;

    if (!diabetesType) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Diabetes type is required',
      });
    }

    // Check if settings already exist
    const existing = await glucoseService.getSettings(userId);
    if (existing) {
      return res.status(409).json({
        error: 'SETTINGS_EXIST',
        message: 'Settings already exist. Use PATCH to update.',
      });
    }

    const settings = await glucoseService.createSettings(userId, profileType, {
      diabetesType,
      unitPreference,
      targetRanges,
      medications,
    });

    res.status(201).json(settings);
  } catch (error: any) {
    console.error('[Glucose API] Error creating settings:', error);
    res.status(500).json({
      error: 'SERVER_ERROR',
      message: error.message || 'Failed to create settings',
    });
  }
});

/**
 * PATCH /api/glucose/settings?userId=<optional>
 * Update glucose settings
 */
router.patch('/settings', async (req, res) => {
  try {
    const userId = (req.query.userId as string) || req.user!.id;

    // Authorization check
    if (userId !== req.user!.id) {
      // TODO: Verify user is guardian of dependent
    }

    const settings = await glucoseService.updateSettings(userId, req.body);

    if (!settings) {
      return res.status(404).json({
        error: 'SETTINGS_NOT_FOUND',
        message: 'Settings not found',
      });
    }

    res.json(settings);
  } catch (error: any) {
    console.error('[Glucose API] Error updating settings:', error);
    res.status(500).json({
      error: 'SERVER_ERROR',
      message: error.message || 'Failed to update settings',
    });
  }
});

// ==================== READINGS ====================

/**
 * POST /api/glucose/readings?userId=<optional>
 * Create a glucose reading
 */
router.post('/readings', async (req, res) => {
  try {
    const userId = (req.query.userId as string) || req.user!.id;
    const profileType = req.query.userId ? 'dependent' : 'user';

    // Authorization check
    if (userId !== req.user!.id) {
      // TODO: Verify user is guardian of dependent
    }

    const {
      timestamp,
      glucoseValue,
      unit,
      context,
      carbsGrams,
      insulinUnits,
      activityMinutes,
      symptoms,
      notes,
    } = req.body;

    // Validation
    if (!timestamp || !glucoseValue || !unit || !context) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Missing required fields: timestamp, glucoseValue, unit, context',
      });
    }

    const reading = await glucoseService.createReading(userId, profileType, {
      timestamp: new Date(timestamp),
      glucoseValue,
      unit,
      context,
      carbsGrams,
      insulinUnits,
      activityMinutes,
      symptoms,
      notes,
    });

    res.status(201).json(reading);
  } catch (error: any) {
    console.error('[Glucose API] Error creating reading:', error);
    res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: error.message || 'Failed to create reading',
    });
  }
});

/**
 * GET /api/glucose/readings?userId=<optional>&startDate=<>&endDate=<>&context=<>&limit=<>
 * Get glucose readings
 */
router.get('/readings', async (req, res) => {
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

    if (req.query.limit) {
      options.limit = parseInt(req.query.limit as string, 10);
    }

    const readings = await glucoseService.getReadings(userId, options);

    res.json(readings);
  } catch (error: any) {
    console.error('[Glucose API] Error getting readings:', error);
    res.status(500).json({
      error: 'SERVER_ERROR',
      message: error.message || 'Failed to get readings',
    });
  }
});

/**
 * PATCH /api/glucose/readings/:id?userId=<optional>
 * Update a glucose reading
 */
router.patch('/readings/:id', async (req, res) => {
  try {
    const userId = (req.query.userId as string) || req.user!.id;
    const readingId = req.params.id;

    // Authorization check
    if (userId !== req.user!.id) {
      // TODO: Verify user is guardian of dependent
    }

    const reading = await glucoseService.updateReading(readingId, userId, req.body);

    if (!reading) {
      return res.status(404).json({
        error: 'READING_NOT_FOUND',
        message: 'Reading not found',
      });
    }

    res.json(reading);
  } catch (error: any) {
    console.error('[Glucose API] Error updating reading:', error);
    res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: error.message || 'Failed to update reading',
    });
  }
});

/**
 * DELETE /api/glucose/readings/:id?userId=<optional>
 * Delete a glucose reading
 */
router.delete('/readings/:id', async (req, res) => {
  try {
    const userId = (req.query.userId as string) || req.user!.id;
    const readingId = req.params.id;

    // Authorization check
    if (userId !== req.user!.id) {
      // TODO: Verify user is guardian of dependent
    }

    const deleted = await glucoseService.deleteReading(readingId, userId);

    if (!deleted) {
      return res.status(404).json({
        error: 'READING_NOT_FOUND',
        message: 'Reading not found',
      });
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('[Glucose API] Error deleting reading:', error);
    res.status(500).json({
      error: 'SERVER_ERROR',
      message: error.message || 'Failed to delete reading',
    });
  }
});

// ==================== SUGGESTIONS ====================

/**
 * GET /api/glucose/suggestions?userId=<optional>
 * Get AI-generated suggestions
 */
router.get('/suggestions', async (req, res) => {
  try {
    const userId = (req.query.userId as string) || req.user!.id;

    // Authorization check
    if (userId !== req.user!.id) {
      // TODO: Verify user is guardian of dependent
    }

    const suggestions = await glucoseService.getSuggestions(userId);

    res.json(suggestions);
  } catch (error: any) {
    console.error('[Glucose API] Error getting suggestions:', error);
    res.status(500).json({
      error: 'SERVER_ERROR',
      message: error.message || 'Failed to get suggestions',
    });
  }
});

// ==================== ANALYTICS ====================

/**
 * GET /api/glucose/analytics?userId=<optional>&days=<>
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

    const analytics = await glucoseService.getAnalytics(userId, days);

    res.json(analytics);
  } catch (error: any) {
    console.error('[Glucose API] Error getting analytics:', error);
    res.status(500).json({
      error: 'SERVER_ERROR',
      message: error.message || 'Failed to get analytics',
    });
  }
});

// ==================== OTHER METRICS ====================

/**
 * POST /api/glucose/metrics?userId=<optional>
 * Create or update other metrics (weight, BP, A1C)
 */
router.post('/metrics', async (req, res) => {
  try {
    const userId = (req.query.userId as string) || req.user!.id;
    const profileType = req.query.userId ? 'dependent' : 'user';

    // Authorization check
    if (userId !== req.user!.id) {
      // TODO: Verify user is guardian of dependent
    }

    const { date, weight, bloodPressure, a1c } = req.body;

    if (!date) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Date is required',
      });
    }

    const metrics = await glucoseService.createOrUpdateMetrics(
      userId,
      profileType,
      new Date(date),
      { weight, bloodPressure, a1c }
    );

    res.status(201).json(metrics);
  } catch (error: any) {
    console.error('[Glucose API] Error creating metrics:', error);
    res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: error.message || 'Failed to create metrics',
    });
  }
});

/**
 * GET /api/glucose/metrics?userId=<optional>&startDate=<>&endDate=<>
 * Get other metrics
 */
router.get('/metrics', async (req, res) => {
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

    const metrics = await glucoseService.getMetrics(userId, options);

    res.json(metrics);
  } catch (error: any) {
    console.error('[Glucose API] Error getting metrics:', error);
    res.status(500).json({
      error: 'SERVER_ERROR',
      message: error.message || 'Failed to get metrics',
    });
  }
});

// ==================== EXPORT / DELETE ====================

/**
 * GET /api/glucose/export?userId=<optional>
 * Export all glucose data
 */
router.get('/export', async (req, res) => {
  try {
    const userId = (req.query.userId as string) || req.user!.id;

    // Authorization check
    if (userId !== req.user!.id) {
      // TODO: Verify user is guardian of dependent
    }

    const exportData = await glucoseService.exportData(userId);

    res.json(exportData);
  } catch (error: any) {
    console.error('[Glucose API] Error exporting data:', error);
    res.status(500).json({
      error: 'SERVER_ERROR',
      message: error.message || 'Failed to export data',
    });
  }
});

/**
 * DELETE /api/glucose/all?userId=<optional>
 * Delete all glucose data
 */
router.delete('/all', async (req, res) => {
  try {
    const userId = (req.query.userId as string) || req.user!.id;

    // Authorization check
    if (userId !== req.user!.id) {
      // TODO: Verify user is guardian of dependent
    }

    const result = await glucoseService.deleteAllData(userId);

    res.json(result);
  } catch (error: any) {
    console.error('[Glucose API] Error deleting all data:', error);
    res.status(500).json({
      error: 'SERVER_ERROR',
      message: error.message || 'Failed to delete data',
    });
  }
});

export default router;

