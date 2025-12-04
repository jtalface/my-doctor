export interface PatientProfile {
  id: string;
  name?: string;
  age?: number;
  gender?: string;
  weight?: number;  // kg
  height?: number;  // meters
  medicalHistory?: string[];
  medications?: string[];
  screenings?: Record<string, any>;
  lastVisit?: string;
}

export interface PatientProfileStore {
  load(id: string): Promise<PatientProfile | null>;
  save(id: string, profile: PatientProfile): Promise<void>;
}
