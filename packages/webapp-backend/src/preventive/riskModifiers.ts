import type { PreventiveProfileInput, PreventiveRiskFactors, ScreeningCode, WeightCategory } from './types.js';

export interface RiskModifierResult {
  highRisk: boolean;
  intervalYearsOverride?: number;
  noteKey: string;
}

const CARDIO_CODES: ScreeningCode[] = ['blood_pressure', 'lipid_panel'];

/**
 * Derives legacy `riskFactors` booleans from the same signals as scheduling (`getRiskModifier`).
 * Persists consistent flags on profile save and GET responses (checkbox-era fields are no longer authoritative).
 */
export function deriveLegacyRiskFactors(profile: {
  smokingStatus?: PreventiveProfileInput['smokingStatus'];
  weightCategory?: WeightCategory | null;
  chronicConditions?: string[];
  familyHistory?: string[];
}): Required<PreventiveRiskFactors> {
  const chronic = new Set((profile.chronicConditions || []).map((item) => item.toLowerCase()));
  const familyHx = new Set((profile.familyHistory || []).map((item) => item.toLowerCase()));

  return {
    smoker: profile.smokingStatus === 'current',
    overweightOrObesity:
      profile.weightCategory === 'overweight' ||
      profile.weightCategory === 'obesity' ||
      chronic.has('chronic_obesity'),
    hypertension: chronic.has('hypertension') || chronic.has('chronic_hypertension'),
    diabetesOrPrediabetes:
      chronic.has('diabetes') ||
      chronic.has('prediabetes') ||
      chronic.has('chronic_type2_diabetes') ||
      familyHx.has('fh_type2_diabetes'),
    familyHistoryCancer: familyHx.has('fh_cancer'),
    familyHistoryCardiovascular:
      familyHx.has('fh_coronary_heart_disease') ||
      familyHx.has('fh_stroke') ||
      familyHx.has('fh_hypertension'),
  };
}

/** Risk signals are derived from chronic conditions, family history, smoking and weight — not from legacy riskFactors checkboxes. */
export function getRiskModifier(
  profile: PreventiveProfileInput,
  code: ScreeningCode
): RiskModifierResult {
  const chronic = new Set((profile.chronicConditions || []).map((item) => item.toLowerCase()));
  const familyHx = new Set((profile.familyHistory || []).map((item) => item.toLowerCase()));

  const isSmoker = profile.smokingStatus === 'current';

  const isOverweight =
    profile.weightCategory === 'overweight' ||
    profile.weightCategory === 'obesity' ||
    chronic.has('chronic_obesity');

  const diabetesRisk =
    chronic.has('diabetes') ||
    chronic.has('prediabetes') ||
    chronic.has('chronic_type2_diabetes') ||
    familyHx.has('fh_type2_diabetes');

  const hasHypertension = chronic.has('hypertension') || chronic.has('chronic_hypertension');

  const cardioFamilyHistory =
    familyHx.has('fh_coronary_heart_disease') ||
    familyHx.has('fh_stroke') ||
    familyHx.has('fh_hypertension');

  const cancerHistory = chronic.has('chronic_cancer') || familyHx.has('fh_cancer');

  if (code === 'hba1c' && (diabetesRisk || isOverweight || isSmoker)) {
    return { highRisk: true, intervalYearsOverride: 1, noteKey: 'risk_hba1c_high' };
  }

  if (CARDIO_CODES.includes(code) && (cardioFamilyHistory || isSmoker || hasHypertension)) {
    return { highRisk: true, intervalYearsOverride: 1, noteKey: 'risk_cardio_high' };
  }

  if ((code === 'colorectal' || code === 'mammogram' || code === 'cervical') && cancerHistory) {
    return { highRisk: true, intervalYearsOverride: 1, noteKey: 'risk_cancer_history' };
  }

  if (profile.age !== undefined && profile.age >= 75) {
    return { highRisk: false, noteKey: 'risk_older_adult_discuss' };
  }

  return { highRisk: false, noteKey: 'risk_standard' };
}
