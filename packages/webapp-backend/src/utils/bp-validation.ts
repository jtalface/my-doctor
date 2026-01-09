/**
 * Blood Pressure Validation Utilities
 * 
 * Safety boundaries for BP measurements
 */

// Safety boundaries (mmHg)
export const BP_BOUNDARIES = {
  SYSTOLIC: {
    ABSOLUTE_MIN: 60, // Below this is likely meter error or shock
    ABSOLUTE_MAX: 260, // Above this is likely meter error or extreme emergency
    TYPICAL_MIN: 80,
    TYPICAL_MAX: 200,
  },
  DIASTOLIC: {
    ABSOLUTE_MIN: 40,
    ABSOLUTE_MAX: 150,
    TYPICAL_MIN: 50,
    TYPICAL_MAX: 120,
  },
  PULSE: {
    MIN: 30,
    MAX: 200,
    TYPICAL_MIN: 50,
    TYPICAL_MAX: 150,
  },
};

/**
 * Validate systolic BP value
 */
export function validateSystolic(value: number): {
  isValid: boolean;
  error?: string;
  warning?: string;
} {
  if (!isFinite(value) || value <= 0) {
    return {
      isValid: false,
      error: 'Systolic pressure must be a positive number',
    };
  }

  if (value < BP_BOUNDARIES.SYSTOLIC.ABSOLUTE_MIN) {
    return {
      isValid: false,
      error: `Systolic too low (minimum: ${BP_BOUNDARIES.SYSTOLIC.ABSOLUTE_MIN} mmHg). Please verify.`,
    };
  }

  if (value > BP_BOUNDARIES.SYSTOLIC.ABSOLUTE_MAX) {
    return {
      isValid: false,
      error: `Systolic too high (maximum: ${BP_BOUNDARIES.SYSTOLIC.ABSOLUTE_MAX} mmHg). Please verify.`,
    };
  }

  if (value < BP_BOUNDARIES.SYSTOLIC.TYPICAL_MIN || value > BP_BOUNDARIES.SYSTOLIC.TYPICAL_MAX) {
    return {
      isValid: true,
      warning: 'This is an unusual reading. Please verify it is correct.',
    };
  }

  return { isValid: true };
}

/**
 * Validate diastolic BP value
 */
export function validateDiastolic(value: number): {
  isValid: boolean;
  error?: string;
  warning?: string;
} {
  if (!isFinite(value) || value <= 0) {
    return {
      isValid: false,
      error: 'Diastolic pressure must be a positive number',
    };
  }

  if (value < BP_BOUNDARIES.DIASTOLIC.ABSOLUTE_MIN) {
    return {
      isValid: false,
      error: `Diastolic too low (minimum: ${BP_BOUNDARIES.DIASTOLIC.ABSOLUTE_MIN} mmHg). Please verify.`,
    };
  }

  if (value > BP_BOUNDARIES.DIASTOLIC.ABSOLUTE_MAX) {
    return {
      isValid: false,
      error: `Diastolic too high (maximum: ${BP_BOUNDARIES.DIASTOLIC.ABSOLUTE_MAX} mmHg). Please verify.`,
    };
  }

  if (value < BP_BOUNDARIES.DIASTOLIC.TYPICAL_MIN || value > BP_BOUNDARIES.DIASTOLIC.TYPICAL_MAX) {
    return {
      isValid: true,
      warning: 'This is an unusual reading. Please verify it is correct.',
    };
  }

  return { isValid: true };
}

/**
 * Validate pulse value
 */
export function validatePulse(value: number): {
  isValid: boolean;
  error?: string;
  warning?: string;
} {
  if (!isFinite(value) || value <= 0) {
    return {
      isValid: false,
      error: 'Pulse must be a positive number',
    };
  }

  if (value < BP_BOUNDARIES.PULSE.MIN || value > BP_BOUNDARIES.PULSE.MAX) {
    return {
      isValid: false,
      error: `Pulse out of range (${BP_BOUNDARIES.PULSE.MIN}-${BP_BOUNDARIES.PULSE.MAX} bpm). Please verify.`,
    };
  }

  if (value < BP_BOUNDARIES.PULSE.TYPICAL_MIN || value > BP_BOUNDARIES.PULSE.TYPICAL_MAX) {
    return {
      isValid: true,
      warning: 'This pulse is unusual. Please verify it is correct.',
    };
  }

  return { isValid: true };
}

/**
 * Validate that systolic > diastolic
 */
export function validateSystolicGreaterThanDiastolic(systolic: number, diastolic: number): {
  isValid: boolean;
  error?: string;
} {
  if (systolic <= diastolic) {
    return {
      isValid: false,
      error: 'Systolic pressure must be greater than diastolic pressure',
    };
  }

  // Check pulse pressure (difference)
  const pulsePressure = systolic - diastolic;
  if (pulsePressure < 20) {
    return {
      isValid: true,
      error: 'Pulse pressure is very narrow (< 20 mmHg). Please verify readings.',
    };
  }

  if (pulsePressure > 100) {
    return {
      isValid: true,
      error: 'Pulse pressure is very wide (> 100 mmHg). Please verify readings.',
    };
  }

  return { isValid: true };
}

/**
 * Validate BP targets
 */
export function validateTargets(systolic: number, diastolic: number): {
  isValid: boolean;
  error?: string;
} {
  if (!isFinite(systolic) || !isFinite(diastolic)) {
    return {
      isValid: false,
      error: 'Targets must be numbers',
    };
  }

  if (systolic < 90 || systolic > 180) {
    return {
      isValid: false,
      error: 'Systolic target must be between 90-180 mmHg',
    };
  }

  if (diastolic < 60 || diastolic > 110) {
    return {
      isValid: false,
      error: 'Diastolic target must be between 60-110 mmHg',
    };
  }

  if (systolic <= diastolic) {
    return {
      isValid: false,
      error: 'Systolic target must be greater than diastolic target',
    };
  }

  return { isValid: true };
}

/**
 * Calculate measurement quality score (0-100)
 */
export function calculateQualityScore(quality: {
  rested_5_min: boolean;
  feet_flat: boolean;
  back_supported: boolean;
  arm_supported_heart_level: boolean;
  correct_cuff_size?: boolean;
  no_caffeine_30_min?: boolean;
  no_exercise_30_min?: boolean;
  no_smoking_30_min?: boolean;
}): number {
  let score = 0;
  let total = 0;

  // Core requirements (mandatory)
  const coreChecks = [
    quality.rested_5_min,
    quality.feet_flat,
    quality.back_supported,
    quality.arm_supported_heart_level,
  ];

  coreChecks.forEach((check) => {
    if (check) score += 25;
    total += 25;
  });

  // Optional but important
  const optionalChecks = [
    quality.correct_cuff_size,
    quality.no_caffeine_30_min,
    quality.no_exercise_30_min,
    quality.no_smoking_30_min,
  ];

  optionalChecks.forEach((check) => {
    if (check !== undefined) {
      if (check) score += 6.25;
      total += 6.25;
    }
  });

  return total > 0 ? Math.round((score / total) * 100) : 0;
}

