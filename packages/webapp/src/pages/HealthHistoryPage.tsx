import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, Button } from '@components/common';
import { useUser } from '../store/UserContext';
import { api, SessionHistoryItem } from '../services/api';
import styles from './HealthHistoryPage.module.css';

export function HealthHistoryPage() {
  const { user } = useUser();
  const [sessions, setSessions] = useState<SessionHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSessions();
  }, [user]);

  const loadSessions = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const userSessions = await api.getUserSessions(user.id);
      setSessions(userSessions);
    } catch (err) {
      console.error('Failed to load sessions:', err);
      setError('Failed to load your health history');
    } finally {
      setIsLoading(false);
    }
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
    if (!completedAt) return 'In progress';
    
    const start = new Date(startedAt).getTime();
    const end = new Date(completedAt).getTime();
    const durationMs = end - start;
    const minutes = Math.round(durationMs / 1000 / 60);
    
    return `${minutes} min`;
  };

  // Group sessions by month
  const groupSessionsByMonth = () => {
    const grouped: { [key: string]: SessionHistoryItem[] } = {};
    
    sessions.forEach(session => {
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

  if (isLoading) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>Health History</h1>
        </header>
        <main className={styles.main}>
          <div className={styles.loadingState}>
            <div className={styles.spinner} />
            <p>Loading your health history...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>Health History</h1>
        </header>
        <main className={styles.main}>
          <Card variant="outline" padding="lg">
            <CardContent>
              <div className={styles.errorState}>
                <span className={styles.errorIcon}>⚠️</span>
                <h3>Error Loading History</h3>
                <p>{error}</p>
                <Button onClick={loadSessions}>Try Again</Button>
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
        <header className={styles.header}>
          <h1 className={styles.title}>Health History</h1>
        </header>
        <main className={styles.main}>
          <Card variant="outline" padding="lg">
            <CardContent>
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>📋</span>
                <h3>No Sessions Yet</h3>
                <p>Start your first health checkup to see your history here.</p>
                <Link to="/checkup/start">
                  <Button>Start Checkup</Button>
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
      <header className={styles.header}>
        <h1 className={styles.title}>Health History</h1>
      </header>

      <main className={styles.main}>
        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="🔍 Search sessions..."
            className={styles.searchInput}
          />
          <Button variant="outline" size="sm">
            📅 Filter
          </Button>
        </div>

        {months.map((monthYear) => (
          <section key={monthYear} className={styles.monthSection}>
            <h2 className={styles.monthTitle}>{monthYear}</h2>
            
            {sessionsByMonth[monthYear].map(session => {
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
                              Health Checkup
                            </h3>
                            <p className={styles.sessionMeta}>
                              {formatDate(session.startedAt)} • {calculateDuration(session.startedAt, session.completedAt)}
                            </p>
                          </div>
                        </div>
                        <div className={styles.sessionRight}>
                          {flagCount > 0 && isCompleted && (
                            <span className={styles.flagBadge}>
                              ⚠️ {flagCount} flagged
                            </span>
                          )}
                          {isCompleted && flagCount === 0 && (
                            <span className={styles.completed}>✓ Completed</span>
                          )}
                          {isAbandoned && (
                            <span className={styles.abandoned}>Abandoned</span>
                          )}
                          {!isCompleted && !isAbandoned && (
                            <span className={styles.inProgress}>⏳ In Progress</span>
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
        ))}
      </main>
    </div>
  );
}
