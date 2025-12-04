import { RiskScores } from "./types";

export class RiskScoresImpl implements RiskScores {
  computeBMI(weightKg: number, heightM: number): number {
    if(!weightKg || !heightM) return NaN;
    return weightKg / (heightM * heightM);
  }

  classifyBloodPressure(systolic: number, diastolic: number): string {
    if(systolic <= 0 || diastolic <= 0) return "unknown";
    if(systolic < 120 && diastolic < 80) return "normal";
    if(systolic < 130 && diastolic < 80) return "elevated";
    if(systolic < 140 || diastolic < 90) return "stage 1 hypertension";
    return "stage 2 hypertension";
  }
}
