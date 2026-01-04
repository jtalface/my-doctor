/**
 * Vaccination Routes
 * 
 * API endpoints for managing vaccination records and retrieving vaccination schemas.
 */

import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../auth/auth.types.js';
import { PatientProfile } from '../models/patient-profile.model.js';
import { User } from '../models/user.model.js';
import { DependentRelationship } from '../models/dependent-relationship.model.js';
import { 
  MOZ_VACCINATION_SCHEMA,
  getVaccinesForAge,
  getOverdueVaccines,
  getVaccinationProgress,
  type VaccinationRecord,
} from '../medical-protocols/moz/vacinations/vaccination-form.js';

const router: RouterType = Router();

// Route parameter types
interface DependentParams {
  dependentId: string;
  [key: string]: string;
}

interface DoseParams {
  dependentId: string;
  doseId: string;
  [key: string]: string;
}

// Validation schemas
const updateVaccinationRecordSchema = z.object({
  doseId: z.string().min(1, 'Dose ID is required'),
  status: z.enum(['yes', 'no', 'unknown']),
  dateAdministered: z.string().optional().transform(val => val ? new Date(val) : undefined),
  notes: z.string().optional(),
});

const updateVaccinationRecordsSchema = z.object({
  records: z.array(updateVaccinationRecordSchema),
});

/**
 * Helper to extract user ID from authenticated request
 */
function requireAuth(req: Request): string {
  const authReq = req as unknown as AuthenticatedRequest;
  const userId = authReq.user?.userId;
  if (!userId) {
    throw new Error('Unauthorized');
  }
  return userId;
}

/**
 * Check if the authenticated user can manage the given dependent
 */
async function canManageDependent(managerId: string, dependentId: string): Promise<boolean> {
  const relationship = await DependentRelationship.findOne({
    managerId,
    dependentId,
  });
  return !!relationship;
}

/**
 * Calculate age in months from date of birth
 */
function calculateAgeInMonths(dateOfBirth: Date): number {
  const now = new Date();
  const months = (now.getFullYear() - dateOfBirth.getFullYear()) * 12 
    + (now.getMonth() - dateOfBirth.getMonth());
  return Math.max(0, months);
}

// ═══════════════════════════════════════════════════════════════
// PUBLIC ENDPOINTS (schema info)
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/vaccination/schema
 * Get the vaccination schema for a country (default: Mozambique)
 */
router.get('/schema', (_req: Request, res: Response) => {
  // Currently only Mozambique is supported
  res.json({
    schema: MOZ_VACCINATION_SCHEMA,
  });
});

/**
 * GET /api/vaccination/schema/:country
 * Get the vaccination schema for a specific country
 */
router.get('/schema/:country', (req: Request, res: Response) => {
  const { country } = req.params;
  
  // Currently only Mozambique is supported
  if (country !== 'moz') {
    return res.status(404).json({
      error: 'SCHEMA_NOT_FOUND',
      message: `Vaccination schema not available for country: ${country}`,
      availableCountries: ['moz'],
    });
  }
  
  res.json({
    schema: MOZ_VACCINATION_SCHEMA,
  });
});

// ═══════════════════════════════════════════════════════════════
// DEPENDENT VACCINATION ENDPOINTS
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/vaccination/dependent/:dependentId
 * Get vaccination records and status for a dependent
 */
router.get('/dependent/:dependentId', async (req: Request<DependentParams>, res: Response) => {
  try {
    const managerId = requireAuth(req);
    const { dependentId } = req.params;

    // Verify access
    const canManage = await canManageDependent(managerId, dependentId);
    if (!canManage) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'You do not have permission to access this dependent\'s vaccination records',
      });
    }

    // Get dependent user to check age
    const dependent = await User.findById(dependentId);
    if (!dependent) {
      return res.status(404).json({
        error: 'DEPENDENT_NOT_FOUND',
        message: 'Dependent not found',
      });
    }

    // Get patient profile with vaccination records
    const profile = await PatientProfile.findOne({ userId: dependentId });
    
    // Calculate age in months
    const dateOfBirth = dependent.dateOfBirth || profile?.demographics?.dateOfBirth;
    if (!dateOfBirth) {
      return res.status(400).json({
        error: 'DOB_REQUIRED',
        message: 'Date of birth is required to determine vaccination schedule',
      });
    }

    const ageMonths = calculateAgeInMonths(new Date(dateOfBirth));
    const ageYears = Math.floor(ageMonths / 12);

    // Only show vaccination info for children 5 years (60 months) or younger
    // The Mozambique calendar goes up to 59 months
    if (ageMonths > 72) { // Allow some buffer (6 years)
      return res.json({
        applicable: false,
        message: 'Vaccination tracking is only applicable for children under 6 years',
        ageMonths,
        ageYears,
      });
    }

    const records: VaccinationRecord[] = (profile?.vaccinationRecords || []).map(r => ({
      doseId: r.doseId,
      status: r.status,
      dateAdministered: r.dateAdministered?.toISOString(),
      notes: r.notes,
    }));

    // Get relevant vaccines for this age
    const relevantDoses = getVaccinesForAge(ageMonths);
    const overdueDoses = getOverdueVaccines(ageMonths, records);
    const progress = getVaccinationProgress(ageMonths, records);

    // Check if records are missing (no records at all for a child who should have some)
    const hasRecords = records.length > 0;
    const needsAttention = !hasRecords || overdueDoses.length > 0;

    res.json({
      applicable: true,
      dependentId,
      dependentName: dependent.name,
      ageMonths,
      ageYears,
      country: profile?.vaccinationCountry || 'moz',
      records,
      relevantDoses,
      overdueDoses,
      progress,
      hasRecords,
      needsAttention,
      schema: MOZ_VACCINATION_SCHEMA,
    });
  } catch (error) {
    console.error('[Vaccination] Error getting records:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to get vaccination records',
    });
  }
});

