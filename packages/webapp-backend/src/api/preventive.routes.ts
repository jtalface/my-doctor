import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import type { AuthenticatedRequest } from '../auth/auth.types.js';
import { PreventiveProfile } from '../models/preventive-profile.model.js';
import { ScreeningCompletion } from '../models/screening-completion.model.js';
import { ScreeningReminder } from '../models/screening-reminder.model.js';
import { deriveLegacyRiskFactors } from '../preventive/riskModifiers.js';
import { generateScreeningSchedule } from '../preventive/screeningRules.js';
import type { ScreeningCode } from '../preventive/types.js';

const router = Router();

const profileSchema = z.object({
  dateOfBirth: z.string().optional(),
  age: z.number().int().min(0).max(120).optional(),
  sexAtBirth: z.enum(['male', 'female', 'other']),
  genderContext: z.string().optional(),
  country: z.string().optional(),
  region: z.string().optional(),
  pregnancyStatus: z.enum(['yes', 'no', 'unknown']).optional(),
  smokingStatus: z.enum(['never', 'former', 'current']).optional(),
  /** nullish = optional + nullable so JSON null clears stored values (Zod 4 rejects null on plain .optional()) */
  heightCm: z.number().min(50).max(280).nullish(),
  weightKg: z.number().min(20).max(400).nullish(),
  bmi: z.number().min(10).max(80).nullish(),
  weightCategory: z.enum(['underweight', 'normal', 'overweight', 'obesity']).nullish(),
  chronicConditions: z.array(z.string()).optional(),
  familyHistory: z.array(z.string()).optional(),
  riskFactors: z
    .object({
      smoker: z.boolean().optional(),
      overweightOrObesity: z.boolean().optional(),
      hypertension: z.boolean().optional(),
      diabetesOrPrediabetes: z.boolean().optional(),
      familyHistoryCancer: z.boolean().optional(),
      familyHistoryCardiovascular: z.boolean().optional(),
    })
    .optional(),
  language: z.enum(['pt', 'en', 'fr', 'sw']).optional(),
});

const completionSchema = z.object({
  patientId: z.string(),
  screeningCode: z.enum([
    'blood_pressure',
    'lipid_panel',
    'hba1c',
    'colorectal',
    'psa_discussion',
    'vision',
    'dental',
    'cervical',
    'mammogram',
    'dexa',
  ]),
  completedAt: z.string(),
  notes: z.string().optional(),
});

const reminderSchema = z.object({
  patientId: z.string(),
  screeningCode: completionSchema.shape.screeningCode,
  remindAt: z.string(),
  channel: z.enum(['in_app', 'email']).optional(),
  enabled: z.boolean().optional(),
});

function canAccessPatient(req: AuthenticatedRequest, patientId: string) {
  return req.user?.userId === patientId;
}

/** Merge client-sent riskFactors with booleans derived from smoking, BMI category, chronic conditions and family history. */
function mergeDerivedRiskFactors(
  riskFactors: z.infer<typeof profileSchema>['riskFactors'],
  fields: Parameters<typeof deriveLegacyRiskFactors>[0]
) {
  return {
    ...(riskFactors ?? {}),
    ...deriveLegacyRiskFactors(fields),
  };
}

async function getLatestCompletionMap(patientId: string): Promise<Partial<Record<ScreeningCode, Date | null>>> {
  const latest = await ScreeningCompletion.aggregate([
    { $match: { patientId: new mongoose.Types.ObjectId(patientId) } },
    { $sort: { completedAt: -1 } },
    { $group: { _id: '$screeningCode', completedAt: { $first: '$completedAt' } } },
  ]);

  return latest.reduce((acc, row) => {
    acc[row._id as ScreeningCode] = row.completedAt ? new Date(row.completedAt) : null;
    return acc;
  }, {} as Partial<Record<ScreeningCode, Date | null>>);
}

router.post('/profile', async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const patientId = authReq.user?.userId;
    if (!patientId) return res.status(401).json({ error: 'Unauthorized' });

    const parsed = profileSchema.parse(req.body);
    const riskFactors = mergeDerivedRiskFactors(parsed.riskFactors, {
      smokingStatus: parsed.smokingStatus,
      weightCategory: parsed.weightCategory,
      chronicConditions: parsed.chronicConditions,
      familyHistory: parsed.familyHistory,
    });
    const profile = await PreventiveProfile.findOneAndUpdate(
      { patientId },
      {
        $set: {
          ...parsed,
          patientId,
          dateOfBirth: parsed.dateOfBirth ? new Date(parsed.dateOfBirth) : undefined,
          riskFactors,
        },
      },
      { upsert: true, new: true }
    );
    res.status(201).json(profile);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.flatten() });
    res.status(500).json({ error: 'Failed to save preventive profile' });
  }
});

router.get('/profile/:patientId', async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { patientId } = req.params;
    if (!canAccessPatient(authReq, patientId)) return res.status(403).json({ error: 'Forbidden' });

    const profile = await PreventiveProfile.findOne({ patientId }).lean();
    if (!profile) return res.status(404).json({ error: 'Preventive profile not found' });
    const riskFactors = mergeDerivedRiskFactors(
      profile.riskFactors && typeof profile.riskFactors === 'object' ? profile.riskFactors : {},
      {
        smokingStatus: profile.smokingStatus,
        weightCategory: profile.weightCategory,
        chronicConditions: profile.chronicConditions,
        familyHistory: profile.familyHistory,
      }
    );
    res.json({ ...profile, riskFactors });
  } catch {
    res.status(500).json({ error: 'Failed to fetch preventive profile' });
  }
});

