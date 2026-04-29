import type { CheckupSessionType } from '../services/api';

/**
 * Localized short title for a checkup session card (matches start-screen labels).
 */
export function getCheckupSessionTitle(
  sessionType: CheckupSessionType | undefined,
  t: (key: string) => string
): string {
  switch (sessionType) {
    case 'symptom-check':
      return t('checkup_start_symptom_title');
    case 'medication-review':
      return t('checkup_start_medication_title');
    case 'annual-checkup':
    default:
      return t('checkup_start_annual_title');
  }
}
