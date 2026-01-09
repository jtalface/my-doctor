/**
 * BP Pattern Detection Service
 * 
 * Analyzes BP sessions to detect clinically significant patterns
 */

import { IBPSession } from '../models/bp-session.model.js';
import { IBPSettings } from '../models/bp-settings.model.js';
import { BPClassification } from '../models/bp-session.model.js';

export interface BPPatternAnalysis {
  summary: {
    totalSessions: number;
    avgSystolic: number;
    avgDiastolic: number;
    avgPulse?: number;
  };
  distribution: {
    normal: number;
    elevated: number;
    stage1: number;
    stage2: number;
    crisis: number;
  };
  aboveTarget: {
    count: number;
    percentage: number;
  };
  adherence: {
    daysWithReadings: number;
    expectedReadings: number;
    actualReadings: number;
    adherenceRate: number;
  };
  amPmComparison?: {
    amAvg: { systolic: number; diastolic: number };
    pmAvg: { systolic: number; diastolic: number };
    difference: { systolic: number; diastolic: number };
  };
  patterns: Array<{
    type: string;
    description: string;
    severity: 'info' | 'warn' | 'urgent';
  }>;
}

/**
 * Analyze BP patterns
 */
export function analyzeBPPatterns(
  sessions: IBPSession[],
  settings: IBPSettings,
  daysToAnalyze: number = 7
): BPPatternAnalysis {
  const cutoffDate = new Date(Date.now() - daysToAnalyze * 24 * 60 * 60 * 1000);
  const relevantSessions = sessions.filter((s) => s.timestamp >= cutoffDate);

  if (relevantSessions.length === 0) {
    return {
      summary: { totalSessions: 0, avgSystolic: 0, avgDiastolic: 0 },
      distribution: { normal: 0, elevated: 0, stage1: 0, stage2: 0, crisis: 0 },
      aboveTarget: { count: 0, percentage: 0 },
      adherence: { daysWithReadings: 0, expectedReadings: 0, actualReadings: 0, adherenceRate: 0 },
      patterns: [],
    };
  }

  // Calculate averages (resting only for home monitoring)
  const restingSessions = relevantSessions.filter((s) => s.context === 'resting');
  const sessionsForAvg = restingSessions.length > 0 ? restingSessions : relevantSessions;

  const avgSystolic = Math.round(
    sessionsForAvg.reduce((sum, s) => sum + s.averages.systolic, 0) / sessionsForAvg.length
  );
  const avgDiastolic = Math.round(
    sessionsForAvg.reduce((sum, s) => sum + s.averages.diastolic, 0) / sessionsForAvg.length
  );

  const pulseSessions = sessionsForAvg.filter((s) => s.averages.pulse);
  const avgPulse = pulseSessions.length > 0
    ? Math.round(pulseSessions.reduce((sum, s) => sum + (s.averages.pulse || 0), 0) / pulseSessions.length)
    : undefined;

  // Calculate distribution by classification
  const distribution = relevantSessions.reduce(
    (acc, s) => {
      acc[s.classification]++;
      return acc;
    },
    { normal: 0, elevated: 0, stage1: 0, stage2: 0, crisis: 0 } as Record<BPClassification, number>
  );

  // Calculate above target
  const aboveTargetCount = relevantSessions.filter(
    (s) =>
      s.averages.systolic > settings.targets.systolic ||
      s.averages.diastolic > settings.targets.diastolic
  ).length;

  const aboveTargetPercentage = Math.round((aboveTargetCount / relevantSessions.length) * 100);

  // Calculate adherence
  const uniqueDates = new Set(
    relevantSessions.map((s) => s.timestamp.toISOString().split('T')[0])
  );
  const daysWithReadings = uniqueDates.size;
  const expectedReadingsPerDay = settings.measurementSchedule.length;
  const expectedReadings = daysWithReadings * expectedReadingsPerDay;
  const adherenceRate = expectedReadings > 0
    ? Math.round((relevantSessions.length / expectedReadings) * 100)
    : 0;

  // AM/PM comparison
  let amPmComparison: BPPatternAnalysis['amPmComparison'];
  if (settings.measurementSchedule.length === 2) {
    const amSessions = relevantSessions.filter((s) => {
      const hour = s.timestamp.getHours();
      return hour >= 5 && hour < 12;
    });

    const pmSessions = relevantSessions.filter((s) => {
      const hour = s.timestamp.getHours();
      return hour >= 17 && hour < 23;
    });

    if (amSessions.length > 0 && pmSessions.length > 0) {
      const amAvg = {
        systolic: Math.round(amSessions.reduce((sum, s) => sum + s.averages.systolic, 0) / amSessions.length),
        diastolic: Math.round(amSessions.reduce((sum, s) => sum + s.averages.diastolic, 0) / amSessions.length),
      };

      const pmAvg = {
        systolic: Math.round(pmSessions.reduce((sum, s) => sum + s.averages.systolic, 0) / pmSessions.length),
        diastolic: Math.round(pmSessions.reduce((sum, s) => sum + s.averages.diastolic, 0) / pmSessions.length),
      };

      amPmComparison = {
        amAvg,
        pmAvg,
        difference: {
          systolic: pmAvg.systolic - amAvg.systolic,
          diastolic: pmAvg.diastolic - amAvg.diastolic,
        },
      };
    }
  }

  // Detect patterns
  const patterns: BPPatternAnalysis['patterns'] = [];

  // Pattern: Morning surge
  if (amPmComparison && amPmComparison.difference.systolic > 10) {
    patterns.push({
      type: 'evening_elevation',
      description: 'Evening blood pressure is higher than morning',
      severity: 'info',
    });
  }

  // Pattern: Crisis readings
  if (distribution.crisis > 0) {
    patterns.push({
      type: 'crisis_readings',
      description: `${distribution.crisis} reading(s) in crisis range`,
      severity: 'urgent',
    });
  }

  // Pattern: Mostly above target
  if (aboveTargetPercentage > 70) {
    patterns.push({
      type: 'mostly_above_target',
      description: `${aboveTargetPercentage}% of readings above target`,
      severity: 'warn',
    });
  }

  // Pattern: Poor adherence
  if (adherenceRate < 50 && daysWithReadings >= 3) {
    patterns.push({
      type: 'low_adherence',
      description: `Only ${adherenceRate}% of expected readings completed`,
      severity: 'info',
    });
  }

  return {
    summary: {
      totalSessions: relevantSessions.length,
      avgSystolic,
      avgDiastolic,
      avgPulse,
    },
    distribution,
    aboveTarget: {
      count: aboveTargetCount,
      percentage: aboveTargetPercentage,
    },
    adherence: {
      daysWithReadings,
      expectedReadings,
      actualReadings: relevantSessions.length,
      adherenceRate,
    },
    amPmComparison,
    patterns,
  };
}

/**
 * Get context distribution
 */
export function getContextDistribution(sessions: IBPSession[]): Record<string, number> {
  return sessions.reduce(
    (acc, s) => {
      acc[s.context] = (acc[s.context] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
}

