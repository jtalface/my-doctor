/**
 * Validation Utilities Tests
 */

import { describe, it, expect } from 'vitest';
import {
  validateBPReading,
  validateGlucoseReading,
  validateEmail,
  validateDependentAge,
  validatePassword,
} from '../validation';

describe('Validation Utilities', () => {
  describe('validateBPReading', () => {
    it('validates correct BP reading', () => {
      const result = validateBPReading(120, 80, 70);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects systolic <= diastolic', () => {
      const result = validateBPReading(80, 120);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Systolic must be greater than diastolic');
    });

    it('rejects systolic out of range', () => {
      const low = validateBPReading(50, 40);
      expect(low.isValid).toBe(false);
      expect(low.errors).toContain('Systolic must be between 70-300 mmHg');

      const high = validateBPReading(350, 80);
      expect(high.isValid).toBe(false);
      expect(high.errors).toContain('Systolic must be between 70-300 mmHg');
    });

    it('rejects diastolic out of range', () => {
      const low = validateBPReading(100, 30);
      expect(low.isValid).toBe(false);
      expect(low.errors).toContain('Diastolic must be between 40-200 mmHg');

      const high = validateBPReading(250, 220);
      expect(high.isValid).toBe(false);
      expect(high.errors).toContain('Diastolic must be between 40-200 mmHg');
    });

    it('rejects pulse out of range', () => {
      const low = validateBPReading(120, 80, 20);
      expect(low.isValid).toBe(false);
      expect(low.errors).toContain('Pulse must be between 30-220 bpm');

      const high = validateBPReading(120, 80, 250);
      expect(high.isValid).toBe(false);
      expect(high.errors).toContain('Pulse must be between 30-220 bpm');
    });

    it('allows missing pulse', () => {
      const result = validateBPReading(120, 80);
      expect(result.isValid).toBe(true);
    });

    it('accumulates multiple errors', () => {
      const result = validateBPReading(80, 80, 300);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe('validateGlucoseReading', () => {
    it('validates correct mg/dL reading', () => {
      const result = validateGlucoseReading(100, 'mg/dL');
      expect(result.isValid).toBe(true);
    });

    it('validates correct mmol/L reading', () => {
      const result = validateGlucoseReading(5.5, 'mmol/L');
      expect(result.isValid).toBe(true);
    });

    it('rejects out of range mg/dL', () => {
      const low = validateGlucoseReading(10, 'mg/dL');
      expect(low.isValid).toBe(false);

      const high = validateGlucoseReading(700, 'mg/dL');
      expect(high.isValid).toBe(false);
    });

    it('rejects out of range mmol/L', () => {
      const low = validateGlucoseReading(0.5, 'mmol/L');
      expect(low.isValid).toBe(false);

      const high = validateGlucoseReading(40, 'mmol/L');
      expect(high.isValid).toBe(false);
    });
  });

  describe('validateEmail', () => {
    it('validates correct emails', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.uk')).toBe(true);
      expect(validateEmail('test+tag@example.com')).toBe(true);
    });

    it('rejects invalid emails', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('invalid@')).toBe(false);
      expect(validateEmail('@domain.com')).toBe(false);
      expect(validateEmail('test@domain')).toBe(false);
      expect(validateEmail('test @example.com')).toBe(false);
    });
  });

  describe('validateDependentAge', () => {
    it('validates ages under 18', () => {
      expect(validateDependentAge(0)).toBe(true);
      expect(validateDependentAge(5)).toBe(true);
      expect(validateDependentAge(17)).toBe(true);
    });

    it('rejects ages 18 and over', () => {
      expect(validateDependentAge(18)).toBe(false);
      expect(validateDependentAge(25)).toBe(false);
    });

    it('rejects negative ages', () => {
      expect(validateDependentAge(-1)).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('validates strong password', () => {
      const result = validatePassword('SecurePass123!');
      expect(result.isValid).toBe(true);
      expect(result.strength).toBe('strong');
    });

    it('rejects password without uppercase', () => {
      const result = validatePassword('lowercase123');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('rejects password without lowercase', () => {
      const result = validatePassword('UPPERCASE123');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('rejects password without number', () => {
      const result = validatePassword('NoNumbers!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('rejects password too short', () => {
      const result = validatePassword('Short1');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters');
    });

    it('assigns medium strength', () => {
      const result = validatePassword('Password123');
      expect(result.strength).toBe('medium');
    });

    it('assigns weak strength', () => {
      const result = validatePassword('pass');
      expect(result.strength).toBe('weak');
    });
  });
});

