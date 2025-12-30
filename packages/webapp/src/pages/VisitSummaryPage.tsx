import { useState, useEffect } from 'react';
import { Link, useParams, useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, Button } from '@components/common';
import { useTranslate } from '../i18n';
import { api, SessionSummary } from '../services/api';
import styles from './VisitSummaryPage.module.css';

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
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<SessionSummary | null>(
    (location.state as any)?.summary || null
  );

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

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link to="/dashboard" className={styles.backButton}>{t('visit_summary_home')}</Link>
        <span className={styles.badge}>{t('visit_summary_badge')}</span>
      </header>

      <main className={styles.main}>
        <h1 className={styles.title}>{t('visit_summary_title')}</h1>
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
                  <li key={i} className={styles.flagItem}>{flag}</li>
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
                    {rec}
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
                    {screening}
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
                  <p key={i}>{line}</p>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Content State */}
        {!hasRedFlags && !hasRecommendations && !hasScreenings && !summary.notes && (
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
          <Button variant="outline" size="md" disabled>
            {t('visit_summary_download_pdf')}
          </Button>
          <Button variant="outline" size="md" disabled>
            {t('visit_summary_share_summary')}
          </Button>
        </div>

        <Button fullWidth size="lg" onClick={() => navigate('/dashboard')}>
          {t('common_return_to_dashboard')}
        </Button>
      </main>
    </div>
  );
}
