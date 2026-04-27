/**
 * Login Page
 * 
 * Doctor authentication page with beautiful design.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BrandingFooter } from '../components/BrandingFooter';
import { Logo } from '../components/Logo';
import { useAuth } from '../auth';
import styles from './LoginPage.module.css';

export default function LoginPage() {
  const { login } = useAuth();
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
    <div className={styles.page}>
      {/* Background Pattern */}
      <div className={styles.background}>
        <div className={styles.pattern}></div>
      </div>

      {/* Login Card */}
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <Logo variant="icon" size="lg" />
            <h1 className={styles.logoTitle}>Zambe</h1>
          </div>
          <p className={styles.subtitle}>Healthcare Provider Portal</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="doctor@example.com"
              required
              autoComplete="email"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className={styles.footer}>
          <p className={styles.registerPrompt}>
            Don't have an account?{' '}
            <Link to="/register" className={styles.link}>Create one</Link>
          </p>
          <p className={styles.hint}>
            Test credentials:<br />
            <strong>doctor@mydoctor.com</strong> / <strong>Doctor123!</strong>
          </p>
        </div>
      </div>
    </div>
    <BrandingFooter />
    </>
  );
}

