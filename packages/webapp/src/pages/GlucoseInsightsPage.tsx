/**
 * Glucose Insights Page
 * 
 * Display patterns, analytics, trends, and all suggestions
 */

import { useNavigate } from 'react-router-dom';
import { useGlucoseData } from '../hooks/useGlucoseData';
import { useTranslate } from '../i18n';
import type { Suggestion } from '../types/glucose';
import styles from './GlucoseInsightsPage.module.css';

export function GlucoseInsightsPage() {
  const navigate = useNavigate();
  const t = useTranslate();
  const { settings, readings, suggestions, analytics, isLoading } = useGlucoseData();

  if (!isLoading && !settings) {
    navigate('/glucose/onboarding');
    return null;
  }

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>{t('glucose_loading_insights')}</div>
      </div>
    );
  }

  const urgentSuggestions = suggestions.filter((s) => s.severity === 'urgent');
  const warnSuggestions = suggestions.filter((s) => s.severity === 'warn');
  const infoSuggestions = suggestions.filter((s) => s.severity === 'info');

  const translateSeverity = (severity: Suggestion['severity']) => {
    if (severity === 'urgent') return t('glucose_severity_urgent');
    if (severity === 'warn') return t('glucose_severity_warn');
    return t('glucose_severity_info');
  };

  const getContextLabel = (context: string): string => {
    const contextMap: Record<string, string> = {
      fasting: t('glucose_fasting'),
      pre_meal: t('glucose_pre_meal'),
      post_meal: t('glucose_post_meal'),
      bedtime: t('glucose_bedtime'),
      overnight: t('glucose_overnight'),
      other: t('glucose_other'),
    };
    return contextMap[context] || context.replace('_', ' ');
  };

  const getLocalizedSuggestionText = (suggestion: Suggestion) => {
    const base = {
      title: suggestion.title,
      message: suggestion.message,
      rationale: suggestion.rationale,
      actions: suggestion.actions,
      disclaimer: suggestion.disclaimer,
    };

    const map: Record<string, { title: string; message: string; rationale: string; actions?: string[]; disclaimer: string }> = {
      severe_hypoglycemia: {
        title: t('glucose_suggestion_severe_hypoglycemia_title'),
        message: t('glucose_suggestion_severe_hypoglycemia_message'),
        rationale: t('glucose_suggestion_severe_hypoglycemia_rationale'),
        actions: [
          t('glucose_suggestion_severe_hypoglycemia_action_1'),
          t('glucose_suggestion_severe_hypoglycemia_action_2'),
          t('glucose_suggestion_severe_hypoglycemia_action_3'),
          t('glucose_suggestion_severe_hypoglycemia_action_4'),
        ],
        disclaimer: t('glucose_suggestion_severe_hypoglycemia_disclaimer'),
      },
      hypoglycemia: {
        title: t('glucose_suggestion_hypoglycemia_title'),
        message: t('glucose_suggestion_hypoglycemia_message'),
        rationale: t('glucose_suggestion_hypoglycemia_rationale'),
        actions: [
          t('glucose_suggestion_hypoglycemia_action_1'),
          t('glucose_suggestion_hypoglycemia_action_2'),
          t('glucose_suggestion_hypoglycemia_action_3'),
          t('glucose_suggestion_hypoglycemia_action_4'),
        ],
        disclaimer: t('glucose_suggestion_hypoglycemia_disclaimer'),
      },
      hyperglycemia_dka_risk: {
        title: t('glucose_suggestion_hyperglycemia_dka_risk_title'),
        message: t('glucose_suggestion_hyperglycemia_dka_risk_message'),
        rationale: t('glucose_suggestion_hyperglycemia_dka_risk_rationale'),
        actions: [
          t('glucose_suggestion_hyperglycemia_dka_risk_action_1'),
          t('glucose_suggestion_hyperglycemia_dka_risk_action_2'),
          t('glucose_suggestion_hyperglycemia_dka_risk_action_3'),
          t('glucose_suggestion_hyperglycemia_dka_risk_action_4'),
        ],
        disclaimer: t('glucose_suggestion_hyperglycemia_dka_risk_disclaimer'),
      },
      persistent_hyperglycemia: {
        title: t('glucose_suggestion_persistent_hyperglycemia_title'),
        message: t('glucose_suggestion_persistent_hyperglycemia_message'),
        rationale: t('glucose_suggestion_persistent_hyperglycemia_rationale'),
        actions: [
          t('glucose_suggestion_persistent_hyperglycemia_action_1'),
          t('glucose_suggestion_persistent_hyperglycemia_action_2'),
          t('glucose_suggestion_persistent_hyperglycemia_action_3'),
          t('glucose_suggestion_persistent_hyperglycemia_action_4'),
        ],
        disclaimer: t('glucose_suggestion_persistent_hyperglycemia_disclaimer'),
      },
      post_meal_pattern: {
        title: t('glucose_suggestion_post_meal_pattern_title'),
        message: t('glucose_suggestion_post_meal_pattern_message'),
        rationale: t('glucose_suggestion_post_meal_pattern_rationale'),
        actions: [
          t('glucose_suggestion_post_meal_pattern_action_1'),
          t('glucose_suggestion_post_meal_pattern_action_2'),
          t('glucose_suggestion_post_meal_pattern_action_3'),
        ],
        disclaimer: t('glucose_suggestion_post_meal_pattern_disclaimer'),
      },
      fasting_pattern: {
        title: t('glucose_suggestion_fasting_pattern_title'),
        message: t('glucose_suggestion_fasting_pattern_message'),
        rationale: t('glucose_suggestion_fasting_pattern_rationale'),
        actions: [
          t('glucose_suggestion_fasting_pattern_action_1'),
          t('glucose_suggestion_fasting_pattern_action_2'),
          t('glucose_suggestion_fasting_pattern_action_3'),
        ],
        disclaimer: t('glucose_suggestion_fasting_pattern_disclaimer'),
      },
      hypoglycemia_pattern: {
        title: t('glucose_suggestion_hypoglycemia_pattern_title'),
        message: t('glucose_suggestion_hypoglycemia_pattern_message'),
        rationale: t('glucose_suggestion_hypoglycemia_pattern_rationale'),
        actions: [
          t('glucose_suggestion_hypoglycemia_pattern_action_1'),
          t('glucose_suggestion_hypoglycemia_pattern_action_2'),
          t('glucose_suggestion_hypoglycemia_pattern_action_3'),
        ],
        disclaimer: t('glucose_suggestion_hypoglycemia_pattern_disclaimer'),
      },
      glucose_variability: {
        title: t('glucose_suggestion_glucose_variability_title'),
        message: t('glucose_suggestion_glucose_variability_message'),
        rationale: t('glucose_suggestion_glucose_variability_rationale'),
        actions: [
          t('glucose_suggestion_glucose_variability_action_1'),
          t('glucose_suggestion_glucose_variability_action_2'),
          t('glucose_suggestion_glucose_variability_action_3'),
        ],
        disclaimer: t('glucose_suggestion_glucose_variability_disclaimer'),
      },
      engagement: {
        title: t('glucose_suggestion_engagement_title'),
        message: t('glucose_suggestion_engagement_message'),
        rationale: t('glucose_suggestion_engagement_rationale'),
        actions: [
          t('glucose_suggestion_engagement_action_1'),
          t('glucose_suggestion_engagement_action_2'),
          t('glucose_suggestion_engagement_action_3'),
        ],
        disclaimer: t('glucose_suggestion_engagement_disclaimer'),
      },
    };

    return map[suggestion.type] || base;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={() => navigate('/glucose/dashboard')} className={styles.backButton}>
          ← {t('glucose_back_to_dashboard')}
        </button>
        <h1 className={styles.title}>📊 {t('glucose_insights_title')}</h1>
      </div>

      {/* Analytics Summary */}
      {analytics && (
        <div className={styles.analyticsSection}>
          <h2 className={styles.sectionTitle}>{t('glucose_7day_summary')}</h2>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>{t('glucose_average_glucose')}</div>
              <div className={styles.statValue}>
                {analytics.averageGlucose}
                <span className={styles.statUnit}>{settings?.unitPreference}</span>
              </div>
              <div className={styles.statMeta}>
                {t('glucose_estimated_a1c', { value: ((analytics.averageGlucose + 46.7) / 28.7).toFixed(1) })}
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statLabel}>{t('glucose_time_in_range')}</div>
              <div className={styles.statValue}>
                {analytics.timeInRange.percentage}
                <span className={styles.statUnit}>%</span>
              </div>
              <div className={styles.statMeta}>
                {analytics.timeInRange.inRange} / {analytics.timeInRange.total} readings
              </div>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${analytics.timeInRange.percentage}%` }}
                />
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statLabel}>{t('glucose_variability')}</div>
              <div className={styles.statValue}>
                {analytics.coefficientOfVariation}
                <span className={styles.statUnit}>%</span>
              </div>
              <div className={styles.statMeta}>
                {analytics.coefficientOfVariation > 36 ? `⚠️ ${t('glucose_high_variability')}` : `✓ ${t('glucose_good_stability')}`}
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statLabel}>{t('glucose_readings')}</div>
              <div className={styles.statValue}>{analytics.timeInRange.total}</div>
              <div className={styles.statMeta}>
                {t('glucose_highs_lows', { highs: analytics.highCount, lows: analytics.lowCount })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detected Patterns */}
      {analytics && analytics.patterns.length > 0 && (
        <div className={styles.patternsSection}>
          <h2 className={styles.sectionTitle}>🔍 {t('glucose_detected_patterns')}</h2>
          <div className={styles.patternsList}>
            {analytics.patterns.map((pattern, idx) => (
              <div key={idx} className={`${styles.patternCard} ${styles[pattern.severity]}`}>
                <div className={styles.patternHeader}>
                  <span className={styles.patternType}>{pattern.type.replace('_', ' ')}</span>
                  <span className={`${styles.badge} ${styles[pattern.severity]}`}>
                    {translateSeverity(pattern.severity)}
                  </span>
                </div>
                <p className={styles.patternDescription}>{pattern.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions */}
      <div className={styles.suggestionsSection}>
        <h2 className={styles.sectionTitle}>💡 {t('glucose_suggestions_guidance')}</h2>

        {suggestions.length === 0 ? (
          <div className={styles.emptyState}>
            <p>{t('glucose_no_suggestions')}</p>
          </div>
        ) : (
          <>
            {urgentSuggestions.length > 0 && (
              <div className={styles.suggestionGroup}>
                <h3 className={styles.groupTitle}>🚨 {t('glucose_urgent')}</h3>
                {urgentSuggestions.map((suggestion) => (
                  (() => {
                    const localized = getLocalizedSuggestionText(suggestion);
                    return (
                  <div key={suggestion.id} className={`${styles.suggestionCard} ${styles.urgent}`}>
                    <h4 className={styles.suggestionTitle}>{localized.title}</h4>
                    <p className={styles.suggestionMessage}>{localized.message}</p>
                    <div className={styles.rationale}>
                      <strong>{t('glucose_why')}</strong> {localized.rationale}
                    </div>
                    {localized.actions && localized.actions.length > 0 && (
                      <div className={styles.actions}>
                        <strong>{t('glucose_recommended_actions')}</strong>
                        <ul>
                          {localized.actions.map((action, idx) => (
                            <li key={idx}>{action}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {suggestion.supportingData.readings.length > 0 && (
                      <div className={styles.supportingData}>
                        <strong>{t('glucose_related_readings')}</strong>
                        <div className={styles.readingsList}>
                          {suggestion.supportingData.readings.slice(0, 3).map((reading, idx) => (
                            <span key={idx} className={styles.readingBadge}>
                              {reading.value} {settings?.unitPreference} ({getContextLabel(reading.context)})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {suggestion.references && suggestion.references.length > 0 && (
                      <div className={styles.references}>
                        <strong>{t('glucose_references')}</strong> {suggestion.references.join(', ')}
                      </div>
                    )}
                    <div className={styles.disclaimer}>{localized.disclaimer}</div>
                  </div>
                    );
                  })()
                ))}
              </div>
            )}

            {warnSuggestions.length > 0 && (
              <div className={styles.suggestionGroup}>
                <h3 className={styles.groupTitle}>⚠️ {t('glucose_warnings')}</h3>
                {warnSuggestions.map((suggestion) => (
                  (() => {
                    const localized = getLocalizedSuggestionText(suggestion);
                    return (
                  <div key={suggestion.id} className={`${styles.suggestionCard} ${styles.warn}`}>
                    <h4 className={styles.suggestionTitle}>{localized.title}</h4>
                    <p className={styles.suggestionMessage}>{localized.message}</p>
                    <div className={styles.rationale}>
                      <strong>{t('glucose_why')}</strong> {localized.rationale}
                    </div>
                    {localized.actions && localized.actions.length > 0 && (
                      <div className={styles.actions}>
                        <strong>{t('glucose_suggested_actions')}</strong>
                        <ul>
                          {localized.actions.map((action, idx) => (
                            <li key={idx}>{action}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className={styles.disclaimer}>{localized.disclaimer}</div>
                  </div>
                    );
                  })()
                ))}
              </div>
            )}

            {infoSuggestions.length > 0 && (
              <div className={styles.suggestionGroup}>
                <h3 className={styles.groupTitle}>ℹ️ {t('glucose_info_tips')}</h3>
                {infoSuggestions.map((suggestion) => (
                  (() => {
                    const localized = getLocalizedSuggestionText(suggestion);
                    return (
                  <div key={suggestion.id} className={`${styles.suggestionCard} ${styles.info}`}>
                    <h4 className={styles.suggestionTitle}>{localized.title}</h4>
                    <p className={styles.suggestionMessage}>{localized.message}</p>
                    {localized.actions && localized.actions.length > 0 && (
                      <div className={styles.actions}>
                        <strong>{t('glucose_tips')}</strong>
                        <ul>
                          {localized.actions.map((action, idx) => (
                            <li key={idx}>{action}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className={styles.disclaimer}>{localized.disclaimer}</div>
                  </div>
                    );
                  })()
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Reading List */}
      <div className={styles.readingsSection}>
        <h2 className={styles.sectionTitle}>{t('glucose_recent_readings')}</h2>
        {readings.length === 0 ? (
          <div className={styles.emptyState}>
            <p>{t('glucose_no_readings_yet')}</p>
          </div>
        ) : (
          <div className={styles.readingsTable}>
            <div className={styles.tableHeader}>
              <span>{t('glucose_date_time')}</span>
              <span>{t('glucose_value')}</span>
              <span>{t('glucose_context')}</span>
              <span>{t('glucose_notes')}</span>
            </div>
            {readings.slice(0, 20).map((reading) => (
              <div
                key={reading._id}
                className={`${styles.tableRow} ${reading.flagged ? styles.flagged : ''}`}
              >
                <span>{new Date(reading.timestamp).toLocaleString()}</span>
                <span className={styles.readingValue}>
                  {reading.glucoseValueRaw} {reading.unit}
                  {reading.flagged && <span className={styles.flagIcon}>⚠️</span>}
                </span>
                <span className={styles.context}>{getContextLabel(reading.context)}</span>
                <span className={styles.notes}>{reading.notes || '-'}</span>
              </div>
            ))}
          </div>
        )}
        {readings.length > 20 && (
          <div className={styles.tableFooter}>
            {t('glucose_showing_of', { shown: 20, total: readings.length })}
          </div>
        )}
      </div>
    </div>
  );
}

