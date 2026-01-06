/**
 * Country Data Types
 * 
 * Shared type definitions for country-specific data across the MyDoctor platform.
 */

// ═══════════════════════════════════════════════════════════════════════════════
// COUNTRY INFO
// ═══════════════════════════════════════════════════════════════════════════════

/** ISO 3166-1 alpha-3 country codes for supported countries */
export type CountryCode = 'MOZ'; // Mozambique - more countries can be added

export interface CountryInfo {
  code: CountryCode;
  name: string;
  localName: string;
  languages: Language[];
  defaultLanguage: string;
  currency: string;
  currencyCode: string;
  timezone: string;
  callingCode: string;
  capital: string;
  region: string;
}

export interface Language {
  code: string;        // ISO 639-1 code
  name: string;        // English name
  localName: string;   // Name in the language itself
  isOfficial: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ETHNIC GROUPS
// ═══════════════════════════════════════════════════════════════════════════════

export interface EthnicSubgroup {
  name: string;
  alternate_names: string[];
  language: string;
  regions: string[];
}

export interface EthnicGroup {
  umbrella_group: string;
  language_family: string;
  primary_language: string;
  subgroups: EthnicSubgroup[] | string[];
  regions?: string[];
  description: string;
  /** Medical relevance notes (e.g., genetic predispositions, traditional practices) */
  medicalNotes: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MEDICAL PROTOCOLS
// ═══════════════════════════════════════════════════════════════════════════════

export type VaccinationStatus = 'yes' | 'no' | 'unknown';

export interface VaccineDose {
  id: string;
  vaccineId: string;
  vaccineName: string;
  vaccineAbbrev: string;
  doseNumber: number;
  totalDoses: number;
  ageMonths: number;
  ageLabel: string;
  description?: string;
  isVitaminOrSupplement: boolean;
}

export interface VaccinationRecord {
  doseId: string;
  status: VaccinationStatus;
  dateAdministered?: string;
  notes?: string;
}

export interface VaccinationSchema {
  country: string;
  countryCode: CountryCode;
  version: string;
  lastUpdated: string;
  doses: VaccineDose[];
}

export interface MedicalProtocol {
  id: string;
  name: string;
  localName?: string;
  category: MedicalProtocolCategory;
  description: string;
  source?: string;
  lastUpdated: string;
  applicableAgeGroups?: AgeGroup[];
  content: string;
}

export type MedicalProtocolCategory = 
  | 'vaccination'
  | 'prenatal'
  | 'postnatal'
  | 'pediatric'
  | 'adult'
  | 'geriatric'
  | 'infectious-disease'
  | 'chronic-disease'
  | 'emergency'
  | 'nutrition'
  | 'mental-health'
  | 'other';

export type AgeGroup =
  | 'newborn'      // 0-28 days
  | 'infant'       // 1-12 months
  | 'toddler'      // 1-3 years
  | 'preschool'    // 3-5 years
  | 'child'        // 6-12 years
  | 'adolescent'   // 13-17 years
  | 'adult'        // 18-64 years
  | 'elderly';     // 65+ years

// ═══════════════════════════════════════════════════════════════════════════════
// ADMINISTRATIVE DIVISIONS
// ═══════════════════════════════════════════════════════════════════════════════

export interface Province {
  code: string;
  name: string;
  capital: string;
  region: 'north' | 'central' | 'south';
}

export interface District {
  code: string;
  name: string;
  provinceCode: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// COUNTRY DATA BUNDLE
// ═══════════════════════════════════════════════════════════════════════════════

export interface CountryData {
  info: CountryInfo;
  ethnicGroups: EthnicGroup[];
  provinces: Province[];
  vaccinationSchema: VaccinationSchema;
  medicalProtocols: MedicalProtocol[];
}

