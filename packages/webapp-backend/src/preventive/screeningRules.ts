import { screeningIntervals } from './screeningIntervals.js';
import { getRiskModifier } from './riskModifiers.js';
import { getScreeningLocalization } from './screeningLocalization.js';
import type {
  PreventiveProfileInput,
  ScreeningCode,
  ScreeningDueStatus,
  ScreeningItemResult,
  ScreeningScheduleResult,
} from './types.js';

const YEARS_TO_MS = 365.25 * 24 * 60 * 60 * 1000;
const MONTHS_TO_MS = 30 * 24 * 60 * 60 * 1000;

function determineApplicableScreenings(profile: PreventiveProfileInput): ScreeningCode[] {
  const age = profile.age;
  const sex = profile.sexAtBirth;
  if (age === undefined || age < 18) {
    return ['blood_pressure', 'dental', 'vision'];
  }

  const base: ScreeningCode[] = [
    'blood_pressure',
    'lipid_panel',
    'hba1c',
    'colorectal',
    'vision',
    'dental',
  ];

  if (sex === 'female') {
    base.push('cervical', 'mammogram', 'dexa');
  }
  if (sex === 'male') {
    base.push('psa_discussion');
  }

  return base;
}

function getRecommendByDate(lastCompletedAt: Date | null, intervalYears: number): Date {
  if (!lastCompletedAt) {
    return new Date(0);
  }
  return new Date(lastCompletedAt.getTime() + intervalYears * YEARS_TO_MS);
}

function classifyDueStatus(
  recommendBy: Date,
  dueSoonMonths: number,
  age?: number
): ScreeningDueStatus {
  if (age !== undefined && age < 18) {
    return 'discuss_with_clinician';
  }

  const now = Date.now();
  if (recommendBy.getTime() <= now) {
    return 'due_now';
  }

  if (recommendBy.getTime() - now <= dueSoonMonths * MONTHS_TO_MS) {
    return 'due_soon';
  }

  return 'up_to_date';
}

function ageGating(profile: PreventiveProfileInput, code: ScreeningCode): boolean {
  const age = profile.age;
  if (age === undefined) return true;

  if (code === 'colorectal') return age >= 45;
  if (code === 'psa_discussion') return age >= 50;
  if (code === 'mammogram') return age >= 40;
  if (code === 'dexa') return age >= 65;
  if (code === 'cervical') return age >= 21 && age <= 65;
  return true;
}

export function generateScreeningSchedule(
  profile: PreventiveProfileInput,
  completionsByCode: Partial<Record<ScreeningCode, Date | null>>
): ScreeningScheduleResult {
  const language = profile.language || 'pt';
  const localization = getScreeningLocalization(language);
  const applicable = determineApplicableScreenings(profile).filter((code) => ageGating(profile, code));

  const items: ScreeningItemResult[] = applicable.map((code) => {
    const intervalCfg = screeningIntervals[code];
    const modifier = getRiskModifier(profile, code);
    const yearsOverride = modifier.intervalYearsOverride;
    const intervalYears = yearsOverride ?? intervalCfg.yearsMax;
    const lastCompletedAt = completionsByCode[code] ?? null;
    const recommendByDate = getRecommendByDate(lastCompletedAt, intervalYears);
    let dueStatus = classifyDueStatus(recommendByDate, intervalCfg.dueSoonMonths, profile.age);

    if (profile.age !== undefined && profile.age >= 75 && ['psa_discussion', 'colorectal', 'mammogram', 'cervical', 'dexa'].includes(code)) {
      dueStatus = 'discuss_with_clinician';
    }

    return {
      code,
      name: localization.screening[code].name,
      intervalLabel: localization.screening[code].interval,
      whyItMatters: localization.screening[code].why,
      dueStatus,
      riskNote: localization.riskNotes[modifier.noteKey] ?? localization.riskNotes.risk_standard ?? '',
      recommendBy: recommendByDate.getTime() <= 0 ? null : recommendByDate.toISOString(),
      learnMore: localization.screening[code].learnMore,
      lastCompletedAt: lastCompletedAt ? lastCompletedAt.toISOString() : null,
    };
  });

  const byStatus = (status: ScreeningDueStatus) => items.filter((item) => item.dueStatus === status);
  const timeline = [...items]
    .filter((item) => item.recommendBy)
    .sort((a, b) => new Date(a.recommendBy as string).getTime() - new Date(b.recommendBy as string).getTime())
    .map((item) => ({
      screeningCode: item.code,
      screeningName: item.name,
      recommendBy: item.recommendBy,
    }));

  return {
    language,
    generatedAt: new Date().toISOString(),
    disclaimer: localization.disclaimer,
    dueNow: byStatus('due_now'),
    dueSoon: byStatus('due_soon'),
    upToDate: byStatus('up_to_date'),
    discussWithClinician: byStatus('discuss_with_clinician'),
    upcomingTimeline: timeline,
  };
}
