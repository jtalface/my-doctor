/**
 * Mozambique Vaccination Form Schema
 * 
 * Based on the official Mozambique childhood vaccination calendar.
 * This schema defines all required vaccines with their doses and expected ages.
 */

export type VaccinationStatus = 'yes' | 'no' | 'unknown';

export interface VaccineDose {
  id: string;                    // Unique identifier for this dose
  vaccineId: string;             // Vaccine identifier (groups doses together)
  vaccineName: string;           // Full vaccine name in Portuguese
  vaccineAbbrev: string;         // Abbreviation (e.g., BCG, VAP)
  doseNumber: number;            // 1, 2, 3 for multi-dose vaccines
  totalDoses: number;            // Total doses required for this vaccine
  ageMonths: number;             // Expected age in months (0 = at birth)
  ageLabel: string;              // Human-readable age label in Portuguese
  description?: string;          // Additional info about the vaccine
  isVitaminOrSupplement: boolean; // True for Vitamin A, Deworming
}

export interface VaccinationRecord {
  doseId: string;                // References VaccineDose.id
  status: VaccinationStatus;     // 'yes', 'no', or 'unknown'
  dateAdministered?: string;     // ISO date string
  notes?: string;                // Optional notes
}

export interface VaccinationFormSchema {
  country: string;
  countryCode: 'moz';
  version: string;
  lastUpdated: string;
  doses: VaccineDose[];
}

/**
 * Complete vaccination form schema for Mozambique
 * Structured from the official "Calendário de Vacinação Infantil"
 */
