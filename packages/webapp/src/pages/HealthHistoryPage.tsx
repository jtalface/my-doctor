import { Link } from 'react-router-dom';
import { Card, CardContent, Button } from '@components/common';
import styles from './HealthHistoryPage.module.css';

export function HealthHistoryPage() {
  // Mock data
  const sessions = [
    {
      id: '1',
      type: 'Annual Checkup',
      date: 'Dec 16, 2024',
      duration: '18 min',
      flagCount: 2,
    },
    {
      id: '2',
      type: 'Symptom Check: Headaches',
      date: 'Nov 28, 2024',
      duration: '8 min',
      flagCount: 0,
    },
    {
      id: '3',
      type: 'Symptom Check: Fatigue',
      date: 'Nov 15, 2024',
      duration: '12 min',
      flagCount: 0,
    },
  ];

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

        <section className={styles.monthSection}>
          <h2 className={styles.monthTitle}>December 2024</h2>
          
          {sessions.filter(s => s.date.includes('Dec')).map(session => (
            <Link to={`/history/${session.id}`} key={session.id} className={styles.sessionLink}>
              <Card variant="default" padding="md">
                <CardContent>
                  <div className={styles.sessionRow}>
                    <div className={styles.sessionInfo}>
                      <span className={styles.sessionIcon}>📋</span>
                      <div>
                        <h3 className={styles.sessionTitle}>{session.type}</h3>
                        <p className={styles.sessionMeta}>
                          {session.date} • {session.duration}
                        </p>
                      </div>
                    </div>
                    <div className={styles.sessionRight}>
                      {session.flagCount > 0 && (
                        <span className={styles.flagBadge}>
                          ⚠️ {session.flagCount} flagged
                        </span>
                      )}
                      <span className={styles.arrow}>▶</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </section>

        <section className={styles.monthSection}>
          <h2 className={styles.monthTitle}>November 2024</h2>
          
          {sessions.filter(s => s.date.includes('Nov')).map(session => (
            <Link to={`/history/${session.id}`} key={session.id} className={styles.sessionLink}>
              <Card variant="default" padding="md">
                <CardContent>
                  <div className={styles.sessionRow}>
                    <div className={styles.sessionInfo}>
                      <span className={styles.sessionIcon}>📋</span>
                      <div>
                        <h3 className={styles.sessionTitle}>{session.type}</h3>
                        <p className={styles.sessionMeta}>
                          {session.date} • {session.duration}
                        </p>
                      </div>
                    </div>
                    <div className={styles.sessionRight}>
                      <span className={styles.completed}>✓ Completed</span>
                      <span className={styles.arrow}>▶</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </section>

        <Button variant="outline" fullWidth>
          Load More Sessions
        </Button>
      </main>
    </div>
  );
}

