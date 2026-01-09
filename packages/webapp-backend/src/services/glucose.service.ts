/**
 * Glucose Service
 * 
 * Main service for handling all glucose tracking operations
 */

import {
  GlucoseSettings,
  IGlucoseSettings,
} from '../models/glucose-settings.model.js';
import {
  GlucoseReading,
  IGlucoseReading,
} from '../models/glucose-reading.model.js';
import {
  OtherMetrics,
  IOtherMetrics,
} from '../models/other-metrics.model.js';
import {
  SuggestionAudit,
  ISuggestionAudit,
} from '../models/suggestion-audit.model.js';
import {
  ActivityAudit,
} from '../models/activity-audit.model.js';
import {
  normalizeGlucoseValue,
  convertToPreferredUnit,
} from '../utils/glucose-units.js';
import {
  validateGlucoseValue,
  shouldFlagReading,
} from '../utils/glucose-validation.js';
import { generateSuggestions, Suggestion } from './suggestion-engine.js';
import { analyzePatterns, estimateA1C, PatternAnalysis } from './glucose-patterns.service.js';

// ==================== SETTINGS ====================

export async function getSettings(userId: string): Promise<IGlucoseSettings | null> {
  return GlucoseSettings.findOne({ userId });
}

export async function createSettings(
  userId: string,
  profileType: 'user' | 'dependent',
  data: {
    diabetesType: 'T1' | 'T2' | 'GDM' | 'Other';
    unitPreference?: 'mg/dL' | 'mmol/L';
    targetRanges?: Partial<IGlucoseSettings['targetRanges']>;
    medications?: Array<{ name: string; isInsulin: boolean }>;
  }
): Promise<IGlucoseSettings> {
  const settings = new GlucoseSettings({
    userId,
    profileType,
    diabetesType: data.diabetesType,
    unitPreference: data.unitPreference || 'mg/dL',
    targetRanges: data.targetRanges || {}, // Use defaults from schema
    medications: data.medications || [],
    disclaimerAccepted: true,
    disclaimerAcceptedAt: new Date(),
  });

  await settings.save();

  // Log activity
  await ActivityAudit.create({
    userId,
    action: 'update_settings',
    resourceType: 'GlucoseSettings',
    resourceId: settings._id,
    timestamp: new Date(),
  });

  return settings;
}

export async function updateSettings(
  userId: string,
  updates: Partial<IGlucoseSettings>
): Promise<IGlucoseSettings | null> {
  const settings = await GlucoseSettings.findOneAndUpdate(
    { userId },
    { $set: updates },
    { new: true }
  );

  if (settings) {
    await ActivityAudit.create({
      userId,
      action: 'update_settings',
      resourceType: 'GlucoseSettings',
      resourceId: settings._id,
      timestamp: new Date(),
    });
  }

  return settings;
}

// ==================== READINGS ====================

export async function createReading(
  userId: string,
  profileType: 'user' | 'dependent',
  data: {
    timestamp: Date;
    glucoseValue: number;
    unit: 'mg/dL' | 'mmol/L';
    context: IGlucoseReading['context'];
    carbsGrams?: number;
    insulinUnits?: number;
    activityMinutes?: number;
    symptoms?: string[];
    notes?: string;
  }
): Promise<IGlucoseReading> {
  // Validate glucose value
  const validation = validateGlucoseValue(data.glucoseValue, data.unit);
  if (!validation.isValid) {
    throw new Error(validation.error || 'Invalid glucose value');
  }

  // Get user settings for flagging
  const settings = await getSettings(userId);
  const targetMin = settings?.targetRanges.fasting.min || 80;
  const targetMax = settings?.targetRanges.postMeal.max || 180;

  // Normalize to mg/dL
  const normalizedValue = normalizeGlucoseValue(data.glucoseValue, data.unit);

  // Check if should be flagged
  const flagged = shouldFlagReading(normalizedValue, targetMin, targetMax);

  const reading = new GlucoseReading({
    userId,
    profileType,
    timestamp: data.timestamp,
    glucoseValue: normalizedValue,
    glucoseValueRaw: data.glucoseValue,
    unit: data.unit,
    context: data.context,
    carbsGrams: data.carbsGrams,
    insulinUnits: data.insulinUnits,
    activityMinutes: data.activityMinutes,
    symptoms: data.symptoms || [],
    notes: data.notes,
    flagged,
  });

  await reading.save();

  // Log activity
  await ActivityAudit.create({
    userId,
    action: 'create_reading',
    resourceType: 'GlucoseReading',
    resourceId: reading._id,
    metadata: {
      value: normalizedValue,
      context: data.context,
      flagged,
    },
    timestamp: new Date(),
  });

  return reading;
}

export async function getReadings(
  userId: string,
  options: {
    startDate?: Date;
    endDate?: Date;
    context?: string;
    limit?: number;
  } = {}
): Promise<IGlucoseReading[]> {
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

  let queryBuilder = GlucoseReading.find(query).sort({ timestamp: -1 });

  if (options.limit) {
    queryBuilder = queryBuilder.limit(options.limit);
  }

  return queryBuilder.exec();
}

