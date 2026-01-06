/**
 * Mozambique Vaccination Schema
 * 
 * Based on the official Mozambique childhood vaccination calendar
 * "Calendário de Vacinação Infantil" from the Ministry of Health.
 */

import type { VaccinationSchema, VaccineDose, VaccinationRecord } from '../../types.js';

/**
 * Complete vaccination form schema for Mozambique
 * Structured from the official "Calendário de Vacinação Infantil"
 */
export const MOZ_VACCINATION_SCHEMA: VaccinationSchema = {
  country: 'Moçambique',
  countryCode: 'MOZ',
  version: '1.0.0',
  lastUpdated: '2024-01-01',
  doses: [
    // ═══════════════════════════════════════════════════════════════════════════════
    // À NASCENÇA (At Birth) - 0 months
    // ═══════════════════════════════════════════════════════════════════════════════
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
      id: 'vap-1',
      vaccineId: 'polio',
      vaccineName: 'Vacina contra a Poliomielite',
      vaccineAbbrev: 'VAP',
      doseNumber: 1,
      totalDoses: 4,
      ageMonths: 0,
      ageLabel: 'À nascença ou antes das 6 semanas',
      description: 'Vacina oral contra a poliomielite - dose ao nascer',
      isVitaminOrSupplement: false,
    },

    // ═══════════════════════════════════════════════════════════════════════════════
    // AOS 2 MESES (At 2 months)
    // ═══════════════════════════════════════════════════════════════════════════════
    {
      id: 'vap-2',
      vaccineId: 'polio',
      vaccineName: 'Vacina contra a Poliomielite',
      vaccineAbbrev: 'VAP',
      doseNumber: 2,
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

    // ═══════════════════════════════════════════════════════════════════════════════
    // AOS 3 MESES (At 3 months)
    // ═══════════════════════════════════════════════════════════════════════════════
    {
      id: 'vap-3',
      vaccineId: 'polio',
      vaccineName: 'Vacina contra a Poliomielite',
      vaccineAbbrev: 'VAP',
      doseNumber: 3,
      totalDoses: 4,
      ageMonths: 3,
      ageLabel: 'Aos 3 meses de vida',
      description: '4 semanas após a 2ª dose',
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

    // ═══════════════════════════════════════════════════════════════════════════════
    // AOS 4 MESES (At 4 months)
    // ═══════════════════════════════════════════════════════════════════════════════
    {
      id: 'vap-4',
      vaccineId: 'polio',
      vaccineName: 'Vacina contra a Poliomielite',
      vaccineAbbrev: 'VAP + IPV',
      doseNumber: 4,
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

    // ═══════════════════════════════════════════════════════════════════════════════
    // AOS 6 MESES (At 6 months)
    // ═══════════════════════════════════════════════════════════════════════════════
    {
      id: 'vitamina-a-1',
      vaccineId: 'vitamina-a',
      vaccineName: 'Vitamina A',
      vaccineAbbrev: 'Vit. A',
      doseNumber: 1,
      totalDoses: 6,
      ageMonths: 6,
      ageLabel: 'Aos 6 meses de vida',
      description: 'Suplemento de Vitamina A',
      isVitaminOrSupplement: true,
    },

    // ═══════════════════════════════════════════════════════════════════════════════
    // AOS 9 MESES (At 9 months)
    // ═══════════════════════════════════════════════════════════════════════════════
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

    // ═══════════════════════════════════════════════════════════════════════════════
    // AOS 12 MESES (At 12 months)
    // ═══════════════════════════════════════════════════════════════════════════════
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
      totalDoses: 6,
      ageMonths: 12,
      ageLabel: 'Aos 12 meses de vida',
      description: 'Tratamento antiparasitário',
      isVitaminOrSupplement: true,
    },

    // ═══════════════════════════════════════════════════════════════════════════════
    // AOS 18 MESES (At 18 months)
    // ═══════════════════════════════════════════════════════════════════════════════
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

    // ═══════════════════════════════════════════════════════════════════════════════
    // DOS 24 AOS 59 MESES (24 to 59 months) - Every 6 months
    // ═══════════════════════════════════════════════════════════════════════════════
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
  ],
};

/**
 * Vaccination calendar as text (Portuguese)
 */
export const MOZ_VACCINATION_CALENDAR_TEXT = `
Calendário de Vacinação Infantil

À nascença
  • Vacina contra a Tuberculose (BCG)

À nascença ou antes das 6 semanas
  • Vacina contra a Poliomielite (VAP)

Aos 2 meses de vida
  • Vacina contra a Poliomielite (VAP)
  • Vacina contra Difteria, Tosse Convulsa, Tétano, Hepatite B e Meningite (DTP/HepB/Hib) - 1ª dose
  • Vacina contra a Pneumonia (PCV) - 1ª dose
  • Vacina contra o Rotavírus - 1ª dose

Aos 3 meses de vida (ou 4 semanas após a 1ª dose)
  • Vacina contra a Poliomielite (VAP)
  • Vacina contra Difteria, Tosse Convulsa, Tétano, Hepatite B e Meningite (DTP/HepB/Hib) - 2ª dose
  • Vacina contra a Pneumonia (PCV) - 2ª dose
  • Vacina contra o Rotavírus - 2ª dose

Aos 4 meses de vida (ou 4 semanas após a 2ª dose)
  • Vacina contra a Poliomielite (vacina oral e injetável - IPV)
  • Vacina contra Difteria, Tosse Convulsa, Tétano, Hepatite B e Meningite (DTP/HepB/Hib) - 3ª dose
  • Vacina contra a Pneumonia (PCV) - 3ª dose

Aos 6 meses de vida
  • Vitamina A

Aos 9 meses de vida
  • Vacina contra o Sarampo - 1ª dose

Aos 12 meses de vida
  • Vitamina A
  • Desparasitante

Aos 18 meses de vida
  • Vacina contra o Sarampo - 2ª dose
  • Vitamina A
  • Desparasitante

Dos 24 aos 59 meses
  • Vitamina A e Desparasitante (administrados de 6 em 6 meses)
`;

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get vaccines relevant for a child's current age
 */
export function getVaccinesForAge(ageMonths: number): VaccineDose[] {
  return MOZ_VACCINATION_SCHEMA.doses.filter(dose => dose.ageMonths <= ageMonths);
}

/**
 * Get overdue vaccines based on age and current records
 */
export function getOverdueVaccines(
  ageMonths: number,
  records: VaccinationRecord[]
): VaccineDose[] {
  const relevantDoses = getVaccinesForAge(ageMonths);
  const recordMap = new Map(records.map(r => [r.doseId, r]));

  return relevantDoses.filter(dose => {
    const record = recordMap.get(dose.id);
    return !record || record.status === 'no';
  });
}

/**
 * Get pending vaccines (upcoming based on age)
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

/**
 * Get vaccines grouped by age milestone
 */
export function getVaccinesByAgeMilestone(): Map<string, VaccineDose[]> {
  const grouped = new Map<string, VaccineDose[]>();
  
  for (const dose of MOZ_VACCINATION_SCHEMA.doses) {
    const existing = grouped.get(dose.ageLabel) || [];
    grouped.set(dose.ageLabel, [...existing, dose]);
  }
  
  return grouped;
}

