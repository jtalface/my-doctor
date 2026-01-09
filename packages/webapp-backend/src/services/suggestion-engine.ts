/**
 * GLUCOSE SUGGESTION ENGINE
 * 
 * SAFETY-FIRST RULE-BASED SYSTEM
 * 
 * This engine provides EDUCATIONAL, NON-PRESCRIPTIVE suggestions based on
 * transparent rules. It does NOT provide medical advice, diagnosis, or
 * medication/insulin dose recommendations.
 * 
 * All suggestions include:
 * - Clear rationale (why triggered)
 * - Supporting data (which readings triggered it)
 * - Disclaimer (not medical advice)
 * - "Consult your clinician" guidance where appropriate
 */

import { IGlucoseReading } from '../models/glucose-reading.model.js';
import { IGlucoseSettings } from '../models/glucose-settings.model.js';
import { CLINICAL_THRESHOLDS } from '../utils/glucose-validation.js';

export interface Suggestion {
  id: string; // Rule ID
  type: string; // Rule type
  severity: 'info' | 'warn' | 'urgent';
  title: string;
  message: string;
  rationale: string;
  supportingData: {
    readings: Array<{
      timestamp: Date;
      value: number;
      context: string;
    }>;
    patterns: string[];
  };
  actions?: string[]; // Suggested actions (educational only)
  references?: string[]; // Clinical references
  disclaimer: string;
}

const DISCLAIMER =
  'This information is for educational purposes only and is not a substitute for professional medical advice. Always consult your healthcare provider.';

/**
 * Generate suggestions based on recent readings
 */