router.put('/profile/:patientId', async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { patientId } = req.params;
    if (!canAccessPatient(authReq, patientId)) return res.status(403).json({ error: 'Forbidden' });
    const parsed = profileSchema.partial().parse(req.body);
    const existing = await PreventiveProfile.findOne({ patientId }).lean();
    if (!existing) return res.status(404).json({ error: 'Preventive profile not found' });

    const smokingStatus = parsed.smokingStatus ?? existing.smokingStatus;
    const weightCategory =
      parsed.weightCategory !== undefined ? parsed.weightCategory : existing.weightCategory;
    const chronicConditions = parsed.chronicConditions ?? existing.chronicConditions ?? [];
    const familyHistory = parsed.familyHistory ?? existing.familyHistory ?? [];
    const riskFactors = mergeDerivedRiskFactors(
      {
        ...(existing.riskFactors && typeof existing.riskFactors === 'object' ? existing.riskFactors : {}),
        ...(parsed.riskFactors ?? {}),
      },
      {
        smokingStatus,
        weightCategory,
        chronicConditions,
        familyHistory,
      }
    );

    const profile = await PreventiveProfile.findOneAndUpdate(
      { patientId },
      {
        $set: {
          ...parsed,
          dateOfBirth: parsed.dateOfBirth ? new Date(parsed.dateOfBirth) : undefined,
          riskFactors,
        },
      },
      { new: true }
    );
    if (!profile) return res.status(404).json({ error: 'Preventive profile not found' });
    res.json(profile);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.flatten() });
    res.status(500).json({ error: 'Failed to update preventive profile' });
  }
});

router.get('/schedule/:patientId', async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { patientId } = req.params;
    if (!canAccessPatient(authReq, patientId)) return res.status(403).json({ error: 'Forbidden' });

    const profile = await PreventiveProfile.findOne({ patientId }).lean();
    if (!profile) return res.status(404).json({ error: 'Preventive profile not found' });

    const completionMap = await getLatestCompletionMap(patientId);
    const schedule = generateScreeningSchedule(
      {
        patientId,
        age: profile.age,
        dateOfBirth: profile.dateOfBirth?.toISOString(),
        sexAtBirth: profile.sexAtBirth,
        genderContext: profile.genderContext,
        country: profile.country,
        region: profile.region,
        pregnancyStatus: profile.pregnancyStatus,
        smokingStatus: profile.smokingStatus,
        bmi: profile.bmi,
        weightCategory: profile.weightCategory,
        chronicConditions: profile.chronicConditions || [],
        familyHistory: profile.familyHistory || [],
        language: profile.language || 'pt',
      },
      completionMap
    );

    const reminders = await ScreeningReminder.find({ patientId, enabled: true }).sort({ remindAt: 1 }).lean();
    res.json({ ...schedule, reminders });
  } catch {
    res.status(500).json({ error: 'Failed to generate preventive schedule' });
  }
});

router.post('/completion', async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const parsed = completionSchema.parse(req.body);
    if (!canAccessPatient(authReq, parsed.patientId)) return res.status(403).json({ error: 'Forbidden' });

    const completion = await ScreeningCompletion.create({
      patientId: parsed.patientId,
      screeningCode: parsed.screeningCode,
      completedAt: new Date(parsed.completedAt),
      notes: parsed.notes,
    });
    res.status(201).json(completion);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.flatten() });
    res.status(500).json({ error: 'Failed to save screening completion' });
  }
});

router.post('/reminder', async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const parsed = reminderSchema.parse(req.body);
    if (!canAccessPatient(authReq, parsed.patientId)) return res.status(403).json({ error: 'Forbidden' });

    const reminder = await ScreeningReminder.create({
      patientId: parsed.patientId,
      screeningCode: parsed.screeningCode,
      remindAt: new Date(parsed.remindAt),
      channel: parsed.channel || 'in_app',
      enabled: parsed.enabled ?? true,
    });
    res.status(201).json(reminder);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.flatten() });
    res.status(500).json({ error: 'Failed to save reminder' });
  }
});

router.put('/reminder/:id', async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;
    const parsed = reminderSchema.partial().parse(req.body);

    const reminder = await ScreeningReminder.findById(id);
    if (!reminder) return res.status(404).json({ error: 'Reminder not found' });
    if (!canAccessPatient(authReq, reminder.patientId.toString())) return res.status(403).json({ error: 'Forbidden' });

    if (parsed.remindAt) reminder.remindAt = new Date(parsed.remindAt);
    if (parsed.channel) reminder.channel = parsed.channel;
    if (typeof parsed.enabled === 'boolean') reminder.enabled = parsed.enabled;
    if (parsed.screeningCode) reminder.screeningCode = parsed.screeningCode;
    await reminder.save();
    res.json(reminder);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.flatten() });
    res.status(500).json({ error: 'Failed to update reminder' });
  }
});

export default router;
