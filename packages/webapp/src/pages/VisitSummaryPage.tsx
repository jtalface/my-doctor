import { useState, useEffect } from 'react';
import { Link, useParams, useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, Button } from '@components/common';
import { api, SessionSummary } from '../services/api';
import styles from './VisitSummaryPage.module.css';

function formatDate(dateString?: string): string {
  if (!dateString) return new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
  
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
}

export function VisitSummaryPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<SessionSummary | null>(
    (location.state as any)?.summary || null
  );

  useEffect(() => {
    // If we have summary from navigation state, use it
    if (summary) {
      setIsLoading(false);
      return;
    }

    // Otherwise, fetch session data
    const fetchSession = async () => {
      if (!id) {
        setError('No session ID provided');
        setIsLoading(false);
        return;
      }

      try {
        const response = await api.getSession(id);
        if (response.summary) {
          setSummary(response.summary);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load session');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSession();
  }, [id, summary]);

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <p>Loading summary...</p>
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <span className={styles.errorIcon}>⚠️</span>
          <h2>Unable to Load Summary</h2>
          <p>{error || 'No summary data available'}</p>
          <Button onClick={() => navigate('/dashboard')}>Return to Dashboard</Button>
        </div>
      </div>
    );
  }

  const hasRedFlags = summary.redFlags && summary.redFlags.length > 0;
  const hasRecommendations = summary.recommendations && summary.recommendations.length > 0;
  const hasScreenings = summary.screenings && summary.screenings.length > 0;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link to="/dashboard" className={styles.backButton}>← Home</Link>
        <span className={styles.badge}>Session Complete ✓</span>
      </header>

      <main className={styles.main}>
        <h1 className={styles.title}>Your Visit Summary</h1>
        <p className={styles.date}>{formatDate()}</p>

        {/* Red Flags - Warning Section */}
        {hasRedFlags && (
          <Card variant="outline" padding="md" className={`${styles.section} ${styles.warningCard}`}>
            <CardContent>
              <h2 className={styles.sectionTitle}>🚨 Items Requiring Attention</h2>
              <p className={styles.warningText}>
                Please discuss these with a healthcare provider:
              </p>
              <ul className={styles.flagList}>
                {summary.redFlags.map((flag, i) => (
                  <li key={i} className={styles.flagItem}>{flag}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Recommendations */}
        {hasRecommendations && (
          <Card variant="default" padding="md" className={styles.section}>
            <CardContent>
              <h2 className={styles.sectionTitle}>💡 Recommendations</h2>
              <ul className={styles.recommendationList}>
                {summary.recommendations.map((rec, i) => (
                  <li key={i} className={styles.recommendationItem}>
                    <span className={styles.checkIcon}>→</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Recommended Screenings */}
        {hasScreenings && (
          <Card variant="default" padding="md" className={styles.section}>
            <CardContent>
              <h2 className={styles.sectionTitle}>📋 Recommended Screenings</h2>
              <p className={styles.sectionSubtitle}>Based on your responses, consider:</p>
              <ul className={styles.screeningList}>
                {summary.screenings.map((screening, i) => (
                  <li key={i} className={styles.screeningItem}>
                    <span className={styles.checkIcon}>☐</span>
                    {screening}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* AI Summary Notes */}
        {summary.notes && (
          <Card variant="default" padding="md" className={styles.section}>
            <CardContent>
              <h2 className={styles.sectionTitle}>🤖 AI Summary</h2>
              <div className={styles.aiSummary}>
                {summary.notes.split('\n').map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Content State */}
        {!hasRedFlags && !hasRecommendations && !hasScreenings && !summary.notes && (
          <Card variant="default" padding="lg" className={styles.section}>
            <CardContent>
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>✨</span>
                <h3>All Clear!</h3>
                <p>No specific concerns were identified during this checkup.</p>
                <p>Continue maintaining your healthy habits!</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Disclaimer */}
        <Card variant="outline" padding="sm" className={styles.disclaimer}>
          <CardContent>
            <p>
              <strong>Important:</strong> This summary is for educational purposes only and is 
              not a medical diagnosis. Always consult with a qualified healthcare provider 
              for medical advice.
            </p>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className={styles.actions}>
          <Button variant="outline" size="md" disabled>
            📥 Download PDF (Coming Soon)
          </Button>
          <Button variant="outline" size="md" disabled>
            📤 Share Summary (Coming Soon)
          </Button>
        </div>

        <Button fullWidth size="lg" onClick={() => navigate('/dashboard')}>
          Return to Dashboard
        </Button>
      </main>
    </div>
  );
}
