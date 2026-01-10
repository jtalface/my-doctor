/**
 * BP Insights Page
 * 
 * Display patterns, trends, and all suggestions
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBPData } from '../hooks/useBPData';
import { useTranslate } from '../i18n';
import styles from './BPInsightsPage.module.css';

export function BPInsightsPage() {
  const navigate = useNavigate();
  const t = useTranslate();
  const { sessions, suggestions, analytics } = useBPData();
  const [filter, setFilter] = useState<'all' | 'urgent' | 'warn' | 'info'>('all');

  const filteredSuggestions = suggestions.filter((s) => filter === 'all' || s.severity === filter);

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
          ← {t('bp_back')}
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
              <div className={styles.statLabel}>Above Target</div>
              <div className={styles.statValue}>{analytics.aboveTarget.percentage}%</div>
              <div className={styles.statMeta}>{t('bp_readings_count', { count: analytics.aboveTarget.count })}</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Adherence</div>
              <div className={styles.statValue}>{analytics.adherence.adherenceRate}%</div>
              <div className={styles.statMeta}>
                {analytics.adherence.actualReadings}/{analytics.adherence.expectedReadings} expected
              </div>
            </div>
          </div>

          {/* Distribution */}
          <div className={styles.distributionSection}>
            <h3>Classification Distribution</h3>
            <div className={styles.distributionBars}>
              {Object.entries(analytics.distribution).map(([key, count]) => {
                const total = analytics.summary.totalSessions || 1;
                const percentage = ((count / total) * 100).toFixed(0);
                return (
                  <div key={key} className={styles.distBar}>
                    <span className={styles.distLabel}>{key.replace('stage', 'Stage ')}</span>
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
              <h3>Morning vs Evening</h3>
              <div className={styles.comparisonGrid}>
                <div className={styles.comparisonCard}>
                  <div className={styles.comparisonLabel}>Morning Average</div>
                  <div className={styles.comparisonValue}>
                    {analytics.amPmComparison.amAvg.systolic}/{analytics.amPmComparison.amAvg.diastolic}
                  </div>
                </div>
                <div className={styles.comparisonCard}>
                  <div className={styles.comparisonLabel}>Evening Average</div>
                  <div className={styles.comparisonValue}>
                    {analytics.amPmComparison.pmAvg.systolic}/{analytics.amPmComparison.pmAvg.diastolic}
                  </div>
                </div>
                <div className={styles.comparisonCard}>
                  <div className={styles.comparisonLabel}>Difference</div>
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
          <h2>Suggestions & Recommendations</h2>
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
            {filteredSuggestions.map((suggestion) => (
              <div key={suggestion.id} className={`${styles.suggestionCard} ${styles[suggestion.severity]}`}>
                <div className={styles.suggestionHeader}>
                  <h3>{suggestion.title}</h3>
                  <span className={styles.badge}>{suggestion.severity.toUpperCase()}</span>
                </div>
                <p className={styles.message}>{suggestion.message}</p>
                <div className={styles.rationale}>
                  <strong>{t('suggestions_why')}</strong> {suggestion.rationale}
                </div>
                {suggestion.actions && suggestion.actions.length > 0 && (
                  <div className={styles.actions}>
                    <strong>{t('suggestions_suggested_actions')}</strong>
                    <ul>
                      {suggestion.actions.map((action, idx) => (
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
                <div className={styles.disclaimer}>{suggestion.disclaimer}</div>
              </div>
            ))}
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
                <div className={styles.sessionClass}>{session.classification.replace('stage', 'Stage ')}</div>
              </div>
              <div className={styles.sessionMeta}>
                {new Date(session.timestamp).toLocaleString()} · {session.context.replace('_', ' ')}
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

