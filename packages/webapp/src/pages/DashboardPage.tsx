import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, Button } from '@components/common';
import { LLMSelector } from '@components/settings';
import { api, SessionHistoryItem, HealthStatus } from '../services/api';
import { useUser } from '../store/UserContext';
import { useTranslate } from '../i18n';
import styles from './DashboardPage.module.css';

// Storage key for user ID
const USER_ID_KEY = 'mydoctor_user_id';

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
}

export function DashboardPage() {
  const { user } = useUser();
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
        // Check backend health
        const health = await api.getHealth();
        setHealthStatus(health);
        setBackendAvailable(true);

        // Get user's sessions
        const userId = localStorage.getItem(USER_ID_KEY);
        if (userId) {
          const userSessions = await api.getUserSessions(userId);
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
  }, []);

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
                <h3 className={styles.alertTitle}>Connection Issue</h3>
                <p className={styles.alertDescription}>
                  Unable to connect to the server. Some features may be unavailable.
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
                <h3 className={styles.alertTitle}>Important Health Notes</h3>
                <p className={styles.alertDescription}>
                  Your recent checkup flagged some items to discuss with your doctor.
                </p>
              </div>
            </div>
            <div className={styles.alertActions}>
              <Link to={`/checkup/summary/${completedSessions[0]?._id}`}>
                <Button variant="ghost" size="sm">View Details</Button>
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
              <h3 className={styles.actionTitle}>Start New Checkup</h3>
              <p className={styles.actionDesc}>Quick wellness assessment</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/history" className={styles.actionCard}>
          <Card variant="interactive" padding="lg">
            <CardContent>
              <div className={styles.actionIcon}>📊</div>
              <h3 className={styles.actionTitle}>View Health History</h3>
              <p className={styles.actionDesc}>
                {sessions.length > 0 
                  ? `${sessions.length} session${sessions.length > 1 ? 's' : ''} recorded`
                  : 'Review past sessions & trends'
                }
              </p>
            </CardContent>
          </Card>
        </Link>
      </section>

      {/* Recent Activity */}
      <section className={styles.recentActivity}>
        <h2 className={styles.sectionTitle}>Recent Activity</h2>
        
        {isLoading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner} />
            <p>Loading sessions...</p>
          </div>
        ) : sessions.length === 0 ? (
          <Card variant="outline" padding="lg">
            <CardContent>
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>📋</span>
                <h3>No sessions yet</h3>
                <p>Start your first health checkup to see your activity here.</p>
                <Link to="/checkup/start">
                  <Button>Start Checkup</Button>
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
                            Health Checkup
                            {session.summary?.redFlags?.length ? ' ⚠️' : ''}
                          </h4>
                          <p className={styles.activityDate}>
                            {formatDate(session.startedAt)}
                            <span className={styles.statusLabel}>
                              {session.status === 'completed' ? ' • Completed' : 
                               session.status === 'abandoned' ? ' • Abandoned' : ' • In Progress'}
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
