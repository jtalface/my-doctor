/**
 * Unit Tests for Glucose Unit Conversion Utilities
 */

import { mmolToMgDl, mgDlToMmol, normalizeGlucoseValue, convertToPreferredUnit, formatGlucoseValue } from '../glucose-units';

describe('Glucose Unit Conversion', () => {
  describe('mmolToMgDl', () => {
    it('should convert mmol/L to mg/dL correctly', () => {
      expect(mmolToMgDl(5.0)).toBe(90); // 5.0 * 18.0182 ≈ 90
      expect(mmolToMgDl(10.0)).toBe(180); // 10.0 * 18.0182 ≈ 180
    });

    it('should round to nearest integer', () => {
      expect(mmolToMgDl(5.5)).toBe(99); // 5.5 * 18.0182 ≈ 99
      expect(mmolToMgDl(7.8)).toBe(141); // 7.8 * 18.0182 ≈ 141
    });

    it('should throw error for invalid values', () => {
      expect(() => mmolToMgDl(-1)).toThrow('Invalid mmol/L value');
      expect(() => mmolToMgDl(NaN)).toThrow('Invalid mmol/L value');
      expect(() => mmolToMgDl(Infinity)).toThrow('Invalid mmol/L value');
    });

    it('should handle zero', () => {
      expect(mmolToMgDl(0)).toBe(0);
    });
  });

  describe('mgDlToMmol', () => {
    it('should convert mg/dL to mmol/L correctly', () => {
      expect(mgDlToMmol(90)).toBe(5.0); // 90 / 18.0182 ≈ 5.0
      expect(mgDlToMmol(180)).toBe(10.0); // 180 / 18.0182 ≈ 10.0
    });

    it('should round to 1 decimal place', () => {
      expect(mgDlToMmol(100)).toBe(5.5); // 100 / 18.0182 ≈ 5.55
      expect(mgDlToMmol(150)).toBe(8.3); // 150 / 18.0182 ≈ 8.32
    });

    it('should throw error for invalid values', () => {
      expect(() => mgDlToMmol(-1)).toThrow('Invalid mg/dL value');
      expect(() => mgDlToMmol(NaN)).toThrow('Invalid mg/dL value');
      expect(() => mgDlToMmol(Infinity)).toThrow('Invalid mg/dL value');
    });

    it('should handle zero', () => {
      expect(mgDlToMmol(0)).toBe(0);
    });
  });

  describe('normalizeGlucoseValue', () => {
    it('should normalize mmol/L to mg/dL', () => {
      expect(normalizeGlucoseValue(5.0, 'mmol/L')).toBe(90);
      expect(normalizeGlucoseValue(10.0, 'mmol/L')).toBe(180);
    });

    it('should keep mg/dL values as-is (rounded)', () => {
      expect(normalizeGlucoseValue(90.5, 'mg/dL')).toBe(91);
      expect(normalizeGlucoseValue(180.2, 'mg/dL')).toBe(180);
      expect(normalizeGlucoseValue(100, 'mg/dL')).toBe(100);
    });
  });

  describe('convertToPreferredUnit', () => {
    it('should convert to mmol/L when preferred', () => {
      expect(convertToPreferredUnit(90, 'mmol/L')).toBe(5.0);
      expect(convertToPreferredUnit(180, 'mmol/L')).toBe(10.0);
    });

    it('should return mg/dL as-is when preferred', () => {
      expect(convertToPreferredUnit(90, 'mg/dL')).toBe(90);
      expect(convertToPreferredUnit(180, 'mg/dL')).toBe(180);
    });
  });

  describe('formatGlucoseValue', () => {
    it('should format mmol/L with 1 decimal', () => {
      expect(formatGlucoseValue(5.0, 'mmol/L')).toBe('5.0');
      expect(formatGlucoseValue(5.55, 'mmol/L')).toBe('5.6'); // Rounds to 1 decimal
    });

    it('should format mg/dL as integer', () => {
      expect(formatGlucoseValue(90.9, 'mg/dL')).toBe('91');
      expect(formatGlucoseValue(180, 'mg/dL')).toBe('180');
    });
  });

  describe('Round-trip conversion', () => {
    it('should maintain reasonable accuracy in round-trip conversions', () => {
      const original = 100; // mg/dL
      const toMmol = mgDlToMmol(original);
      const backToMgDl = mmolToMgDl(toMmol);
      // Allow 1 unit difference due to rounding
      expect(Math.abs(backToMgDl - original)).toBeLessThanOrEqual(1);
    });
  });
});

