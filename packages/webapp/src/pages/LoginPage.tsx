import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button, Logo } from '@components/common';
import { LanguageSelector } from '@components/settings';
import { Footer } from '@components/layout';
import { useAuth } from '../auth';
import { useTranslate } from '../i18n';
import { DEFAULT_LANGUAGE, type LanguageCode } from '../config/languages';
import styles from './LoginPage.module.css';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [language, setLanguage] = useState<LanguageCode>(DEFAULT_LANGUAGE);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Pass selected language to translation hook so UI updates immediately
  const t = useTranslate(language);

  // Redirect if already authenticated
  if (isAuthenticated) {
    const from = (location.state as any)?.from?.pathname || '/dashboard';
    navigate(from, { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      await login(email, password, rememberMe);
      
      // Navigate to original destination or dashboard
      const from = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('login_error_unknown');
      setError(errorMessage);
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className={styles.container}>
        <Link to="/" className={styles.backButton}>{t('common_back')}</Link>
        
        <div className={styles.content}>
          <Logo size="lg" variant="icon" className={styles.logo} />
          <h1 className={styles.title}>{t('login_title')}</h1>
          <p className={styles.subtitle}>{t('login_subtitle')}</p>
          
          {error && <p className={styles.error}>{error}</p>}
          
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.inputGroup}>
              <label htmlFor="email" className={styles.label}>{t('login_email_label')}</label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}>📧</span>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('login_email_placeholder')}
                  className={styles.input}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="password" className={styles.label}>{t('login_password_label')}</label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}>🔒</span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('login_password_placeholder')}
                  className={styles.input}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className={styles.togglePassword}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? t('login_hide_password') : t('login_show_password')}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <div className={styles.optionsRow}>
              <label className={styles.rememberMe}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>{t('login_remember_me')}</span>
              </label>
              <Link to="/forgot-password" className={styles.forgotPassword}>
                {t('login_forgot_password')}
              </Link>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="language" className={styles.label}>{t('login_language_label')}</label>
              <LanguageSelector value={language} onChange={setLanguage} />
            </div>
            
            <Button 
              type="submit" 
              fullWidth 
              size="lg"
              isLoading={isLoading}
            >
              {t('login_sign_in')}
            </Button>
          </form>
          
          <div className={styles.divider}>
            <span>{t('login_or')}</span>
          </div>
          
          <Link to="/register" className={styles.registerLink}>
            <Button variant="outline" fullWidth size="lg">
              {t('login_create_account')}
            </Button>
          </Link>
        </div>
      </div>
      <Footer />
    </>
  );
}
