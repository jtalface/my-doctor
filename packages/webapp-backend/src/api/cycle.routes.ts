import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../auth/auth.types.js';
import * as cycleService from '../services/cycle.service.js';
import { CycleError } from '../services/cycle.service.js';

const router: RouterType = Router();

/**
 * Custom error for unauthorized access
 */
class UnauthorizedError extends Error {
  constructor() {
    super('Unauthorized');
    this.name = 'UnauthorizedError';
  }
}

/**
 * Helper to extract user ID from authenticated request
 */
function requireAuth(req: Request<any>): string {
  const authReq = req as unknown as AuthenticatedRequest;
  const userId = authReq.user?.userId;
  if (!userId) {
    throw new UnauthorizedError();
  }
  return userId;
}

/**
 * Get target user ID from query or use authenticated user
 * Allows managers to access dependent data via ?userId=dependentId
 */
function getTargetUserId(req: Request<any>): { requesterId: string; targetUserId: string } {
  const requesterId = requireAuth(req);
  const targetUserId = (req.query.userId as string) || requesterId;
  return { requesterId, targetUserId };
}

/**
 * Handle errors
 */
function handleError(error: unknown, res: Response, defaultMessage: string) {
  if (error instanceof UnauthorizedError) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  if (error instanceof CycleError) {
    return res.status(error.statusCode).json({
      error: error.code,
      message: error.message,
    });
  }
  
  console.error(`[API] ${defaultMessage}:`, error);
  res.status(500).json({ 
    error: defaultMessage,
    details: error instanceof Error ? error.message : 'Unknown error'
  });
}

// ==================== VALIDATION SCHEMAS ====================

const createSettingsSchema = z.object({
  lastPeriodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  averageCycleLength: z.number().int().min(21).max(45).optional(),
  averagePeriodLength: z.number().int().min(2).max(10).optional(),
  irregularCycle: z.boolean().optional(),
  reminders: z.object({
    periodExpected: z.boolean().optional(),
    periodExpectedDays: z.number().int().min(0).max(7).optional(),
    fertileWindow: z.boolean().optional(),
  }).optional(),
});

const updateSettingsSchema = z.object({
  lastPeriodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  averageCycleLength: z.number().int().min(21).max(45).optional(),
  averagePeriodLength: z.number().int().min(2).max(10).optional(),
  irregularCycle: z.boolean().optional(),
  isActive: z.boolean().optional(),
  reminders: z.object({
    periodExpected: z.boolean().optional(),
    periodExpectedDays: z.number().int().min(0).max(7).optional(),
    fertileWindow: z.boolean().optional(),
  }).optional(),
});

const createDailyLogSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  isPeriodDay: z.boolean().optional(),
  flowLevel: z.enum(['none', 'light', 'medium', 'heavy']).optional(),
  symptoms: z.array(z.enum([
    'cramps',
    'headache',
    'bloating',
    'acne',
    'breast_tenderness',
    'fatigue',
    'nausea',
    'back_pain',
  ])).optional(),
  mood: z.array(z.enum([
    'happy',
    'anxious',
    'irritable',
    'sad',
    'energetic',
    'calm',
  ])).optional(),
  notes: z.string().max(500).optional(),
});

const dateRangeSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
});

const importDataSchema = z.object({
  settings: createSettingsSchema.optional(),
  dailyLogs: z.array(createDailyLogSchema).optional(),
  replace: z.boolean().optional(),
});

// ==================== ROUTES ====================

/**
 * GET /api/cycle/settings
 * Get cycle settings for user
 * Query params: ?userId=<dependentId> (optional, for managers accessing dependent data)
 */
router.get('/settings', async (req: Request, res: Response) => {
  try {
    const { requesterId, targetUserId } = getTargetUserId(req);
    const settings = await cycleService.getSettings(requesterId, targetUserId);
    
    if (!settings) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Cycle settings not found' });
    }
    
    res.json(settings);
  } catch (error) {
    handleError(error, res, 'Failed to get cycle settings');
  }
});

/**
 * POST /api/cycle/settings
 * Create cycle settings (onboarding)
 * Query params: ?userId=<dependentId> (optional, for managers setting up dependent)
 */
router.post('/settings', async (req: Request, res: Response) => {
  try {
    const { requesterId, targetUserId } = getTargetUserId(req);
    
    const validation = createSettingsSchema.safeParse(req.body);
    if (!validation.success) {
      const firstIssue = validation.error.issues?.[0];
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: firstIssue?.message || 'Validation failed',
        details: validation.error.issues,
      });
    }
    
    const settings = await cycleService.createSettings(requesterId, targetUserId, validation.data);
    res.status(201).json(settings);
  } catch (error) {
    handleError(error, res, 'Failed to create cycle settings');
  }
});

/**
 * PATCH /api/cycle/settings
 * Update cycle settings
 * Query params: ?userId=<dependentId> (optional)
 */
