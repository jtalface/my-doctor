/**
 * BP SUGGESTION ENGINE
 * 
 * SAFETY-FIRST RULE-BASED SYSTEM
 * 
 * This engine provides EDUCATIONAL, NON-PRESCRIPTIVE suggestions based on
 * transparent rules. It does NOT provide medical advice, diagnosis, or
 * medication dose recommendations.
 * 
 * All suggestions include:
 * - Clear rationale (why triggered)
 * - Supporting data (which sessions triggered it)
 * - Disclaimer (not medical advice)
 * - "Consult your clinician" guidance where appropriate
 */

import { IBPSession } from '../models/bp-session.model.js';
import { IBPSettings } from '../models/bp-settings.model.js';
import { BP_THRESHOLDS } from '../utils/bp-classification.js';

export interface BPSuggestion {
  id: string; // Rule ID
  type: string; // Rule type
  severity: 'info' | 'warn' | 'urgent';
  title: string;
  message: string;
  rationale: string;
  supportingData: {
    sessions: Array<{
      timestamp: Date;
      systolic: number;
      diastolic: number;
      classification: string;
    }>;
    patterns: string[];
  };
  actions?: string[]; // Suggested actions (educational only)
  references?: string[]; // Clinical references
  disclaimer: string;
}

const DISCLAIMER =
  'This information is for educational purposes only and is not a substitute for professional medical advice. If you feel unwell, seek medical care. Always consult your healthcare provider.';

/**
 * Generate suggestions based on recent sessions
 */