export const MOZ_VACCINATION_SCHEMA: VaccinationFormSchema = {
  country: 'Moçambique',
  countryCode: 'moz',
  version: '1.0.0',
  lastUpdated: '2024-01-01',
  doses: [
    // ═══════════════════════════════════════════════════════════════
    // À NASCENÇA (At Birth) - 0 months
    // ═══════════════════════════════════════════════════════════════
    {
      id: 'bcg-1',
      vaccineId: 'bcg',
      vaccineName: 'Vacina contra a Tuberculose',
      vaccineAbbrev: 'BCG',
      doseNumber: 1,
      totalDoses: 1,
      ageMonths: 0,
      ageLabel: 'À nascença',
      description: 'Protege contra formas graves de tuberculose',
      isVitaminOrSupplement: false,
    },
    {
      id: 'vap-0',
      vaccineId: 'polio',
      vaccineName: 'Vacina contra a Poliomielite',
      vaccineAbbrev: 'VAP',
      doseNumber: 0, // Birth dose (dose 0)
      totalDoses: 4,
      ageMonths: 0,
      ageLabel: 'À nascença ou antes das 6 semanas',
      description: 'Vacina oral contra a poliomielite - dose ao nascer',
      isVitaminOrSupplement: false,
    },

    // ═══════════════════════════════════════════════════════════════
    // AOS 2 MESES (At 2 months)
    // ═══════════════════════════════════════════════════════════════
    {
      id: 'vap-1',
      vaccineId: 'polio',
      vaccineName: 'Vacina contra a Poliomielite',
      vaccineAbbrev: 'VAP',
      doseNumber: 1,
      totalDoses: 4,
      ageMonths: 2,
      ageLabel: 'Aos 2 meses de vida',
      isVitaminOrSupplement: false,
    },
    {
      id: 'dtp-hepb-hib-1',
      vaccineId: 'dtp-hepb-hib',
      vaccineName: 'Vacina contra Difteria, Tosse Convulsa, Tétano, Hepatite B e Meningite',
      vaccineAbbrev: 'DTP/HepB/Hib',
      doseNumber: 1,
      totalDoses: 3,
      ageMonths: 2,
      ageLabel: 'Aos 2 meses de vida',
      description: 'Vacina pentavalente - 1ª dose',
      isVitaminOrSupplement: false,
    },
    {
      id: 'pcv-1',
      vaccineId: 'pcv',
      vaccineName: 'Vacina contra a Pneumonia',
      vaccineAbbrev: 'PCV',
      doseNumber: 1,
      totalDoses: 3,
      ageMonths: 2,
      ageLabel: 'Aos 2 meses de vida',
      description: 'Vacina pneumocócica conjugada - 1ª dose',
      isVitaminOrSupplement: false,
    },
    {
      id: 'rotavirus-1',
      vaccineId: 'rotavirus',
      vaccineName: 'Vacina contra o Rotavírus',
      vaccineAbbrev: 'Rotavírus',
      doseNumber: 1,
      totalDoses: 2,
      ageMonths: 2,
      ageLabel: 'Aos 2 meses de vida',
      description: '1ª dose',
      isVitaminOrSupplement: false,
    },

    // ═══════════════════════════════════════════════════════════════
    // AOS 3 MESES (At 3 months)
    // ═══════════════════════════════════════════════════════════════
    {
      id: 'vap-2',
      vaccineId: 'polio',
      vaccineName: 'Vacina contra a Poliomielite',
      vaccineAbbrev: 'VAP',
      doseNumber: 2,
      totalDoses: 4,
      ageMonths: 3,
      ageLabel: 'Aos 3 meses de vida',
      description: '4 semanas após a 1ª dose',
      isVitaminOrSupplement: false,
    },
    {
      id: 'dtp-hepb-hib-2',
      vaccineId: 'dtp-hepb-hib',
      vaccineName: 'Vacina contra Difteria, Tosse Convulsa, Tétano, Hepatite B e Meningite',
      vaccineAbbrev: 'DTP/HepB/Hib',
      doseNumber: 2,
      totalDoses: 3,
      ageMonths: 3,
      ageLabel: 'Aos 3 meses de vida',
      description: 'Vacina pentavalente - 2ª dose',
      isVitaminOrSupplement: false,
    },
    {
      id: 'pcv-2',
      vaccineId: 'pcv',
      vaccineName: 'Vacina contra a Pneumonia',
      vaccineAbbrev: 'PCV',
      doseNumber: 2,
      totalDoses: 3,
      ageMonths: 3,
      ageLabel: 'Aos 3 meses de vida',
      description: 'Vacina pneumocócica conjugada - 2ª dose',
      isVitaminOrSupplement: false,
    },
    {
      id: 'rotavirus-2',
      vaccineId: 'rotavirus',
      vaccineName: 'Vacina contra o Rotavírus',
      vaccineAbbrev: 'Rotavírus',
      doseNumber: 2,
      totalDoses: 2,
      ageMonths: 3,
      ageLabel: 'Aos 3 meses de vida',
      description: '2ª dose',
      isVitaminOrSupplement: false,
    },

    // ═══════════════════════════════════════════════════════════════
    // AOS 4 MESES (At 4 months)
    // ═══════════════════════════════════════════════════════════════
    {
      id: 'vap-3',
      vaccineId: 'polio',
      vaccineName: 'Vacina contra a Poliomielite',
      vaccineAbbrev: 'VAP + IPV',
      doseNumber: 3,
      totalDoses: 4,
      ageMonths: 4,
      ageLabel: 'Aos 4 meses de vida',
      description: 'Vacina oral e injetável (IPV)',
      isVitaminOrSupplement: false,
    },
    {
      id: 'dtp-hepb-hib-3',
      vaccineId: 'dtp-hepb-hib',
      vaccineName: 'Vacina contra Difteria, Tosse Convulsa, Tétano, Hepatite B e Meningite',
      vaccineAbbrev: 'DTP/HepB/Hib',
      doseNumber: 3,
      totalDoses: 3,
      ageMonths: 4,
      ageLabel: 'Aos 4 meses de vida',
      description: 'Vacina pentavalente - 3ª dose',
      isVitaminOrSupplement: false,
    },
    {
      id: 'pcv-3',
      vaccineId: 'pcv',
      vaccineName: 'Vacina contra a Pneumonia',
      vaccineAbbrev: 'PCV',
      doseNumber: 3,
      totalDoses: 3,
      ageMonths: 4,
      ageLabel: 'Aos 4 meses de vida',
      description: 'Vacina pneumocócica conjugada - 3ª dose',
      isVitaminOrSupplement: false,
    },

    // ═══════════════════════════════════════════════════════════════
    // AOS 6 MESES (At 6 months)
    // ═══════════════════════════════════════════════════════════════
    {
      id: 'vitamina-a-1',
      vaccineId: 'vitamina-a',
      vaccineName: 'Vitamina A',
      vaccineAbbrev: 'Vit. A',
      doseNumber: 1,
      totalDoses: 6, // Multiple doses through 59 months
      ageMonths: 6,
      ageLabel: 'Aos 6 meses de vida',
      description: 'Suplemento de Vitamina A',
      isVitaminOrSupplement: true,
    },

    // ═══════════════════════════════════════════════════════════════
    // AOS 9 MESES (At 9 months)
    // ═══════════════════════════════════════════════════════════════
    {
      id: 'sarampo-1',
      vaccineId: 'sarampo',
      vaccineName: 'Vacina contra o Sarampo',
      vaccineAbbrev: 'Sarampo',
      doseNumber: 1,
      totalDoses: 2,
      ageMonths: 9,
      ageLabel: 'Aos 9 meses de vida',
      description: '1ª dose',
      isVitaminOrSupplement: false,
    },

    // ═══════════════════════════════════════════════════════════════
    // AOS 12 MESES (At 12 months)
    // ═══════════════════════════════════════════════════════════════
    {
      id: 'vitamina-a-2',
      vaccineId: 'vitamina-a',
      vaccineName: 'Vitamina A',
      vaccineAbbrev: 'Vit. A',
      doseNumber: 2,
      totalDoses: 6,
      ageMonths: 12,
      ageLabel: 'Aos 12 meses de vida',
      isVitaminOrSupplement: true,
    },
    {
      id: 'desparasitante-1',
      vaccineId: 'desparasitante',
      vaccineName: 'Desparasitante',
      vaccineAbbrev: 'Desp.',
      doseNumber: 1,
      totalDoses: 6, // Multiple doses through 59 months
      ageMonths: 12,
      ageLabel: 'Aos 12 meses de vida',
      description: 'Tratamento antiparasitário',
      isVitaminOrSupplement: true,
    },

    // ═══════════════════════════════════════════════════════════════
    // AOS 18 MESES (At 18 months)
    // ═══════════════════════════════════════════════════════════════
    {
      id: 'sarampo-2',
      vaccineId: 'sarampo',
      vaccineName: 'Vacina contra o Sarampo',
      vaccineAbbrev: 'Sarampo',
      doseNumber: 2,
      totalDoses: 2,
      ageMonths: 18,
      ageLabel: 'Aos 18 meses de vida',
      description: '2ª dose',
      isVitaminOrSupplement: false,
    },
    {
      id: 'vitamina-a-3',
      vaccineId: 'vitamina-a',
      vaccineName: 'Vitamina A',
      vaccineAbbrev: 'Vit. A',
      doseNumber: 3,
      totalDoses: 6,
      ageMonths: 18,
      ageLabel: 'Aos 18 meses de vida',
      isVitaminOrSupplement: true,
    },
    {
      id: 'desparasitante-2',
      vaccineId: 'desparasitante',
      vaccineName: 'Desparasitante',
      vaccineAbbrev: 'Desp.',
      doseNumber: 2,
      totalDoses: 6,
      ageMonths: 18,
      ageLabel: 'Aos 18 meses de vida',
      isVitaminOrSupplement: true,
    },

    // ═══════════════════════════════════════════════════════════════
    // DOS 24 AOS 59 MESES (24 to 59 months) - Every 6 months
    // ═══════════════════════════════════════════════════════════════
    {
      id: 'vitamina-a-4',
      vaccineId: 'vitamina-a',
      vaccineName: 'Vitamina A',
      vaccineAbbrev: 'Vit. A',
      doseNumber: 4,
      totalDoses: 6,
      ageMonths: 24,
      ageLabel: 'Aos 24 meses de vida',
      isVitaminOrSupplement: true,
    },
    {
      id: 'desparasitante-3',
      vaccineId: 'desparasitante',
      vaccineName: 'Desparasitante',
      vaccineAbbrev: 'Desp.',
      doseNumber: 3,
      totalDoses: 6,
      ageMonths: 24,
      ageLabel: 'Aos 24 meses de vida',
      isVitaminOrSupplement: true,
    },
    {
      id: 'vitamina-a-5',
      vaccineId: 'vitamina-a',
      vaccineName: 'Vitamina A',
      vaccineAbbrev: 'Vit. A',
      doseNumber: 5,
      totalDoses: 6,
      ageMonths: 30,
      ageLabel: 'Aos 30 meses de vida',
      isVitaminOrSupplement: true,
    },
    {
      id: 'desparasitante-4',
      vaccineId: 'desparasitante',
      vaccineName: 'Desparasitante',
      vaccineAbbrev: 'Desp.',
      doseNumber: 4,
      totalDoses: 6,
      ageMonths: 30,
      ageLabel: 'Aos 30 meses de vida',
      isVitaminOrSupplement: true,
    },
    {
      id: 'vitamina-a-6',
      vaccineId: 'vitamina-a',
      vaccineName: 'Vitamina A',
      vaccineAbbrev: 'Vit. A',
      doseNumber: 6,
      totalDoses: 6,
      ageMonths: 36,
      ageLabel: 'Aos 36 meses de vida',
      isVitaminOrSupplement: true,
    },
    {
      id: 'desparasitante-5',
      vaccineId: 'desparasitante',
      vaccineName: 'Desparasitante',
      vaccineAbbrev: 'Desp.',
      doseNumber: 5,
      totalDoses: 6,
      ageMonths: 36,
      ageLabel: 'Aos 36 meses de vida',
      isVitaminOrSupplement: true,
    },
    // Note: Additional doses at 42, 48, 54 months could be added
    // but we stop at 36 months for core tracking
  ],
};

