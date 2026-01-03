import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../auth/auth.types.js';
import { 
  dependentService, 
  DependentError,
} from '../services/dependent.service.js';

const router: RouterType = Router();

// Route parameter types - with index signature for Express compatibility
interface DependentParams {
  id: string;
  [key: string]: string;
}

interface ManagerParams {
  id: string;
  managerId: string;
  [key: string]: string;
}

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
 * Throws UnauthorizedError if not authenticated
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
 * Handle errors including unauthorized
 */
function handleError(error: unknown, res: Response, defaultMessage: string) {
  if (error instanceof UnauthorizedError) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  if (error instanceof DependentError) {
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

/**
 * All routes in this file require authentication.
 * The authenticate middleware in server.ts adds req.user with userId and email.
 */

// Validation schemas
const createDependentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  dateOfBirth: z.string().refine(
    (date) => !isNaN(Date.parse(date)),
    'Invalid date format'
  ).transform((date) => new Date(date)),
  relationship: z.enum(['parent', 'guardian', 'spouse', 'sibling', 'grandparent', 'other']),
  language: z.string().optional(),
});

const addManagerSchema = z.object({
  managerId: z.string().min(1, 'Manager ID is required').optional(),
  email: z.string().email('Invalid email format').optional(),
  relationship: z.enum(['parent', 'guardian', 'spouse', 'sibling', 'grandparent', 'other']),
}).refine(data => data.managerId || data.email, {
  message: 'Either managerId or email is required',
});

const updateDependentSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  dateOfBirth: z.string().refine(
    (date) => !isNaN(Date.parse(date)),
    'Invalid date format'
  ).transform((date) => new Date(date)).optional(),
  language: z.string().optional(),
});

const updateRelationshipSchema = z.object({
  relationship: z.enum(['parent', 'guardian', 'spouse', 'sibling', 'grandparent', 'other']),
});

const profileUpdateSchema = z.object({
  demographics: z.object({
    dateOfBirth: z.string().transform(val => new Date(val)).optional(),
    age: z.number().optional(),
    sexAtBirth: z.enum(['male', 'female', 'other']).optional(),
    heightCm: z.number().optional(),
    weightKg: z.number().optional(),
  }).optional(),
  medicalHistory: z.object({
    chronicConditions: z.array(z.string()).optional(),
    allergies: z.array(z.string()).optional(),
    medications: z.array(z.string()).optional(),
    surgeries: z.array(z.string()).optional(),
    familyHistory: z.array(z.string()).optional(),
  }).optional(),
  lifestyle: z.object({
    smoking: z.enum(['never', 'former', 'current']).optional(),
    alcohol: z.enum(['never', 'occasional', 'regular', 'heavy']).optional(),
    exercise: z.enum(['sedentary', 'light', 'moderate', 'active']).optional(),
    diet: z.string().optional(),
  }).optional(),
});

/**
 * POST /api/dependents
 * Create a new dependent
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const managerId = requireAuth(req);

    const validation = createDependentSchema.safeParse(req.body);
    if (!validation.success) {
      const firstIssue = validation.error.issues?.[0];
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: firstIssue?.message || 'Validation failed',
        details: validation.error.issues,
      });
    }

    const dependent = await dependentService.createDependent(managerId, validation.data);
    res.status(201).json(dependent);
  } catch (error) {
    handleError(error, res, 'Failed to create dependent');
  }
});

/**
 * GET /api/dependents
 * Get all dependents for the authenticated user
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const managerId = requireAuth(req);
    const dependents = await dependentService.getDependents(managerId);
    res.json(dependents);
  } catch (error) {
    handleError(error, res, 'Failed to get dependents');
  }
});

/**
 * GET /api/dependents/:id
 * Get a specific dependent
 */
router.get('/:id', async (req: Request<DependentParams>, res: Response) => {
  try {
    const managerId = requireAuth(req);
    const { id: dependentId } = req.params;
    const dependent = await dependentService.getDependent(managerId, dependentId);
    res.json(dependent);
  } catch (error) {
    handleError(error, res, 'Failed to get dependent');
  }
});

/**
 * PATCH /api/dependents/:id
 * Update a dependent's basic info
 */
router.patch('/:id', async (req: Request<DependentParams>, res: Response) => {
  try {
    const managerId = requireAuth(req);
    const { id: dependentId } = req.params;

    const validation = updateDependentSchema.safeParse(req.body);
    if (!validation.success) {
      const firstIssue = validation.error.issues?.[0];
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: firstIssue?.message || 'Validation failed',
        details: validation.error.issues,
      });
    }

    const dependent = await dependentService.updateDependent(managerId, dependentId, validation.data);
    res.json(dependent);
  } catch (error) {
    handleError(error, res, 'Failed to update dependent');
  }
});

/**
 * DELETE /api/dependents/:id
 * Delete a dependent and all their data
 */
