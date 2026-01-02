import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, Button } from '@components/common';
import { LLMSelector } from '@components/settings';
import { api, SessionHistoryItem, HealthStatus } from '../services/api';
import { useAuth } from '../auth';
import { useTranslate } from '../i18n';
import styles from './DashboardPage.module.css';

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
}

export function DashboardPage() {
  const { user } = useAuth();
  const t = useTranslate();
  
  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return t('dashboard_greeting_morning');
    if (hour < 17) return t('dashboard_greeting_afternoon');
    return t('dashboard_greeting_evening');
  };
  const [sessions, setSessions] = useState<SessionHistoryItem[]>([]);
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [backendAvailable, setBackendAvailable] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Check backend health (public endpoint)
        const health = await api.getHealth();
        setHealthStatus(health);
        setBackendAvailable(true);

        // Get user's sessions (using authenticated user ID)
        if (user?.id) {
          const userSessions = await api.getUserSessions(user.id);
          setSessions(userSessions);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
        setBackendAvailable(false);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user?.id]);

  const completedSessions = sessions.filter(s => s.status === 'completed');
  const hasRedFlags = completedSessions.some(s => s.summary?.redFlags?.length);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <h1 className={styles.greeting}>{getGreeting()}{user?.name ? `, ${user.name.split(' ')[0]}` : ''} 👋</h1>
          {healthStatus && (
            <p className={styles.statusBadge}>
              <span className={backendAvailable ? styles.statusOnline : styles.statusOffline}>●</span>
              {backendAvailable ? t('dashboard_status_connected') : t('dashboard_status_offline')}
            </p>
          )}
        </div>
        {backendAvailable && (
          <div className={styles.llmSelector}>
            <span className={styles.llmLabel}>{t('dashboard_llm_label')}</span>
            <LLMSelector compact />
          </div>
        )}
      </header>

      {/* Backend Status Alert */}
      {!backendAvailable && (
        <Card variant="outline" className={styles.alertCard}>
          <CardContent>
            <div className={styles.alertContent}>
              <div className={styles.alertIcon}>⚠️</div>
              <div className={styles.alertText}>
                <h3 className={styles.alertTitle}>{t('dashboard_connection_issue')}</h3>
                <p className={styles.alertDescription}>
                  {t('dashboard_connection_message')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Red Flag Alert */}
      {hasRedFlags && (
        <Card variant="outline" className={`${styles.alertCard} ${styles.redFlagAlert}`}>
          <CardContent>
            <div className={styles.alertContent}>
              <div className={styles.alertIcon}>🚨</div>
              <div className={styles.alertText}>
                <h3 className={styles.alertTitle}>{t('dashboard_health_notes')}</h3>
                <p className={styles.alertDescription}>
                  {t('dashboard_health_notes_message')}
                </p>
              </div>
            </div>
            <div className={styles.alertActions}>
              <Link to={`/checkup/summary/${completedSessions[0]?._id}`}>
                <Button variant="ghost" size="sm">{t('dashboard_view_details')}</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <section className={styles.quickActions}>
        <Link to="/checkup/start" className={styles.actionCard}>
          <Card variant="interactive" padding="lg">
            <CardContent>
              <div className={styles.actionIcon}>🩺</div>
              <h3 className={styles.actionTitle}>{t('dashboard_start_new_checkup')}</h3>
              <p className={styles.actionDesc}>{t('dashboard_quick_wellness')}</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/history" className={styles.actionCard}>
          <Card variant="interactive" padding="lg">
            <CardContent>
              <div className={styles.actionIcon}>📊</div>
              <h3 className={styles.actionTitle}>{t('dashboard_view_health_history')}</h3>
              <p className={styles.actionDesc}>
                {sessions.length > 0 
                  ? t('dashboard_sessions_count', { 
                      count: sessions.length, 
                      plural: sessions.length > 1 ? 's' : '' 
                    })
                  : t('dashboard_review_past_sessions')
                }
              </p>
            </CardContent>
          </Card>
        </Link>
      </section>

      {/* Recent Activity */}
      <section className={styles.recentActivity}>
        <h2 className={styles.sectionTitle}>{t('dashboard_recent_activity')}</h2>
        
        {isLoading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner} />
            <p>{t('dashboard_loading_sessions')}</p>
          </div>
        ) : sessions.length === 0 ? (
          <Card variant="outline" padding="lg">
            <CardContent>
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>📋</span>
                <h3>{t('dashboard_no_sessions_yet')}</h3>
                <p>{t('dashboard_start_first_checkup')}</p>
                <Link to="/checkup/start">
                  <Button>{t('dashboard_start_checkup')}</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className={styles.activityList}>
            {sessions.slice(0, 5).map((session) => (
              <Link 
                key={session._id} 
                to={`/checkup/summary/${session._id}`} 
                className={styles.activityItem}
              >
                <Card variant="default" padding="md">
                  <CardContent>
                    <div className={styles.activityRow}>
                      <div className={styles.activityInfo}>
                        <span className={styles.activityIcon}>
                          {session.status === 'completed' ? '✅' : 
                           session.status === 'abandoned' ? '❌' : '⏳'}
                        </span>
                        <div>
                          <h4 className={styles.activityTitle}>
                            {t('dashboard_health_checkup_title')}
                            {session.summary?.redFlags?.length ? ' ⚠️' : ''}
                          </h4>
                          <p className={styles.activityDate}>
                            {formatDate(session.startedAt)}
                            <span className={styles.statusLabel}>
                              {session.status === 'completed' ? ` • ${t('dashboard_status_completed')}` : 
                               session.status === 'abandoned' ? ` • ${t('dashboard_status_abandoned')}` : ` • ${t('dashboard_status_in_progress')}`}
                            </span>
                          </p>
                        </div>
                      </div>
                      <span className={styles.activityArrow}>▶</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
