// ==================== ENUMS & UNIONS ====================

export type FlowLevel = 'none' | 'light' | 'medium' | 'heavy';

export type Symptom = 
  | 'cramps'
  | 'headache'
  | 'bloating'
  | 'acne'
  | 'breast_tenderness'
  | 'fatigue'
  | 'nausea'
  | 'back_pain';

export type Mood = 
  | 'happy'
  | 'anxious'
  | 'irritable'
  | 'sad'
  | 'energetic'
  | 'calm';

export type ProfileType = 'user' | 'dependent';

// ==================== MODELS ====================

export interface CycleSettings {
  _id: string;
  userId: string;
  profileType: ProfileType;
  lastPeriodStart: string;              // YYYY-MM-DD
  averageCycleLength: number;
  averagePeriodLength: number;
  irregularCycle: boolean;
  reminders: {
    periodExpected: boolean;
    periodExpectedDays: number;
    fertileWindow: boolean;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DailyLog {
  _id: string;
  userId: string;
  profileType: ProfileType;
  date: string;                         // YYYY-MM-DD
  isPeriodDay: boolean;
  flowLevel: FlowLevel;
  symptoms: Symptom[];
  mood: Mood[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Cycle {
  _id: string;
  userId: string;
  profileType: ProfileType;
  startDate: string;                    // YYYY-MM-DD
  endDate: string;                      // YYYY-MM-DD
  cycleLength: number;
  periodLength: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== PREDICTIONS ====================

export interface RegularPrediction {
  nextPeriod: {
    start: string;                      // YYYY-MM-DD
    end: string;                        // YYYY-MM-DD
  };
  ovulation: {
    date: string;                       // YYYY-MM-DD
  };
  fertileWindow: {
    start: string;                      // YYYY-MM-DD
    end: string;                        // YYYY-MM-DD
  };
}

export interface IrregularPrediction {
  nextPeriod: {
    startRange: {
      min: string;                      // YYYY-MM-DD
      max: string;                      // YYYY-MM-DD
    };
    endRange: {
      min: string;                      // YYYY-MM-DD
      max: string;                      // YYYY-MM-DD
    };
  };
  ovulation: {
    dateRange: {
      min: string;                      // YYYY-MM-DD
      max: string;                      // YYYY-MM-DD
    };
  };
  fertileWindow: {
    start: string;                      // YYYY-MM-DD
    end: string;                        // YYYY-MM-DD
  };
}

export type Prediction = RegularPrediction | IrregularPrediction;

// ==================== API REQUEST/RESPONSE ====================

export interface CreateSettingsRequest {
  lastPeriodStart: string;              // YYYY-MM-DD
  averageCycleLength?: number;
  averagePeriodLength?: number;
  irregularCycle?: boolean;
  reminders?: {
    periodExpected?: boolean;
    periodExpectedDays?: number;
    fertileWindow?: boolean;
  };
}

export interface UpdateSettingsRequest {
  lastPeriodStart?: string;             // YYYY-MM-DD
  averageCycleLength?: number;
  averagePeriodLength?: number;
  irregularCycle?: boolean;
  isActive?: boolean;
  reminders?: {
    periodExpected?: boolean;
    periodExpectedDays?: number;
    fertileWindow?: boolean;
  };
}

export interface CreateDailyLogRequest {
  date: string;                         // YYYY-MM-DD
  isPeriodDay?: boolean;
  flowLevel?: FlowLevel;
  symptoms?: Symptom[];
  mood?: Mood[];
  notes?: string;
}

export interface ExportData {
  version: string;
  exportDate: string;
  profileId: string;
  settings: CycleSettings | null;
  dailyLogs: DailyLog[];
  cycles: Cycle[];
}

export interface ImportDataRequest {
  settings?: CreateSettingsRequest;
  dailyLogs?: CreateDailyLogRequest[];
  replace?: boolean;                    // If true, delete existing data
}

export interface ImportDataResponse {
  success: boolean;
  imported: {
    settings: boolean;
    logs: number;
    cycles: number;
  };
}

export interface DeleteAllDataResponse {
  success: boolean;
  deleted: {
    settings: number;
    logs: number;
    cycles: number;
  };
}

// ==================== UI STATE ====================

export interface CycleStats {
  averageCycleLength: number;
  averagePeriodLength: number;
  cycleRegularity: 'regular' | 'irregular';
  cycleLengthStdDev: number;
  totalCycles: number;
  oldestCycleDate: string | null;
}

export interface DayInfo {
  date: string;                         // YYYY-MM-DD
  isPeriodDay: boolean;
  isPredictedPeriod: boolean;
  isFertileWindow: boolean;
  isOvulation: boolean;
  log: DailyLog | null;
}

export interface CalendarMonth {
  year: number;
  month: number;                        // 0-11 (JavaScript month)
  days: DayInfo[];
}

// ==================== HELPER TYPE GUARDS ====================

export function isRegularPrediction(pred: Prediction): pred is RegularPrediction {
  return 'nextPeriod' in pred && 'start' in pred.nextPeriod;
}

export function isIrregularPrediction(pred: Prediction): pred is IrregularPrediction {
  return 'nextPeriod' in pred && 'startRange' in pred.nextPeriod;
}

