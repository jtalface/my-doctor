/**
 * Glucose Tracking TypeScript Types
 */

// ==================== SETTINGS ====================

export interface GlucoseSettings {
  _id: string;
  userId: string;
  profileType: 'user' | 'dependent';
  diabetesType: 'T1' | 'T2' | 'GDM' | 'Other';
  unitPreference: 'mg/dL' | 'mmol/L';
  targetRanges: {
    fasting: { min: number; max: number };
    preMeal: { min: number; max: number };
    postMeal: { min: number; max: number };
    bedtime: { min: number; max: number };
  };
  medications: Array<{
    name: string;
    isInsulin: boolean;
  }>;
  disclaimerAccepted: boolean;
  disclaimerAcceptedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSettingsRequest {
  diabetesType: 'T1' | 'T2' | 'GDM' | 'Other';
  unitPreference?: 'mg/dL' | 'mmol/L';
  targetRanges?: Partial<GlucoseSettings['targetRanges']>;
  medications?: Array<{ name: string; isInsulin: boolean }>;
}

export interface UpdateSettingsRequest {
  diabetesType?: 'T1' | 'T2' | 'GDM' | 'Other';
  unitPreference?: 'mg/dL' | 'mmol/L';
  targetRanges?: Partial<GlucoseSettings['targetRanges']>;
  medications?: Array<{ name: string; isInsulin: boolean }>;
}

// ==================== READINGS ====================

export type GlucoseContext = 'fasting' | 'pre_meal' | 'post_meal' | 'bedtime' | 'overnight' | 'other';

export interface GlucoseReading {
  _id: string;
  userId: string;
  profileType: 'user' | 'dependent';
  timestamp: string;
  glucoseValue: number; // Always in mg/dL
  glucoseValueRaw: number; // As entered by user
  unit: 'mg/dL' | 'mmol/L';
  context: GlucoseContext;
  carbsGrams?: number;
  insulinUnits?: number;
  activityMinutes?: number;
  symptoms: string[];
  notes?: string;
  flagged: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReadingRequest {
  timestamp: string; // ISO date string
  glucoseValue: number;
  unit: 'mg/dL' | 'mmol/L';
  context: GlucoseContext;
  carbsGrams?: number;
  insulinUnits?: number;
  activityMinutes?: number;
  symptoms?: string[];
  notes?: string;
}

export interface UpdateReadingRequest {
  timestamp?: string;
  glucoseValue?: number;
  unit?: 'mg/dL' | 'mmol/L';
  context?: GlucoseContext;
  carbsGrams?: number;
  insulinUnits?: number;
  activityMinutes?: number;
  symptoms?: string[];
  notes?: string;
}

// ==================== METRICS ====================

export interface OtherMetrics {
  _id: string;
  userId: string;
  profileType: 'user' | 'dependent';
  date: string;
  weight?: {
    value: number;
    unit: 'kg' | 'lbs';
  };
  bloodPressure?: {
    systolic: number;
    diastolic: number;
  };
  a1c?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMetricsRequest {
  date: string;
  weight?: {
    value: number;
    unit: 'kg' | 'lbs';
  };
  bloodPressure?: {
    systolic: number;
    diastolic: number;
  };
  a1c?: number;
}

// ==================== SUGGESTIONS ====================

export interface Suggestion {
  id: string;
  type: string;
  severity: 'info' | 'warn' | 'urgent';
  title: string;
  message: string;
  rationale: string;
  supportingData: {
    readings: Array<{
      timestamp: string;
      value: number;
      context: string;
    }>;
    patterns: string[];
  };
  actions?: string[];
  references?: string[];
  disclaimer: string;
}

// ==================== ANALYTICS ====================

export interface PatternAnalysis {
  timeInRange: {
    percentage: number;
    inRange: number;
    total: number;
  };
  averageGlucose: number;
  highCount: number;
  lowCount: number;
  severeHighCount: number;
  severeLowCount: number;
  coefficientOfVariation: number;
  patterns: Array<{
    type: string;
    description: string;
    severity: 'info' | 'warn' | 'urgent';
  }>;
}

// ==================== EXPORT ====================

export interface ExportData {
  exportDate: string;
  settings: GlucoseSettings | null;
  readings: GlucoseReading[];
  metrics: OtherMetrics[];
  analytics: PatternAnalysis;
}

// ==================== PREDEFINED OPTIONS ====================

export const DIABETES_TYPES = [
  { value: 'T1', label: 'Type 1 Diabetes' },
  { value: 'T2', label: 'Type 2 Diabetes' },
  { value: 'GDM', label: 'Gestational Diabetes' },
  { value: 'Other', label: 'Other/Pre-diabetes' },
] as const;

export const UNIT_OPTIONS = [
  { value: 'mg/dL', label: 'mg/dL (US)' },
  { value: 'mmol/L', label: 'mmol/L (International)' },
] as const;

export const CONTEXT_OPTIONS = [
  { value: 'fasting', label: 'Fasting (morning)' },
  { value: 'pre_meal', label: 'Before meal' },
  { value: 'post_meal', label: 'After meal' },
  { value: 'bedtime', label: 'Bedtime' },
  { value: 'overnight', label: 'Overnight' },
  { value: 'other', label: 'Other' },
] as const;

export const SYMPTOM_OPTIONS = [
  'Shaky/Trembling',
  'Sweating',
  'Hungry',
  'Dizzy/Lightheaded',
  'Confused',
  'Blurred vision',
  'Headache',
  'Fatigue/Tired',
  'Thirsty',
  'Frequent urination',
  'Nausea',
  'Rapid breathing',
  'Fruity breath odor',
  'Abdominal pain',
] as const;