export function generateSuggestions(
  readings: IGlucoseReading[],
  settings: IGlucoseSettings
): Suggestion[] {
  const suggestions: Suggestion[] = [];

  if (readings.length === 0) {
    return suggestions;
  }

  // Sort readings by timestamp (newest first)
  const sortedReadings = [...readings].sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
  );

  const latestReading = sortedReadings[0];
  const last7Days = sortedReadings.filter(
    (r) => Date.now() - r.timestamp.getTime() < 7 * 24 * 60 * 60 * 1000
  );

  // CRITICAL SAFETY RULES (checked first)
  
  // Rule A1: Severe Hypoglycemia (<54 mg/dL or 3.0 mmol/L)
  if (latestReading.glucoseValue < CLINICAL_THRESHOLDS.SEVERE_HYPO) {
    suggestions.push({
      id: 'HYPO_SEVERE',
      type: 'severe_hypoglycemia',
      severity: 'urgent',
      title: '⚠️ Severe Low Blood Sugar - Take Action Now',
      message: `Your reading of ${latestReading.glucoseValue} mg/dL is dangerously low. If conscious and able to swallow, consume 15-20g of fast-acting carbs immediately (e.g., 4 glucose tablets, 4oz juice, or 1 tablespoon honey). Wait 15 minutes and retest. If still below 70, repeat. If unconscious, having seizures, or unable to swallow, this is a medical emergency - call 911 or use glucagon if available.`,
      rationale: `Blood glucose below 54 mg/dL (3.0 mmol/L) is classified as severe hypoglycemia requiring immediate treatment.`,
      supportingData: {
        readings: [
          {
            timestamp: latestReading.timestamp,
            value: latestReading.glucoseValue,
            context: latestReading.context,
          },
        ],
        patterns: ['severe_hypoglycemia'],
      },
      actions: [
        'Treat immediately with 15-20g fast-acting carbs',
        'Retest after 15 minutes',
        'Repeat treatment if still below 70 mg/dL',
        'Seek immediate medical help if symptoms persist or worsen',
      ],
      references: ['ADA Standards of Care 2024 - Hypoglycemia Management'],
      disclaimer: DISCLAIMER + ' This is an emergency situation - seek immediate medical attention.',
    });
  }
  
  // Rule A2: Hypoglycemia (<70 mg/dL or 3.9 mmol/L) - Not severe
  else if (latestReading.glucoseValue < CLINICAL_THRESHOLDS.HYPO) {
    suggestions.push({
      id: 'HYPO_MILD',
      type: 'hypoglycemia',
      severity: 'warn',
      title: '⚠️ Low Blood Sugar Detected',
      message: `Your reading of ${latestReading.glucoseValue} mg/dL is below target. Follow the 15-15 rule: consume 15g of fast-acting carbs (e.g., 3-4 glucose tablets, 4oz juice, or 1 tablespoon honey), wait 15 minutes, then retest. Repeat if still below 70 mg/dL. Once normalized, eat a small snack if your next meal is more than an hour away.`,
      rationale: `Blood glucose below 70 mg/dL (3.9 mmol/L) is considered hypoglycemia and requires treatment.`,
      supportingData: {
        readings: [
          {
            timestamp: latestReading.timestamp,
            value: latestReading.glucoseValue,
            context: latestReading.context,
          },
        ],
        patterns: ['hypoglycemia'],
      },
      actions: [
        'Follow the 15-15 rule',
        'Retest after 15 minutes',
        'Eat a small snack once normalized if meal is delayed',
        'Track the episode in your log',
      ],
      references: ['ADA Standards of Care 2024 - Hypoglycemia Management'],
      disclaimer: DISCLAIMER,
    });
  }

  // Rule B1: Severe Hyperglycemia with DKA risk (>300 mg/dL, especially T1)
  if (
    latestReading.glucoseValue >= CLINICAL_THRESHOLDS.HYPER_SEVERE &&
    settings.diabetesType === 'T1'
  ) {
    suggestions.push({
      id: 'HYPER_DKA_RISK',
      type: 'hyperglycemia_dka_risk',
      severity: 'urgent',
      title: '⚠️ Very High Blood Sugar - Check Ketones',
      message: `Your reading of ${latestReading.glucoseValue} mg/dL is very high. For Type 1 diabetes, this carries risk of diabetic ketoacidosis (DKA). Check your ketones immediately using urine strips or blood ketone meter. If moderate or large ketones, or if you have symptoms (nausea, vomiting, rapid breathing, fruity breath, confusion, abdominal pain), seek immediate medical care. Drink water and avoid exercise until ketones clear.`,
      rationale: `Blood glucose above 300 mg/dL in Type 1 diabetes carries significant DKA risk, especially if accompanied by ketones.`,
      supportingData: {
        readings: [
          {
            timestamp: latestReading.timestamp,
            value: latestReading.glucoseValue,
            context: latestReading.context,
          },
        ],
        patterns: ['severe_hyperglycemia', 'dka_risk'],
      },
      actions: [
        'Check ketones immediately',
        'Drink plenty of water',
        'Do NOT exercise',
        'Contact your healthcare provider',
        'Seek emergency care if ketones are moderate/large or symptoms present',
      ],
      references: ['ADA Standards of Care 2024 - DKA Management'],
      disclaimer: DISCLAIMER + ' DKA is a medical emergency - seek immediate care if symptomatic.',
    });
  }

  // Rule B2: Moderate persistent hyperglycemia
  const recentHighs = last7Days.filter(
    (r) => r.glucoseValue > CLINICAL_THRESHOLDS.HYPER_MODERATE
  );
  if (recentHighs.length >= 3) {
    suggestions.push({
      id: 'HYPER_PATTERN',
      type: 'persistent_hyperglycemia',
      severity: 'warn',
      title: 'Pattern: Frequent High Readings',
      message: `You've had ${recentHighs.length} readings above 250 mg/dL in the past 7 days. Persistent high blood sugar can lead to complications. This pattern suggests your diabetes management plan may need adjustment.`,
      rationale: `Multiple readings above 250 mg/dL indicate a pattern that should be addressed.`,
      supportingData: {
        readings: recentHighs.slice(0, 5).map((r) => ({
          timestamp: r.timestamp,
          value: r.glucoseValue,
          context: r.context,
        })),
        patterns: ['persistent_hyperglycemia'],
      },
      actions: [
        'Schedule an appointment with your healthcare provider',
        'Review your meal plan and carbohydrate intake',
        'Check if you\'re taking medications as prescribed',
        'Stay well hydrated',
        'Keep tracking your readings',
      ],
      references: ['ADA Standards of Care 2024'],
      disclaimer: DISCLAIMER,
    });
  }

  // Rule C: Repeated post-meal spikes
  const postMealReadings = last7Days.filter((r) => r.context === 'post_meal');
  const postMealHighs = postMealReadings.filter(
    (r) => r.glucoseValue > (settings.targetRanges.postMeal?.max || 180)
  );
  if (postMealHighs.length >= 3 && postMealReadings.length >= 3) {
    suggestions.push({
      id: 'POST_MEAL_SPIKES',
      type: 'post_meal_pattern',
      severity: 'info',
      title: 'Pattern: Post-Meal Spikes',
      message: `You've had ${postMealHighs.length} out of ${postMealReadings.length} post-meal readings above target in the past 7 days. Post-meal glucose control is important for overall diabetes management.`,
      rationale: `Frequent post-meal elevations suggest opportunities for improvement in meal planning or timing.`,
      supportingData: {
        readings: postMealHighs.slice(0, 5).map((r) => ({
          timestamp: r.timestamp,
          value: r.glucoseValue,
          context: r.context,
        })),
        patterns: ['post_meal_spikes'],
      },
      actions: [
        'Consider smaller portions or different food choices',
        'Try adding more fiber and protein to meals',
        'A 10-15 minute walk after meals may help',
        'Discuss meal timing with your healthcare provider',
        'Consider keeping a food diary',
      ],
      references: ['ADA Guidelines on Post-Meal Glucose Management'],
      disclaimer: DISCLAIMER,
    });
  }

  // Rule D: Repeated fasting highs
  const fastingReadings = last7Days.filter((r) => r.context === 'fasting');
  const fastingHighs = fastingReadings.filter(
    (r) => r.glucoseValue > (settings.targetRanges.fasting?.max || 130)
  );
  if (fastingHighs.length >= 3 && fastingReadings.length >= 3) {
    suggestions.push({
      id: 'FASTING_HIGHS',
      type: 'fasting_pattern',
      severity: 'info',
      title: 'Pattern: High Fasting Readings',
      message: `You've had ${fastingHighs.length} out of ${fastingReadings.length} fasting readings above target in the past 7 days. Fasting glucose reflects overnight glucose control.`,
      rationale: `Frequent fasting elevations may indicate need for adjustments in evening routine or medications.`,
      supportingData: {
        readings: fastingHighs.slice(0, 5).map((r) => ({
          timestamp: r.timestamp,
          value: r.glucoseValue,
          context: r.context,
        })),
        patterns: ['fasting_highs'],
      },
      actions: [
        'Discuss with your healthcare provider about medication timing',
        'Review your evening snacks and timing',
        'Consider what time you\'re eating dinner',
        'Ensure you\'re getting adequate sleep',
        'Check if late-night snacking is affecting morning readings',
      ],
      references: ['ADA Standards of Care 2024'],
      disclaimer: DISCLAIMER,
    });
  }

  // Rule E: Repeated lows (hypoglycemia pattern)
  const lows = last7Days.filter((r) => r.glucoseValue < CLINICAL_THRESHOLDS.HYPO);
  if (lows.length >= 2) {
    suggestions.push({
      id: 'REPEATED_LOWS',
      type: 'hypoglycemia_pattern',
      severity: 'warn',
      title: 'Pattern: Repeated Low Readings',
      message: `You've had ${lows.length} episodes of low blood sugar (below 70 mg/dL) in the past 7 days. Frequent lows increase risk of severe hypoglycemia and can impair your awareness of future lows.`,
      rationale: `Two or more episodes of hypoglycemia in a week suggests need for medication or lifestyle adjustments.`,
      supportingData: {
        readings: lows.map((r) => ({
          timestamp: r.timestamp,
          value: r.glucoseValue,
          context: r.context,
        })),
        patterns: ['repeated_hypoglycemia'],
      },
      actions: [
        'Contact your healthcare provider as soon as possible',
        'DO NOT reduce medications without medical guidance',
        'Look for patterns in timing of lows',
        'Consider having snacks before activities that trigger lows',
        'Always carry fast-acting carbs with you',
      ],
      references: ['ADA Standards of Care 2024 - Hypoglycemia Prevention'],
      disclaimer: DISCLAIMER + ' Never adjust medications without consulting your healthcare provider.',
    });
  }

  // Rule F: High variability (glucose instability)
  if (last7Days.length >= 10) {
    const values = last7Days.map((r) => r.glucoseValue);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance =
      values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    const cv = (stdDev / mean) * 100; // Coefficient of variation

    // High variability if CV > 36% (clinical guideline)
    if (cv > 36) {
      suggestions.push({
        id: 'HIGH_VARIABILITY',
        type: 'glucose_variability',
        severity: 'info',
        title: 'Pattern: Variable Readings',
        message: `Your glucose readings show high variability (swings between highs and lows). More stable glucose levels are associated with better long-term outcomes and reduced risk of complications.`,
        rationale: `Coefficient of variation is ${cv.toFixed(1)}%, which is above the recommended threshold of 36%.`,
        supportingData: {
          readings: [],
          patterns: ['high_variability'],
        },
        actions: [
          'Discuss with your healthcare provider about strategies to stabilize readings',
          'Consider continuous glucose monitoring (CGM) if not already using',
          'Review meal timing and consistency',
          'Check medication timing and adherence',
          'Look for triggers of highs and lows',
        ],
        references: ['Clinical Guidelines on Glucose Variability'],
        disclaimer: DISCLAIMER,
      });
    }
  }

  // Rule G: No recent logging (engagement)
  const hoursSinceLastReading =
    (Date.now() - sortedReadings[0].timestamp.getTime()) / (1000 * 60 * 60);
  if (hoursSinceLastReading > 24 && hoursSinceLastReading < 72) {
    suggestions.push({
      id: 'LOGGING_REMINDER',
      type: 'engagement',
      severity: 'info',
      title: 'Reminder: Log Your Readings',
      message: `It's been ${Math.floor(hoursSinceLastReading)} hours since your last glucose check. Regular monitoring helps you and your healthcare provider understand your patterns and make informed decisions.`,
      rationale: `Regular glucose monitoring is recommended for effective diabetes management.`,
      supportingData: {
        readings: [],
        patterns: ['low_engagement'],
      },
      actions: [
        'Check your blood glucose',
        'Log your reading in the app',
        'Consider setting reminders for regular checks',
      ],
      disclaimer: DISCLAIMER,
    });
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

