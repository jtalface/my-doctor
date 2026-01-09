import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, Button } from '@components/common';
import { useActiveProfile } from '../contexts';
import { useTranslate } from '../i18n';
import { api, SessionHistoryItem } from '../services/api';
import styles from './HealthHistoryPage.module.css';

export function HealthHistoryPage() {
  const { activeProfile, isViewingDependent } = useActiveProfile();
  const t = useTranslate();
  const [sessions, setSessions] = useState<SessionHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Create a stable key from profile ID and type
  const profileId = activeProfile?.id;
  const profileType = isViewingDependent ? 'dependent' : 'self';

  // Load sessions when profile changes
  useEffect(() => {
    // Reset state when profile changes
    setIsLoading(true);
    setSessions([]);
    setError(null);
    
    const loadSessions = async () => {
      if (!profileId) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch sessions for the active profile (self or dependent)
        let userSessions: SessionHistoryItem[];
        if (profileType === 'dependent') {
          userSessions = await api.getDependentSessions(profileId);
        } else {
          userSessions = await api.getUserSessions(profileId);
        }
        setSessions(userSessions);
      } catch (err) {
        console.error('Failed to load sessions:', err);
        setError('Failed to load sessions');
      } finally {
        setIsLoading(false);
      }
    };

    loadSessions();
  }, [profileId, profileType]);

  // Function to reload sessions (for retry button)
  const reloadSessions = () => {
    setIsLoading(true);
    setSessions([]);
    setError(null);
    
    const load = async () => {
      if (!profileId) {
        setIsLoading(false);
        return;
      }
      try {
        let userSessions: SessionHistoryItem[];
        if (profileType === 'dependent') {
          userSessions = await api.getDependentSessions(profileId);
        } else {
          userSessions = await api.getUserSessions(profileId);
        }
        setSessions(userSessions);
      } catch (err) {
        console.error('Failed to load sessions:', err);
        setError('Failed to load sessions');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  };

  // Format date to "Dec 16, 2024"
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // Format date to "December 2024" for month headers
  const formatMonthYear = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  // Calculate duration between start and end
  const calculateDuration = (startedAt: string, completedAt?: string) => {
    if (!completedAt) return t('history_status_in_progress');
    
    const start = new Date(startedAt).getTime();
    const end = new Date(completedAt).getTime();
    const durationMs = end - start;
    const minutes = Math.round(durationMs / 1000 / 60);
    
    return t('history_duration_min', { minutes });
  };

  // Filter sessions based on search query
  const filterSessions = () => {
    if (!searchQuery.trim()) {
      return sessions;
    }

    const query = searchQuery.toLowerCase();
    
    return sessions.filter(session => {
      // Search in formatted date
      const formattedDate = formatDate(session.startedAt).toLowerCase();
      if (formattedDate.includes(query)) return true;

      // Search in status
      const status = session.status.toLowerCase();
      if (status.includes(query)) return true;

      // Search in summary data
      if (session.summary) {
        // Search in red flags
        if (session.summary.redFlags?.some(flag => flag.toLowerCase().includes(query))) {
          return true;
        }

        // Search in recommendations
        if (session.summary.recommendations?.some(rec => rec.toLowerCase().includes(query))) {
          return true;
        }

        // Search in notes
        if (session.summary.notes?.toLowerCase().includes(query)) {
          return true;
        }
      }

      return false;
    });
  };

  // Group sessions by month
  const groupSessionsByMonth = () => {
    const grouped: { [key: string]: SessionHistoryItem[] } = {};
    const filteredSessions = filterSessions();
    
    filteredSessions.forEach(session => {
      const monthYear = formatMonthYear(session.startedAt);
      if (!grouped[monthYear]) {
        grouped[monthYear] = [];
      }
      grouped[monthYear].push(session);
    });
    
    return grouped;
  };

  const sessionsByMonth = groupSessionsByMonth();
  const months = Object.keys(sessionsByMonth);

  const renderHeader = () => (
    <header className={styles.header}>
      <div className={styles.headerLeft}>
        <Link to="/dashboard" className={styles.backButton}>←</Link>
        <h1 className={styles.title}>{t('history_title')}</h1>
      </div>
      <div className={styles.headerRight} />
    </header>
  );

  if (isLoading) {
    return (
      <div className={styles.container}>
        {renderHeader()}
        <main className={styles.main}>
          <div className={styles.loadingState}>
            <div className={styles.spinner} />
            <p>{t('history_loading')}</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        {renderHeader()}
        <main className={styles.main}>
          <Card variant="outline" padding="lg">
            <CardContent>
              <div className={styles.errorState}>
                <span className={styles.errorIcon}>⚠️</span>
                <h3>{t('history_error_title')}</h3>
                <p>{error}</p>
                <Button onClick={reloadSessions}>{t('history_try_again')}</Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className={styles.container}>
        {renderHeader()}
        <main className={styles.main}>
          <Card variant="outline" padding="lg">
            <CardContent>
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>📋</span>
                <h3>{t('history_empty_title')}</h3>
                <p>{t('history_empty_desc')}</p>
                <Link to="/checkup/start">
                  <Button>{t('history_empty_button')}</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {renderHeader()}

      <main className={styles.main}>
        <div className={styles.searchBar}>
          <div className={styles.searchInputWrapper}>
            <input
              type="text"
              placeholder={t('history_search_placeholder')}
              className={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className={styles.clearButton}
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {months.length === 0 && searchQuery ? (
          <Card variant="outline" padding="lg">
            <CardContent>
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>🔍</span>
                <h3>No results found</h3>
                <p>Try adjusting your search terms</p>
                <Button onClick={() => setSearchQuery('')}>Clear search</Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          months.map((monthYear) => (
            <section key={monthYear} className={styles.monthSection}>
              <h2 className={styles.monthTitle}>{monthYear}</h2>
              
              {(sessionsByMonth[monthYear] || []).map(session => {
                const flagCount = session.summary?.redFlags?.length || 0;
                const isCompleted = session.status === 'completed';
                const isAbandoned = session.status === 'abandoned';

                return (
                  <Link 
                    to={`/history/${session._id}`} 
                    key={session._id} 
                    className={styles.sessionLink}
                  >
                    <Card variant="default" padding="md">
                      <CardContent>
                        <div className={styles.sessionRow}>
                          <div className={styles.sessionInfo}>
                            <span className={styles.sessionIcon}>
                              {isCompleted ? '✅' : isAbandoned ? '❌' : '📋'}
                            </span>
                            <div>
                              <h3 className={styles.sessionTitle}>
                                {t('history_health_checkup')}
                              </h3>
                              <p className={styles.sessionMeta}>
                                {formatDate(session.startedAt)} • {calculateDuration(session.startedAt, session.completedAt)}
                              </p>
                            </div>
                          </div>
                          <div className={styles.sessionRight}>
                            {flagCount > 0 && isCompleted && (
                              <span className={styles.flagBadge}>
                                ⚠️ {t('history_flagged_count', { count: flagCount })}
                              </span>
                            )}
                            {isCompleted && flagCount === 0 && (
                              <span className={styles.completed}>✓ {t('history_status_completed')}</span>
                            )}
                            {isAbandoned && (
                              <span className={styles.abandoned}>{t('history_status_abandoned')}</span>
                            )}
                            {!isCompleted && !isAbandoned && (
                              <span className={styles.inProgress}>⏳ {t('history_status_in_progress')}</span>
                            )}
                            <span className={styles.arrow}>▶</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </section>
          ))
        )}
      </main>
    </div>
  );
}
