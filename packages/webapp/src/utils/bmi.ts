export type BmiWeightCategory = 'underweight' | 'normal' | 'overweight' | 'obesity';

/** BMI = kg / (m^2) */
export function computeBmi(heightCm: number, weightKg: number): number {
  if (!Number.isFinite(heightCm) || !Number.isFinite(weightKg) || heightCm <= 0 || weightKg <= 0) {
    return NaN;
  }
  const m = heightCm / 100;
  return weightKg / (m * m);
}

/** WHO-style categories for adults (same bands as existing preventive weightCategory enum). */
export function bmiToWeightCategory(bmi: number): BmiWeightCategory | null {
  if (!Number.isFinite(bmi) || bmi < 10 || bmi > 60) return null;
  if (bmi < 18.5) return 'underweight';
  if (bmi < 25) return 'normal';
  if (bmi < 30) return 'overweight';
  return 'obesity';
}

export function roundBmi(bmi: number): number {
  return Math.round(bmi * 10) / 10;
}
