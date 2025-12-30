import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, Button } from '@components/common';
import { useTranslate } from '../i18n';
import { api } from '../services/api';
import styles from './CheckupConsentPage.module.css';

// Storage key for user ID
const USER_ID_KEY = 'mydoctor_user_id';

export function CheckupConsentPage() {
  const navigate = useNavigate();
  const t = useTranslate();
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
      setError(t('consent_error_user_init'));
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
      setError(err instanceof Error ? err.message : t('consent_error_start_session'));
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link to="/checkup/start" className={styles.backButton}>{t('common_back')}</Link>
        <span className={styles.step}>{t('consent_step')}</span>
      </header>

      <main className={styles.main}>
        <h1 className={styles.title}>{t('consent_title')}</h1>
        <p className={styles.subtitle}>{t('consent_subtitle')}</p>

        <div className={styles.cards}>
          <Card variant="outline" padding="md">
            <CardContent>
              <div className={styles.cardHeader}>
                <span className={styles.cardIcon}>🔒</span>
                <h3 className={styles.cardTitle}>{t('consent_privacy_title')}</h3>
              </div>
              <p className={styles.cardText}>
                {t('consent_privacy_text')}
              </p>
              <Button variant="ghost" size="sm">{t('consent_read_policy')}</Button>
            </CardContent>
          </Card>

          <Card variant="outline" padding="md" className={styles.warningCard}>
            <CardContent>
              <div className={styles.cardHeader}>
                <span className={styles.cardIcon}>⚠️</span>
                <h3 className={styles.cardTitle}>{t('consent_disclaimer_title')}</h3>
              </div>
              <p className={styles.cardText}>
                {t('consent_disclaimer_text')}
              </p>
              <p className={styles.emergencyText}>
                <strong>{t('consent_emergency')}</strong>
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
              {t('consent_checkbox1')}
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
              {t('consent_checkbox2')}
            </span>
          </label>
        </div>

        {error && (
          <div className={styles.error}>
            <p>{error}</p>
            <button onClick={() => setError(null)}>{t('consent_dismiss')}</button>
          </div>
        )}

        <Button
          fullWidth
          size="lg"
          onClick={handleContinue}
          disabled={!consent1 || !consent2 || isLoading}
          isLoading={isLoading}
        >
          {isLoading ? t('consent_starting') : t('consent_continue')}
        </Button>
      </main>
    </div>
  );
}

