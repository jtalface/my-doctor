import mongoose from 'mongoose';
import {
  CycleSettings,
  ICycleSettings,
  DailyLog,
  IDailyLog,
  Cycle,
  ICycle,
  User,
  PatientProfile,
  DependentRelationship,
} from '../models/index.js';
import type { FlowLevel, Symptom, Mood } from '../models/daily-log.model.js';

/**
 * Custom error class for cycle tracking operations
 */
export class CycleError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'CycleError';
  }
}

/**
 * Date utility: parse YYYY-MM-DD string to Date object
 */
function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Date utility: format Date to YYYY-MM-DD string
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Date utility: add days to a date string
 */
function addDays(dateStr: string, days: number): string {
  const date = parseDate(dateStr);
  date.setDate(date.getDate() + days);
  return formatDate(date);
}

/**
 * Date utility: calculate days between two date strings
 */
function daysBetween(startDateStr: string, endDateStr: string): number {
  const start = parseDate(startDateStr);
  const end = parseDate(endDateStr);
  const diffTime = end.getTime() - start.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calculate predictions for next period and fertile window
 */
function calculatePredictions(settings: ICycleSettings) {
  const { lastPeriodStart, averageCycleLength, averagePeriodLength, irregularCycle } = settings;
  
  // Predict next period start
  const nextPeriodStart = addDays(lastPeriodStart, averageCycleLength);
  
  // Predict period window
  const periodWindowEnd = addDays(nextPeriodStart, averagePeriodLength - 1);
  
  // Predict ovulation (14 days before next period)
  const ovulationDay = addDays(nextPeriodStart, -14);
  
  // Predict fertile window (5 days before ovulation to ovulation day)
  const fertileWindowStart = addDays(ovulationDay, -5);
  const fertileWindowEnd = ovulationDay;
  
  // If irregular, add ±2 days range
  if (irregularCycle) {
    return {
      nextPeriod: {
        startRange: {
          min: addDays(nextPeriodStart, -2),
          max: addDays(nextPeriodStart, 2),
        },
        endRange: {
          min: addDays(periodWindowEnd, -2),
          max: addDays(periodWindowEnd, 2),
        },
      },
      ovulation: {
        dateRange: {
          min: addDays(ovulationDay, -2),
          max: addDays(ovulationDay, 2),
        },
      },
      fertileWindow: {
        start: addDays(fertileWindowStart, -2),
        end: addDays(fertileWindowEnd, 2),
      },
    };
  }
  
  return {
    nextPeriod: {
      start: nextPeriodStart,
      end: periodWindowEnd,
    },
    ovulation: {
      date: ovulationDay,
    },
    fertileWindow: {
      start: fertileWindowStart,
      end: fertileWindowEnd,
    },
  };
}

/**
 * Check if user has permission to access cycle data for a given userId
 * Allows access if:
 * - userId matches requesterId (own data)
 * - userId is a dependent managed by requesterId
 */
async function checkAccess(requesterId: string, targetUserId: string): Promise<boolean> {
  // Allow if accessing own data
  if (requesterId === targetUserId) {
    return true;
  }
  
  // Check if targetUser is a dependent managed by requester
  const relationship = await DependentRelationship.findOne({
    managerId: new mongoose.Types.ObjectId(requesterId),
    dependentId: new mongoose.Types.ObjectId(targetUserId),
  });
  
  return !!relationship;
}

/**
 * Check if user is eligible for cycle tracking (female and age 10+)
 */
async function checkEligibility(userId: string): Promise<{ eligible: boolean; reason?: string }> {
  const user = await User.findById(userId);
  if (!user) {
    return { eligible: false, reason: 'User not found' };
  }
  
  const profile = await PatientProfile.findOne({ userId: new mongoose.Types.ObjectId(userId) });
  
  // Check gender
  if (profile?.demographics?.sexAtBirth !== 'female') {
    return { eligible: false, reason: 'Cycle tracking is only available for female users' };
  }
  
  // Check age for dependents
  if (user.isDependent && user.dateOfBirth) {
    const age = Math.floor((Date.now() - user.dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    if (age < 10) {
      return { eligible: false, reason: 'Cycle tracking is only available for users age 10 and above' };
    }
  }
  
  return { eligible: true };
}

// ==================== CYCLE SETTINGS ====================

export async function getSettings(requesterId: string, targetUserId: string): Promise<ICycleSettings | null> {
  const hasAccess = await checkAccess(requesterId, targetUserId);
  if (!hasAccess) {
    throw new CycleError('FORBIDDEN', 'You do not have permission to access this data', 403);
  }
  
  const eligibility = await checkEligibility(targetUserId);
  if (!eligibility.eligible) {
    throw new CycleError('NOT_ELIGIBLE', eligibility.reason!, 403);
  }
  
  return await CycleSettings.findOne({ userId: new mongoose.Types.ObjectId(targetUserId) });
}

export interface CreateSettingsData {
  lastPeriodStart: string;
  averageCycleLength?: number;
  averagePeriodLength?: number;
  irregularCycle?: boolean;
  reminders?: {
    periodExpected?: boolean;
    periodExpectedDays?: number;
    fertileWindow?: boolean;
  };
}

export async function createSettings(
  requesterId: string,
  targetUserId: string,
  data: CreateSettingsData
): Promise<ICycleSettings> {
  const hasAccess = await checkAccess(requesterId, targetUserId);
  if (!hasAccess) {
    throw new CycleError('FORBIDDEN', 'You do not have permission to create settings for this user', 403);
  }
  
  const eligibility = await checkEligibility(targetUserId);
  if (!eligibility.eligible) {
    throw new CycleError('NOT_ELIGIBLE', eligibility.reason!, 403);
  }
  
  // Check if settings already exist
  const existing = await CycleSettings.findOne({ userId: new mongoose.Types.ObjectId(targetUserId) });
  if (existing) {
    throw new CycleError('ALREADY_EXISTS', 'Cycle settings already exist for this user', 409);
  }
  
  const user = await User.findById(targetUserId);
  const profileType = user?.isDependent ? 'dependent' : 'user';
  
  const settings = await CycleSettings.create({
    userId: new mongoose.Types.ObjectId(targetUserId),
    profileType,
    lastPeriodStart: data.lastPeriodStart,
    averageCycleLength: data.averageCycleLength || 28,
    averagePeriodLength: data.averagePeriodLength || 5,
    irregularCycle: data.irregularCycle || false,
    reminders: {
      periodExpected: data.reminders?.periodExpected ?? true,
      periodExpectedDays: data.reminders?.periodExpectedDays || 2,
      fertileWindow: data.reminders?.fertileWindow || false,
    },
    isActive: true,
  });
  
  return settings;
}

export interface UpdateSettingsData {
  lastPeriodStart?: string;
  averageCycleLength?: number;
  averagePeriodLength?: number;
  irregularCycle?: boolean;
  reminders?: {
    periodExpected?: boolean;
    periodExpectedDays?: number;
    fertileWindow?: boolean;
  };
  isActive?: boolean;
}

export async function updateSettings(
  requesterId: string,
  targetUserId: string,
  data: UpdateSettingsData
): Promise<ICycleSettings> {
  const hasAccess = await checkAccess(requesterId, targetUserId);
  if (!hasAccess) {
    throw new CycleError('FORBIDDEN', 'You do not have permission to update settings for this user', 403);
  }
  
  const settings = await CycleSettings.findOne({ userId: new mongoose.Types.ObjectId(targetUserId) });
  if (!settings) {
    throw new CycleError('NOT_FOUND', 'Cycle settings not found', 404);
  }
  
  // Update fields
  if (data.lastPeriodStart !== undefined) settings.lastPeriodStart = data.lastPeriodStart;
  if (data.averageCycleLength !== undefined) settings.averageCycleLength = data.averageCycleLength;
  if (data.averagePeriodLength !== undefined) settings.averagePeriodLength = data.averagePeriodLength;
  if (data.irregularCycle !== undefined) settings.irregularCycle = data.irregularCycle;
  if (data.isActive !== undefined) settings.isActive = data.isActive;
  
  if (data.reminders) {
    if (data.reminders.periodExpected !== undefined) {
      settings.reminders.periodExpected = data.reminders.periodExpected;
    }
    if (data.reminders.periodExpectedDays !== undefined) {
      settings.reminders.periodExpectedDays = data.reminders.periodExpectedDays;
    }
    if (data.reminders.fertileWindow !== undefined) {
      settings.reminders.fertileWindow = data.reminders.fertileWindow;
    }
  }
  
  await settings.save();
  return settings;
}

// ==================== DAILY LOGS ====================

export interface CreateDailyLogData {
  date: string;
  isPeriodDay?: boolean;
  flowLevel?: FlowLevel;
  symptoms?: Symptom[];
  mood?: Mood[];
  notes?: string;
}

export async function createOrUpdateDailyLog(
  requesterId: string,
  targetUserId: string,
  data: CreateDailyLogData
): Promise<IDailyLog> {
  const hasAccess = await checkAccess(requesterId, targetUserId);
  if (!hasAccess) {
    throw new CycleError('FORBIDDEN', 'You do not have permission to log data for this user', 403);
  }
  
  const user = await User.findById(targetUserId);
  const profileType = user?.isDependent ? 'dependent' : 'user';
  
  // Upsert daily log
  const log = await DailyLog.findOneAndUpdate(
    {
      userId: new mongoose.Types.ObjectId(targetUserId),
      date: data.date,
    },
    {
      $set: {
        userId: new mongoose.Types.ObjectId(targetUserId),
        profileType,
        date: data.date,
        isPeriodDay: data.isPeriodDay ?? false,
        flowLevel: data.flowLevel || 'none',
        symptoms: data.symptoms || [],
        mood: data.mood || [],
        notes: data.notes || '',
      },
    },
    { upsert: true, new: true }
  );
  
  // If this is a period day, potentially update cycles
  if (data.isPeriodDay) {
    await updateCyclesFromLogs(targetUserId);
  }
  
  return log;
}

export async function getDailyLogs(
  requesterId: string,
  targetUserId: string,
  startDate: string,
  endDate: string
): Promise<IDailyLog[]> {
  const hasAccess = await checkAccess(requesterId, targetUserId);
  if (!hasAccess) {
    throw new CycleError('FORBIDDEN', 'You do not have permission to view logs for this user', 403);
  }
  
  return await DailyLog.find({
    userId: new mongoose.Types.ObjectId(targetUserId),
    date: { $gte: startDate, $lte: endDate },
  }).sort({ date: 1 });
}

export async function deleteDailyLog(
  requesterId: string,
  targetUserId: string,
  date: string
): Promise<{ success: boolean }> {
  const hasAccess = await checkAccess(requesterId, targetUserId);
  if (!hasAccess) {
    throw new CycleError('FORBIDDEN', 'You do not have permission to delete logs for this user', 403);
  }
  
  const result = await DailyLog.deleteOne({
    userId: new mongoose.Types.ObjectId(targetUserId),
    date,
  });
  
  if (result.deletedCount > 0) {
    await updateCyclesFromLogs(targetUserId);
  }
  
  return { success: result.deletedCount > 0 };
}

// ==================== CYCLES ====================

/**
 * Update cycle records based on period days in daily logs
 * Identifies consecutive period days and creates/updates cycle records
 */
async function updateCyclesFromLogs(userId: string): Promise<void> {
  // Get all period days, sorted by date
  const periodLogs = await DailyLog.find({
    userId: new mongoose.Types.ObjectId(userId),
    isPeriodDay: true,
  }).sort({ date: 1 });
  
  if (periodLogs.length === 0) {
    return;
  }
  
  // Group consecutive period days into cycles
  const cycles: { startDate: string; endDate: string }[] = [];
  let currentCycleStart: string | null = null;
  let currentCycleEnd: string | null = null;
  
  for (const log of periodLogs) {
    if (!currentCycleStart) {
      // Start new cycle
      currentCycleStart = log.date;
      currentCycleEnd = log.date;
    } else {
      // Check if this log is consecutive (within 1-2 days of previous)
      const daysSinceLast = daysBetween(currentCycleEnd!, log.date);
      
      if (daysSinceLast <= 2) {
        // Extend current cycle
        currentCycleEnd = log.date;
      } else {
        // Save current cycle and start new one
        cycles.push({ startDate: currentCycleStart, endDate: currentCycleEnd! });
        currentCycleStart = log.date;
        currentCycleEnd = log.date;
      }
    }
  }
  
  // Save last cycle
  if (currentCycleStart && currentCycleEnd) {
    cycles.push({ startDate: currentCycleStart, endDate: currentCycleEnd });
  }
  
  // Update cycle records in database
  const user = await User.findById(userId);
  const profileType = user?.isDependent ? 'dependent' : 'user';
  
  for (let i = 0; i < cycles.length; i++) {
    const { startDate, endDate } = cycles[i];
    const periodLength = daysBetween(startDate, endDate) + 1;
    
    // Calculate cycle length (days until next period start)
    let cycleLength = 0;
    if (i < cycles.length - 1) {
      cycleLength = daysBetween(startDate, cycles[i + 1].startDate);
    }
    
    await Cycle.findOneAndUpdate(
      {
        userId: new mongoose.Types.ObjectId(userId),
        startDate,
      },
      {
        $set: {
          userId: new mongoose.Types.ObjectId(userId),
          profileType,
          startDate,
          endDate,
          cycleLength,
          periodLength,
        },
      },
      { upsert: true }
    );
  }
  
  // Update settings with most recent cycle data
  if (cycles.length > 0) {
    const lastCycle = cycles[cycles.length - 1];
    const settings = await CycleSettings.findOne({ userId: new mongoose.Types.ObjectId(userId) });
    
    if (settings) {
      settings.lastPeriodStart = lastCycle.startDate;
      
      // Recalculate averages from stored cycles
      const allCycles = await Cycle.find({
        userId: new mongoose.Types.ObjectId(userId),
        cycleLength: { $gt: 0 },
      });
      
      if (allCycles.length > 0) {
        const avgCycleLength = Math.round(
          allCycles.reduce((sum, c) => sum + c.cycleLength, 0) / allCycles.length
        );
        const avgPeriodLength = Math.round(
          allCycles.reduce((sum, c) => sum + c.periodLength, 0) / allCycles.length
        );
        
        settings.averageCycleLength = avgCycleLength;
        settings.averagePeriodLength = avgPeriodLength;
      }
      
      await settings.save();
    }
  }
}

export async function getCycles(
  requesterId: string,
  targetUserId: string
): Promise<ICycle[]> {
  const hasAccess = await checkAccess(requesterId, targetUserId);
  if (!hasAccess) {
    throw new CycleError('FORBIDDEN', 'You do not have permission to view cycles for this user', 403);
  }
  
  return await Cycle.find({
    userId: new mongoose.Types.ObjectId(targetUserId),
  }).sort({ startDate: -1 });
}

export async function getPredictions(
  requesterId: string,
  targetUserId: string
) {
  const hasAccess = await checkAccess(requesterId, targetUserId);
  if (!hasAccess) {
    throw new CycleError('FORBIDDEN', 'You do not have permission to view predictions for this user', 403);
  }
  
  const settings = await CycleSettings.findOne({ userId: new mongoose.Types.ObjectId(targetUserId) });
  if (!settings) {
    throw new CycleError('NOT_FOUND', 'Cycle settings not found. Please complete onboarding first.', 404);
  }
  
  return calculatePredictions(settings);
}

// ==================== EXPORT / IMPORT ====================

export interface ExportData {
  version: string;
  exportDate: string;
  profileId: string;
  settings: ICycleSettings | null;
  dailyLogs: IDailyLog[];
  cycles: ICycle[];
}

export async function exportData(
  requesterId: string,
  targetUserId: string
): Promise<ExportData> {
  const hasAccess = await checkAccess(requesterId, targetUserId);
  if (!hasAccess) {
    throw new CycleError('FORBIDDEN', 'You do not have permission to export data for this user', 403);
  }
  
  const settings = await CycleSettings.findOne({ userId: new mongoose.Types.ObjectId(targetUserId) });
  const dailyLogs = await DailyLog.find({ userId: new mongoose.Types.ObjectId(targetUserId) }).sort({ date: 1 });
  const cycles = await Cycle.find({ userId: new mongoose.Types.ObjectId(targetUserId) }).sort({ startDate: -1 });
  
  return {
    version: '1.0',
    exportDate: new Date().toISOString(),
    profileId: targetUserId,
    settings,
    dailyLogs,
    cycles,
  };
}

export interface ImportData {
  settings?: CreateSettingsData;
  dailyLogs?: CreateDailyLogData[];
  replace?: boolean; // If true, delete existing data before import
}

export async function importData(
  requesterId: string,
  targetUserId: string,
  data: ImportData
): Promise<{ success: boolean; imported: { settings: boolean; logs: number; cycles: number } }> {
  const hasAccess = await checkAccess(requesterId, targetUserId);
  if (!hasAccess) {
    throw new CycleError('FORBIDDEN', 'You do not have permission to import data for this user', 403);
  }
  
  const eligibility = await checkEligibility(targetUserId);
  if (!eligibility.eligible) {
    throw new CycleError('NOT_ELIGIBLE', eligibility.reason!, 403);
  }
  
  // If replace mode, delete existing data
  if (data.replace) {
    await CycleSettings.deleteOne({ userId: new mongoose.Types.ObjectId(targetUserId) });
    await DailyLog.deleteMany({ userId: new mongoose.Types.ObjectId(targetUserId) });
    await Cycle.deleteMany({ userId: new mongoose.Types.ObjectId(targetUserId) });
  }
  
  let settingsImported = false;
  let logsImported = 0;
  
  // Import settings
  if (data.settings) {
    try {
      await createSettings(requesterId, targetUserId, data.settings);
      settingsImported = true;
    } catch (error) {
      if (error instanceof CycleError && error.code === 'ALREADY_EXISTS') {
        await updateSettings(requesterId, targetUserId, data.settings);
        settingsImported = true;
      } else {
        throw error;
      }
    }
  }
  
  // Import daily logs
  if (data.dailyLogs && data.dailyLogs.length > 0) {
    for (const logData of data.dailyLogs) {
      await createOrUpdateDailyLog(requesterId, targetUserId, logData);
      logsImported++;
    }
  }
  
  // Cycles will be auto-generated from daily logs
  const cycles = await Cycle.find({ userId: new mongoose.Types.ObjectId(targetUserId) });
  
  return {
    success: true,
    imported: {
      settings: settingsImported,
      logs: logsImported,
      cycles: cycles.length,
    },
  };
}

// ==================== DELETE ALL DATA ====================

export async function deleteAllData(
  requesterId: string,
  targetUserId: string
): Promise<{ success: boolean; deleted: { settings: number; logs: number; cycles: number } }> {
  const hasAccess = await checkAccess(requesterId, targetUserId);
  if (!hasAccess) {
    throw new CycleError('FORBIDDEN', 'You do not have permission to delete data for this user', 403);
  }
  
  const settingsResult = await CycleSettings.deleteOne({ userId: new mongoose.Types.ObjectId(targetUserId) });
  const logsResult = await DailyLog.deleteMany({ userId: new mongoose.Types.ObjectId(targetUserId) });
  const cyclesResult = await Cycle.deleteMany({ userId: new mongoose.Types.ObjectId(targetUserId) });
  
  return {
    success: true,
    deleted: {
      settings: settingsResult.deletedCount,
      logs: logsResult.deletedCount,
      cycles: cyclesResult.deletedCount,
    },
  };
}

