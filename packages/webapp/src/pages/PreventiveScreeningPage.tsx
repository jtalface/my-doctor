import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth';
import { api, type PreventiveProfile, type PreventiveScheduleItem } from '../services/api';
import { getPreventiveText, type PreventiveTextKey } from '../i18n/preventive';
import { useTranslate } from '../i18n';
import type { LanguageCode } from '../config/languages';
import { bmiToWeightCategory, computeBmi, roundBmi } from '../utils/bmi';
import styles from './PreventiveScreeningPage.module.css';

type CompletionMap = Record<string, string>;

const screeningCodes = [
  'blood_pressure',
  'lipid_panel',
  'hba1c',
  'colorectal',
  'psa_discussion',
  'vision',
  'dental',
  'cervical',
  'mammogram',
  'dexa',
] as const;

const chronicConditionKeys = [
  'chronic_hypertension',
  'chronic_type2_diabetes',
  'chronic_coronary_heart_disease',
  'chronic_respiratory',
  'chronic_cancer',
  'chronic_depression',
  'chronic_osteoarthritis',
  'chronic_kidney_disease',
  'chronic_obesity',
  'chronic_dyslipidemia',
  'chronic_stroke',
] as const;

const chronicConditionSet = new Set<string>(chronicConditionKeys);

const familyHistoryKeys = [
  'fh_cancer',
  'fh_hypertension',
  'fh_type2_diabetes',
  'fh_coronary_heart_disease',
  'fh_stroke',
  'fh_asthma',
  'fh_obesity',
  'fh_dyslipidemia',
  'fh_alzheimers_dementia',
  'fh_depression',
  'fh_chronic_kidney_disease',
  'fh_osteoarthritis',
] as const;

const familyHistorySet = new Set<string>(familyHistoryKeys);

function parseMetricInput(s: string): number | undefined {
  const trimmed = s.trim().replace(',', '.');
  if (!trimmed) return undefined;
  const n = parseFloat(trimmed);
  return Number.isFinite(n) ? n : undefined;
}

function isValidHeightCm(n: number | undefined): n is number {
  return n !== undefined && n >= 50 && n <= 280;
}

function isValidWeightKg(n: number | undefined): n is number {
  return n !== undefined && n >= 20 && n <= 400;
}

function savedMetricToInput(saved: number | null | undefined): string {
  if (typeof saved === 'number') return String(saved);
  return '';
}