router.patch('/settings', async (req: Request, res: Response) => {
  try {
    const { requesterId, targetUserId } = getTargetUserId(req);
    
    const validation = updateSettingsSchema.safeParse(req.body);
    if (!validation.success) {
      const firstIssue = validation.error.issues?.[0];
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: firstIssue?.message || 'Validation failed',
        details: validation.error.issues,
      });
    }
    
    const settings = await cycleService.updateSettings(requesterId, targetUserId, validation.data);
    res.json(settings);
  } catch (error) {
    handleError(error, res, 'Failed to update cycle settings');
  }
});

/**
 * POST /api/cycle/logs
 * Create or update a daily log
 * Query params: ?userId=<dependentId> (optional)
 */
router.post('/logs', async (req: Request, res: Response) => {
  try {
    const { requesterId, targetUserId } = getTargetUserId(req);
    
    const validation = createDailyLogSchema.safeParse(req.body);
    if (!validation.success) {
      const firstIssue = validation.error.issues?.[0];
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: firstIssue?.message || 'Validation failed',
        details: validation.error.issues,
      });
    }
    
    const log = await cycleService.createOrUpdateDailyLog(requesterId, targetUserId, validation.data);
    res.status(201).json(log);
  } catch (error) {
    handleError(error, res, 'Failed to create daily log');
  }
});

/**
 * GET /api/cycle/logs
 * Get daily logs for a date range
 * Query params: 
 *   - startDate (required): YYYY-MM-DD
 *   - endDate (required): YYYY-MM-DD
 *   - userId (optional): for managers accessing dependent data
 */
router.get('/logs', async (req: Request, res: Response) => {
  try {
    const { requesterId, targetUserId } = getTargetUserId(req);
    
    const validation = dateRangeSchema.safeParse({
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    });
    
    if (!validation.success) {
      const firstIssue = validation.error.issues?.[0];
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: firstIssue?.message || 'Validation failed',
        details: validation.error.issues,
      });
    }
    
    const logs = await cycleService.getDailyLogs(
      requesterId,
      targetUserId,
      validation.data.startDate,
      validation.data.endDate
    );
    res.json(logs);
  } catch (error) {
    handleError(error, res, 'Failed to get daily logs');
  }
});

/**
 * DELETE /api/cycle/logs/:date
 * Delete a daily log
 * Query params: ?userId=<dependentId> (optional)
 */
router.delete('/logs/:date', async (req: Request, res: Response) => {
  try {
    const { requesterId, targetUserId } = getTargetUserId(req);
    const { date } = req.params;
    
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Date must be in YYYY-MM-DD format',
      });
    }
    
    const result = await cycleService.deleteDailyLog(requesterId, targetUserId, date);
    res.json(result);
  } catch (error) {
    handleError(error, res, 'Failed to delete daily log');
  }
});

/**
 * GET /api/cycle/cycles
 * Get all cycles (historical data)
 * Query params: ?userId=<dependentId> (optional)
 */
router.get('/cycles', async (req: Request, res: Response) => {
  try {
    const { requesterId, targetUserId } = getTargetUserId(req);
    const cycles = await cycleService.getCycles(requesterId, targetUserId);
    res.json(cycles);
  } catch (error) {
    handleError(error, res, 'Failed to get cycles');
  }
});

/**
 * GET /api/cycle/predictions
 * Get predictions for next period and fertile window
 * Query params: ?userId=<dependentId> (optional)
 */
router.get('/predictions', async (req: Request, res: Response) => {
  try {
    const { requesterId, targetUserId } = getTargetUserId(req);
    const predictions = await cycleService.getPredictions(requesterId, targetUserId);
    res.json(predictions);
  } catch (error) {
    handleError(error, res, 'Failed to get predictions');
  }
});

/**
 * GET /api/cycle/export
 * Export all cycle data as JSON
 * Query params: ?userId=<dependentId> (optional)
 */
router.get('/export', async (req: Request, res: Response) => {
  try {
    const { requesterId, targetUserId } = getTargetUserId(req);
    const data = await cycleService.exportData(requesterId, targetUserId);
    
    // Set headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="cycle-data-${targetUserId}-${Date.now()}.json"`);
    
    res.json(data);
  } catch (error) {
    handleError(error, res, 'Failed to export cycle data');
  }
});

/**
 * POST /api/cycle/import
 * Import cycle data from JSON
 * Query params: ?userId=<dependentId> (optional)
 */
router.post('/import', async (req: Request, res: Response) => {
  try {
    const { requesterId, targetUserId } = getTargetUserId(req);
    
    const validation = importDataSchema.safeParse(req.body);
    if (!validation.success) {
      const firstIssue = validation.error.issues?.[0];
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: firstIssue?.message || 'Validation failed',
        details: validation.error.issues,
      });
    }
    
    const result = await cycleService.importData(requesterId, targetUserId, validation.data);
    res.json(result);
  } catch (error) {
    handleError(error, res, 'Failed to import cycle data');
  }
});

/**
 * DELETE /api/cycle/all
 * Delete all cycle data for user (requires confirmation)
 * Query params: ?userId=<dependentId> (optional)
 */
router.delete('/all', async (req: Request, res: Response) => {
  try {
    const { requesterId, targetUserId } = getTargetUserId(req);
    const result = await cycleService.deleteAllData(requesterId, targetUserId);
    res.json(result);
  } catch (error) {
    handleError(error, res, 'Failed to delete cycle data');
  }
});

export default router;

