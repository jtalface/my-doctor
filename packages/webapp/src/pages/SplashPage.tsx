import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Footer } from '@components/layout';
import { useAuth } from '../auth';
import { useTranslate } from '../i18n';
import styles from './SplashPage.module.css';

export function SplashPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();
  const t = useTranslate();

  useEffect(() => {
    // Wait for auth context to finish loading
    if (isLoading) return;

    // Small delay for splash screen effect
    const timer = setTimeout(() => {
      if (isAuthenticated) {
        // User is authenticated, go to dashboard
        navigate('/dashboard');
      } else {
        // User is not authenticated, go to login
        navigate('/login');
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [navigate, isAuthenticated, isLoading]);

  return (
    <>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.logo}>🏥</div>
          <h1 className={styles.title}>{t('splash_title')}</h1>
          <p className={styles.subtitle}>{t('splash_subtitle')}</p>
          <div className={styles.loader}>
            <div className={styles.dot} />
            <div className={styles.dot} />
            <div className={styles.dot} />
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
