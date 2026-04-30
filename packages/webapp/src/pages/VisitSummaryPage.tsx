import { useState, useEffect } from 'react';
import { Link, useParams, useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, Button } from '@components/common';
import { useTranslate } from '../i18n';
import { api, CheckupSessionType, SessionSummary } from '../services/api';
import { useActiveProfile } from '../contexts';
import { getCheckupSessionTitle } from '../utils/checkupSessionTitle';
import styles from './VisitSummaryPage.module.css';

const SCREENING_TRANSLATION_KEYS: Record<string, string> = {
  'Annual physical exam': 'visit_summary_screening_annual_physical_exam',
  'Blood pressure check': 'visit_summary_screening_blood_pressure_check',
  'Basic blood work': 'visit_summary_screening_basic_blood_work',
  'Mental health screening': 'visit_summary_screening_mental_health',
};
const RECOMMENDATION_TRANSLATION_KEYS: Record<string, string> = {
  'Consider improving sleep hygiene': 'visit_summary_recommendation_sleep_hygiene',
  'Explore stress management techniques': 'visit_summary_recommendation_stress_management',
  'Consider speaking with a mental health professional': 'visit_summary_recommendation_mental_health_support',
  'Gradual increase in physical activity recommended': 'visit_summary_recommendation_physical_activity',
  'Consider nutrition counseling': 'visit_summary_recommendation_nutrition_counseling',
};
const RED_FLAG_VALUE_TRANSLATION_KEYS: Record<string, string> = {
  'Chest pain or pressure': 'visit_summary_red_flag_value_chest_pain',
  'Difficulty breathing': 'visit_summary_red_flag_value_difficulty_breathing',
  'Sudden severe headache': 'visit_summary_red_flag_value_severe_headache',
  'Numbness or weakness on one side': 'visit_summary_red_flag_value_one_side_weakness',
  'I understand': 'visit_summary_red_flag_value_i_understand',
  'I need more information': 'visit_summary_red_flag_value_need_more_information',
};

function formatDate(dateString?: string): string {
  if (!dateString) return new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
  
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
}

