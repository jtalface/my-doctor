import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@components/common';
import { LanguageSelector } from '@components/settings';
import { Footer } from '@components/layout';
import { useUser } from '../store/UserContext';
import { useTranslate } from '../i18n';
import { DEFAULT_LANGUAGE, type LanguageCode } from '../config/languages';
import styles from './LoginPage.module.css';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useUser();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [language, setLanguage] = useState<LanguageCode>(DEFAULT_LANGUAGE);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Pass selected language to translation hook so UI updates immediately
  const t = useTranslate(language);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const { isNew } = await login(email, name, language);
      
      if (isNew) {
        navigate('/profile/setup');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`${t('login_error_prefix')}${errorMessage}`);
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
          <div className={styles.logo}>🏥</div>
          <h1 className={styles.title}>{t('login_title')}</h1>
          <p className={styles.subtitle}>{t('login_subtitle')}</p>
          
          {error && <p className={styles.error}>{error}</p>}
          
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.inputGroup}>
              <label htmlFor="name" className={styles.label}>{t('login_name_label')}</label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}>👤</span>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('login_name_placeholder')}
                  className={styles.input}
                  required
                />
              </div>
            </div>
            
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
                  required
                />
              </div>
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
              {t('common_continue')}
            </Button>
          </form>
          
          <p className={styles.hint}>
            {t('login_hint')}
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
}
