import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Footer } from '@components/layout';
import { useUser } from '../store/UserContext';
import styles from './SplashPage.module.css';

export function SplashPage() {
  const navigate = useNavigate();
  const { user, isLoading } = useUser();

  useEffect(() => {
    // Wait for user context to finish loading
    if (isLoading) return;

    // Small delay for splash screen effect
    const timer = setTimeout(() => {
      if (user) {
        // User is authenticated, go to dashboard
        navigate('/dashboard');
      } else {
        // User is not authenticated, go to login
        navigate('/login');
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [navigate, user, isLoading]);

  return (
    <>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.logo}>🏥</div>
          <h1 className={styles.title}>MyDoctor</h1>
          <p className={styles.subtitle}>Your AI Health Companion</p>
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
