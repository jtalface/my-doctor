/**
 * BP Dashboard Page
 * 
 * Main dashboard showing summary, latest sessions, and suggestions
 */

import { useNavigate } from 'react-router-dom';
import { useBPData } from '../hooks/useBPData';
import { useTranslate } from '../i18n';
import styles from './BPDashboardPage.module.css';

export function BPDashboardPage() {
  const navigate = useNavigate();
  const t = useTranslate();
  const { settings, sessions, suggestions, analytics, isLoading, hasOnboarded } = useBPData();

  // Redirect to onboarding if not set up
  if (!isLoading && !hasOnboarded) {
    navigate('/bp/onboarding', { replace: true });
    return null;
  }

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>{t('bp_entry_loading')}</div>
      </div>
    );
  }

  const latestSession = sessions[0];
  const urgentSuggestions = suggestions.filter((s) => s.severity === 'urgent');
  const warnSuggestions = suggestions.filter((s) => s.severity === 'warn');

  // Get classification color
  const getClassColor = (classification: string) => {
    switch (classification) {
      case 'normal': return '#10b981';
      case 'elevated': return '#f59e0b';
      case 'stage1': return '#f97316';
      case 'stage2': return '#ef4444';
      case 'crisis': return '#dc2626';
      default: return '#6b7280';
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>❤️ {t('bp_dashboard_title')}</h1>
          <p className={styles.subtitle}>
            {t('bp_target')} <strong>{settings?.targets.systolic}/{settings?.targets.diastolic} mmHg</strong>
          </p>
        </div>
        <button onClick={() => navigate('/bp/settings')} className={styles.settingsButton} type="button">
          ⚙️ {t('bp_settings_button')}
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
      <button onClick={() => navigate('/bp/log')} className={styles.quickLogButton}>
        {t('bp_quick_log')}
      </button>

      {/* Summary Cards */}
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <div className={styles.cardLabel}>{t('bp_latest_reading')}</div>
          {latestSession ? (
            <>
              <div className={styles.cardValue} style={{ color: getClassColor(latestSession.classification) }}>
                {latestSession.averages.systolic}/{latestSession.averages.diastolic}
                <span className={styles.unit}>mmHg</span>
              </div>
              <div className={styles.cardMeta}>
                {new Date(latestSession.timestamp).toLocaleString()}
                {latestSession.averages.pulse && ` • ${latestSession.averages.pulse} bpm`}
              </div>
              <div className={styles.classification}>
                {latestSession.classification.replace('stage', 'Stage ').replace(/^\w/, c => c.toUpperCase())}
              </div>
            </>
          ) : (
            <div className={styles.noData}>{t('bp_no_readings')}</div>
          )}
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.cardLabel}>{t('bp_7day_average')}</div>
          <div className={styles.cardValue}>
            {analytics?.summary.avgSystolic || 0}/{analytics?.summary.avgDiastolic || 0}
            <span className={styles.unit}>mmHg</span>
          </div>
          <div className={styles.cardMeta}>{t('bp_readings_count', { count: analytics?.summary.totalSessions || 0 })}</div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.cardLabel}>{t('bp_above_target')}</div>
          <div className={styles.cardValue}>
            {analytics?.aboveTarget.percentage || 0}
            <span className={styles.unit}>%</span>
          </div>
          <div className={styles.cardMeta}>
            {t('bp_readings_count', { count: analytics?.aboveTarget.count || 0 })}
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.cardLabel}>{t('bp_adherence')}</div>
          <div className={styles.cardValue}>
            {analytics?.adherence.adherenceRate || 0}
            <span className={styles.unit}>%</span>
          </div>
          <div className={styles.cardMeta}>
            {t('bp_expected', { actual: analytics?.adherence.actualReadings || 0, expected: analytics?.adherence.expectedReadings || 0 })}
          </div>
        </div>
      </div>

      {/* Warnings/Suggestions */}
      {warnSuggestions.length > 0 && (
        <div className={styles.suggestionsSection}>
          <h2 className={styles.sectionTitle}>⚠️ {t('bp_patterns_title')}</h2>
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
                    <strong>{t('bp_suggested_actions')}</strong>
                    <ul>
                      {suggestion.actions.slice(0, 3).map((action, idx) => (
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
            <button onClick={() => navigate('/bp/insights')} className={styles.viewAllButton}>
              View all {suggestions.length} suggestions →
            </button>
          )}
        </div>
      )}

      {/* Recent Sessions */}
      <div className={styles.recentSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>{t('bp_recent_sessions')}</h2>
          <button onClick={() => navigate('/bp/insights')} className={styles.viewAllLink}>
            View all →
          </button>
        </div>

        {sessions.length === 0 ? (
          <div className={styles.emptyState}>
            <p>{t('bp_no_sessions_yet')}</p>
          </div>
        ) : (
          <div className={styles.sessionsList}>
            {sessions.slice(0, 7).map((session) => (
              <div
                key={session._id}
                className={`${styles.sessionItem} ${session.flagged ? styles.flagged : ''}`}
                style={{ borderLeftColor: getClassColor(session.classification) }}
              >
                <div className={styles.sessionValue}>
                  {session.averages.systolic}/{session.averages.diastolic} mmHg
                  {session.flagged && <span className={styles.flagBadge}>⚠️</span>}
                </div>
                <div className={styles.sessionDetails}>
                  <span>{new Date(session.timestamp).toLocaleString()}</span>
                  <span>·</span>
                  <span>{session.context.replace('_', ' ')}</span>
                  {session.averages.pulse && (
                    <>
                      <span>·</span>
                      <span>{session.averages.pulse} bpm</span>
                    </>
                  )}
                </div>
                {session.notes && <div className={styles.sessionNotes}>Note: {session.notes}</div>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className={styles.quickLinks}>
        <button onClick={() => navigate('/bp/log')} className={styles.linkCard}>
          📝 {t('quick_link_log_reading')}
        </button>
        <button onClick={() => navigate('/bp/insights')} className={styles.linkCard}>
          📊 {t('quick_link_view_insights')}
        </button>
        <button onClick={() => navigate('/bp/reports')} className={styles.linkCard}>
          📄 {t('quick_link_export_report')}
        </button>
      </div>
    </div>
  );
}

