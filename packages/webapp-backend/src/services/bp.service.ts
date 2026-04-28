/**
 * BP Service
 * 
 * Main service for handling all blood pressure tracking operations
 */

import { BPSettings, IBPSettings } from '../models/bp-settings.model.js';
import { BPSession, IBPSession } from '../models/bp-session.model.js';
import { BPSuggestionAudit } from '../models/bp-suggestion-audit.model.js';
import { BPActivityAudit } from '../models/bp-activity-audit.model.js';
import { classifyBP, calculateAverage } from '../utils/bp-classification.js';
import {
  validateSystolic,
  validateDiastolic,
  validatePulse,
  validateSystolicGreaterThanDiastolic,
} from '../utils/bp-validation.js';
import { generateBPSuggestions, BPSuggestion } from './bp-suggestion-engine.js';
import { analyzeBPPatterns, BPPatternAnalysis } from './bp-patterns.service.js';

// ==================== SETTINGS ====================

export async function getSettings(userId: string): Promise<IBPSettings | null> {
  return BPSettings.findOne({ userId });
}

export async function createSettings(
  userId: string,
  profileType: 'user' | 'dependent',
  data: {
    targets?: { systolic: number; diastolic: number };
    measurementSchedule?: ('AM' | 'PM')[];
    medications?: Array<{ name: string; class?: string }>;
    comorbidities?: Partial<IBPSettings['comorbidities']>;
  }
): Promise<IBPSettings> {
  const settings = new BPSettings({
    userId,
    profileType,
    targets: data.targets || { systolic: 130, diastolic: 80 },
    measurementSchedule: data.measurementSchedule || ['AM', 'PM'],
    medications: data.medications || [],
    comorbidities: {
      diabetes: data.comorbidities?.diabetes || false,
      ckd: data.comorbidities?.ckd || false,
      cad: data.comorbidities?.cad || false,
      stroke: data.comorbidities?.stroke || false,
      pregnancy: data.comorbidities?.pregnancy || false,
    },
    disclaimerAccepted: true,
    disclaimerAcceptedAt: new Date(),
  });

  await settings.save();

  // Log activity
  await BPActivityAudit.create({
    userId,
    action: 'update_settings',
    resourceType: 'BPSettings',
    resourceId: settings._id,
    timestamp: new Date(),
  });

  return settings;
}

export async function updateSettings(
  userId: string,
  updates: Partial<IBPSettings>
): Promise<IBPSettings | null> {
  const settings = await BPSettings.findOneAndUpdate({ userId }, { $set: updates }, { new: true });

  if (settings) {
    await BPActivityAudit.create({
      userId,
      action: 'update_settings',
      resourceType: 'BPSettings',
      resourceId: settings._id,
      timestamp: new Date(),
    });
  }

  return settings;
}

// ==================== SESSIONS ====================

export async function createSession(
  userId: string,
  profileType: 'user' | 'dependent',
  data: {
    timestamp: Date;
    readings: Array<{ systolic: number; diastolic: number; pulse?: number }>;
    context: IBPSession['context'];
    symptoms?: IBPSession['symptoms'];
    measurementQuality: IBPSession['measurementQuality'];
    notes?: string;
  }
): Promise<IBPSession> {
  // Validate all readings
  for (const reading of data.readings) {
    const sysValidation = validateSystolic(reading.systolic);
    if (!sysValidation.isValid) {
      throw new Error(sysValidation.error || 'Invalid systolic value');
    }

    const diaValidation = validateDiastolic(reading.diastolic);
    if (!diaValidation.isValid) {
      throw new Error(diaValidation.error || 'Invalid diastolic value');
    }

    if (reading.pulse) {
      const pulseValidation = validatePulse(reading.pulse);
      if (!pulseValidation.isValid) {
        throw new Error(pulseValidation.error || 'Invalid pulse value');
      }
    }

    const comparison = validateSystolicGreaterThanDiastolic(reading.systolic, reading.diastolic);
    if (!comparison.isValid) {
      throw new Error(comparison.error || 'Systolic must be greater than diastolic');
    }
  }

  // Calculate averages
  const averages = calculateAverage(data.readings);

  // Classify based on average
  const classification = classifyBP(averages.systolic, averages.diastolic);

  // Flag if crisis or stage2
  const flagged = classification === 'crisis' || classification === 'stage2';

  const session = new BPSession({
    userId,
    profileType,
    timestamp: data.timestamp,
    readings: data.readings,
    averages,
    classification,
    context: data.context,
    symptoms: data.symptoms || ['none'],
    measurementQuality: data.measurementQuality,
    notes: data.notes,
    flagged,
  });

  await session.save();

  // Log activity
  await BPActivityAudit.create({
    userId,
    action: 'create_session',
    resourceType: 'BPSession',
    resourceId: session._id,
    metadata: {
      averages,
      classification,
      flagged,
    },
    timestamp: new Date(),
  });

  return session;
}

export async function getSessions(
  userId: string,
  options: {
    startDate?: Date;
    endDate?: Date;
    context?: string;
    classification?: string;
    limit?: number;
  } = {}
): Promise<IBPSession[]> {
  const query: any = { userId };

  if (options.startDate || options.endDate) {
    query.timestamp = {};
    if (options.startDate) {
      query.timestamp.$gte = options.startDate;
    }
    if (options.endDate) {
      query.timestamp.$lte = options.endDate;
    }
  }

  if (options.context) {
    query.context = options.context;
  }

  if (options.classification) {
    query.classification = options.classification;
  }

  let queryBuilder = BPSession.find(query).sort({ timestamp: -1 });

  if (options.limit) {
    queryBuilder = queryBuilder.limit(options.limit);
  }

  return queryBuilder.exec();
}

