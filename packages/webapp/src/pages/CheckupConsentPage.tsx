import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, Button } from '@components/common';
import { api } from '../services/api';
import styles from './CheckupConsentPage.module.css';

// Storage key for user ID
const USER_ID_KEY = 'mydoctor_user_id';

export function CheckupConsentPage() {
  const navigate = useNavigate();
  const [consent1, setConsent1] = useState(false);
  const [consent2, setConsent2] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Get or create user on mount
  useEffect(() => {
    const initUser = async () => {
      // Check for existing user ID in localStorage
      let storedUserId = localStorage.getItem(USER_ID_KEY);
      
      if (!storedUserId) {
        try {
          // Create a guest user
          const user = await api.createUser({ isGuest: true });
          storedUserId = user.id;
          localStorage.setItem(USER_ID_KEY, storedUserId);
        } catch (err) {
          console.error('Failed to create user:', err);
          // Use a temporary ID if API fails
          storedUserId = `temp_${Date.now()}`;
        }
      }
      
      setUserId(storedUserId);
    };
    
    initUser();
  }, []);

  const handleContinue = async () => {
    if (!userId) {
      setError('User not initialized. Please refresh the page.');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // Start a new session via the API
      const result = await api.startSession(userId);
      
      // Navigate to the session with the real session ID
      navigate(`/checkup/session/${result.sessionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start session');
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link to="/checkup/start" className={styles.backButton}>← Back</Link>
        <span className={styles.step}>Step 1 of 2</span>
      </header>

      <main className={styles.main}>
        <h1 className={styles.title}>Before We Begin</h1>
        <p className={styles.subtitle}>Please review and acknowledge the following:</p>

        <div className={styles.cards}>
          <Card variant="outline" padding="md">
            <CardContent>
              <div className={styles.cardHeader}>
                <span className={styles.cardIcon}>🔒</span>
                <h3 className={styles.cardTitle}>Privacy & Data Use</h3>
              </div>
              <p className={styles.cardText}>
                Your responses are stored securely and used only to provide personalized 
                health education. We never share your data with third parties without consent.
              </p>
              <Button variant="ghost" size="sm">Read Full Privacy Policy</Button>
            </CardContent>
          </Card>

          <Card variant="outline" padding="md" className={styles.warningCard}>
            <CardContent>
              <div className={styles.cardHeader}>
                <span className={styles.cardIcon}>⚠️</span>
                <h3 className={styles.cardTitle}>Important Disclaimer</h3>
              </div>
              <p className={styles.cardText}>
                MyDoctor provides health education only. This is <strong>NOT</strong> a substitute 
                for professional medical advice, diagnosis, or treatment. Always consult a 
                qualified healthcare provider for medical concerns.
              </p>
              <p className={styles.emergencyText}>
                <strong>In case of emergency, call 911 immediately.</strong>
              </p>
            </CardContent>
          </Card>
        </div>

        <div className={styles.checkboxes}>
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={consent1}
              onChange={(e) => setConsent1(e.target.checked)}
            />
            <span className={styles.checkmark}>
              {consent1 ? '☑️' : '☐'}
            </span>
            <span className={styles.checkboxLabel}>
              I understand this is for educational purposes only and not medical advice.
            </span>
          </label>

          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={consent2}
              onChange={(e) => setConsent2(e.target.checked)}
            />
            <span className={styles.checkmark}>
              {consent2 ? '☑️' : '☐'}
            </span>
            <span className={styles.checkboxLabel}>
              I consent to the storage of my health information as described in the Privacy Policy.
            </span>
          </label>
        </div>

        {error && (
          <div className={styles.error}>
            <p>{error}</p>
            <button onClick={() => setError(null)}>Dismiss</button>
          </div>
        )}

        <Button
          fullWidth
          size="lg"
          onClick={handleContinue}
          disabled={!consent1 || !consent2 || isLoading}
          isLoading={isLoading}
        >
          {isLoading ? 'Starting...' : 'I Understand, Continue'}
        </Button>
      </main>
    </div>
  );
}

