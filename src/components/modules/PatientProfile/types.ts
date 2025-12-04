export interface PatientProfile {
  id: string;
  name?: string;
  age?: number;
  gender?: string;
  dateOfBirth?: string;
  medicalHistory?: string[];
  medications?: Medication[];
  allergies?: string[];
  screenings?: Record<string, ScreeningRecord>;
  socialHistory?: SocialHistory;
  lastVisit?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Medication {
  name: string;
  dosage?: string;
  frequency?: string;
  startDate?: string;
}

export interface ScreeningRecord {
  type: string;
  date: string;
  result?: string;
  notes?: string;
}

export interface SocialHistory {
  smoking?: "never" | "former" | "current";
  alcohol?: "none" | "occasional" | "moderate" | "heavy";
  exercise?: "sedentary" | "light" | "moderate" | "active";
  occupation?: string;
}

export interface PatientProfileStore {
  load(id: string): Promise<PatientProfile | null>;
  save(id: string, profile: PatientProfile): Promise<void>;
  update(id: string, updates: Partial<PatientProfile>): Promise<void>;
  delete(id: string): Promise<void>;
}

