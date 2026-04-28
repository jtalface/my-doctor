/**
 * BP Dashboard Page
 * 
 * Main dashboard showing summary, latest sessions, and suggestions
 */

import { useNavigate } from 'react-router-dom';
import { useBPData } from '../hooks/useBPData';
import { useTranslate } from '../i18n';
import type { BPSuggestion } from '../types/bp';
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

  const translateSeverity = (severity: BPSuggestion['severity']) => {
    if (severity === 'urgent') return t('bp_severity_urgent');
    if (severity === 'warn') return t('bp_severity_warn');
    return t('bp_severity_info');
  };

  const getClassificationLabel = (classification: string): string => {
    const classMap: Record<string, string> = {
      normal: t('bp_classification_normal'),
      elevated: t('bp_classification_elevated'),
      stage1: t('bp_classification_stage1'),
      stage2: t('bp_classification_stage2'),
      crisis: t('bp_classification_crisis'),
    };
    return classMap[classification] || classification;
  };

  const getContextLabel = (context: string): string => {
    const contextMap: Record<string, string> = {
      resting: t('bp_context_resting'),
      after_exercise: t('bp_context_after_exercise'),
      stressed: t('bp_context_stressed'),
      clinic: t('bp_context_clinic'),
      other: t('bp_context_other'),
    };
    return contextMap[context] || context.replace('_', ' ');
  };

  const getLocalizedSuggestionText = (suggestion: BPSuggestion) => {
    const base = {
      title: suggestion.title,
      message: suggestion.message,
      rationale: suggestion.rationale,
      actions: suggestion.actions,
      disclaimer: suggestion.disclaimer,
    };

    const map: Record<string, { title: string; message: string; rationale: string; actions?: string[]; disclaimer: string }> = {
      hypertensive_crisis_symptoms: {
        title: t('bp_suggestion_hypertensive_crisis_symptoms_title'),
        message: t('bp_suggestion_hypertensive_crisis_symptoms_message'),
        rationale: t('bp_suggestion_hypertensive_crisis_symptoms_rationale'),
        actions: [
          t('bp_suggestion_hypertensive_crisis_symptoms_action_1'),
          t('bp_suggestion_hypertensive_crisis_symptoms_action_2'),
          t('bp_suggestion_hypertensive_crisis_symptoms_action_3'),
          t('bp_suggestion_hypertensive_crisis_symptoms_action_4'),
        ],
        disclaimer: t('bp_suggestion_hypertensive_crisis_symptoms_disclaimer'),
      },
      hypertensive_urgency: {
        title: t('bp_suggestion_hypertensive_urgency_title'),
        message: t('bp_suggestion_hypertensive_urgency_message'),
        rationale: t('bp_suggestion_hypertensive_urgency_rationale'),
        actions: [
          t('bp_suggestion_hypertensive_urgency_action_1'),
          t('bp_suggestion_hypertensive_urgency_action_2'),
          t('bp_suggestion_hypertensive_urgency_action_3'),
          t('bp_suggestion_hypertensive_urgency_action_4'),
        ],
        disclaimer: t('bp_suggestion_hypertensive_urgency_disclaimer'),
      },
      persistently_above_target: {
        title: t('bp_suggestion_persistently_above_target_title'),
        message: t('bp_suggestion_persistently_above_target_message'),
        rationale: t('bp_suggestion_persistently_above_target_rationale'),
        actions: [
          t('bp_suggestion_persistently_above_target_action_1'),
          t('bp_suggestion_persistently_above_target_action_2'),
          t('bp_suggestion_persistently_above_target_action_3'),
          t('bp_suggestion_persistently_above_target_action_4'),
          t('bp_suggestion_persistently_above_target_action_5'),
        ],
        disclaimer: t('bp_suggestion_persistently_above_target_disclaimer'),
      },
      measurement_technique: {
        title: t('bp_suggestion_measurement_technique_title'),
        message: t('bp_suggestion_measurement_technique_message'),
        rationale: t('bp_suggestion_measurement_technique_rationale'),
        actions: [
          t('bp_suggestion_measurement_technique_action_1'),
          t('bp_suggestion_measurement_technique_action_2'),
          t('bp_suggestion_measurement_technique_action_3'),
          t('bp_suggestion_measurement_technique_action_4'),
          t('bp_suggestion_measurement_technique_action_5'),
          t('bp_suggestion_measurement_technique_action_6'),
          t('bp_suggestion_measurement_technique_action_7'),
        ],
        disclaimer: t('bp_suggestion_measurement_technique_disclaimer'),
      },
      context_awareness: {
        title: t('bp_suggestion_context_awareness_title'),
        message: t('bp_suggestion_context_awareness_message'),
        rationale: t('bp_suggestion_context_awareness_rationale'),
        actions: [
          t('bp_suggestion_context_awareness_action_1'),
          t('bp_suggestion_context_awareness_action_2'),
          t('bp_suggestion_context_awareness_action_3'),
          t('bp_suggestion_context_awareness_action_4'),
        ],
        disclaimer: t('bp_suggestion_context_awareness_disclaimer'),
      },
      measurement_adherence: {
        title: t('bp_suggestion_measurement_adherence_title'),
        message: t('bp_suggestion_measurement_adherence_message'),
        rationale: t('bp_suggestion_measurement_adherence_rationale'),
        actions: [
          t('bp_suggestion_measurement_adherence_action_1'),
          t('bp_suggestion_measurement_adherence_action_2'),
          t('bp_suggestion_measurement_adherence_action_3'),
          t('bp_suggestion_measurement_adherence_action_4'),
        ],
        disclaimer: t('bp_suggestion_measurement_adherence_disclaimer'),
      },
      schedule_compliance: {
        title: t('bp_suggestion_schedule_compliance_title'),
        message: t('bp_suggestion_schedule_compliance_message'),
        rationale: t('bp_suggestion_schedule_compliance_rationale'),
        actions: [
          t('bp_suggestion_schedule_compliance_action_1'),
          t('bp_suggestion_schedule_compliance_action_2'),
          t('bp_suggestion_schedule_compliance_action_3'),
          t('bp_suggestion_schedule_compliance_action_4'),
        ],
        disclaimer: t('bp_suggestion_schedule_compliance_disclaimer'),
      },
      blood_pressure_variability: {
        title: t('bp_suggestion_blood_pressure_variability_title'),
        message: t('bp_suggestion_blood_pressure_variability_message'),
        rationale: t('bp_suggestion_blood_pressure_variability_rationale'),
        actions: [
          t('bp_suggestion_blood_pressure_variability_action_1'),
          t('bp_suggestion_blood_pressure_variability_action_2'),
          t('bp_suggestion_blood_pressure_variability_action_3'),
          t('bp_suggestion_blood_pressure_variability_action_4'),
          t('bp_suggestion_blood_pressure_variability_action_5'),
        ],
        disclaimer: t('bp_suggestion_blood_pressure_variability_disclaimer'),
      },
    };

    return map[suggestion.type] || base;
  };

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
          {urgentSuggestions.map((suggestion) => {
            const localized = getLocalizedSuggestionText(suggestion);
            return (
            <div key={suggestion.id} className={styles.urgentAlert}>
              <div className={styles.alertIcon}>🚨</div>
              <div>
                <h3>{localized.title}</h3>
                <p>{localized.message}</p>
              </div>
            </div>
            );
          })}
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
                {getClassificationLabel(latestSession.classification)}
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
            {warnSuggestions.slice(0, 3).map((suggestion) => {
              const localized = getLocalizedSuggestionText(suggestion);
              return (
                <div key={suggestion.id} className={styles.suggestionCard}>
                <div className={styles.suggestionHeader}>
                  <span className={styles.suggestionTitle}>{localized.title}</span>
                  <span className={`${styles.badge} ${styles[suggestion.severity]}`}>
                    {translateSeverity(suggestion.severity)}
                  </span>
                </div>
                <p className={styles.suggestionMessage}>{localized.message}</p>
                {localized.actions && localized.actions.length > 0 && (
                  <div className={styles.actions}>
                    <strong>{t('bp_suggested_actions')}</strong>
                    <ul>
                      {localized.actions.slice(0, 3).map((action, idx) => (
                        <li key={idx}>{action}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className={styles.disclaimer}>{localized.disclaimer}</div>
                </div>
              );
            })}
          </div>
          {suggestions.length > 3 && (
            <button onClick={() => navigate('/bp/insights')} className={styles.viewAllButton}>
              {t('view_all_suggestions', { count: suggestions.length })} →
            </button>
          )}
        </div>
      )}

      {/* Recent Sessions */}
      <div className={styles.recentSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>{t('bp_recent_sessions')}</h2>
          <button onClick={() => navigate('/bp/insights')} className={styles.viewAllLink}>
            {t('view_all_arrow')}
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
                  <span>{getContextLabel(session.context)}</span>
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