/**
 * PUT /api/vaccination/dependent/:dependentId
 * Update vaccination records for a dependent
 */
router.put('/dependent/:dependentId', async (req: Request<DependentParams>, res: Response) => {
  try {
    const managerId = requireAuth(req);
    const { dependentId } = req.params;

    // Verify access
    const canManage = await canManageDependent(managerId, dependentId);
    if (!canManage) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'You do not have permission to update this dependent\'s vaccination records',
      });
    }

    // Validate request body
    const validation = updateVaccinationRecordsSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Invalid vaccination records',
        details: validation.error.issues,
      });
    }

    const { records } = validation.data;

    // Get or create patient profile
    let profile = await PatientProfile.findOne({ userId: dependentId });
    if (!profile) {
      profile = new PatientProfile({
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
        vaccinationRecords: [],
        vaccinationCountry: 'moz',
      });
    }

    // Update vaccination records
    // Merge new records with existing ones (update by doseId)
    const existingRecords = profile.vaccinationRecords || [];
    const recordMap = new Map(existingRecords.map(r => [r.doseId, r]));

    for (const newRecord of records) {
      recordMap.set(newRecord.doseId, {
        doseId: newRecord.doseId,
        status: newRecord.status,
        dateAdministered: newRecord.dateAdministered,
        notes: newRecord.notes,
        updatedAt: new Date(),
      });
    }

    profile.vaccinationRecords = Array.from(recordMap.values());
    profile.lastUpdated = new Date();
    await profile.save();

    // Get updated stats
    const dependent = await User.findById(dependentId);
    const dateOfBirth = dependent?.dateOfBirth || profile.demographics?.dateOfBirth;
    const ageMonths = dateOfBirth ? calculateAgeInMonths(new Date(dateOfBirth)) : 0;
    
    const updatedRecords: VaccinationRecord[] = profile.vaccinationRecords.map(r => ({
      doseId: r.doseId,
      status: r.status,
      dateAdministered: r.dateAdministered?.toISOString(),
      notes: r.notes,
    }));

    const overdueDoses = getOverdueVaccines(ageMonths, updatedRecords);
    const progress = getVaccinationProgress(ageMonths, updatedRecords);

    res.json({
      success: true,
      records: updatedRecords,
      overdueDoses,
      progress,
      needsAttention: overdueDoses.length > 0,
    });
  } catch (error) {
    console.error('[Vaccination] Error updating records:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to update vaccination records',
    });
  }
});

/**
 * PATCH /api/vaccination/dependent/:dependentId/dose/:doseId
 * Update a single vaccination dose record
 */
router.patch('/dependent/:dependentId/dose/:doseId', async (req: Request<DoseParams>, res: Response) => {
  try {
    const managerId = requireAuth(req);
    const { dependentId, doseId } = req.params;

    // Verify access
    const canManage = await canManageDependent(managerId, dependentId);
    if (!canManage) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'You do not have permission to update this dependent\'s vaccination records',
      });
    }

    // Validate request body
    const validation = updateVaccinationRecordSchema.safeParse({ ...req.body, doseId });
    if (!validation.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Invalid vaccination record',
        details: validation.error.issues,
      });
    }

    const recordData = validation.data;

    // Get or create patient profile
    let profile = await PatientProfile.findOne({ userId: dependentId });
    if (!profile) {
      profile = new PatientProfile({
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
        vaccinationRecords: [],
        vaccinationCountry: 'moz',
      });
    }

    // Update or add the specific dose record
    const existingRecords = profile.vaccinationRecords || [];
    const existingIndex = existingRecords.findIndex(r => r.doseId === doseId);

    const newRecord = {
      doseId: recordData.doseId,
      status: recordData.status,
      dateAdministered: recordData.dateAdministered,
      notes: recordData.notes,
      updatedAt: new Date(),
    };

    if (existingIndex >= 0) {
      existingRecords[existingIndex] = newRecord;
    } else {
      existingRecords.push(newRecord);
    }

    profile.vaccinationRecords = existingRecords;
    profile.lastUpdated = new Date();
    await profile.save();

    res.json({
      success: true,
      record: newRecord,
    });
  } catch (error) {
    console.error('[Vaccination] Error updating dose:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to update vaccination record',
    });
  }
});

export { router as vaccinationRoutes };