export async function updateSession(
  sessionId: string,
  userId: string,
  updates: Partial<IBPSession>
): Promise<IBPSession | null> {
  // If readings are being updated, recalculate averages and classification
  if (updates.readings && updates.readings.length > 0) {
    const averages = calculateAverage(updates.readings);
    const classification = classifyBP(averages.systolic, averages.diastolic);
    const flagged = classification === 'crisis' || classification === 'stage2';

    updates.averages = averages;
    updates.classification = classification;
    updates.flagged = flagged;
  }

  const session = await BPSession.findOneAndUpdate(
    { _id: sessionId, userId },
    { $set: updates },
    { new: true }
  );

  if (session) {
    await BPActivityAudit.create({
      userId,
      action: 'update_session',
      resourceType: 'BPSession',
      resourceId: session._id,
      timestamp: new Date(),
    });
  }

  return session;
}

export async function deleteSession(sessionId: string, userId: string): Promise<boolean> {
  const result = await BPSession.deleteOne({ _id: sessionId, userId });

  if (result.deletedCount > 0) {
    await BPActivityAudit.create({
      userId,
      action: 'delete_session',
      resourceType: 'BPSession',
      metadata: { sessionId },
      timestamp: new Date(),
    });
  }

  return result.deletedCount > 0;
}

// ==================== SUGGESTIONS ====================

export async function getSuggestions(userId: string): Promise<BPSuggestion[]> {
  const settings = await getSettings(userId);
  if (!settings) {
    return [];
  }

  // Get last 30 days of sessions
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sessions = await getSessions(userId, { startDate: thirtyDaysAgo });

  const suggestions = generateBPSuggestions(sessions, settings);

  // Audit all generated suggestions
  for (const suggestion of suggestions) {
    await BPSuggestionAudit.create({
      userId,
      profileType: settings.profileType,
      timestamp: new Date(),
      suggestionId: suggestion.id,
      suggestionType: suggestion.type,
      severity: suggestion.severity,
      title: suggestion.title,
      message: suggestion.message,
      rationale: suggestion.rationale,
      supportingData: suggestion.supportingData,
    });
  }

  return suggestions;
}

// ==================== ANALYTICS ====================

export async function getAnalytics(userId: string, days: number = 7): Promise<BPPatternAnalysis> {
  const settings = await getSettings(userId);
  if (!settings) {
    throw new Error('Settings not found');
  }

  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const sessions = await getSessions(userId, { startDate });

  return analyzeBPPatterns(sessions, settings, days);
}

// ==================== EXPORT ====================

export interface BPExportData {
  exportDate: Date;
  settings: IBPSettings | null;
  sessions: IBPSession[];
  analytics: BPPatternAnalysis;
}

export async function exportData(userId: string): Promise<BPExportData> {
  const settings = await getSettings(userId);
  const sessions = await getSessions(userId);
  const fallbackDistribution = sessions.reduce(
    (acc, session) => {
      acc[session.classification] += 1;
      return acc;
    },
    { normal: 0, elevated: 0, stage1: 0, stage2: 0, crisis: 0 }
  );
  const fallbackAvgSystolic =
    sessions.length > 0
      ? Math.round(sessions.reduce((sum, s) => sum + s.averages.systolic, 0) / sessions.length)
      : 0;
  const fallbackAvgDiastolic =
    sessions.length > 0
      ? Math.round(sessions.reduce((sum, s) => sum + s.averages.diastolic, 0) / sessions.length)
      : 0;
  const analytics = settings
    ? analyzeBPPatterns(sessions, settings, 30)
    : {
        summary: {
          totalSessions: sessions.length,
          avgSystolic: fallbackAvgSystolic,
          avgDiastolic: fallbackAvgDiastolic,
        },
        distribution: fallbackDistribution,
        aboveTarget: { count: 0, percentage: 0 },
        adherence: {
          daysWithReadings: 0,
          expectedReadings: 0,
          actualReadings: sessions.length,
          adherenceRate: 0,
        },
        patterns: [],
      };

  await BPActivityAudit.create({
    userId,
    action: 'export_data',
    timestamp: new Date(),
  });

  return {
    exportDate: new Date(),
    settings,
    sessions,
    analytics,
  };
}

// ==================== DELETE ALL DATA ====================

export async function deleteAllData(userId: string): Promise<{
  settingsDeleted: number;
  sessionsDeleted: number;
  suggestionsDeleted: number;
}> {
  const settingsResult = await BPSettings.deleteMany({ userId });
  const sessionsResult = await BPSession.deleteMany({ userId });
  const suggestionsResult = await BPSuggestionAudit.deleteMany({ userId });

  await BPActivityAudit.create({
    userId,
    action: 'delete_account',
    metadata: {
      settingsDeleted: settingsResult.deletedCount,
      sessionsDeleted: sessionsResult.deletedCount,
      suggestionsDeleted: suggestionsResult.deletedCount,
    },
    timestamp: new Date(),
  });

  return {
    settingsDeleted: settingsResult.deletedCount || 0,
    sessionsDeleted: sessionsResult.deletedCount || 0,
    suggestionsDeleted: suggestionsResult.deletedCount || 0,
  };
}

