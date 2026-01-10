/**
 * Validation Utilities
 * 
 * Pure functions for validating user input
 */

/**
 * Validate blood pressure reading
 */
export interface BPValidation {
  isValid: boolean;
  errors: string[];
}

export function validateBPReading(systolic: number, diastolic: number, pulse?: number): BPValidation {
  const errors: string[] = [];

  // Check systolic
  if (systolic <= diastolic) {
    errors.push('Systolic must be greater than diastolic');
  }
  if (systolic < 70 || systolic > 300) {
    errors.push('Systolic must be between 70-300 mmHg');
  }

  // Check diastolic
  if (diastolic < 40 || diastolic > 200) {
    errors.push('Diastolic must be between 40-200 mmHg');
  }

  // Check pulse if provided
  if (pulse !== undefined && (pulse < 30 || pulse > 220)) {
    errors.push('Pulse must be between 30-220 bpm');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate glucose reading
 */
export function validateGlucoseReading(value: number, unit: 'mg/dL' | 'mmol/L'): BPValidation {
  const errors: string[] = [];

  if (unit === 'mg/dL') {
    if (value < 20 || value > 600) {
      errors.push('Glucose must be between 20-600 mg/dL');
    }
  } else {
    if (value < 1.1 || value > 33.3) {
      errors.push('Glucose must be between 1.1-33.3 mmol/L');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate age for dependents (must be under 18)
 */
export function validateDependentAge(age: number): boolean {
  return age >= 0 && age < 18;
}

/**
 * Validate password strength
 */
export interface PasswordValidation {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
}

export function validatePassword(password: string): PasswordValidation {
  const errors: string[] = [];
  let strength: 'weak' | 'medium' | 'strong' = 'weak';

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  // Calculate strength
  const hasLength = password.length >= 12;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const criteriaCount = [hasLength, hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;

  if (criteriaCount >= 4) {
    strength = 'strong';
  } else if (criteriaCount >= 2) {
    strength = 'medium';
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength,
  };
}