router.delete('/:id', async (req: Request<DependentParams>, res: Response) => {
  try {
    const managerId = requireAuth(req);
    const { id: dependentId } = req.params;
    const result = await dependentService.deleteDependent(managerId, dependentId);
    res.json(result);
  } catch (error) {
    handleError(error, res, 'Failed to delete dependent');
  }
});

/**
 * GET /api/dependents/:id/managers
 * Get all managers of a dependent
 */
router.get('/:id/managers', async (req: Request<DependentParams>, res: Response) => {
  try {
    const managerId = requireAuth(req);
    const { id: dependentId } = req.params;
    const managers = await dependentService.getManagers(managerId, dependentId);
    res.json(managers);
  } catch (error) {
    handleError(error, res, 'Failed to get managers');
  }
});

/**
 * POST /api/dependents/:id/managers
 * Add a manager to a dependent (by ID or email)
 */
router.post('/:id/managers', async (req: Request<DependentParams>, res: Response) => {
  try {
    const requesterId = requireAuth(req);
    const { id: dependentId } = req.params;

    const validation = addManagerSchema.safeParse(req.body);
    if (!validation.success) {
      const firstIssue = validation.error.issues?.[0];
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: firstIssue?.message || 'Validation failed',
        details: validation.error.issues,
      });
    }

    // If email is provided, look up the manager by email
    let managerId = validation.data.managerId;
    if (!managerId && validation.data.email) {
      const result = await dependentService.addManagerByEmail(requesterId, {
        dependentId,
        email: validation.data.email,
        relationship: validation.data.relationship,
      });
      return res.json(result);
    }

    if (!managerId) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Either managerId or email is required',
      });
    }

    const result = await dependentService.addManager(requesterId, {
      dependentId,
      managerId,
      relationship: validation.data.relationship,
    });
    res.json(result);
  } catch (error) {
    handleError(error, res, 'Failed to add manager');
  }
});

/**
 * DELETE /api/dependents/:id/managers/:managerId
 * Remove a manager from a dependent
 */
router.delete('/:id/managers/:managerId', async (req: Request<ManagerParams>, res: Response) => {
  try {
    const requesterId = requireAuth(req);
    const { id: dependentId, managerId: managerToRemoveId } = req.params;
    const result = await dependentService.removeManager(requesterId, dependentId, managerToRemoveId);
    res.json(result);
  } catch (error) {
    handleError(error, res, 'Failed to remove manager');
  }
});

/**
 * PATCH /api/dependents/:id/relationship
 * Update the relationship between current user and dependent
 */
router.patch('/:id/relationship', async (req: Request<DependentParams>, res: Response) => {
  try {
    const managerId = requireAuth(req);
    const { id: dependentId } = req.params;

    const validation = updateRelationshipSchema.safeParse(req.body);
    if (!validation.success) {
      const firstIssue = validation.error.issues?.[0];
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: firstIssue?.message || 'Validation failed',
        details: validation.error.issues,
      });
    }

    const dependent = await dependentService.updateRelationship(managerId, dependentId, validation.data.relationship);
    res.json(dependent);
  } catch (error) {
    handleError(error, res, 'Failed to update relationship');
  }
});

/**
 * GET /api/dependents/:id/profile
 * Get dependent's health profile (returns empty structure if none exists)
 */
router.get('/:id/profile', async (req: Request<DependentParams>, res: Response) => {
  try {
    const managerId = requireAuth(req);
    const { id: dependentId } = req.params;
    const profile = await dependentService.getDependentProfile(managerId, dependentId);
    
    // Return profile or an empty structure if none exists
    if (!profile) {
      return res.json({
        userId: dependentId,
        demographics: {},
        medicalHistory: {
          chronicConditions: [],
          allergies: [],
          medications: [],
          surgeries: [],
          familyHistory: [],
        },
        lifestyle: {},
      });
    }
    res.json(profile);
  } catch (error) {
    handleError(error, res, 'Failed to get profile');
  }
});

/**
 * PATCH /api/dependents/:id/profile
 * Update dependent's health profile
 */
router.patch('/:id/profile', async (req: Request<DependentParams>, res: Response) => {
  try {
    const managerId = requireAuth(req);
    const { id: dependentId } = req.params;

    const validation = profileUpdateSchema.safeParse(req.body);
    if (!validation.success) {
      const firstIssue = validation.error.issues?.[0];
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: firstIssue?.message || 'Validation failed',
        details: validation.error.issues,
      });
    }

    const profile = await dependentService.updateDependentProfile(managerId, dependentId, validation.data);
    res.json(profile);
  } catch (error) {
    handleError(error, res, 'Failed to update profile');
  }
});

/**
 * GET /api/dependents/:id/sessions
 * Get dependent's session history
 */
router.get('/:id/sessions', async (req: Request<DependentParams>, res: Response) => {
  try {
    const managerId = requireAuth(req);
    const { id: dependentId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = parseInt(req.query.skip as string) || 0;

    const sessions = await dependentService.getDependentSessions(managerId, dependentId, { limit, skip });
    res.json(sessions);
  } catch (error) {
    handleError(error, res, 'Failed to get sessions');
  }
});

export default router;

