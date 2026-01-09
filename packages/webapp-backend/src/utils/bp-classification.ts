/**
 * Blood Pressure Classification Utilities
 * 
 * Based on 2017 ACC/AHA High Blood Pressure Clinical Practice Guidelines
 */

import { BPClassification } from '../models/bp-session.model.js';

/**
 * BP Classification thresholds (mmHg)
 * 
 * References:
 * - ACC/AHA 2017 High Blood Pressure Guideline
 * - European Society of Cardiology 2018
 */
export const BP_THRESHOLDS = {
  NORMAL: {
    systolic: 120,
    diastolic: 80,
  },
  ELEVATED: {
    systolic: 130,
    diastolic: 80,
  },
  STAGE1: {
    systolic: 140,
    diastolic: 90,
  },
  STAGE2: {
    systolic: 180,
    diastolic: 120,
  },
  // Crisis if >= 180 systolic OR >= 120 diastolic
};

/**
 * Classify blood pressure reading
 * 
 * Classification is based on the HIGHER category between systolic and diastolic
 * 
 * @param systolic - Systolic BP in mmHg
 * @param diastolic - Diastolic BP in mmHg
 * @returns BPClassification
 */
export function classifyBP(systolic: number, diastolic: number): BPClassification {
  // Hypertensive Crisis: Systolic >= 180 OR Diastolic >= 120
  if (systolic >= BP_THRESHOLDS.STAGE2.systolic || diastolic >= BP_THRESHOLDS.STAGE2.diastolic) {
    return 'crisis';
  }

  // Stage 2 Hypertension: Systolic >= 140 OR Diastolic >= 90
  if (systolic >= BP_THRESHOLDS.STAGE1.systolic || diastolic >= BP_THRESHOLDS.STAGE1.diastolic) {
    return 'stage2';
  }

  // Stage 1 Hypertension: Systolic >= 130 OR Diastolic >= 80
  if (systolic >= BP_THRESHOLDS.ELEVATED.systolic || diastolic >= BP_THRESHOLDS.ELEVATED.diastolic) {
    return 'stage1';
  }

  // Elevated: Systolic 120-129 AND Diastolic < 80
  if (systolic >= BP_THRESHOLDS.NORMAL.systolic && diastolic < BP_THRESHOLDS.ELEVATED.diastolic) {
    return 'elevated';
  }

  // Normal: Systolic < 120 AND Diastolic < 80
  return 'normal';
}

/**
 * Get human-readable classification label
 */
export function getClassificationLabel(classification: BPClassification): string {
  switch (classification) {
    case 'normal':
      return 'Normal';
    case 'elevated':
      return 'Elevated';
    case 'stage1':
      return 'Stage 1 Hypertension';
    case 'stage2':
      return 'Stage 2 Hypertension';
    case 'crisis':
      return 'Hypertensive Crisis';
  }
}

/**
 * Get color for classification (for UI)
 */
export function getClassificationColor(classification: BPClassification): string {
  switch (classification) {
    case 'normal':
      return '#10b981'; // green
    case 'elevated':
      return '#f59e0b'; // amber
    case 'stage1':
      return '#f97316'; // orange
    case 'stage2':
      return '#ef4444'; // red
    case 'crisis':
      return '#dc2626'; // dark red
  }
}

/**
 * Get BP range description for classification
 */
export function getClassificationRange(classification: BPClassification): string {
  switch (classification) {
    case 'normal':
      return 'Systolic < 120 and Diastolic < 80';
    case 'elevated':
      return 'Systolic 120-129 and Diastolic < 80';
    case 'stage1':
      return 'Systolic 130-139 or Diastolic 80-89';
    case 'stage2':
      return 'Systolic ≥140 or Diastolic ≥90';
    case 'crisis':
      return 'Systolic ≥180 or Diastolic ≥120';
  }
}

/**
 * Calculate average of multiple BP readings
 */
export function calculateAverage(readings: Array<{ systolic: number; diastolic: number; pulse?: number }>): {
  systolic: number;
  diastolic: number;
  pulse?: number;
} {
  if (readings.length === 0) {
    throw new Error('Cannot calculate average of empty readings array');
  }

  const sum = readings.reduce(
    (acc, reading) => ({
      systolic: acc.systolic + reading.systolic,
      diastolic: acc.diastolic + reading.diastolic,
      pulse: (acc.pulse || 0) + (reading.pulse || 0),
      pulseCount: acc.pulseCount + (reading.pulse ? 1 : 0),
    }),
    { systolic: 0, diastolic: 0, pulse: 0, pulseCount: 0 }
  );

  return {
    systolic: Math.round(sum.systolic / readings.length),
    diastolic: Math.round(sum.diastolic / readings.length),
    pulse: sum.pulseCount > 0 ? Math.round(sum.pulse / sum.pulseCount) : undefined,
  };
}