function ScreeningSection({
  title,
  items,
  onMarkCompleted,
  onSetReminder,
  markCompletedLabel,
  learnMoreLabel,
  setReminderLabel,
  singleColumnCards,
}: {
  title: string;
  items: PreventiveScheduleItem[];
  onMarkCompleted: (code: string) => void;
  onSetReminder: (code: string) => void;
  markCompletedLabel: string;
  learnMoreLabel: string;
  setReminderLabel: string;
  /** One card per row (e.g. up-to-date list). */
  singleColumnCards?: boolean;
}) {
  if (!items.length) return null;
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      <div className={`${styles.cards} ${singleColumnCards ? styles.cardsSingleColumn : ''}`}>
        {items.map((item) => (
          <article key={item.code} className={styles.card}>
            <h3 className={styles.cardTitle}>{item.name}</h3>
            <p className={styles.interval}>{item.intervalLabel}</p>
            <p>{item.whyItMatters}</p>
            <p className={styles.risk}>{item.riskNote}</p>
            <details>
              <summary>{learnMoreLabel}</summary>
              <p>{item.learnMore}</p>
            </details>
            <div className={styles.actions}>
              <button onClick={() => onMarkCompleted(item.code)}>{markCompletedLabel}</button>
              <button onClick={() => onSetReminder(item.code)}>{setReminderLabel}</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function resolvePreventiveLanguage(userLang: string | undefined): LanguageCode {
  if (typeof window === 'undefined') return 'pt';
  const stored = window.localStorage.getItem('mydoctor_language') as LanguageCode | null;
  return ((userLang as LanguageCode) || stored || 'pt') as LanguageCode;
}

export function PreventiveScreeningPage() {
  const { user, profile: userProfile } = useAuth();
  const tNav = useTranslate();
  const language = useMemo(
    () => resolvePreventiveLanguage(user?.preferences?.language),
    [user?.preferences?.language]
  );
  const [profile, setProfile] = useState<PreventiveProfile>({
    patientId: user?.id || '',
    sexAtBirth: userProfile?.demographics?.sexAtBirth || 'female',
    dateOfBirth: userProfile?.demographics?.dateOfBirth,
    age: userProfile?.demographics?.age,
    language: resolvePreventiveLanguage(user?.preferences?.language),
    chronicConditions: [],
    familyHistory: [],
  });
  const [completions, setCompletions] = useState<CompletionMap>({});
  /** When true, user indicated they never had this screening; date input is cleared and disabled. */
  const [neverDoneByScreening, setNeverDoneByScreening] = useState<Record<string, boolean>>({});
  const [schedule, setSchedule] = useState<Awaited<ReturnType<typeof api.getPreventiveSchedule>> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [chronicAddValue, setChronicAddValue] = useState('');
  const [familyAddValue, setFamilyAddValue] = useState('');
  const [heightInput, setHeightInput] = useState('');
  const [weightInput, setWeightInput] = useState('');
  /** After a successful save, the profile form collapses into a compact header; user can expand to edit. */
  const [profileFormCollapsed, setProfileFormCollapsed] = useState(false);

  const t = useMemo(() => (key: Parameters<typeof getPreventiveText>[1]) => getPreventiveText(language, key), [language]);
  const screeningLabelMap = useMemo(
    () =>
      ({
        blood_pressure: t('screening_blood_pressure'),
        lipid_panel: t('screening_lipid_panel'),
        hba1c: t('screening_hba1c'),
        colorectal: t('screening_colorectal'),
        psa_discussion: t('screening_psa_discussion'),
        vision: t('screening_vision'),
        dental: t('screening_dental'),
        cervical: t('screening_cervical'),
        mammogram: t('screening_mammogram'),
        dexa: t('screening_dexa'),
      }) as Record<(typeof screeningCodes)[number], string>,
    [t]
  );

  const chronicConditionsSelected = useMemo(
    () => (profile.chronicConditions || []).filter((c) => chronicConditionSet.has(c)),
    [profile.chronicConditions]
  );

  const familyHistorySelected = useMemo(
    () => (profile.familyHistory || []).filter((c) => familyHistorySet.has(c)),
    [profile.familyHistory]
  );

  const heightNum = useMemo(() => parseMetricInput(heightInput), [heightInput]);
  const weightNum = useMemo(() => parseMetricInput(weightInput), [weightInput]);

  const bmiPreview = useMemo(() => {
    if (!isValidHeightCm(heightNum) || !isValidWeightKg(weightNum)) return null;
    const bmi = computeBmi(heightNum, weightNum);
    if (!Number.isFinite(bmi)) return null;
    return { bmi: roundBmi(bmi), category: bmiToWeightCategory(bmi) };
  }, [heightNum, weightNum]);

  useEffect(() => {
    setProfile((prev) => ({
      ...prev,
      patientId: user?.id || prev.patientId,
      sexAtBirth: userProfile?.demographics?.sexAtBirth || prev.sexAtBirth,
      dateOfBirth: userProfile?.demographics?.dateOfBirth || prev.dateOfBirth,
      age: userProfile?.demographics?.age ?? prev.age,
    }));
  }, [user?.id, userProfile?.demographics?.sexAtBirth, userProfile?.demographics?.dateOfBirth, userProfile?.demographics?.age]);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    (async () => {
      try {
        const saved = await api.getPreventiveProfile(user.id);
        if (cancelled) return;
        setHeightInput(savedMetricToInput(saved.heightCm));
        setWeightInput(savedMetricToInput(saved.weightKg));
        setProfile((prev) => ({
          ...prev,
          pregnancyStatus: saved.pregnancyStatus ?? prev.pregnancyStatus,
          smokingStatus: saved.smokingStatus ?? prev.smokingStatus,
          chronicConditions: saved.chronicConditions ?? prev.chronicConditions,
          familyHistory: saved.familyHistory ?? prev.familyHistory,
        }));
      } catch {
        if (cancelled) return;
        setHeightInput('');
        setWeightInput('');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    setProfile((prev) => ({ ...prev, language }));
  }, [language]);

  const submitProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setIsSaving(true);
    try {
      const chronicConditions = (profile.chronicConditions || []).filter((c) => chronicConditionSet.has(c));
      const familyHistory = (profile.familyHistory || []).filter((c) => familyHistorySet.has(c));
      const h = parseMetricInput(heightInput);
      const w = parseMetricInput(weightInput);
      const heightCm = h === undefined ? null : isValidHeightCm(h) ? h : null;
      const weightKg = w === undefined ? null : isValidWeightKg(w) ? w : null;
      const payload: PreventiveProfile = {
        ...profile,
        patientId: user.id,
        language,
        chronicConditions,
        familyHistory,
        riskFactors: {},
        heightCm,
        weightKg,
        bmi: null,
        weightCategory: null,
      };
      if (
        heightCm != null &&
        weightKg != null &&
        isValidHeightCm(heightCm) &&
        isValidWeightKg(weightKg)
      ) {
        const raw = computeBmi(heightCm, weightKg);
        if (Number.isFinite(raw)) {
          payload.bmi = roundBmi(raw);
          payload.weightCategory = bmiToWeightCategory(raw);
        }
      }
      await api.createPreventiveProfile(payload);
      await Promise.all(
        Object.entries(completions)
          .filter(([, completedAt]) => Boolean(completedAt))
          .map(([screeningCode, completedAt]) =>
            api.markScreeningCompleted({
              patientId: user.id,
              screeningCode,
              completedAt: new Date(completedAt).toISOString(),
            })
          )
      );
      const nextSchedule = await api.getPreventiveSchedule(user.id);
      setSchedule(nextSchedule);
      setProfileFormCollapsed(true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleMarkCompleted = async (code: string) => {
    if (!user?.id) return;
    await api.markScreeningCompleted({
      patientId: user.id,
      screeningCode: code,
      completedAt: new Date().toISOString(),
    });
    setSchedule(await api.getPreventiveSchedule(user.id));
  };

  const handleSetReminder = async (code: string) => {
    if (!user?.id) return;
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    await api.createScreeningReminder({
      patientId: user.id,
      screeningCode: code,
      remindAt: nextWeek.toISOString(),
      channel: 'in_app',
    });
    setSchedule(await api.getPreventiveSchedule(user.id));
  };

  return (
    <div className={styles.shell}>
      <header className={styles.contentHeader}>
        <Link to="/dashboard" className={styles.backLink}>
          {tNav('common_back')}
        </Link>
        <h1 className={styles.contentTitle}>{t('title')}</h1>
      </header>

      <div className={styles.main}>
        <p className={styles.pageLead}>{t('subtitle')}</p>
      <section className={styles.onboarding} aria-labelledby="preventive-onboarding-title">
        <div className={styles.onboardingShell} data-collapsed={profileFormCollapsed ? 'true' : 'false'}>
          <div className={styles.onboardingHeader}>
            <h2 id="preventive-onboarding-title" className={styles.onboardingHeading}>
              {t('onboardingTitle')}
            </h2>
            {profileFormCollapsed && (
              <button
                type="button"
                className={styles.onboardingExpandBtn}
                onClick={() => setProfileFormCollapsed(false)}
              >
                {t('editPreventiveProfile')}
              </button>
            )}
          </div>
          <div
            className={styles.onboardingPanel}
            data-collapsed={profileFormCollapsed ? 'true' : 'false'}
            id="preventive-onboarding-panel"
            aria-hidden={profileFormCollapsed}
            inert={profileFormCollapsed ? true : undefined}
          >
            <div className={styles.onboardingPanelInner}>
      <form className={`${styles.form} ${styles.formOnboarding}`} onSubmit={submitProfile}>
        {profile.sexAtBirth === 'female' && (
          <div
            className={styles.ynRow}
            role="radiogroup"
            aria-labelledby="preventive-pregnancy-label"
          >
            <span id="preventive-pregnancy-label" className={styles.ynQuestion}>
              {t('pregnancyStatus')}
            </span>
            <label className={styles.ynChoice}>
              <input
                type="radio"
                name="preventive-pregnancy"
                checked={profile.pregnancyStatus === 'yes'}
                onChange={() => setProfile((p) => ({ ...p, pregnancyStatus: 'yes' }))}
              />
              <span className={styles.ynChoiceInner}>
                <span className={styles.ynChoiceLabel}>{t('answer_yes')}</span>
                {profile.pregnancyStatus === 'yes' ? (
                  <span className={styles.ynMark} aria-hidden>
                    ✓
                  </span>
                ) : (
                  <span className={styles.ynMarkPlaceholder} aria-hidden />
                )}
              </span>
            </label>
            <label className={styles.ynChoice}>
              <input
                type="radio"
                name="preventive-pregnancy"
                checked={profile.pregnancyStatus === 'no'}
                onChange={() => setProfile((p) => ({ ...p, pregnancyStatus: 'no' }))}
              />
              <span className={styles.ynChoiceInner}>
                <span className={styles.ynChoiceLabel}>{t('answer_no')}</span>
                {profile.pregnancyStatus === 'no' ? (
                  <span className={styles.ynMark} aria-hidden>
                    ✓
                  </span>
                ) : (
                  <span className={styles.ynMarkPlaceholder} aria-hidden />
                )}
              </span>
            </label>
          </div>
        )}
        <div className={styles.ynRow} role="radiogroup" aria-labelledby="preventive-smoking-label">
          <span id="preventive-smoking-label" className={styles.ynQuestion}>
            {t('smokingStatus')}
          </span>
          <label className={styles.ynChoice}>
            <input
              type="radio"
              name="preventive-smoking"
              checked={profile.smokingStatus === 'current'}
              onChange={() => setProfile((p) => ({ ...p, smokingStatus: 'current' }))}
            />
            <span className={styles.ynChoiceInner}>
              <span className={styles.ynChoiceLabel}>{t('answer_yes')}</span>
              {profile.smokingStatus === 'current' ? (
                <span className={styles.ynMark} aria-hidden>
                  ✓
                </span>
              ) : (
                <span className={styles.ynMarkPlaceholder} aria-hidden />
              )}
            </span>
          </label>
          <label className={styles.ynChoice}>
            <input
              type="radio"
              name="preventive-smoking"
              checked={profile.smokingStatus === 'never' || profile.smokingStatus === 'former'}
              onChange={() => setProfile((p) => ({ ...p, smokingStatus: 'never' }))}
            />
            <span className={styles.ynChoiceInner}>
              <span className={styles.ynChoiceLabel}>{t('answer_no')}</span>
              {profile.smokingStatus === 'never' || profile.smokingStatus === 'former' ? (
                <span className={styles.ynMark} aria-hidden>
                  ✓
                </span>
              ) : (
                <span className={styles.ynMarkPlaceholder} aria-hidden />
              )}
            </span>
          </label>
        </div>
        <label>
          {t('chronicConditions')}
          <select
            className={styles.chronicDropdown}
            value={chronicAddValue}
            onChange={(e) => {
              const key = e.target.value;
              if (!key || !chronicConditionSet.has(key)) return;
              setProfile((p) => {
                const current = (p.chronicConditions || []).filter((c) => chronicConditionSet.has(c));
                if (current.includes(key)) return p;
                return { ...p, chronicConditions: [...current, key] };
              });
              setChronicAddValue('');
            }}
          >
            <option value="">{t('chronic_add_placeholder')}</option>
            {chronicConditionKeys.map((key) => (
              <option key={key} value={key} disabled={chronicConditionsSelected.includes(key)}>
                {t(key as PreventiveTextKey)}
              </option>
            ))}
          </select>
          {chronicConditionsSelected.length > 0 && (
            <ul className={styles.chronicChips} aria-label={t('chronicConditions')}>
              {chronicConditionsSelected.map((key) => (
                <li key={key} className={styles.chronicChip}>
                  <span>{t(key as PreventiveTextKey)}</span>
                  <button
                    type="button"
                    className={styles.chronicChipRemove}
                    aria-label={`${t('chronic_remove')}: ${t(key as PreventiveTextKey)}`}
                    onClick={() =>
                      setProfile((p) => ({
                        ...p,
                        chronicConditions: (p.chronicConditions || []).filter((c) => c !== key),
                      }))
                    }
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </label>
        <label>
          {t('familyHistory')}
          <select
            className={styles.chronicDropdown}
            value={familyAddValue}
            onChange={(e) => {
              const key = e.target.value;
              if (!key || !familyHistorySet.has(key)) return;
              setProfile((p) => {
                const current = (p.familyHistory || []).filter((c) => familyHistorySet.has(c));
                if (current.includes(key)) return p;
                return { ...p, familyHistory: [...current, key] };
              });
              setFamilyAddValue('');
            }}
          >
            <option value="">{t('family_add_placeholder')}</option>
            {familyHistoryKeys.map((key) => (
              <option key={key} value={key} disabled={familyHistorySelected.includes(key)}>
                {t(key as PreventiveTextKey)}
              </option>
            ))}
          </select>
          {familyHistorySelected.length > 0 && (
            <ul className={styles.chronicChips} aria-label={t('familyHistory')}>
              {familyHistorySelected.map((key) => (
                <li key={key} className={styles.chronicChip}>
                  <span>{t(key as PreventiveTextKey)}</span>
                  <button
                    type="button"
                    className={styles.chronicChipRemove}
                    aria-label={`${t('chronic_remove')}: ${t(key as PreventiveTextKey)}`}
                    onClick={() =>
                      setProfile((p) => ({
                        ...p,
                        familyHistory: (p.familyHistory || []).filter((c) => c !== key),
                      }))
                    }
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </label>
        <div>
          <h3 className={styles.metricsSectionTitle}>{t('body_metrics_title')}</h3>
          <div className={styles.metricsCard}>
            <div className={styles.metricsRow}>
              <span className={styles.metricsLabel}>{tNav('profile_height')}</span>
              <div className={styles.metricsInputWrap}>
                <input
                  type="number"
                  inputMode="decimal"
                  min={50}
                  max={280}
                  step={0.1}
                  value={heightInput}
                  onChange={(e) => setHeightInput(e.target.value)}
                  aria-label={tNav('profile_height')}
                />
                <span className={styles.metricsUnit}>cm</span>
              </div>
            </div>
            <div className={styles.metricsRow}>
              <span className={styles.metricsLabel}>{tNav('profile_weight')}</span>
              <div className={styles.metricsInputWrap}>
                <input
                  type="number"
                  inputMode="decimal"
                  min={20}
                  max={400}
                  step={0.1}
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  aria-label={tNav('profile_weight')}
                />
                <span className={styles.metricsUnit}>kg</span>
              </div>
            </div>
            <div className={styles.metricsRow}>
              <span className={styles.metricsLabel}>{t('bmi_label')}</span>
              {bmiPreview ? (
                <div className={styles.metricsBmiValue}>
                  {bmiPreview.bmi}
                  {bmiPreview.category ? (
                    <>
                      {' ('}
                      {(
                        {
                          underweight: t('weight_underweight'),
                          normal: t('weight_normal'),
                          overweight: t('weight_overweight'),
                          obesity: t('bmi_category_obesity'),
                        } as const
                      )[bmiPreview.category]}
                      {')'}
                    </>
                  ) : null}
                </div>
              ) : (
                <div className={styles.metricsBmiValue}>-</div>
              )}
            </div>
          </div>
        </div>

        <fieldset>
          <legend>{t('lastCompleted')}</legend>
          <div className={styles.completionTable} role="table" aria-label={t('lastCompleted')}>
            <div className={styles.completionHeader} role="row">
              <span role="columnheader">{t('lastCompleted_header_screening')}</span>
              <span role="columnheader">{t('lastCompleted_header_never')}</span>
              <span role="columnheader">{t('lastCompleted_header_date')}</span>
            </div>
            {screeningCodes.map((code) => {
              const neverDone = Boolean(neverDoneByScreening[code]);
              const dateVal = completions[code] || '';
              const name = screeningLabelMap[code];
              return (
                <div key={code} className={styles.completionRow} role="row">
                  <span className={styles.completionName} role="cell">
                    {name}
                  </span>
                  <div className={styles.completionNeverCell} role="cell">
                    <input
                      type="checkbox"
                      className={styles.completionCheckbox}
                      checked={neverDone}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setNeverDoneByScreening((prev) => ({ ...prev, [code]: checked }));
                        if (checked) setCompletions((prev) => ({ ...prev, [code]: '' }));
                      }}
                      aria-label={`${t('lastCompleted_header_never')}: ${name}`}
                    />
                  </div>
                  <div className={styles.completionDateCell} role="cell">
                    <input
                      type="date"
                      disabled={neverDone}
                      value={neverDone ? '' : dateVal}
                      onChange={(e) => {
                        const v = e.target.value;
                        setCompletions((prev) => ({ ...prev, [code]: v }));
                        if (v) setNeverDoneByScreening((prev) => ({ ...prev, [code]: false }));
                      }}
                      aria-label={`${t('lastCompleted_header_date')}: ${name}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </fieldset>

        <button type="submit" disabled={isSaving}>{t('saveProfile')}</button>
      </form>
            </div>
          </div>
        </div>
      </section>

      {schedule && (
        <div className={styles.dashboard}>
          <ScreeningSection
            title={t('dueNow')}
            items={schedule.dueNow}
            onMarkCompleted={handleMarkCompleted}
            onSetReminder={handleSetReminder}
            markCompletedLabel={t('markCompleted')}
            learnMoreLabel={t('learnMore')}
            setReminderLabel={t('setReminder')}
          />
          <ScreeningSection
            title={t('dueSoon')}
            items={schedule.dueSoon}
            onMarkCompleted={handleMarkCompleted}
            onSetReminder={handleSetReminder}
            markCompletedLabel={t('markCompleted')}
            learnMoreLabel={t('learnMore')}
            setReminderLabel={t('setReminder')}
          />
          <ScreeningSection
            title={t('upToDate')}
            items={schedule.upToDate}
            singleColumnCards
            onMarkCompleted={handleMarkCompleted}
            onSetReminder={handleSetReminder}
            markCompletedLabel={t('markCompleted')}
            learnMoreLabel={t('learnMore')}
            setReminderLabel={t('setReminder')}
          />
          <ScreeningSection
            title={t('discuss')}
            items={schedule.discussWithClinician}
            onMarkCompleted={handleMarkCompleted}
            onSetReminder={handleSetReminder}
            markCompletedLabel={t('markCompleted')}
            learnMoreLabel={t('learnMore')}
            setReminderLabel={t('setReminder')}
          />

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>{t('timeline')}</h2>
            <ul className={styles.timelineList}>
              {schedule.upcomingTimeline.map((item) => (
                <li key={`${item.screeningCode}-${item.recommendBy}`} className={styles.timelineItem}>
                  {item.screeningName} — {item.recommendBy ? new Date(item.recommendBy).toLocaleDateString() : '-'}
                </li>
              ))}
            </ul>
          </section>

          <p className={styles.disclaimer}>{schedule.disclaimer || t('disclaimer')}</p>
        </div>
      )}
      </div>
    </div>
  );
}
