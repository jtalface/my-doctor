import { z } from 'zod';
import {
  UserRole,
  LocationType,
  Shift,
  FFDDecision,
  AssessmentStatus,
  ActionTaken,
  JobRoleTag,
} from './types.js';

// ==================== AUTH ====================

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
export type LoginInput = z.infer<typeof loginSchema>;

// ==================== USER ====================

export const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum([UserRole.ADMIN, UserRole.ASSESSOR, UserRole.VIEWER, UserRole.EMPLOYEE]),
  locationIds: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = createUserSchema.partial().omit({ password: true }).extend({
  password: z.string().min(8).optional(),
});
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

// ==================== LOCATION ====================

export const createLocationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  type: z.enum([LocationType.ONSHORE, LocationType.OFFSHORE, LocationType.REFINERY, LocationType.PIPELINE]),
  region: z.string().min(2, 'Region must be at least 2 characters'),
  isActive: z.boolean().default(true),
});
export type CreateLocationInput = z.infer<typeof createLocationSchema>;

export const updateLocationSchema = createLocationSchema.partial();
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;

// ==================== JOB ROLE ====================

export const createJobRoleSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  safetyCritical: z.boolean().default(false),
  tags: z.array(z.enum([
    JobRoleTag.WORKING_AT_HEIGHTS,
    JobRoleTag.CONFINED_SPACE,
    JobRoleTag.CRANE,
    JobRoleTag.ELECTRICAL,
    JobRoleTag.H2S,
    JobRoleTag.HEAVY_EQUIPMENT,
  ])).default([]),
  isActive: z.boolean().default(true),
});
export type CreateJobRoleInput = z.infer<typeof createJobRoleSchema>;

export const updateJobRoleSchema = createJobRoleSchema.partial();
export type UpdateJobRoleInput = z.infer<typeof updateJobRoleSchema>;

// ==================== CHECKLIST TEMPLATE ====================

export const checklistItemSchema = z.object({
  id: z.string(),
  text: z.string().min(1),
  isRedFlag: z.boolean().optional(),
});

export const checklistSectionSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  items: z.array(checklistItemSchema),
  hasVitals: z.boolean().optional(),
  hasSleepHours: z.boolean().optional(),
  hasFatigueScore: z.boolean().optional(),
  hasBACTest: z.boolean().optional(),
});

export const createTemplateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  sections: z.array(checklistSectionSchema).min(1, 'At least one section is required'),
  isActive: z.boolean().default(true),
});
export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;

export const updateTemplateSchema = createTemplateSchema.partial();
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;

// ==================== ASSESSMENT ====================

export const itemResultSchema = z.object({
  itemId: z.string(),
  passed: z.boolean(),
  comment: z.string().max(500).optional(),
});

export const sectionResultSchema = z.object({
  sectionId: z.string(),
  sectionName: z.string(),
  items: z.array(itemResultSchema),
  passed: z.boolean(),
  sleepHours: z.number().min(0).max(24).optional(),
  fatigueScore: z.number().min(1).max(10).optional(),
  bacReading: z.number().min(0).max(1).optional(),
});

export const vitalsSchema = z.object({
  bpSystolic: z.number().min(60).max(250).optional(),
  bpDiastolic: z.number().min(40).max(150).optional(),
  heartRate: z.number().min(30).max(220).optional(),
  spo2: z.number().min(50).max(100).optional(),
});

export const signaturesSchema = z.object({
  employeeName: z.string().min(2),
  employeeSignedAt: z.string().datetime().optional(),
  assessorName: z.string().min(2),
  assessorSignedAt: z.string().datetime().optional(),
});

export const createAssessmentSchema = z.object({
  templateId: z.string(),
  employeeName: z.string().min(2, 'Employee name is required'),
  employeeId: z.string().min(1, 'Employee ID is required'),
  jobRoleId: z.string(),
  locationId: z.string(),
  shift: z.enum([Shift.DAY, Shift.NIGHT]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  sections: z.array(sectionResultSchema).optional(),
  vitals: vitalsSchema.optional(),
  finalDecision: z.enum([
    FFDDecision.FIT,
    FFDDecision.FIT_WITH_RESTRICTIONS,
    FFDDecision.TEMP_UNFIT,
    FFDDecision.UNFIT,
  ]).optional(),
  restrictionsText: z.string().max(1000).optional(),
  actionsTaken: z.array(z.enum([
    ActionTaken.REASSIGNED,
    ActionTaken.REST,
    ActionTaken.MEDICAL_EVAL,
    ActionTaken.SENT_OFFSITE,
  ])).default([]),
  notes: z.string().max(2000).optional(),
  signatures: signaturesSchema.optional(),
});
export type CreateAssessmentInput = z.infer<typeof createAssessmentSchema>;

export const updateAssessmentSchema = createAssessmentSchema.partial();
export type UpdateAssessmentInput = z.infer<typeof updateAssessmentSchema>;

export const submitAssessmentSchema = z.object({
  sections: z.array(sectionResultSchema).min(1, 'All sections must be completed'),
  vitals: vitalsSchema.optional(),
  finalDecision: z.enum([
    FFDDecision.FIT,
    FFDDecision.FIT_WITH_RESTRICTIONS,
    FFDDecision.TEMP_UNFIT,
    FFDDecision.UNFIT,
  ]),
  restrictionsText: z.string().max(1000).optional(),
  actionsTaken: z.array(z.enum([
    ActionTaken.REASSIGNED,
    ActionTaken.REST,
    ActionTaken.MEDICAL_EVAL,
    ActionTaken.SENT_OFFSITE,
  ])).default([]),
  notes: z.string().max(2000).optional(),
  signatures: signaturesSchema,
}).refine(
  (data) => {
    // If FIT_WITH_RESTRICTIONS, restrictionsText is required
    if (data.finalDecision === FFDDecision.FIT_WITH_RESTRICTIONS) {
      return !!data.restrictionsText && data.restrictionsText.trim().length > 0;
    }
    return true;
  },
  { message: 'Restrictions text is required when decision is FIT WITH RESTRICTIONS', path: ['restrictionsText'] }
);
export type SubmitAssessmentInput = z.infer<typeof submitAssessmentSchema>;

export const voidAssessmentSchema = z.object({
  reason: z.string().min(10, 'Void reason must be at least 10 characters'),
});
export type VoidAssessmentInput = z.infer<typeof voidAssessmentSchema>;

// ==================== QUERY PARAMS ====================

export const assessmentQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  locationId: z.string().optional(),
  jobRoleId: z.string().optional(),
  decision: z.enum([
    FFDDecision.FIT,
    FFDDecision.FIT_WITH_RESTRICTIONS,
    FFDDecision.TEMP_UNFIT,
    FFDDecision.UNFIT,
  ]).optional(),
  assessorUserId: z.string().optional(),
  employeeId: z.string().optional(),
  status: z.enum([
    AssessmentStatus.DRAFT,
    AssessmentStatus.SUBMITTED,
    AssessmentStatus.VOIDED,
  ]).optional(),
});
export type AssessmentQueryInput = z.infer<typeof assessmentQuerySchema>;
