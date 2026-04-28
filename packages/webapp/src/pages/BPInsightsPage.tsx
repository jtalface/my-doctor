/**
 * BP Insights Page
 * 
 * Display patterns, trends, and all suggestions
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBPData } from '../hooks/useBPData';
import { useTranslate } from '../i18n';
import type { BPSuggestion } from '../types/bp';
import styles from './BPInsightsPage.module.css';

export function BPInsightsPage() {
  const navigate = useNavigate();
  const t = useTranslate();
  const { sessions, suggestions, analytics } = useBPData();
  const [filter, setFilter] = useState<'all' | 'urgent' | 'warn' | 'info'>('all');

  // Helper function to get translated classification name
  const getClassificationLabel = (classification: string): string => {
    const classMap: Record<string, string> = {
      'normal': t('bp_classification_normal'),
      'elevated': t('bp_classification_elevated'),
      'stage1': t('bp_classification_stage1'),
      'stage2': t('bp_classification_stage2'),
      'crisis': t('bp_classification_crisis'),
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

  const filteredSuggestions = suggestions.filter((s) => filter === 'all' || s.severity === filter);

  const translateSeverity = (severity: BPSuggestion['severity']) => {
    if (severity === 'urgent') return t('bp_severity_urgent');
    if (severity === 'warn') return t('bp_severity_warn');
    return t('bp_severity_info');
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
      <div className={styles.header}>
        <button onClick={() => navigate('/bp/dashboard')} className={styles.backButton}>
          {t('bp_back')}
        </button>
        <h1 className={styles.title}>📊 {t('bp_insights_title')}</h1>
      </div>

      {/* Analytics Summary */}
      {analytics && (
        <div className={styles.summarySection}>
          <h2>{t('bp_7day_summary')}</h2>
          <div className={styles.summaryGrid}>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>{t('bp_average_bp')}</div>
              <div className={styles.statValue}>
                {analytics.summary.avgSystolic}/{analytics.summary.avgDiastolic} mmHg
              </div>
              {analytics.summary.avgPulse && (
                <div className={styles.statMeta}>Pulse: {analytics.summary.avgPulse} bpm</div>
              )}
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>{t('bp_sessions')}</div>
              <div className={styles.statValue}>{analytics.summary.totalSessions}</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>{t('bp_above_target')}</div>
              <div className={styles.statValue}>{analytics.aboveTarget.percentage}%</div>
              <div className={styles.statMeta}>{t('bp_readings_count', { count: analytics.aboveTarget.count })}</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>{t('bp_adherence')}</div>
              <div className={styles.statValue}>{analytics.adherence.adherenceRate}%</div>
              <div className={styles.statMeta}>
                {t('bp_expected', {
                  actual: analytics.adherence.actualReadings,
                  expected: analytics.adherence.expectedReadings,
                })}
              </div>
            </div>
          </div>

          {/* Distribution */}
          <div className={styles.distributionSection}>
            <h3>{t('bp_classification_distribution')}</h3>
            <div className={styles.distributionBars}>
              {Object.entries(analytics.distribution).map(([key, count]) => {
                const total = analytics.summary.totalSessions || 1;
                const percentage = ((count / total) * 100).toFixed(0);
                return (
                  <div key={key} className={styles.distBar}>
                    <span className={styles.distLabel}>{getClassificationLabel(key)}</span>
                    <div className={styles.barContainer}>
                      <div
                        className={styles.barFill}
                        style={{ width: `${percentage}%`, background: getClassColor(key) }}
                      />
                    </div>
                    <span className={styles.distValue}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AM/PM Comparison */}
          {analytics.amPmComparison && (
            <div className={styles.comparisonSection}>
              <h3>{t('bp_morning_vs_evening')}</h3>
              <div className={styles.comparisonGrid}>
                <div className={styles.comparisonCard}>
                  <div className={styles.comparisonLabel}>{t('bp_morning_average')}</div>
                  <div className={styles.comparisonValue}>
                    {analytics.amPmComparison.amAvg.systolic}/{analytics.amPmComparison.amAvg.diastolic}
                  </div>
                </div>
                <div className={styles.comparisonCard}>
                  <div className={styles.comparisonLabel}>{t('bp_evening_average')}</div>
                  <div className={styles.comparisonValue}>
                    {analytics.amPmComparison.pmAvg.systolic}/{analytics.amPmComparison.pmAvg.diastolic}
                  </div>
                </div>
                <div className={styles.comparisonCard}>
                  <div className={styles.comparisonLabel}>{t('bp_difference')}</div>
                  <div className={styles.comparisonValue}>
                    {analytics.amPmComparison.difference.systolic > 0 ? '+' : ''}
                    {analytics.amPmComparison.difference.systolic}/
                    {analytics.amPmComparison.difference.diastolic > 0 ? '+' : ''}
                    {analytics.amPmComparison.difference.diastolic}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Suggestions */}
      <div className={styles.suggestionsSection}>
        <div className={styles.sectionHeader}>
          <h2>{t('bp_suggestions_recommendations')}</h2>
          <div className={styles.filterButtons}>
            <button
              className={filter === 'all' ? styles.active : ''}
              onClick={() => setFilter('all')}
            >
              {t('filter_all')} ({suggestions.length})
            </button>
            <button
              className={filter === 'urgent' ? styles.active : ''}
              onClick={() => setFilter('urgent')}
            >
              {t('filter_urgent')} ({suggestions.filter(s => s.severity === 'urgent').length})
            </button>
            <button
              className={filter === 'warn' ? styles.active : ''}
              onClick={() => setFilter('warn')}
            >
              {t('filter_warnings')} ({suggestions.filter(s => s.severity === 'warn').length})
            </button>
            <button
              className={filter === 'info' ? styles.active : ''}
              onClick={() => setFilter('info')}
            >
              {t('filter_info')} ({suggestions.filter(s => s.severity === 'info').length})
            </button>
          </div>
        </div>

        {filteredSuggestions.length === 0 ? (
          <div className={styles.emptyState}>
            {filter === 'all' ? t('suggestions_none') : t('suggestions_none_filtered', { filter })}
          </div>
        ) : (
          <div className={styles.suggestionsList}>
            {filteredSuggestions.map((suggestion) => {
              const localized = getLocalizedSuggestionText(suggestion);
              return (
              <div key={suggestion.id} className={`${styles.suggestionCard} ${styles[suggestion.severity]}`}>
                <div className={styles.suggestionHeader}>
                  <h3>{localized.title}</h3>
                  <span className={styles.badge}>{translateSeverity(suggestion.severity).toUpperCase()}</span>
                </div>
                <p className={styles.message}>{localized.message}</p>
                <div className={styles.rationale}>
                  <strong>{t('suggestions_why')}</strong> {localized.rationale}
                </div>
                {localized.actions && localized.actions.length > 0 && (
                  <div className={styles.actions}>
                    <strong>{t('suggestions_suggested_actions')}</strong>
                    <ul>
                      {localized.actions.map((action, idx) => (
                        <li key={idx}>{action}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {suggestion.references && suggestion.references.length > 0 && (
                  <div className={styles.references}>
                    <strong>{t('suggestions_references')}</strong> {suggestion.references.join(', ')}
                  </div>
                )}
                <div className={styles.disclaimer}>{localized.disclaimer}</div>
              </div>
              );
            })}
          </div>
        )}
      </div>

      {/* All Sessions */}
      <div className={styles.sessionsSection}>
        <h2>{t('all_readings')} ({sessions.length})</h2>
        <div className={styles.sessionsList}>
          {sessions.map((session) => (
            <div
              key={session._id}
              className={`${styles.sessionItem} ${session.flagged ? styles.flagged : ''}`}
              style={{ borderLeftColor: getClassColor(session.classification) }}
            >
              <div className={styles.sessionTop}>
                <div className={styles.sessionValue}>
                  {session.averages.systolic}/{session.averages.diastolic} mmHg
                  {session.flagged && <span className={styles.flag}>⚠️</span>}
                </div>
                <div className={styles.sessionClass}>{getClassificationLabel(session.classification)}</div>
              </div>
              <div className={styles.sessionMeta}>
                {new Date(session.timestamp).toLocaleString()} · {getContextLabel(session.context)}
                {session.averages.pulse && ` · ${session.averages.pulse} bpm`}
              </div>
              {session.notes && <div className={styles.sessionNotes}>Note: {session.notes}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

