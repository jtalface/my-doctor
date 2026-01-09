/**
 * Glucose Pattern Detection Service
 * 
 * Analyzes glucose readings to detect clinically significant patterns
 */

import { IGlucoseReading } from '../models/glucose-reading.model.js';
import { IGlucoseSettings } from '../models/glucose-settings.model.js';
import { CLINICAL_THRESHOLDS } from '../utils/glucose-validation.js';

export interface PatternAnalysis {
  timeInRange: {
    percentage: number;
    inRange: number;
    total: number;
  };
  averageGlucose: number;
  highCount: number;
  lowCount: number;
  severeHighCount: number;
  severeLowCount: number;
  coefficientOfVariation: number;
  patterns: {
    type: string;
    description: string;
    severity: 'info' | 'warn' | 'urgent';
  }[];
}

/**
 * Analyze glucose patterns
 */
export function analyzePatterns(
  readings: IGlucoseReading[],
  settings: IGlucoseSettings,
  daysToAnalyze: number = 7
): PatternAnalysis {
  const cutoffDate = new Date(Date.now() - daysToAnalyze * 24 * 60 * 60 * 1000);
  const relevantReadings = readings.filter((r) => r.timestamp >= cutoffDate);

  if (relevantReadings.length === 0) {
    return {
      timeInRange: { percentage: 0, inRange: 0, total: 0 },
      averageGlucose: 0,
      highCount: 0,
      lowCount: 0,
      severeHighCount: 0,
      severeLowCount: 0,
      coefficientOfVariation: 0,
      patterns: [],
    };
  }

  // Calculate time in range
  const inRange = relevantReadings.filter(
    (r) =>
      r.glucoseValue >= settings.targetRanges.preMeal.min &&
      r.glucoseValue <= settings.targetRanges.postMeal.max
  );

  // Calculate averages and counts
  const values = relevantReadings.map((r) => r.glucoseValue);
  const avgGlucose = values.reduce((a, b) => a + b, 0) / values.length;

  const highCount = relevantReadings.filter(
    (r) => r.glucoseValue > settings.targetRanges.postMeal.max
  ).length;

  const lowCount = relevantReadings.filter(
    (r) => r.glucoseValue < settings.targetRanges.fasting.min
  ).length;

  const severeHighCount = relevantReadings.filter(
    (r) => r.glucoseValue > CLINICAL_THRESHOLDS.HYPER_SEVERE
  ).length;

  const severeLowCount = relevantReadings.filter(
    (r) => r.glucoseValue < CLINICAL_THRESHOLDS.SEVERE_HYPO
  ).length;

  // Calculate coefficient of variation (CV)
  const variance = values.reduce((sum, val) => sum + Math.pow(val - avgGlucose, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  const cv = (stdDev / avgGlucose) * 100;

  // Detect patterns
  const patterns: PatternAnalysis['patterns'] = [];

  // Pattern: Nocturnal hypoglycemia
  const overnightLows = relevantReadings.filter(
    (r) => r.context === 'overnight' && r.glucoseValue < CLINICAL_THRESHOLDS.HYPO
  );
  if (overnightLows.length >= 2) {
    patterns.push({
      type: 'nocturnal_hypoglycemia',
      description: 'Repeated low readings during the night',
      severity: 'warn',
    });
  }

  // Pattern: Dawn phenomenon (high morning readings)
  const fastingReadings = relevantReadings.filter((r) => r.context === 'fasting');
  const highFasting = fastingReadings.filter(
    (r) => r.glucoseValue > settings.targetRanges.fasting.max
  );
  if (fastingReadings.length >= 3 && highFasting.length / fastingReadings.length > 0.6) {
    patterns.push({
      type: 'dawn_phenomenon',
      description: 'Consistently high fasting morning readings',
      severity: 'info',
    });
  }

  // Pattern: Post-meal spikes
  const postMealReadings = relevantReadings.filter((r) => r.context === 'post_meal');
  const postMealHighs = postMealReadings.filter(
    (r) => r.glucoseValue > settings.targetRanges.postMeal.max + 50
  );
  if (postMealReadings.length >= 3 && postMealHighs.length / postMealReadings.length > 0.5) {
    patterns.push({
      type: 'post_meal_spikes',
      description: 'Frequent significant post-meal elevations',
      severity: 'info',
    });
  }

  return {
    timeInRange: {
      percentage: Math.round((inRange.length / relevantReadings.length) * 100),
      inRange: inRange.length,
      total: relevantReadings.length,
    },
    averageGlucose: Math.round(avgGlucose),
    highCount,
    lowCount,
    severeHighCount,
    severeLowCount,
    coefficientOfVariation: Math.round(cv * 10) / 10,
    patterns,
  };
}

/**
 * Calculate estimated A1C from average glucose
 * Formula: A1C ≈ (Average glucose + 46.7) / 28.7
 */
export function estimateA1C(averageGlucoseMgDl: number): number {
  const a1c = (averageGlucoseMgDl + 46.7) / 28.7;
  return Math.round(a1c * 10) / 10;
}

/**
 * Get distribution of readings by context
 */
export function getReadingDistribution(readings: IGlucoseReading[]): Record<string, number> {
  const distribution: Record<string, number> = {
    fasting: 0,
    pre_meal: 0,
    post_meal: 0,
    bedtime: 0,
    overnight: 0,
    other: 0,
  };

  readings.forEach((r) => {
    distribution[r.context]++;
  });

  return distribution;
}

