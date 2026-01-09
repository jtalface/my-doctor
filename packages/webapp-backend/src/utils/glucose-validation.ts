/**
 * Glucose Validation Utilities
 * 
 * SAFETY BOUNDARIES - Critical for preventing data entry errors
 * and ensuring suggestion engine operates within safe parameters
 */

// Safety boundaries (mg/dL)
export const GLUCOSE_BOUNDARIES = {
  ABSOLUTE_MIN: 20, // Below this is likely meter error or critical emergency
  ABSOLUTE_MAX: 600, // Above this is likely meter error or critical emergency
  TYPICAL_MIN: 40, // Typical minimum for conscious patient
  TYPICAL_MAX: 500, // Typical maximum for home monitoring
};

// mmol/L boundaries (for reference)
export const GLUCOSE_BOUNDARIES_MMOL = {
  ABSOLUTE_MIN: 1.1,
  ABSOLUTE_MAX: 33.3,
  TYPICAL_MIN: 2.2,
  TYPICAL_MAX: 27.8,
};

// Clinical thresholds (mg/dL)
export const CLINICAL_THRESHOLDS = {
  SEVERE_HYPO: 54, // <54 mg/dL (3.0 mmol/L) - Severe hypoglycemia
  HYPO: 70, // <70 mg/dL (3.9 mmol/L) - Hypoglycemia
  TARGET_LOW: 80, // Typical target low
  TARGET_HIGH: 180, // Typical target high (post-meal)
  HYPER_MODERATE: 250, // >250 mg/dL - Check ketones
  HYPER_SEVERE: 300, // >300 mg/dL - DKA risk territory
};

/**
 * Validate glucose reading value
 */
export function validateGlucoseValue(value: number, unit: 'mg/dL' | 'mmol/L'): {
  isValid: boolean;
  error?: string;
  warning?: string;
} {
  if (!isFinite(value) || value <= 0) {
    return {
      isValid: false,
      error: 'Glucose value must be a positive number',
    };
  }

  // Check boundaries based on unit
  const boundaries =
    unit === 'mmol/L' ? GLUCOSE_BOUNDARIES_MMOL : GLUCOSE_BOUNDARIES;

  if (value < boundaries.ABSOLUTE_MIN) {
    return {
      isValid: false,
      error: `Value too low (minimum: ${boundaries.ABSOLUTE_MIN} ${unit}). Please verify your meter reading.`,
    };
  }

  if (value > boundaries.ABSOLUTE_MAX) {
    return {
      isValid: false,
      error: `Value too high (maximum: ${boundaries.ABSOLUTE_MAX} ${unit}). Please verify your meter reading.`,
    };
  }

  // Check for unusual but possible values
  if (value < boundaries.TYPICAL_MIN || value > boundaries.TYPICAL_MAX) {
    return {
      isValid: true,
      warning: 'This is an unusual reading. Please verify it is correct.',
    };
  }

  return { isValid: true };
}

/**
 * Validate target range
 */
export function validateTargetRange(min: number, max: number): {
  isValid: boolean;
  error?: string;
} {
  if (!isFinite(min) || !isFinite(max)) {
    return {
      isValid: false,
      error: 'Target range values must be numbers',
    };
  }

  if (min < GLUCOSE_BOUNDARIES.TYPICAL_MIN) {
    return {
      isValid: false,
      error: `Minimum target too low (must be >= ${GLUCOSE_BOUNDARIES.TYPICAL_MIN} mg/dL)`,
    };
  }

  if (max > GLUCOSE_BOUNDARIES.TYPICAL_MAX) {
    return {
      isValid: false,
      error: `Maximum target too high (must be <= ${GLUCOSE_BOUNDARIES.TYPICAL_MAX} mg/dL)`,
    };
  }

  if (min >= max) {
    return {
      isValid: false,
      error: 'Minimum target must be less than maximum target',
    };
  }

  if (max - min < 20) {
    return {
      isValid: false,
      error: 'Target range must be at least 20 mg/dL wide',
    };
  }

  return { isValid: true };
}

/**
 * Validate carbs input
 */
export function validateCarbs(carbs: number): { isValid: boolean; error?: string } {
  if (!isFinite(carbs) || carbs < 0) {
    return {
      isValid: false,
      error: 'Carbs must be a non-negative number',
    };
  }

  if (carbs > 500) {
    return {
      isValid: false,
      error: 'Carbs value seems too high (maximum: 500g)',
    };
  }

  return { isValid: true };
}

/**
 * Validate insulin units (LOG ONLY - never used in calculations)
 */
export function validateInsulin(units: number): { isValid: boolean; error?: string } {
  if (!isFinite(units) || units < 0) {
    return {
      isValid: false,
      error: 'Insulin units must be a non-negative number',
    };
  }

  if (units > 200) {
    return {
      isValid: false,
      error: 'Insulin units value seems too high (maximum: 200 units)',
    };
  }

  return { isValid: true };
}

/**
 * Validate A1C percentage
 */
export function validateA1C(a1c: number): { isValid: boolean; error?: string } {
  if (!isFinite(a1c) || a1c < 3 || a1c > 20) {
    return {
      isValid: false,
      error: 'A1C must be between 3% and 20%',
    };
  }

  return { isValid: true };
}

/**
 * Check if glucose value should be flagged
 */
export function shouldFlagReading(valueMgDl: number, targetMin: number, targetMax: number): boolean {
  return valueMgDl < targetMin || valueMgDl > targetMax;
}