export function VisitSummaryPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const t = useTranslate();
  const { activeProfile } = useActiveProfile();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfNotice, setPdfNotice] = useState<string | null>(null);
  const [summary, setSummary] = useState<SessionSummary | null>(
    (location.state as any)?.summary || null
  );
  const [sessionType, setSessionType] = useState<CheckupSessionType | undefined>(
    (location.state as any)?.sessionType
  );
  const translate = t as unknown as (key: string, params?: Record<string, string | number>) => string;
  const sessionTitle = getCheckupSessionTitle(sessionType, t);
  const patientName = ((location.state as any)?.patientName as string | undefined) || activeProfile?.name;

  const localizeScreening = (screening: string): string => {
    const key = SCREENING_TRANSLATION_KEYS[screening];
    return key ? translate(key) : screening;
  };
  const localizeRecommendation = (recommendation: string): string => {
    const key = RECOMMENDATION_TRANSLATION_KEYS[recommendation];
    return key ? translate(key) : recommendation;
  };
  const localizeRedFlag = (redFlag: string): string => {
    const separatorIndex = redFlag.indexOf(':');
    if (separatorIndex === -1) {
      const directKey = RED_FLAG_VALUE_TRANSLATION_KEYS[redFlag];
      return directKey ? translate(directKey) : redFlag;
    }

    const value = redFlag.slice(separatorIndex + 1).trim();
    const valueKey = RED_FLAG_VALUE_TRANSLATION_KEYS[value];

    if (valueKey) {
      return translate(valueKey);
    }
    return redFlag;
  };
  const isSummaryHeadingLine = (line: string): boolean => {
    const trimmed = line.trim();
    if (!trimmed) return false;
    if (trimmed.startsWith('-') || trimmed.startsWith('•')) return false;
    return /^[^:]{2,80}:$/.test(trimmed);
  };
  const localizeSummaryHeadingLine = (line: string): string => {
    const trimmed = line.trim();
    if (!trimmed) return line;

    const withoutMarkdown = trimmed.replace(/^#+\s*/, '');
    const hasColon = withoutMarkdown.endsWith(':');
    const base = (hasColon ? withoutMarkdown.slice(0, -1) : withoutMarkdown).trim();

    const headingMap: Record<string, string> = {
      'Medication Profile': t('summary_heading_medication_profile'),
      'What Each Medication Is For': t('summary_heading_medication_purpose'),
      'Name Verification Notes': t('summary_heading_name_verification'),
      'Side Effects Reported': t('summary_heading_side_effects_reported'),
      'Adherence & Safety Considerations': t('summary_heading_adherence_safety'),
      'Recommendations to Discuss with Clinician': t('summary_heading_recommendations_clinician'),
      'Questions to Ask Your Doctor/Pharmacist': t('summary_heading_questions_for_clinician'),
      Summary: t('summary_heading_summary'),
    };

    const localized = headingMap[base] || base;
    return `${localized}:`;
  };
  const isMobileDevice = (): boolean => {
    if (typeof navigator === 'undefined' || typeof window === 'undefined') return false;
    const ua = navigator.userAgent || '';
    return /Android|iPhone|iPad|iPod|Mobile/i.test(ua) || window.matchMedia('(pointer: coarse)').matches;
  };
  const buildShareSummaryText = (): string => {
    const date = formatDate();
    const redFlags = summary.redFlags?.map((flag) => `- ${localizeRedFlag(flag)}`).join('\n') || t('visit_summary_none');
    const recommendations = summary.recommendations
      ?.map((item) => `- ${localizeRecommendation(item)}`)
      .join('\n') || t('visit_summary_none');
    const screenings = summary.screenings
      ?.map((item) => `- ${localizeScreening(item)}`)
      .join('\n') || t('visit_summary_none');

    return [
      sessionTitle,
      patientName ? `${t('visit_summary_patient_label')} ${patientName}` : '',
      `${t('visit_summary_date_label')} ${date}`,
      '',
      `${t('visit_summary_red_flags_title')}`,
      redFlags,
      '',
      `${t('visit_summary_recommendations_title')}`,
      recommendations,
      '',
      `${t('visit_summary_screenings_title')}`,
      screenings,
      '',
      `${t('visit_summary_ai_summary_title')}`,
      summary.notes || t('visit_summary_none'),
    ].join('\n');
  };
  const handleDownloadPdf = () => {
    setPdfNotice(null);
    const onPrintFallback = () => {
      window.print();
      if (isMobileDevice()) {
        setPdfNotice(t('visit_summary_pdf_mobile_fallback_hint'));
      }
    };

    if (isMobileDevice() && typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      navigator.share({
        title: t('visit_summary_title'),
        text: buildShareSummaryText(),
      })
        .then(() => {
          setPdfNotice(t('visit_summary_pdf_mobile_share_hint'));
        })
        .catch(() => {
          onPrintFallback();
        });
      return;
    }

    onPrintFallback();
  };

  useEffect(() => {
    // If we have summary from navigation state, use it
    if (summary) {
      setIsLoading(false);
      return;
    }

    // Otherwise, fetch session data
    const fetchSession = async () => {
      if (!id) {
        setError('No session ID provided');
        setIsLoading(false);
        return;
      }

      try {
        const response = await api.getSession(id);
        setSessionType(response.sessionType);
        if (response.summary) {
          setSummary(response.summary);
        } else {
          setError(t('visit_summary_error_no_summary'));
        }
      } catch (err) {
        console.error('Error loading session:', err);
        setError(err instanceof Error ? err.message : t('visit_summary_error_load_failed'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchSession();
  }, [id, summary]);

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <p>{t('visit_summary_loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <span className={styles.errorIcon}>⚠️</span>
          <h2>{t('visit_summary_error_title')}</h2>
          <p>{error || t('visit_summary_error_no_data')}</p>
          <Button onClick={() => navigate('/dashboard')}>{t('common_return_to_dashboard')}</Button>
        </div>
      </div>
    );
  }

  const hasRedFlags = summary.redFlags && summary.redFlags.length > 0;
  const hasRecommendations = summary.recommendations && summary.recommendations.length > 0;
  const hasScreenings = summary.screenings && summary.screenings.length > 0;
  const isMedicationReview = sessionType === 'medication-review';

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link to="/dashboard" className={styles.backButton}>{t('visit_summary_home')}</Link>
        <span className={styles.badge}>{t('visit_summary_badge')}</span>
      </header>

      <main className={styles.main}>
        <h1 className={styles.title}>{sessionTitle}</h1>
        {patientName && <p className={styles.patientName}>{t('visit_summary_patient_label')} {patientName}</p>}
        <p className={styles.date}>{formatDate()}</p>

        {/* Red Flags - Warning Section */}
        {hasRedFlags && (
          <Card variant="outline" padding="md" className={`${styles.section} ${styles.warningCard}`}>
            <CardContent>
              <h2 className={styles.sectionTitle}>{t('visit_summary_red_flags_title')}</h2>
              <p className={styles.warningText}>
                {t('visit_summary_red_flags_subtitle')}
              </p>
              <ul className={styles.flagList}>
                {summary.redFlags.map((flag, i) => (
                  <li key={i} className={styles.flagItem}>{localizeRedFlag(flag)}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Recommendations */}
        {hasRecommendations && (
          <Card variant="default" padding="md" className={styles.section}>
            <CardContent>
              <h2 className={styles.sectionTitle}>{t('visit_summary_recommendations_title')}</h2>
              <ul className={styles.recommendationList}>
                {summary.recommendations.map((rec, i) => (
                  <li key={i} className={styles.recommendationItem}>
                    <span className={styles.checkIcon}>→</span>
                    {localizeRecommendation(rec)}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Recommended Screenings */}
        {hasScreenings && (
          <Card variant="default" padding="md" className={styles.section}>
            <CardContent>
              <h2 className={styles.sectionTitle}>{t('visit_summary_screenings_title')}</h2>
              <p className={styles.sectionSubtitle}>{t('visit_summary_screenings_subtitle')}</p>
              <ul className={styles.screeningList}>
                {summary.screenings.map((screening, i) => (
                  <li key={i} className={styles.screeningItem}>
                    <span className={styles.checkIcon}>☐</span>
                    {localizeScreening(screening)}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* AI Summary Notes */}
        {summary.notes && (
          <Card variant="default" padding="md" className={styles.section}>
            <CardContent>
              <h2 className={styles.sectionTitle}>{t('visit_summary_ai_summary_title')}</h2>
              <div className={styles.aiSummary}>
                {summary.notes.split('\n').map((line, i) => (
                  <p key={i} className={isSummaryHeadingLine(line) ? styles.aiSummaryHeading : styles.aiSummaryLine}>
                    {isSummaryHeadingLine(line) ? localizeSummaryHeadingLine(line) : line}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Content State */}
        {!isMedicationReview && !hasRedFlags && !hasRecommendations && !hasScreenings && !summary.notes && (
          <Card variant="default" padding="lg" className={styles.section}>
            <CardContent>
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>✨</span>
                <h3>{t('visit_summary_all_clear_title')}</h3>
                <p>{t('visit_summary_all_clear_message')}</p>
                <p>{t('visit_summary_all_clear_encouragement')}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Disclaimer */}
        <Card variant="outline" padding="sm" className={styles.disclaimer}>
          <CardContent>
            <p>
              <strong>{t('visit_summary_disclaimer_label')}</strong> {t('visit_summary_disclaimer_text')}
            </p>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className={styles.actions}>
          <Button variant="outline" size="md" onClick={handleDownloadPdf}>
            {t('visit_summary_download_pdf')}
          </Button>
          <Button variant="outline" size="md" disabled>
            {t('visit_summary_share_summary')}
          </Button>
        </div>
        {pdfNotice && <p className={styles.pdfNotice}>{pdfNotice}</p>}

        <Button fullWidth size="lg" onClick={() => navigate('/dashboard')}>
          {t('common_return_to_dashboard')}
        </Button>
      </main>
    </div>
  );
}
