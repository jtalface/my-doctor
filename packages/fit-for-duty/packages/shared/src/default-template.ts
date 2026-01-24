import type { ChecklistSection } from './types.js';

/**
 * Default FFD Checklist Template
 * Must match the specification exactly
 */
export const DEFAULT_TEMPLATE_SECTIONS: ChecklistSection[] = [
  {
    id: 'section-1-physical',
    name: 'Section 1: Physical Condition',
    hasVitals: true,
    items: [
      { id: 'phys-1', text: 'No chest pain, shortness of breath, dizziness' },
      { id: 'phys-2', text: 'No fever/flu/acute illness' },
      { id: 'phys-3', text: 'No recent injury affecting safety' },
      { id: 'phys-4', text: 'Able to walk/climb/balance' },
      { id: 'phys-5', text: 'No visible tremors/coordination issues' },
    ],
  },
  {
    id: 'section-2-fatigue',
    name: 'Section 2: Fatigue & Rest',
    hasSleepHours: true,
    hasFatigueScore: true,
    items: [
      { id: 'fatigue-1', text: 'Slept ≥ 6 hours in last 24h' },
      { id: 'fatigue-2', text: 'No excessive overtime (>14 hrs continuous)' },
      { id: 'fatigue-3', text: 'No microsleeps/drowsiness observed' },
      { id: 'fatigue-4', text: 'Alert and responsive' },
    ],
  },
  {
    id: 'section-3-substance',
    name: 'Section 3: Substance & Medication',
    hasBACTest: true,
    items: [
      { id: 'subst-1', text: 'No alcohol in last 12 hours' },
      { id: 'subst-2', text: 'Breath alcohol test 0.00%' },
      { id: 'subst-3', text: 'No illegal drug use' },
      { id: 'subst-4', text: 'Prescription meds declared/reviewed' },
      { id: 'subst-5', text: 'No medication side effects' },
    ],
  },
  {
    id: 'section-4-cognitive',
    name: 'Section 4: Cognitive & Mental Alertness',
    items: [
      { id: 'cog-1', text: 'Oriented to time/place/task' },
      { id: 'cog-2', text: 'Understands scope/hazards' },
      { id: 'cog-3', text: 'Can explain emergency actions' },
      { id: 'cog-4', text: 'Reaction time appears normal' },
      { id: 'cog-5', text: 'No confusion/memory gaps/slowed thinking' },
    ],
  },
  {
    id: 'section-5-psychological',
    name: 'Section 5: Psychological & Behavioral',
    items: [
      { id: 'psych-1', text: 'Calm/stable' },
      { id: 'psych-2', text: 'No distress/agitation/aggression' },
      { id: 'psych-3', text: 'No impaired judgment' },
      { id: 'psych-4', text: 'Willing to follow procedures' },
      // Red flags - if any checked => auto-fail
      { id: 'psych-rf-1', text: 'RED FLAG: Aggressive behavior', isRedFlag: true },
      { id: 'psych-rf-2', text: 'RED FLAG: Extreme anxiety/panic', isRedFlag: true },
      { id: 'psych-rf-3', text: 'RED FLAG: Paranoia/disorientation', isRedFlag: true },
      { id: 'psych-rf-4', text: 'RED FLAG: Refusal to follow safety rules', isRedFlag: true },
    ],
  },
  {
    id: 'section-6-job-specific',
    name: 'Section 6: Job-Specific Readiness',
    items: [
      { id: 'job-1', text: 'Safety-critical role requirements acknowledged' },
      { id: 'job-2', text: 'Required PPE available and correctly worn' },
      { id: 'job-3', text: 'Emergency procedures recalled' },
      { id: 'job-4', text: 'Permit-to-Work requirements understood' },
    ],
  },
];

export const DEFAULT_TEMPLATE_NAME = 'Standard FFD Checklist v1';