/**
 * Get vaccines relevant for a child's current age
 * @param ageMonths - Child's age in months
 * @returns Array of vaccine doses up to and including current age
 */
export function getVaccinesForAge(ageMonths: number): VaccineDose[] {
  return MOZ_VACCINATION_SCHEMA.doses.filter(dose => dose.ageMonths <= ageMonths);
}

/**
 * Get overdue vaccines based on age and current records
 * @param ageMonths - Child's age in months
 * @param records - Current vaccination records
 * @returns Array of overdue vaccine doses
 */
export function getOverdueVaccines(
  ageMonths: number, 
  records: VaccinationRecord[]
): VaccineDose[] {
  const relevantDoses = getVaccinesForAge(ageMonths);
  const recordMap = new Map(records.map(r => [r.doseId, r]));
  
  return relevantDoses.filter(dose => {
    const record = recordMap.get(dose.id);
    // Overdue if no record exists or status is 'no' (not administered)
    return !record || record.status === 'no';
  });
}

/**
 * Get pending vaccines (upcoming based on age)
 * @param ageMonths - Child's age in months
 * @param lookAheadMonths - How many months ahead to look (default 3)
 * @returns Array of upcoming vaccine doses
 */
export function getPendingVaccines(
  ageMonths: number, 
  lookAheadMonths: number = 3
): VaccineDose[] {
  return MOZ_VACCINATION_SCHEMA.doses.filter(
    dose => dose.ageMonths > ageMonths && dose.ageMonths <= ageMonths + lookAheadMonths
  );
}

/**
 * Calculate vaccination completion percentage
 * @param ageMonths - Child's age in months
 * @param records - Current vaccination records
 * @returns Percentage of completed vaccinations (0-100)
 */
export function getVaccinationProgress(
  ageMonths: number, 
  records: VaccinationRecord[]
): number {
  const relevantDoses = getVaccinesForAge(ageMonths);
  if (relevantDoses.length === 0) return 100;
  
  const completedCount = records.filter(
    r => r.status === 'yes' && relevantDoses.some(d => d.id === r.doseId)
  ).length;
  
  return Math.round((completedCount / relevantDoses.length) * 100);
}


