import type { ScreeningCode } from './types.js';

export interface ScreeningIntervalConfig {
  code: ScreeningCode;
  yearsMin: number;
  yearsMax: number;
  dueSoonMonths: number;
}

export const screeningIntervals: Record<ScreeningCode, ScreeningIntervalConfig> = {
  blood_pressure: { code: 'blood_pressure', yearsMin: 1, yearsMax: 1, dueSoonMonths: 2 },
  lipid_panel: { code: 'lipid_panel', yearsMin: 4, yearsMax: 6, dueSoonMonths: 6 },
  hba1c: { code: 'hba1c', yearsMin: 1, yearsMax: 3, dueSoonMonths: 4 },
  colorectal: { code: 'colorectal', yearsMin: 1, yearsMax: 10, dueSoonMonths: 8 },
  psa_discussion: { code: 'psa_discussion', yearsMin: 1, yearsMax: 1, dueSoonMonths: 6 },
  vision: { code: 'vision', yearsMin: 1, yearsMax: 2, dueSoonMonths: 4 },
  dental: { code: 'dental', yearsMin: 0.5, yearsMax: 1, dueSoonMonths: 2 },
  cervical: { code: 'cervical', yearsMin: 3, yearsMax: 5, dueSoonMonths: 6 },
  mammogram: { code: 'mammogram', yearsMin: 1, yearsMax: 2, dueSoonMonths: 4 },
  dexa: { code: 'dexa', yearsMin: 2, yearsMax: 2, dueSoonMonths: 6 },
};
