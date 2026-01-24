import {
  hasRedFlags,
  validateBAC,
  hasFatigueWarning,
  validateFinalDecision,
  computeSuggestedDecision,
} from '../services/assessment.service.js';
import { FFDDecision } from '@ffd/shared';

const mockTemplateSnapshot = {
  sections: [
    {
      id: 'section-1-physical',
      name: 'Physical Condition',
      items: [
        { id: 'phys-1', text: 'No chest pain', isRedFlag: false },
      ],
    },
    {
      id: 'section-5-psychological',
      name: 'Psychological',
      items: [
        { id: 'psych-1', text: 'Calm/stable', isRedFlag: false },
        { id: 'psych-rf-1', text: 'RED FLAG: Aggressive behavior', isRedFlag: true },
      ],
    },
    {
      id: 'section-6-job-specific',
      name: 'Job-Specific',
      items: [
        { id: 'job-1', text: 'PPE available', isRedFlag: false },
      ],
    },
  ],
};

describe('Assessment Service', () => {
  describe('hasRedFlags', () => {
    it('returns false when no red flags are triggered', () => {
      const sections = [
        {
          sectionId: 'section-5-psychological',
          sectionName: 'Psychological',
          items: [
            { itemId: 'psych-1', passed: true },
            { itemId: 'psych-rf-1', passed: true }, // Red flag NOT triggered (passed = true means condition is NOT present)
          ],
          passed: true,
        },
      ];
      
      expect(hasRedFlags(sections, mockTemplateSnapshot)).toBe(false);
    });

    it('returns true when a red flag is triggered', () => {
      const sections = [
        {
          sectionId: 'section-5-psychological',
          sectionName: 'Psychological',
          items: [
            { itemId: 'psych-1', passed: true },
            { itemId: 'psych-rf-1', passed: false }, // Red flag triggered (passed = false means condition IS present)
          ],
          passed: false,
        },
      ];
      
      expect(hasRedFlags(sections, mockTemplateSnapshot)).toBe(true);
    });
  });

  describe('validateBAC', () => {
    it('returns valid when BAC is 0.00', () => {
      const sections = [
        {
          sectionId: 'section-3',
          sectionName: 'Substance',
          items: [],
          passed: true,
          bacReading: 0.0,
        },
      ];
      
      const result = validateBAC(sections);
      expect(result.valid).toBe(true);
    });

    it('returns invalid when BAC is above 0', () => {
      const sections = [
        {
          sectionId: 'section-3',
          sectionName: 'Substance',
          items: [],
          passed: false,
          bacReading: 0.02,
        },
      ];
      
      const result = validateBAC(sections);
      expect(result.valid).toBe(false);
      expect(result.message).toContain('0.00');
    });

    it('returns valid when BAC is not provided', () => {
      const sections = [
        {
          sectionId: 'section-3',
          sectionName: 'Substance',
          items: [],
          passed: true,
        },
      ];
      
      const result = validateBAC(sections);
      expect(result.valid).toBe(true);
    });
  });

  describe('hasFatigueWarning', () => {
    it('returns false when fatigue score is 4 or below', () => {
      const sections = [
        {
          sectionId: 'section-2',
          sectionName: 'Fatigue',
          items: [],
          passed: true,
          fatigueScore: 4,
        },
      ];
      
      expect(hasFatigueWarning(sections)).toBe(false);
    });

    it('returns true when fatigue score is above 4', () => {
      const sections = [
        {
          sectionId: 'section-2',
          sectionName: 'Fatigue',
          items: [],
          passed: true,
          fatigueScore: 5,
        },
      ];
      
      expect(hasFatigueWarning(sections)).toBe(true);
    });
  });

  describe('validateFinalDecision', () => {
    it('rejects FIT when red flags are present', () => {
      const sections = [
        {
          sectionId: 'section-5-psychological',
          sectionName: 'Psychological',
          items: [
            { itemId: 'psych-rf-1', passed: false },
          ],
          passed: false,
        },
      ];
      
      const result = validateFinalDecision(FFDDecision.FIT, sections, mockTemplateSnapshot, null);
      expect(result.valid).toBe(false);
      expect(result.suggestedDecision).toBe(FFDDecision.TEMP_UNFIT);
    });

    it('rejects FIT for safety-critical role when Section 6 fails', () => {
      const sections = [
        {
          sectionId: 'section-6-job-specific',
          sectionName: 'Job-Specific',
          items: [{ itemId: 'job-1', passed: false }],
          passed: false,
        },
      ];
      
      const jobRole = { safetyCritical: true };
      
      const result = validateFinalDecision(FFDDecision.FIT, sections, mockTemplateSnapshot, jobRole);
      expect(result.valid).toBe(false);
    });

    it('allows FIT when all conditions are met', () => {
      const sections = [
        {
          sectionId: 'section-1-physical',
          sectionName: 'Physical',
          items: [{ itemId: 'phys-1', passed: true }],
          passed: true,
        },
      ];
      
      const result = validateFinalDecision(FFDDecision.FIT, sections, mockTemplateSnapshot, null);
      expect(result.valid).toBe(true);
    });
  });

  describe('computeSuggestedDecision', () => {
    it('suggests FIT when all sections pass', () => {
      const sections = [
        {
          sectionId: 'section-1-physical',
          sectionName: 'Physical',
          items: [{ itemId: 'phys-1', passed: true }],
          passed: true,
        },
      ];
      
      const result = computeSuggestedDecision(sections, mockTemplateSnapshot, null);
      expect(result.decision).toBe(FFDDecision.FIT);
      expect(result.warnings).toHaveLength(0);
    });

    it('suggests TEMP_UNFIT when a section fails', () => {
      const sections = [
        {
          sectionId: 'section-1-physical',
          sectionName: 'Physical',
          items: [{ itemId: 'phys-1', passed: false }],
          passed: false,
        },
      ];
      
      const result = computeSuggestedDecision(sections, mockTemplateSnapshot, null);
      expect(result.decision).toBe(FFDDecision.TEMP_UNFIT);
      expect(result.warnings).toContain('One or more sections failed');
    });

    it('includes fatigue warning when score > 4', () => {
      const sections = [
        {
          sectionId: 'section-2',
          sectionName: 'Fatigue',
          items: [],
          passed: true,
          fatigueScore: 6,
        },
      ];
      
      const result = computeSuggestedDecision(sections, mockTemplateSnapshot, null);
      expect(result.warnings).toContain('Fatigue score above threshold (>4)');
    });
  });
});
