/**
 * Login Page
 *
 * Doctor authentication page with beautiful design.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BrandingFooter } from '../components/BrandingFooter';
import { Logo } from '../components/Logo';
import { LanguageSelector } from '../components/LanguageSelector';
import { useAuth } from '../auth';
import { useLanguage, useTranslate } from '../i18n';
import styles from './LoginPage.module.css';

export default function LoginPage() {
  const { login } = useAuth();
  const { language, setLanguage } = useLanguage();
  const t = useTranslate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login({ email, password });
      try {
        await setLanguage(language);
      } catch (syncErr) {
        console.error('[Login] Failed to sync language preference', syncErr);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('login_error_generic'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className={styles.page}>
        <div className={styles.background}>
          <div className={styles.pattern}></div>
        </div>

        <div className={styles.card}>
          <div className={styles.header}>
            <div className={styles.logo}>
              <Logo variant="icon" size="lg" />
              <h1 className={styles.logoTitle}>Zambe</h1>
            </div>
            <p className={styles.subtitle}>{t('auth_portal_subtitle')}</p>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.field}>
              <label htmlFor="email">{t('login_email_label')}</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('login_email_placeholder')}
                required
                autoComplete="email"
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="password">{t('login_password_label')}</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('login_password_placeholder')}
                required
                autoComplete="current-password"
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="doctor-ui-lang">{t('common_language_label')}</label>
              <LanguageSelector
                id="doctor-ui-lang"
                value={language}
                onChange={(lang) => void setLanguage(lang)}
                aria-label={t('common_language_label')}
              />
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <button type="submit" className={styles.submitBtn} disabled={isLoading}>
              {isLoading ? t('login_signing_in') : t('login_sign_in')}
            </button>
          </form>

          <div className={styles.footer}>
            <p className={styles.registerPrompt}>
              {t('login_no_account')}{' '}
              <Link to="/register" className={styles.link}>
                {t('login_create_account')}
              </Link>
            </p>
            <p className={styles.hint}>
              {t('login_test_credentials')}
              <br />
              <strong>doctor@mydoctor.com</strong> / <strong>Doctor123!</strong>
            </p>
          </div>
        </div>
      </div>
      <BrandingFooter />
    </>
  );
}
