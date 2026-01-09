/**
 * Unit Tests for Glucose Suggestion Engine
 * 
 * These tests verify the SAFETY-CRITICAL suggestion rules
 */

import { generateSuggestions } from '../suggestion-engine';
import { IGlucoseReading } from '../../models/glucose-reading.model';
import { IGlucoseSettings } from '../../models/glucose-settings.model';
import mongoose from 'mongoose';

// Helper to create mock reading
function createReading(
  value: number,
  context: string,
  timestamp?: Date
): Partial<IGlucoseReading> {
  return {
    _id: new mongoose.Types.ObjectId(),
    userId: new mongoose.Types.ObjectId(),
    profileType: 'user',
    glucoseValue: value,
    glucoseValueRaw: value,
    unit: 'mg/dL',
    context: context as any,
    timestamp: timestamp || new Date(),
    symptoms: [],
    flagged: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// Mock settings
const mockSettings: Partial<IGlucoseSettings> = {
  _id: new mongoose.Types.ObjectId(),
  userId: new mongoose.Types.ObjectId(),
  profileType: 'user',
  diabetesType: 'T2',
  unitPreference: 'mg/dL',
  targetRanges: {
    fasting: { min: 80, max: 130 },
    preMeal: { min: 80, max: 130 },
    postMeal: { min: 80, max: 180 },
    bedtime: { min: 100, max: 140 },
  },
  medications: [],
  disclaimerAccepted: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('Suggestion Engine - Safety Critical Tests', () => {
  describe('Rule A1: Severe Hypoglycemia (<54 mg/dL)', () => {
    it('should trigger URGENT suggestion for severe hypoglycemia', () => {
      const readings = [createReading(50, 'fasting')] as IGlucoseReading[];
      const suggestions = generateSuggestions(readings, mockSettings as IGlucoseSettings);

      const severeLow = suggestions.find((s) => s.id === 'HYPO_SEVERE');
      expect(severeLow).toBeDefined();
      expect(severeLow?.severity).toBe('urgent');
      expect(severeLow?.message).toContain('dangerously low');
      expect(severeLow?.message).toContain('15-20g');
    });

    it('should mention emergency actions for severe hypoglycemia', () => {
      const readings = [createReading(45, 'other')] as IGlucoseReading[];
      const suggestions = generateSuggestions(readings, mockSettings as IGlucoseSettings);

      const severeLow = suggestions.find((s) => s.id === 'HYPO_SEVERE');
      expect(severeLow?.message).toContain('911');
      expect(severeLow?.message).toContain('glucagon');
    });

    it('should NOT trigger severe hypo for 54 mg/dL (boundary)', () => {
      const readings = [createReading(54, 'fasting')] as IGlucoseReading[];
      const suggestions = generateSuggestions(readings, mockSettings as IGlucoseSettings);

      const severeLow = suggestions.find((s) => s.id === 'HYPO_SEVERE');
      expect(severeLow).toBeUndefined();
    });
  });

  describe('Rule A2: Mild Hypoglycemia (54-70 mg/dL)', () => {
    it('should trigger WARN suggestion for mild hypoglycemia', () => {
      const readings = [createReading(65, 'pre_meal')] as IGlucoseReading[];
      const suggestions = generateSuggestions(readings, mockSettings as IGlucoseSettings);

      const mildLow = suggestions.find((s) => s.id === 'HYPO_MILD');
      expect(mildLow).toBeDefined();
      expect(mildLow?.severity).toBe('warn');
      expect(mildLow?.message).toContain('15-15 rule');
    });

    it('should provide 15-15 rule guidance', () => {
      const readings = [createReading(68, 'fasting')] as IGlucoseReading[];
      const suggestions = generateSuggestions(readings, mockSettings as IGlucoseSettings);

      const mildLow = suggestions.find((s) => s.id === 'HYPO_MILD');
      expect(mildLow?.message).toContain('15g');
      expect(mildLow?.message).toContain('15 minutes');
      expect(mildLow?.message).toContain('retest');
    });

    it('should NOT trigger mild hypo for 70 mg/dL (boundary)', () => {
      const readings = [createReading(70, 'fasting')] as IGlucoseReading[];
      const suggestions = generateSuggestions(readings, mockSettings as IGlucoseSettings);

      const mildLow = suggestions.find((s) => s.id === 'HYPO_MILD');
      expect(mildLow).toBeUndefined();
    });
  });

  describe('Rule B1: Severe Hyperglycemia with DKA Risk (>300 mg/dL, T1)', () => {
    it('should trigger URGENT DKA risk for T1 diabetes above 300 mg/dL', () => {
      const t1Settings = { ...mockSettings, diabetesType: 'T1' as const };
      const readings = [createReading(320, 'other')] as IGlucoseReading[];
      const suggestions = generateSuggestions(readings, t1Settings as IGlucoseSettings);

      const dkaRisk = suggestions.find((s) => s.id === 'HYPER_DKA_RISK');
      expect(dkaRisk).toBeDefined();
      expect(dkaRisk?.severity).toBe('urgent');
      expect(dkaRisk?.message).toContain('ketones');
      expect(dkaRisk?.message).toContain('DKA');
    });

    it('should mention ketone testing for T1 hyperglycemia', () => {
      const t1Settings = { ...mockSettings, diabetesType: 'T1' as const };
      const readings = [createReading(350, 'post_meal')] as IGlucoseReading[];
      const suggestions = generateSuggestions(readings, t1Settings as IGlucoseSettings);

      const dkaRisk = suggestions.find((s) => s.id === 'HYPER_DKA_RISK');
      expect(dkaRisk?.actions).toContain('Check ketones immediately');
      expect(dkaRisk?.message).toContain('immediate medical care');
    });

    it('should NOT trigger DKA risk for T2 diabetes (not T1)', () => {
      const t2Settings = { ...mockSettings, diabetesType: 'T2' as const };
      const readings = [createReading(320, 'other')] as IGlucoseReading[];
      const suggestions = generateSuggestions(readings, t2Settings as IGlucoseSettings);

      const dkaRisk = suggestions.find((s) => s.id === 'HYPER_DKA_RISK');
      expect(dkaRisk).toBeUndefined();
    });
  });

  describe('Rule B2: Persistent Hyperglycemia Pattern', () => {
    it('should detect pattern of repeated high readings', () => {
      const now = Date.now();
      const readings = [
        createReading(270, 'post_meal', new Date(now)),
        createReading(280, 'fasting', new Date(now - 24 * 60 * 60 * 1000)),
        createReading(260, 'post_meal', new Date(now - 2 * 24 * 60 * 60 * 1000)),
      ] as IGlucoseReading[];

      const suggestions = generateSuggestions(readings, mockSettings as IGlucoseSettings);

      const pattern = suggestions.find((s) => s.id === 'HYPER_PATTERN');
      expect(pattern).toBeDefined();
      expect(pattern?.severity).toBe('warn');
      expect(pattern?.message).toContain('adjustment');
    });

    it('should NOT trigger for fewer than 3 high readings', () => {
      const now = Date.now();
      const readings = [
        createReading(270, 'post_meal', new Date(now)),
        createReading(100, 'fasting', new Date(now - 24 * 60 * 60 * 1000)),
      ] as IGlucoseReading[];

      const suggestions = generateSuggestions(readings, mockSettings as IGlucoseSettings);

      const pattern = suggestions.find((s) => s.id === 'HYPER_PATTERN');
      expect(pattern).toBeUndefined();
    });
  });

  describe('Rule C: Post-Meal Spikes Pattern', () => {
    it('should detect repeated post-meal spikes', () => {
      const now = Date.now();
      const readings = [
        createReading(200, 'post_meal', new Date(now)),
        createReading(210, 'post_meal', new Date(now - 24 * 60 * 60 * 1000)),
        createReading(205, 'post_meal', new Date(now - 2 * 24 * 60 * 60 * 1000)),
      ] as IGlucoseReading[];

      const suggestions = generateSuggestions(readings, mockSettings as IGlucoseSettings);

      const spikes = suggestions.find((s) => s.id === 'POST_MEAL_SPIKES');
      expect(spikes).toBeDefined();
      expect(spikes?.severity).toBe('info');
      expect(spikes?.actions).toContain('A 10-15 minute walk after meals may help');
    });

    it('should provide lifestyle suggestions for post-meal spikes', () => {
      const now = Date.now();
      const readings = [
        createReading(220, 'post_meal', new Date(now)),
        createReading(210, 'post_meal', new Date(now - 24 * 60 * 60 * 1000)),
        createReading(205, 'post_meal', new Date(now - 2 * 24 * 60 * 60 * 1000)),
      ] as IGlucoseReading[];

      const suggestions = generateSuggestions(readings, mockSettings as IGlucoseSettings);

      const spikes = suggestions.find((s) => s.id === 'POST_MEAL_SPIKES');
      expect(spikes?.actions?.some((a) => a.includes('fiber'))).toBe(true);
      expect(spikes?.actions?.some((a) => a.includes('walk'))).toBe(true);
    });
  });

  describe('Rule D: Fasting Highs Pattern', () => {
    it('should detect repeated high fasting readings', () => {
      const now = Date.now();
      const readings = [
        createReading(150, 'fasting', new Date(now)),
        createReading(145, 'fasting', new Date(now - 24 * 60 * 60 * 1000)),
        createReading(155, 'fasting', new Date(now - 2 * 24 * 60 * 60 * 1000)),
      ] as IGlucoseReading[];

      const suggestions = generateSuggestions(readings, mockSettings as IGlucoseSettings);

      const fastingHighs = suggestions.find((s) => s.id === 'FASTING_HIGHS');
      expect(fastingHighs).toBeDefined();
      expect(fastingHighs?.message).toContain('morning');
    });

    it('should suggest reviewing evening routine for fasting highs', () => {
      const now = Date.now();
      const readings = [
        createReading(140, 'fasting', new Date(now)),
        createReading(145, 'fasting', new Date(now - 24 * 60 * 60 * 1000)),
        createReading(150, 'fasting', new Date(now - 2 * 24 * 60 * 60 * 1000)),
      ] as IGlucoseReading[];

      const suggestions = generateSuggestions(readings, mockSettings as IGlucoseSettings);

      const fastingHighs = suggestions.find((s) => s.id === 'FASTING_HIGHS');
      expect(fastingHighs?.actions?.some((a) => a.includes('evening'))).toBe(true);
    });
  });

  describe('Rule E: Repeated Lows (Hypoglycemia Pattern)', () => {
    it('should detect pattern of repeated low readings', () => {
      const now = Date.now();
      const readings = [
        createReading(65, 'pre_meal', new Date(now)),
        createReading(68, 'fasting', new Date(now - 24 * 60 * 60 * 1000)),
      ] as IGlucoseReading[];

      const suggestions = generateSuggestions(readings, mockSettings as IGlucoseSettings);

      const repeatedLows = suggestions.find((s) => s.id === 'REPEATED_LOWS');
      expect(repeatedLows).toBeDefined();
      expect(repeatedLows?.severity).toBe('warn');
    });

    it('should NEVER suggest medication dose changes', () => {
      const now = Date.now();
      const readings = [
        createReading(65, 'pre_meal', new Date(now)),
        createReading(68, 'fasting', new Date(now - 24 * 60 * 60 * 1000)),
      ] as IGlucoseReading[];

      const suggestions = generateSuggestions(readings, mockSettings as IGlucoseSettings);

      const repeatedLows = suggestions.find((s) => s.id === 'REPEATED_LOWS');
      expect(repeatedLows?.actions?.some((a) => a.toLowerCase().includes('reduce medication'))).toBe(false);
      expect(repeatedLows?.message).toContain('DO NOT reduce medications without medical guidance');
    });
  });

  describe('Rule F: High Glucose Variability', () => {
    it('should detect high variability (CV > 36%)', () => {
      const now = Date.now();
      // Create readings with high variability
      const readings = [
        createReading(50, 'fasting', new Date(now)),
        createReading(200, 'post_meal', new Date(now - 2 * 60 * 60 * 1000)),
        createReading(80, 'pre_meal', new Date(now - 6 * 60 * 60 * 1000)),
        createReading(220, 'post_meal', new Date(now - 24 * 60 * 60 * 1000)),
        createReading(60, 'fasting', new Date(now - 2 * 24 * 60 * 60 * 1000)),
        createReading(210, 'post_meal', new Date(now - 3 * 24 * 60 * 60 * 1000)),
        createReading(70, 'fasting', new Date(now - 4 * 24 * 60 * 60 * 1000)),
        createReading(190, 'post_meal', new Date(now - 5 * 24 * 60 * 60 * 1000)),
        createReading(65, 'fasting', new Date(now - 6 * 24 * 60 * 60 * 1000)),
        createReading(200, 'post_meal', new Date(now - 7 * 24 * 60 * 60 * 1000)),
      ] as IGlucoseReading[];

      const suggestions = generateSuggestions(readings, mockSettings as IGlucoseSettings);

      const variability = suggestions.find((s) => s.id === 'HIGH_VARIABILITY');
      expect(variability).toBeDefined();
      expect(variability?.message).toContain('variability');
    });

    it('should NOT trigger for stable readings', () => {
      const now = Date.now();
      // Create stable readings (low variability)
      const readings = Array.from({ length: 10 }, (_, i) => 
        createReading(100 + (i % 2) * 10, 'fasting', new Date(now - i * 24 * 60 * 60 * 1000))
      ) as IGlucoseReading[];

      const suggestions = generateSuggestions(readings, mockSettings as IGlucoseSettings);

      const variability = suggestions.find((s) => s.id === 'HIGH_VARIABILITY');
      expect(variability).toBeUndefined();
    });
  });

  describe('Rule G: Engagement (Logging Reminder)', () => {
    it('should remind user to log after 24+ hours', () => {
      const now = Date.now();
      const readings = [
        createReading(100, 'fasting', new Date(now - 26 * 60 * 60 * 1000)), // 26 hours ago
      ] as IGlucoseReading[];

      const suggestions = generateSuggestions(readings, mockSettings as IGlucoseSettings);

      const reminder = suggestions.find((s) => s.id === 'LOGGING_REMINDER');
      expect(reminder).toBeDefined();
      expect(reminder?.severity).toBe('info');
    });

    it('should NOT remind if recent reading exists', () => {
      const now = Date.now();
      const readings = [
        createReading(100, 'fasting', new Date(now - 2 * 60 * 60 * 1000)), // 2 hours ago
      ] as IGlucoseReading[];

      const suggestions = generateSuggestions(readings, mockSettings as IGlucoseSettings);

      const reminder = suggestions.find((s) => s.id === 'LOGGING_REMINDER');
      expect(reminder).toBeUndefined();
    });
  });

  describe('Safety Disclaimers', () => {
    it('should include disclaimer on ALL suggestions', () => {
      const readings = [createReading(65, 'fasting')] as IGlucoseReading[];
      const suggestions = generateSuggestions(readings, mockSettings as IGlucoseSettings);

      suggestions.forEach((suggestion) => {
        expect(suggestion.disclaimer).toBeDefined();
        expect(suggestion.disclaimer).toContain('not a substitute for professional medical advice');
      });
    });

    it('should never suggest insulin dose changes', () => {
      const readings = [createReading(250, 'post_meal')] as IGlucoseReading[];
      const suggestions = generateSuggestions(readings, mockSettings as IGlucoseSettings);

      suggestions.forEach((suggestion) => {
        const fullText = `${suggestion.message} ${suggestion.actions?.join(' ') || ''}`.toLowerCase();
        expect(fullText).not.toMatch(/change.*dose/);
        expect(fullText).not.toMatch(/increase.*insulin/);
        expect(fullText).not.toMatch(/decrease.*insulin/);
        expect(fullText).not.toMatch(/adjust.*medication/);
      });
    });
  });
});

