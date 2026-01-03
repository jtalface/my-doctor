import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, Button } from '@components/common';
import { useTranslate } from '../i18n';
import { useActiveProfile } from '../contexts';
import { api } from '../services/api';
import styles from './CheckupConsentPage.module.css';

export function CheckupConsentPage() {
  const navigate = useNavigate();
  const t = useTranslate();
  const { activeProfile } = useActiveProfile();
  const [consent1, setConsent1] = useState(false);
  const [consent2, setConsent2] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleContinue = async () => {
    if (!activeProfile?.id) {
      setError(t('consent_error_user_init'));
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // Start a new session for the active profile (self or dependent)
      const result = await api.startSession(activeProfile.id);
      
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
