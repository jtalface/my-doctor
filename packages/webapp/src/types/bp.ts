/**
 * Blood Pressure Tracking Types
 * 
 * Frontend type definitions for PressurePal feature
 */

// ==================== ENUMS ====================

export type BPClassification = 'normal' | 'elevated' | 'stage1' | 'stage2' | 'crisis';

export type BPContext = 'resting' | 'after_exercise' | 'stressed' | 'clinic' | 'other';

export type BPSymptom =
  | 'chest_pain'
  | 'shortness_of_breath'
  | 'severe_headache'
  | 'vision_changes'
  | 'confusion'
  | 'weakness_numbness'
  | 'none';

// ==================== SETTINGS ====================

export interface BPSettings {
  _id: string;
  userId: string;
  profileType: 'user' | 'dependent';
  targets: {
    systolic: number;
    diastolic: number;
  };
  measurementSchedule: ('AM' | 'PM')[];
  medications: Array<{
    name: string;
    class?: string;
  }>;
  comorbidities: {
    diabetes: boolean;
    ckd: boolean;
    cad: boolean;
    stroke: boolean;
    pregnancy: boolean;
  };
  disclaimerAccepted: boolean;
  disclaimerAcceptedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSettingsRequest {
  targets?: {
    systolic: number;
    diastolic: number;
  };
  measurementSchedule?: ('AM' | 'PM')[];
  medications?: Array<{
    name: string;
    class?: string;
  }>;
  comorbidities?: {
    diabetes?: boolean;
    ckd?: boolean;
    cad?: boolean;
    stroke?: boolean;
    pregnancy?: boolean;
  };
}

// ==================== SESSION ====================

export interface BPReading {
  systolic: number;
  diastolic: number;
  pulse?: number;
}

export interface MeasurementQuality {
  rested_5_min: boolean;
  feet_flat: boolean;
  back_supported: boolean;
  arm_supported_heart_level: boolean;
  correct_cuff_size?: boolean;
  no_caffeine_30_min?: boolean;
  no_exercise_30_min?: boolean;
  no_smoking_30_min?: boolean;
}

export interface BPSession {
  _id: string;
  userId: string;
  profileType: 'user' | 'dependent';
  timestamp: string;
  readings: BPReading[];
  averages: {
    systolic: number;
    diastolic: number;
    pulse?: number;
  };
  classification: BPClassification;
  context: BPContext;
  symptoms: BPSymptom[];
  measurementQuality: MeasurementQuality;
  notes?: string;
  flagged: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSessionRequest {
  timestamp: string;
  readings: BPReading[];
  context: BPContext;
  symptoms?: BPSymptom[];
  measurementQuality: MeasurementQuality;
  notes?: string;
}

// ==================== SUGGESTIONS ====================

export interface BPSuggestion {
  id: string;
  type: string;
  severity: 'info' | 'warn' | 'urgent';
  title: string;
  message: string;
  rationale: string;
  supportingData: {
    sessions: Array<{
      timestamp: string;
      systolic: number;
      diastolic: number;
      classification: string;
    }>;
    patterns: string[];
  };
  actions?: string[];
  references?: string[];
  disclaimer: string;
}

// ==================== ANALYTICS ====================

export interface BPPatternAnalysis {
  summary: {
    totalSessions: number;
    avgSystolic: number;
    avgDiastolic: number;
    avgPulse?: number;
  };
  distribution: {
    normal: number;
    elevated: number;
    stage1: number;
    stage2: number;
    crisis: number;
  };
  aboveTarget: {
    count: number;
    percentage: number;
  };
  adherence: {
    daysWithReadings: number;
    expectedReadings: number;
    actualReadings: number;
    adherenceRate: number;
  };
  amPmComparison?: {
    amAvg: { systolic: number; diastolic: number };
    pmAvg: { systolic: number; diastolic: number };
    difference: { systolic: number; diastolic: number };
  };
  patterns: Array<{
    type: string;
    description: string;
    severity: 'info' | 'warn' | 'urgent';
  }>;
}

// ==================== EXPORT ====================

export interface BPExportData {
  exportDate: string;
  settings: BPSettings | null;
  sessions: BPSession[];
  analytics: BPPatternAnalysis;
}

// ==================== CONSTANTS ====================

export const CONTEXT_OPTIONS = [
  { value: 'resting', label: 'Resting (Recommended)' },
  { value: 'after_exercise', label: 'After Exercise' },
  { value: 'stressed', label: 'Stressed/Anxious' },
  { value: 'clinic', label: 'At Doctor's Office' },
  { value: 'other', label: 'Other' },
] as const;

export const SYMPTOM_OPTIONS = [
  { value: 'none', label: 'None - I feel fine', icon: '✅' },
  { value: 'chest_pain', label: 'Chest Pain', icon: '⚠️' },
  { value: 'shortness_of_breath', label: 'Shortness of Breath', icon: '⚠️' },
  { value: 'severe_headache', label: 'Severe Headache', icon: '⚠️' },
  { value: 'vision_changes', label: 'Vision Changes (blurred/spots)', icon: '⚠️' },
  { value: 'confusion', label: 'Confusion/Disorientation', icon: '⚠️' },
  { value: 'weakness_numbness', label: 'Weakness/Numbness', icon: '⚠️' },
] as const;

export const MEDICATION_CLASSES = [
  'ACE Inhibitor',
  'ARB',
  'Beta Blocker',
  'Calcium Channel Blocker',
  'Diuretic',
  'Other',
] as const;

export const SCHEDULE_OPTIONS = [
  { value: 'AM', label: 'Morning (AM)' },
  { value: 'PM', label: 'Evening (PM)' },
] as const;

