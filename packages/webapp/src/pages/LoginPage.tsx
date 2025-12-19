import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@components/common';
import { Footer } from '@components/layout';
import { useUser } from '../store/UserContext';
import styles from './LoginPage.module.css';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useUser();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const { isNew } = await login(email, name);
      
      if (isNew) {
        navigate('/profile/setup');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to sign in: ${errorMessage}`);
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className={styles.container}>
        <Link to="/" className={styles.backButton}>← Back</Link>
        
        <div className={styles.content}>
          <div className={styles.logo}>🏥</div>
          <h1 className={styles.title}>Welcome to MyDoctor</h1>
          <p className={styles.subtitle}>Sign in or create your account</p>
          
          {error && <p className={styles.error}>{error}</p>}
          
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.inputGroup}>
              <label htmlFor="name" className={styles.label}>Your Name</label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}>👤</span>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className={styles.input}
                  required
                />
              </div>
            </div>
            
            <div className={styles.inputGroup}>
              <label htmlFor="email" className={styles.label}>Email address</label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}>📧</span>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className={styles.input}
                  required
                />
              </div>
            </div>
            
            <Button 
              type="submit" 
              fullWidth 
              size="lg"
              isLoading={isLoading}
            >
              Continue
            </Button>
          </form>
          
          <p className={styles.hint}>
            New users will be guided through profile setup
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
}
