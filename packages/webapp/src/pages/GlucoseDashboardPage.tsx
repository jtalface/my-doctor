/**
 * Glucose Dashboard Page
 * 
 * Main dashboard showing summary, latest readings, and suggestions
 */

import { useNavigate } from 'react-router-dom';
import { useGlucoseData } from '../hooks/useGlucoseData';
import { useTranslate } from '../i18n';
import styles from './GlucoseDashboardPage.module.css';

export function GlucoseDashboardPage() {
  const navigate = useNavigate();
  const t = useTranslate();
  const { settings, readings, suggestions, analytics, isLoading, hasOnboarded } = useGlucoseData();

  const handleSettingsClick = () => {
    console.log('Settings button clicked, navigating to /glucose/settings');
    navigate('/glucose/settings');
  };

  // Redirect to onboarding if not set up
  if (!isLoading && !hasOnboarded) {
    navigate('/glucose/onboarding', { replace: true });
    return null;
  }

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>{t('glucose_entry_loading')}</div>
      </div>
    );
  }

  const latestReading = readings[0];
  const last7Days = readings.filter(
    (r) => new Date(r.timestamp) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  );

  // Calculate quick stats
  const avgGlucose =
    last7Days.length > 0
      ? Math.round(last7Days.reduce((sum, r) => sum + r.glucoseValue, 0) / last7Days.length)
      : 0;

  const inRange = last7Days.filter(
    (r) =>
      r.glucoseValue >= (settings?.targetRanges.fasting.min || 80) &&
      r.glucoseValue <= (settings?.targetRanges.postMeal.max || 180)
  );
  const timeInRange = last7Days.length > 0 ? Math.round((inRange.length / last7Days.length) * 100) : 0;

  // Get urgent suggestions
  const urgentSuggestions = suggestions.filter((s) => s.severity === 'urgent');
  const warnSuggestions = suggestions.filter((s) => s.severity === 'warn');

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>🩸 {t('glucose_dashboard_title')}</h1>
          <p className={styles.subtitle}>
            {t('glucose_tracking_for')} <strong>{settings?.diabetesType}</strong>
          </p>
        </div>
        <button onClick={handleSettingsClick} className={styles.settingsButton} type="button">
          ⚙️ {t('glucose_settings_button')}
        </button>
      </div>

      {/* Urgent Alerts */}
      {urgentSuggestions.length > 0 && (
        <div className={styles.urgentAlerts}>
          {urgentSuggestions.map((suggestion) => (
            <div key={suggestion.id} className={styles.urgentAlert}>
              <div className={styles.alertIcon}>🚨</div>
              <div>
                <h3>{suggestion.title}</h3>
                <p>{suggestion.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Action */}
      <button onClick={() => navigate('/glucose/log')} className={styles.quickLogButton}>
        {t('glucose_quick_log')}
      </button>

      {/* Summary Cards */}
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <div className={styles.cardLabel}>{t('glucose_latest_reading')}</div>
          <div className={styles.cardValue}>
            {latestReading ? (
              <>
                {latestReading.glucoseValueRaw}{' '}
                <span className={styles.unit}>{latestReading.unit}</span>
              </>
            ) : (
              <span className={styles.noData}>{t('glucose_no_readings')}</span>
            )}
          </div>
          {latestReading && (
            <div className={styles.cardMeta}>
              {new Date(latestReading.timestamp).toLocaleString()} · {latestReading.context}
            </div>
          )}
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.cardLabel}>{t('glucose_7day_average')}</div>
          <div className={styles.cardValue}>
            {last7Days.length > 0 ? (
              <>
                {avgGlucose} <span className={styles.unit}>{settings?.unitPreference}</span>
              </>
            ) : (
              <span className={styles.noData}>{t('glucose_not_enough_data')}</span>
            )}
          </div>
          <div className={styles.cardMeta}>{t('glucose_readings_count', { count: last7Days.length })}</div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.cardLabel}>{t('glucose_time_in_range')}</div>
          <div className={styles.cardValue}>
            {last7Days.length > 0 ? (
              <>
                {timeInRange}<span className={styles.unit}>%</span>
              </>
            ) : (
              <span className={styles.noData}>{t('glucose_not_enough_data')}</span>
            )}
          </div>
          <div className={styles.cardMeta}>
            {inRange.length} / {last7Days.length} readings
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.cardLabel}>{t('glucose_patterns')}</div>
          <div className={styles.cardValue}>{analytics?.patterns.length || 0}</div>
          <div className={styles.cardMeta}>
            <button onClick={() => navigate('/glucose/insights')} className={styles.linkButton}>
              {t('glucose_view_insights')}
            </button>
          </div>
        </div>
      </div>

      {/* Warnings/Suggestions */}
      {warnSuggestions.length > 0 && (
        <div className={styles.suggestionsSection}>
          <h2 className={styles.sectionTitle}>⚠️ Suggestions & Patterns</h2>
          <div className={styles.suggestionsList}>
            {warnSuggestions.slice(0, 3).map((suggestion) => (
              <div key={suggestion.id} className={styles.suggestionCard}>
                <div className={styles.suggestionHeader}>
                  <span className={styles.suggestionTitle}>{suggestion.title}</span>
                  <span className={`${styles.badge} ${styles[suggestion.severity]}`}>
                    {suggestion.severity}
                  </span>
                </div>
                <p className={styles.suggestionMessage}>{suggestion.message}</p>
                {suggestion.actions && suggestion.actions.length > 0 && (
                  <div className={styles.actions}>
                    <strong>Suggested actions:</strong>
                    <ul>
                      {suggestion.actions.slice(0, 2).map((action, idx) => (
                        <li key={idx}>{action}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className={styles.disclaimer}>{suggestion.disclaimer}</div>
              </div>
            ))}
          </div>
          {suggestions.length > 3 && (
            <button onClick={() => navigate('/glucose/insights')} className={styles.viewAllButton}>
              View all {suggestions.length} suggestions →
            </button>
          )}
        </div>
      )}

      {/* Recent Readings */}
      <div className={styles.recentSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Recent Readings</h2>
          <button onClick={() => navigate('/glucose/insights')} className={styles.viewAllLink}>
            View all →
          </button>
        </div>

        {readings.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No readings yet. Log your first reading to get started!</p>
          </div>
        ) : (
          <div className={styles.readingsList}>
            {readings.slice(0, 5).map((reading) => (
              <div key={reading._id} className={`${styles.readingItem} ${reading.flagged ? styles.flagged : ''}`}>
                <div className={styles.readingValue}>
                  {reading.glucoseValueRaw} {reading.unit}
                  {reading.flagged && <span className={styles.flagBadge}>⚠️</span>}
                </div>
                <div className={styles.readingDetails}>
                  <span>{reading.context.replace('_', ' ')}</span>
                  <span>·</span>
                  <span>{new Date(reading.timestamp).toLocaleString()}</span>
                </div>
                {reading.notes && <div className={styles.readingNotes}>Note: {reading.notes}</div>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className={styles.quickLinks}>
        <button onClick={() => navigate('/glucose/log')} className={styles.linkCard}>
          📝 Log Reading
        </button>
        <button onClick={() => navigate('/glucose/insights')} className={styles.linkCard}>
          📊 View Insights
        </button>
        <button onClick={() => navigate('/glucose/reports')} className={styles.linkCard}>
          📄 Export Report
        </button>
      </div>
    </div>
  );
}