export function generateBPSuggestions(
  sessions: IBPSession[],
  settings: IBPSettings
): BPSuggestion[] {
  const suggestions: BPSuggestion[] = [];

  if (sessions.length === 0) {
    return suggestions;
  }

  // Sort sessions by timestamp (newest first)
  const sortedSessions = [...sessions].sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
  );

  const latestSession = sortedSessions[0];
  const last7Days = sortedSessions.filter(
    (s) => Date.now() - s.timestamp.getTime() < 7 * 24 * 60 * 60 * 1000
  );

  // CRITICAL SAFETY RULES (checked first)

  // Rule A1: Hypertensive Crisis WITH Symptoms (MEDICAL EMERGENCY)
  if (
    (latestSession.averages.systolic >= BP_THRESHOLDS.STAGE2.systolic ||
      latestSession.averages.diastolic >= BP_THRESHOLDS.STAGE2.diastolic) &&
    latestSession.symptoms.length > 0 &&
    !latestSession.symptoms.includes('none')
  ) {
    suggestions.push({
      id: 'CRISIS_WITH_SYMPTOMS',
      type: 'hypertensive_crisis_symptoms',
      severity: 'urgent',
      title: '🚨 EMERGENCY: High Blood Pressure with Symptoms',
      message: `Your blood pressure is ${latestSession.averages.systolic}/${latestSession.averages.diastolic} mmHg with concerning symptoms. This is a medical emergency. Call 911 or go to the emergency room immediately. Do NOT wait or try to treat this at home.`,
      rationale: `Blood pressure ≥180/120 mmHg with symptoms (chest pain, shortness of breath, severe headache, vision changes, confusion, or weakness) indicates possible organ damage requiring immediate medical attention.`,
      supportingData: {
        sessions: [
          {
            timestamp: latestSession.timestamp,
            systolic: latestSession.averages.systolic,
            diastolic: latestSession.averages.diastolic,
            classification: latestSession.classification,
          },
        ],
        patterns: ['hypertensive_emergency', 'symptoms_present'],
      },
      actions: [
        'Call 911 immediately',
        'Do NOT drive yourself to the hospital',
        'Sit down and try to stay calm while waiting for help',
        'Have someone stay with you',
      ],
      references: ['ACC/AHA 2017 Hypertensive Crisis Guidelines'],
      disclaimer: 'THIS IS A MEDICAL EMERGENCY. Call 911 now.',
    });
  }

  // Rule A2: Hypertensive Crisis WITHOUT Symptoms (Urgent Follow-up)
  else if (
    (latestSession.averages.systolic >= BP_THRESHOLDS.STAGE2.systolic ||
      latestSession.averages.diastolic >= BP_THRESHOLDS.STAGE2.diastolic) &&
    (latestSession.symptoms.length === 0 || latestSession.symptoms.includes('none'))
  ) {
    suggestions.push({
      id: 'CRISIS_NO_SYMPTOMS',
      type: 'hypertensive_urgency',
      severity: 'urgent',
      title: '⚠️ Very High Blood Pressure - Recheck and Contact Doctor',
      message: `Your blood pressure is ${latestSession.averages.systolic}/${latestSession.averages.diastolic} mmHg, which is very high. Rest for 5 minutes in a quiet place, then recheck your blood pressure. If it remains ≥180/120 mmHg, contact your healthcare provider urgently or visit urgent care today. Do NOT attempt to adjust your medications on your own.`,
      rationale: `Blood pressure ≥180/120 mmHg without symptoms is called "hypertensive urgency" and requires prompt medical evaluation, typically within hours to days.`,
      supportingData: {
        sessions: [
          {
            timestamp: latestSession.timestamp,
            systolic: latestSession.averages.systolic,
            diastolic: latestSession.averages.diastolic,
            classification: latestSession.classification,
          },
        ],
        patterns: ['hypertensive_urgency'],
      },
      actions: [
        'Rest for 5 minutes in a calm, quiet place',
        'Recheck your blood pressure',
        'If still ≥180/120, contact your doctor or go to urgent care today',
        'Do NOT take extra blood pressure medication without doctor approval',
      ],
      references: ['ACC/AHA 2017 Hypertensive Crisis Guidelines'],
      disclaimer: DISCLAIMER + ' Do NOT adjust medications without medical guidance.',
    });
  }

  // Rule B: Persistently Above Target (≥3 days in last 7)
  const restingSessions = last7Days.filter((s) => s.context === 'resting');
  const aboveTargetSessions = restingSessions.filter(
    (s) =>
      s.averages.systolic > settings.targets.systolic ||
      s.averages.diastolic > settings.targets.diastolic
  );

  if (restingSessions.length >= 3 && aboveTargetSessions.length >= 3) {
    suggestions.push({
      id: 'PERSISTENT_HIGH',
      type: 'persistently_above_target',
      severity: 'warn',
      title: 'Pattern: Blood Pressure Above Target',
      message: `You've had ${aboveTargetSessions.length} out of ${restingSessions.length} resting readings above your target (${settings.targets.systolic}/${settings.targets.diastolic} mmHg) in the past 7 days. Persistent high blood pressure requires evaluation and adjustment of your treatment plan.`,
      rationale: `Multiple readings above target suggest your current management plan may need modification.`,
      supportingData: {
        sessions: aboveTargetSessions.slice(0, 5).map((s) => ({
          timestamp: s.timestamp,
          systolic: s.averages.systolic,
          diastolic: s.averages.diastolic,
          classification: s.classification,
        })),
        patterns: ['persistently_elevated'],
      },
      actions: [
        'Schedule an appointment with your healthcare provider',
        'Review your medication adherence (taking meds as prescribed)',
        'Discuss lifestyle factors: diet, exercise, stress, sleep',
        'Bring your BP log to your appointment',
        'Do NOT adjust medications without doctor approval',
      ],
      references: ['ACC/AHA 2017 Blood Pressure Guidelines'],
      disclaimer: DISCLAIMER,
    });
  }

  // Rule C: Poor Measurement Quality
  const recentLowQuality = last7Days.filter((s) => {
    const quality = s.measurementQuality;
    const coreItemsMissing =
      !quality.rested_5_min ||
      !quality.feet_flat ||
      !quality.back_supported ||
      !quality.arm_supported_heart_level;
    return coreItemsMissing;
  });

  if (recentLowQuality.length >= 3) {
    suggestions.push({
      id: 'POOR_MEASUREMENT_QUALITY',
      type: 'measurement_technique',
      severity: 'info',
      title: 'Improve Measurement Technique',
      message: `Several of your recent readings were taken without following proper technique. Incorrect technique can lead to inaccurate readings, which may affect your treatment decisions.`,
      rationale: `Proper measurement technique is essential for accurate blood pressure readings.`,
      supportingData: {
        sessions: [],
        patterns: ['poor_measurement_technique'],
      },
      actions: [
        'Rest for 5 minutes before taking BP',
        'Sit with feet flat on floor',
        'Back supported against chair',
        'Arm supported at heart level on a table',
        'Use correct cuff size (cuff should cover 80% of arm)',
        'Avoid caffeine, exercise, or smoking for 30 minutes before',
        'Take 2-3 readings 1 minute apart and record the average',
      ],
      references: ['AHA Blood Pressure Measurement Guidelines'],
      disclaimer: DISCLAIMER,
    });
  }

  // Rule D: Readings Taken in Non-Resting Contexts
  const nonRestingReadings = last7Days.filter(
    (s) => s.context === 'after_exercise' || s.context === 'stressed'
  );

  if (nonRestingReadings.length >= 3) {
    suggestions.push({
      id: 'NON_RESTING_CONTEXT',
      type: 'context_awareness',
      severity: 'info',
      title: 'Take Readings at Rest',
      message: `Many of your recent readings were taken after exercise or while stressed. Blood pressure naturally rises during physical activity and stress. For accurate assessment, most readings should be taken at rest.`,
      rationale: `Resting blood pressure is the standard for diagnosis and treatment decisions.`,
      supportingData: {
        sessions: nonRestingReadings.slice(0, 3).map((s) => ({
          timestamp: s.timestamp,
          systolic: s.averages.systolic,
          diastolic: s.averages.diastolic,
          classification: s.classification,
        })),
        patterns: ['non_resting_readings'],
      },
      actions: [
        'Take most readings while resting',
        'Wait at least 30 minutes after exercise',
        'Take readings at the same times each day (e.g., morning and evening)',
        'Sit quietly for 5 minutes before measuring',
      ],
      references: ['ACC/AHA Blood Pressure Monitoring Guidelines'],
      disclaimer: DISCLAIMER,
    });
  }

  // Rule E: Adherence Gap (No readings in >48 hours)
  const hoursSinceLastReading = (Date.now() - sortedSessions[0].timestamp.getTime()) / (1000 * 60 * 60);
  if (hoursSinceLastReading > 48 && hoursSinceLastReading < 168) {
    suggestions.push({
      id: 'ADHERENCE_GAP',
      type: 'measurement_adherence',
      severity: 'info',
      title: 'Reminder: Check Your Blood Pressure',
      message: `It's been ${Math.floor(hoursSinceLastReading)} hours since your last BP reading. Regular monitoring helps you and your healthcare provider track trends and adjust treatment as needed.`,
      rationale: `Consistent blood pressure monitoring is important for effective hypertension management.`,
      supportingData: {
        sessions: [],
        patterns: ['low_adherence'],
      },
      actions: [
        'Aim to check BP at the same times each day',
        'Set reminders on your phone',
        'Keep your BP monitor in a visible place',
        'Track both AM and PM readings if recommended',
      ],
      disclaimer: DISCLAIMER,
    });
  }

  // Rule F: AM/PM Scheduled but Missing Pattern
  if (settings.measurementSchedule.length === 2) {
    // User has AM and PM schedule
    const last7DaysUnique = new Set(
      last7Days.map((s) => s.timestamp.toISOString().split('T')[0])
    );
    const daysWithReadings = last7DaysUnique.size;
    const expectedReadings = daysWithReadings * 2;
    const actualReadings = last7Days.length;

    if (daysWithReadings >= 3 && actualReadings < expectedReadings * 0.7) {
      suggestions.push({
        id: 'SCHEDULE_ADHERENCE',
        type: 'schedule_compliance',
        severity: 'info',
        title: 'Measurement Schedule Reminder',
        message: `You have ${actualReadings} readings over ${daysWithReadings} days. With your AM/PM schedule, aim for ${expectedReadings} readings. Consistent timing helps detect patterns.`,
        rationale: `Regular AM and PM readings provide better insight into blood pressure patterns throughout the day.`,
        supportingData: {
          sessions: [],
          patterns: ['schedule_inconsistency'],
        },
        actions: [
          'Take readings at the same times daily (e.g., 7 AM and 7 PM)',
          'Set phone reminders for your schedule',
          'Morning: Take BP before medications and breakfast',
          'Evening: Take BP before dinner or at bedtime',
        ],
        disclaimer: DISCLAIMER,
      });
    }
  }

  // Rule G: High Variability (for information/lifestyle coaching)
  if (restingSessions.length >= 10) {
    const systolicValues = restingSessions.map((s) => s.averages.systolic);
    const range = Math.max(...systolicValues) - Math.min(...systolicValues);

    if (range > 40) {
      suggestions.push({
        id: 'HIGH_VARIABILITY',
        type: 'blood_pressure_variability',
        severity: 'info',
        title: 'Variable Blood Pressure Readings',
        message: `Your blood pressure readings show significant variation (range: ${range} mmHg). High variability may be related to measurement technique, timing, lifestyle factors, or medication adherence.`,
        rationale: `Blood pressure variability can provide insights into contributing factors and treatment effectiveness.`,
        supportingData: {
          sessions: [],
          patterns: ['high_variability'],
        },
        actions: [
          'Ensure consistent measurement technique',
          'Take readings at the same times daily',
          'Review factors: sodium intake, alcohol, stress, sleep quality',
          'Take medications at the same time each day',
          'Discuss variability with your healthcare provider',
        ],
        references: ['Research on Blood Pressure Variability'],
        disclaimer: DISCLAIMER,
      });
    }
  }

  return suggestions;
}

/**
 * Get severity color for UI
 */
export function getSeverityColor(severity: 'info' | 'warn' | 'urgent'): string {
  switch (severity) {
    case 'urgent':
      return '#dc2626'; // red-600
    case 'warn':
      return '#f59e0b'; // amber-500
    case 'info':
      return '#3b82f6'; // blue-500
  }
}

/**
 * Get severity icon
 */
export function getSeverityIcon(severity: 'info' | 'warn' | 'urgent'): string {
  switch (severity) {
    case 'urgent':
      return '🚨';
    case 'warn':
      return '⚠️';
    case 'info':
      return 'ℹ️';
  }
}

