import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Logo } from '@components/common';
import { LanguageSelector } from '@components/settings';
import { Footer } from '@components/layout';
import { useAuth, getPasswordRequirements, checkEmail } from '../auth';
import { useTranslate } from '../i18n';
import { DEFAULT_LANGUAGE, type LanguageCode } from '../config/languages';
import styles from './RegisterPage.module.css';

export function RegisterPage() {
  const navigate = useNavigate();
  const { register, isAuthenticated } = useAuth();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [language, setLanguage] = useState<LanguageCode>(DEFAULT_LANGUAGE);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordRequirements, setPasswordRequirements] = useState<string[]>([]);
  const [emailExists, setEmailExists] = useState(false);
  const [emailChecking, setEmailChecking] = useState(false);
  
  // Pass selected language to translation hook so UI updates immediately
  const t = useTranslate(language);

  // Load password requirements on mount
  useEffect(() => {
    getPasswordRequirements().then(setPasswordRequirements).catch(console.error);
  }, []);

  // Check if email exists when user stops typing
  useEffect(() => {
    if (!email || !email.includes('@')) {
      setEmailExists(false);
      return;
    }

    const timer = setTimeout(async () => {
      setEmailChecking(true);
      try {
        const exists = await checkEmail(email);
        setEmailExists(exists);
      } catch (err) {
        console.error('Email check failed:', err);
      } finally {
        setEmailChecking(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [email]);

  // Redirect if already authenticated
  if (isAuthenticated) {
    navigate('/dashboard', { replace: true });
    return null;
  }

  const validateForm = (): boolean => {
    if (!name.trim()) {
      setError(t('register_error_name_required'));
      return false;
    }
    if (!email.includes('@')) {
      setError(t('register_error_invalid_email'));
      return false;
    }
    if (emailExists) {
      setError(t('register_error_email_exists'));
      return false;
    }
    if (password.length < 8) {
      setError(t('register_error_password_short'));
      return false;
    }
    if (password !== confirmPassword) {
      setError(t('register_error_passwords_mismatch'));
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      await register(email, password, name, language);
      
      // Navigate to profile setup for new users
      navigate('/profile/setup', { replace: true });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('register_error_unknown');
      setError(errorMessage);
      console.error('Registration error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className={styles.container}>
        <Link to="/login" className={styles.backButton}>{t('common_back')}</Link>
        
        <div className={styles.content}>
          <Logo size="lg" variant="icon" className={styles.logo} />
          <h1 className={styles.title}>{t('register_title')}</h1>
          <p className={styles.subtitle}>{t('register_subtitle')}</p>
          
          {error && <p className={styles.error}>{error}</p>}
          
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.inputGroup}>
              <label htmlFor="name" className={styles.label}>{t('register_name_label')}</label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}>👤</span>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('register_name_placeholder')}
                  className={styles.input}
                  autoComplete="name"
                  required
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="email" className={styles.label}>{t('register_email_label')}</label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}>📧</span>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('register_email_placeholder')}
                  className={`${styles.input} ${emailExists ? styles.inputError : ''}`}
                  autoComplete="email"
                  required
                />
                {emailChecking && <span className={styles.checking}>⏳</span>}
                {!emailChecking && email && emailExists && (
                  <span className={styles.errorIcon}>❌</span>
                )}
                {!emailChecking && email && !emailExists && email.includes('@') && (
                  <span className={styles.successIcon}>✓</span>
                )}
              </div>
              {emailExists && (
                <p className={styles.fieldError}>
                  {t('register_email_exists')}{' '}
                  <Link to="/login">{t('register_sign_in_instead')}</Link>
                </p>
              )}
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="password" className={styles.label}>{t('register_password_label')}</label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}>🔒</span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('register_password_placeholder')}
                  className={styles.input}
                  autoComplete="new-password"
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
              {passwordRequirements.length > 0 && (
                <ul className={styles.requirements}>
                  {passwordRequirements.map((req, i) => (
                    <li key={i} className={styles.requirement}>
                      {req}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="confirmPassword" className={styles.label}>
                {t('register_confirm_password_label')}
              </label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}>🔒</span>
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('register_confirm_password_placeholder')}
                  className={`${styles.input} ${confirmPassword && password !== confirmPassword ? styles.inputError : ''}`}
                  autoComplete="new-password"
                  required
                />
                {confirmPassword && (
                  password === confirmPassword ? (
                    <span className={styles.successIcon}>✓</span>
                  ) : (
                    <span className={styles.errorIcon}>❌</span>
                  )
                )}
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="language" className={styles.label}>{t('register_language_label')}</label>
              <LanguageSelector value={language} onChange={setLanguage} />
            </div>
            
            <Button 
              type="submit" 
              fullWidth 
              size="lg"
              isLoading={isLoading}
              disabled={emailExists}
            >
              {t('register_create_account')}
            </Button>
          </form>
          
          <p className={styles.terms}>
            {t('register_terms_prefix')}{' '}
            <Link to="/terms">{t('register_terms_of_service')}</Link>{' '}
            {t('register_terms_and')}{' '}
            <Link to="/privacy">{t('register_privacy_policy')}</Link>
          </p>
          
          <div className={styles.divider}>
            <span>{t('register_or')}</span>
          </div>
          
          <p className={styles.loginLink}>
            {t('register_already_have_account')}{' '}
            <Link to="/login">{t('register_sign_in')}</Link>
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
}

