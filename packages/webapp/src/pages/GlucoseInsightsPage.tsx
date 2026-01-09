/**
 * Glucose Insights Page
 * 
 * Display patterns, analytics, trends, and all suggestions
 */

import { useNavigate } from 'react-router-dom';
import { useGlucoseData } from '../hooks/useGlucoseData';
import styles from './GlucoseInsightsPage.module.css';

export function GlucoseInsightsPage() {
  const navigate = useNavigate();
  const { settings, readings, suggestions, analytics, isLoading } = useGlucoseData();

  if (!isLoading && !settings) {
    navigate('/glucose/onboarding');
    return null;
  }

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading insights...</div>
      </div>
    );
  }

  const urgentSuggestions = suggestions.filter((s) => s.severity === 'urgent');
  const warnSuggestions = suggestions.filter((s) => s.severity === 'warn');
  const infoSuggestions = suggestions.filter((s) => s.severity === 'info');

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={() => navigate('/glucose/dashboard')} className={styles.backButton}>
          ← Back to Dashboard
        </button>
        <h1 className={styles.title}>📊 Glucose Insights & Patterns</h1>
      </div>

      {/* Analytics Summary */}
      {analytics && (
        <div className={styles.analyticsSection}>
          <h2 className={styles.sectionTitle}>7-Day Summary</h2>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Average Glucose</div>
              <div className={styles.statValue}>
                {analytics.averageGlucose}
                <span className={styles.statUnit}>{settings?.unitPreference}</span>
              </div>
              <div className={styles.statMeta}>
                Estimated A1C: ~
                {((analytics.averageGlucose + 46.7) / 28.7).toFixed(1)}%
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statLabel}>Time in Range</div>
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
              <div className={styles.statLabel}>Variability (CV)</div>
              <div className={styles.statValue}>
                {analytics.coefficientOfVariation}
                <span className={styles.statUnit}>%</span>
              </div>
              <div className={styles.statMeta}>
                {analytics.coefficientOfVariation > 36 ? '⚠️ High variability' : '✓ Good stability'}
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statLabel}>Readings</div>
              <div className={styles.statValue}>{analytics.timeInRange.total}</div>
              <div className={styles.statMeta}>
                Highs: {analytics.highCount} | Lows: {analytics.lowCount}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detected Patterns */}
      {analytics && analytics.patterns.length > 0 && (
        <div className={styles.patternsSection}>
          <h2 className={styles.sectionTitle}>🔍 Detected Patterns</h2>
          <div className={styles.patternsList}>
            {analytics.patterns.map((pattern, idx) => (
              <div key={idx} className={`${styles.patternCard} ${styles[pattern.severity]}`}>
                <div className={styles.patternHeader}>
                  <span className={styles.patternType}>{pattern.type.replace('_', ' ')}</span>
                  <span className={`${styles.badge} ${styles[pattern.severity]}`}>
                    {pattern.severity}
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
        <h2 className={styles.sectionTitle}>💡 Suggestions & Guidance</h2>

        {suggestions.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No suggestions at this time. Keep logging your readings!</p>
          </div>
        ) : (
          <>
            {urgentSuggestions.length > 0 && (
              <div className={styles.suggestionGroup}>
                <h3 className={styles.groupTitle}>🚨 Urgent</h3>
                {urgentSuggestions.map((suggestion) => (
                  <div key={suggestion.id} className={`${styles.suggestionCard} ${styles.urgent}`}>
                    <h4 className={styles.suggestionTitle}>{suggestion.title}</h4>
                    <p className={styles.suggestionMessage}>{suggestion.message}</p>
                    <div className={styles.rationale}>
                      <strong>Why:</strong> {suggestion.rationale}
                    </div>
                    {suggestion.actions && suggestion.actions.length > 0 && (
                      <div className={styles.actions}>
                        <strong>Recommended actions:</strong>
                        <ul>
                          {suggestion.actions.map((action, idx) => (
                            <li key={idx}>{action}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {suggestion.supportingData.readings.length > 0 && (
                      <div className={styles.supportingData}>
                        <strong>Related readings:</strong>
                        <div className={styles.readingsList}>
                          {suggestion.supportingData.readings.slice(0, 3).map((reading, idx) => (
                            <span key={idx} className={styles.readingBadge}>
                              {reading.value} {settings?.unitPreference} ({reading.context})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {suggestion.references && suggestion.references.length > 0 && (
                      <div className={styles.references}>
                        <strong>References:</strong> {suggestion.references.join(', ')}
                      </div>
                    )}
                    <div className={styles.disclaimer}>{suggestion.disclaimer}</div>
                  </div>
                ))}
              </div>
            )}

            {warnSuggestions.length > 0 && (
              <div className={styles.suggestionGroup}>
                <h3 className={styles.groupTitle}>⚠️ Warnings</h3>
                {warnSuggestions.map((suggestion) => (
                  <div key={suggestion.id} className={`${styles.suggestionCard} ${styles.warn}`}>
                    <h4 className={styles.suggestionTitle}>{suggestion.title}</h4>
                    <p className={styles.suggestionMessage}>{suggestion.message}</p>
                    <div className={styles.rationale}>
                      <strong>Why:</strong> {suggestion.rationale}
                    </div>
                    {suggestion.actions && suggestion.actions.length > 0 && (
                      <div className={styles.actions}>
                        <strong>Suggested actions:</strong>
                        <ul>
                          {suggestion.actions.map((action, idx) => (
                            <li key={idx}>{action}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className={styles.disclaimer}>{suggestion.disclaimer}</div>
                  </div>
                ))}
              </div>
            )}

            {infoSuggestions.length > 0 && (
              <div className={styles.suggestionGroup}>
                <h3 className={styles.groupTitle}>ℹ️ Information & Tips</h3>
                {infoSuggestions.map((suggestion) => (
                  <div key={suggestion.id} className={`${styles.suggestionCard} ${styles.info}`}>
                    <h4 className={styles.suggestionTitle}>{suggestion.title}</h4>
                    <p className={styles.suggestionMessage}>{suggestion.message}</p>
                    {suggestion.actions && suggestion.actions.length > 0 && (
                      <div className={styles.actions}>
                        <strong>Tips:</strong>
                        <ul>
                          {suggestion.actions.map((action, idx) => (
                            <li key={idx}>{action}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Reading List */}
      <div className={styles.readingsSection}>
        <h2 className={styles.sectionTitle}>Recent Readings</h2>
        {readings.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No readings yet. Start logging to see trends!</p>
          </div>
        ) : (
          <div className={styles.readingsTable}>
            <div className={styles.tableHeader}>
              <span>Date & Time</span>
              <span>Value</span>
              <span>Context</span>
              <span>Notes</span>
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
                <span className={styles.context}>{reading.context.replace('_', ' ')}</span>
                <span className={styles.notes}>{reading.notes || '-'}</span>
              </div>
            ))}
          </div>
        )}
        {readings.length > 20 && (
          <div className={styles.tableFooter}>
            Showing 20 of {readings.length} readings. Export full data from Reports page.
          </div>
        )}
      </div>
    </div>
  );
}