export async function updateReading(
  readingId: string,
  userId: string,
  updates: Partial<IGlucoseReading>
): Promise<IGlucoseReading | null> {
  // If glucose value is being updated, re-normalize and re-flag
  if (updates.glucoseValue !== undefined && updates.unit) {
    const validation = validateGlucoseValue(updates.glucoseValue, updates.unit);
    if (!validation.isValid) {
      throw new Error(validation.error || 'Invalid glucose value');
    }

    updates.glucoseValueRaw = updates.glucoseValue;
    updates.glucoseValue = normalizeGlucoseValue(updates.glucoseValue, updates.unit);

    const settings = await getSettings(userId);
    const targetMin = settings?.targetRanges.fasting.min || 80;
    const targetMax = settings?.targetRanges.postMeal.max || 180;
    updates.flagged = shouldFlagReading(updates.glucoseValue, targetMin, targetMax);
  }

  const reading = await GlucoseReading.findOneAndUpdate(
    { _id: readingId, userId },
    { $set: updates },
    { new: true }
  );

  if (reading) {
    await ActivityAudit.create({
      userId,
      action: 'update_reading',
      resourceType: 'GlucoseReading',
      resourceId: reading._id,
      timestamp: new Date(),
    });
  }

  return reading;
}

export async function deleteReading(readingId: string, userId: string): Promise<boolean> {
  const result = await GlucoseReading.deleteOne({ _id: readingId, userId });

  if (result.deletedCount > 0) {
    await ActivityAudit.create({
      userId,
      action: 'delete_reading',
      resourceType: 'GlucoseReading',
      metadata: { readingId },
      timestamp: new Date(),
    });
  }

  return result.deletedCount > 0;
}

// ==================== SUGGESTIONS ====================

export async function getSuggestions(userId: string): Promise<Suggestion[]> {
  const settings = await getSettings(userId);
  if (!settings) {
    return [];
  }

  // Get last 30 days of readings
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const readings = await getReadings(userId, { startDate: thirtyDaysAgo });

  const suggestions = generateSuggestions(readings, settings);

  // Audit all generated suggestions
  for (const suggestion of suggestions) {
    await SuggestionAudit.create({
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

export async function markSuggestionViewed(
  userId: string,
  suggestionAuditId: string
): Promise<void> {
  await SuggestionAudit.findOneAndUpdate(
    { _id: suggestionAuditId, userId },
    {
      $set: {
        userAction: 'viewed',
        actionTimestamp: new Date(),
      },
    }
  );
}

// ==================== ANALYTICS ====================

export async function getAnalytics(
  userId: string,
  days: number = 7
): Promise<PatternAnalysis> {
  const settings = await getSettings(userId);
  if (!settings) {
    throw new Error('Settings not found');
  }

  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const readings = await getReadings(userId, { startDate });

  return analyzePatterns(readings, settings, days);
}

// ==================== OTHER METRICS ====================

export async function createOrUpdateMetrics(
  userId: string,
  profileType: 'user' | 'dependent',
  date: Date,
  data: {
    weight?: { value: number; unit: 'kg' | 'lbs' };
    bloodPressure?: { systolic: number; diastolic: number };
    a1c?: number;
  }
): Promise<IOtherMetrics> {
  const metrics = await OtherMetrics.findOneAndUpdate(
    { userId, date },
    {
      $set: {
        userId,
        profileType,
        date,
        ...data,
      },
    },
    { upsert: true, new: true }
  );

  return metrics;
}

export async function getMetrics(
  userId: string,
  options: {
    startDate?: Date;
    endDate?: Date;
  } = {}
): Promise<IOtherMetrics[]> {
  const query: any = { userId };

  if (options.startDate || options.endDate) {
    query.date = {};
    if (options.startDate) {
      query.date.$gte = options.startDate;
    }
    if (options.endDate) {
      query.date.$lte = options.endDate;
    }
  }

  return OtherMetrics.find(query).sort({ date: -1 }).exec();
}

// ==================== EXPORT ====================

export interface ExportData {
  exportDate: Date;
  settings: IGlucoseSettings | null;
  readings: IGlucoseReading[];
  metrics: IOtherMetrics[];
  analytics: PatternAnalysis;
}

export async function exportData(userId: string): Promise<ExportData> {
  const settings = await getSettings(userId);
  const readings = await getReadings(userId);
  const metrics = await getMetrics(userId);
  const analytics = await getAnalytics(userId, 30);

  await ActivityAudit.create({
    userId,
    action: 'export_data',
    timestamp: new Date(),
  });

  return {
    exportDate: new Date(),
    settings,
    readings,
    metrics,
    analytics,
  };
}

// ==================== DELETE ALL DATA ====================

export async function deleteAllData(userId: string): Promise<{
  settingsDeleted: number;
  readingsDeleted: number;
  metricsDeleted: number;
  suggestionsDeleted: number;
}> {
  const settingsResult = await GlucoseSettings.deleteMany({ userId });
  const readingsResult = await GlucoseReading.deleteMany({ userId });
  const metricsResult = await OtherMetrics.deleteMany({ userId });
  const suggestionsResult = await SuggestionAudit.deleteMany({ userId });

  await ActivityAudit.create({
    userId,
    action: 'delete_account',
    metadata: {
      settingsDeleted: settingsResult.deletedCount,
      readingsDeleted: readingsResult.deletedCount,
      metricsDeleted: metricsResult.deletedCount,
      suggestionsDeleted: suggestionsResult.deletedCount,
    },
    timestamp: new Date(),
  });

  return {
    settingsDeleted: settingsResult.deletedCount || 0,
    readingsDeleted: readingsResult.deletedCount || 0,
    metricsDeleted: metricsResult.deletedCount || 0,
    suggestionsDeleted: suggestionsResult.deletedCount || 0,
  };
}

