/**
 * Glucose Unit Conversion Utilities
 * 
 * Handles conversion between mg/dL and mmol/L
 * Conversion factor: 1 mmol/L = 18.0182 mg/dL
 */

const CONVERSION_FACTOR = 18.0182;

/**
 * Convert mmol/L to mg/dL
 */
export function mmolToMgDl(mmol: number): number {
  if (!isFinite(mmol) || mmol < 0) {
    throw new Error('Invalid mmol/L value');
  }
  return Math.round(mmol * CONVERSION_FACTOR);
}

/**
 * Convert mg/dL to mmol/L
 */
export function mgDlToMmol(mgDl: number): number {
  if (!isFinite(mgDl) || mgDl < 0) {
    throw new Error('Invalid mg/dL value');
  }
  return Math.round((mgDl / CONVERSION_FACTOR) * 10) / 10; // Round to 1 decimal
}

/**
 * Normalize glucose value to mg/dL for storage
 */
export function normalizeGlucoseValue(value: number, unit: 'mg/dL' | 'mmol/L'): number {
  if (unit === 'mmol/L') {
    return mmolToMgDl(value);
  }
  return Math.round(value);
}

/**
 * Convert glucose value to user's preferred unit
 */
export function convertToPreferredUnit(
  valueMgDl: number,
  preferredUnit: 'mg/dL' | 'mmol/L'
): number {
  if (preferredUnit === 'mmol/L') {
    return mgDlToMmol(valueMgDl);
  }
  return valueMgDl;
}

/**
 * Format glucose value for display with appropriate precision
 */
export function formatGlucoseValue(value: number, unit: 'mg/dL' | 'mmol/L'): string {
  if (unit === 'mmol/L') {
    return value.toFixed(1);
  }
  return Math.round(value).toString();
}

