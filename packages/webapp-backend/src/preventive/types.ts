export type PreventiveLanguage = 'pt' | 'en' | 'fr' | 'sw';

export type SexAtBirth = 'male' | 'female' | 'other';
export type SmokingStatus = 'never' | 'former' | 'current';
export type WeightCategory = 'underweight' | 'normal' | 'overweight' | 'obesity';
export type ScreeningDueStatus = 'due_now' | 'due_soon' | 'up_to_date' | 'discuss_with_clinician';

export type ScreeningCode =
  | 'blood_pressure'
  | 'lipid_panel'
  | 'hba1c'
  | 'colorectal'
  | 'psa_discussion'
  | 'vision'
  | 'dental'
  | 'cervical'
  | 'mammogram'
  | 'dexa';

/** Stored on legacy profiles; scheduling uses chronic conditions, family history, smoking and weight instead. */
export interface PreventiveRiskFactors {
  smoker?: boolean;
  overweightOrObesity?: boolean;
  hypertension?: boolean;
  diabetesOrPrediabetes?: boolean;
  familyHistoryCancer?: boolean;
  familyHistoryCardiovascular?: boolean;
}

export interface PreventiveProfileInput {
  patientId: string;
  dateOfBirth?: string;
  age?: number;
  sexAtBirth: SexAtBirth;
  genderContext?: string;
  country?: string;
  region?: string;
  pregnancyStatus?: 'yes' | 'no' | 'unknown';
  smokingStatus?: SmokingStatus;
  heightCm?: number;
  weightKg?: number;
  bmi?: number;
  weightCategory?: WeightCategory;
  chronicConditions?: string[];
  riskFactors?: PreventiveRiskFactors;
  familyHistory?: string[];
  language?: PreventiveLanguage;
}

export interface ScreeningCompletionInput {
  patientId: string;
  screeningCode: ScreeningCode;
  completedAt: string;
  notes?: string;
}

export interface ReminderInput {
  patientId: string;
  screeningCode: ScreeningCode;
  remindAt: string;
  channel?: 'in_app' | 'email';
  enabled?: boolean;
}

export interface ScreeningItemResult {
  code: ScreeningCode;
  name: string;
  intervalLabel: string;
  whyItMatters: string;
  dueStatus: ScreeningDueStatus;
  riskNote: string;
  recommendBy: string | null;
  learnMore: string;
  lastCompletedAt: string | null;
}

export interface ScreeningScheduleResult {
  language: PreventiveLanguage;
  generatedAt: string;
  disclaimer: string;
  dueNow: ScreeningItemResult[];
  dueSoon: ScreeningItemResult[];
  upToDate: ScreeningItemResult[];
  discussWithClinician: ScreeningItemResult[];
  upcomingTimeline: Array<{
    screeningCode: ScreeningCode;
    screeningName: string;
    recommendBy: string | null;
  }>;
}
