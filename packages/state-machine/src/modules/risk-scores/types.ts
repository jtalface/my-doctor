export interface RiskScores {
  computeBMI(weightKg: number, heightM: number): number;
  classifyBloodPressure(systolic: number, diastolic: number): string;
}
