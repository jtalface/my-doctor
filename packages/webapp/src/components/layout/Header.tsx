import { Link, useLocation } from 'react-router-dom';
import { Logo } from '@components/common';
import styles from './Header.module.css';

export function Header() {
  const location = useLocation();
  
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link to="/dashboard" className={styles.logo}>
          <Logo size="sm" variant="mark" />
        </Link>
        
        <nav className={styles.nav} aria-label="Main navigation">
          <Link 
            to="/dashboard" 
            className={`${styles.navLink} ${location.pathname === '/dashboard' ? styles.active : ''}`}
          >
            Home
          </Link>
          <Link 
            to="/history" 
            className={`${styles.navLink} ${location.pathname.startsWith('/history') ? styles.active : ''}`}
          >
            History
          </Link>
        </nav>
        
        <div className={styles.actions}>
          <Link to="/profile" className={styles.profileButton} aria-label="Profile">
            <span className={styles.profileIcon}>👤</span>
          </Link>
          <Link to="/settings" className={styles.settingsButton} aria-label="Settings">
            <span className={styles.settingsIcon}>⚙️</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

