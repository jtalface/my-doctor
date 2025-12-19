import { Link, useLocation } from 'react-router-dom';
import styles from './BottomNav.module.css';

const navItems = [
  { path: '/dashboard', icon: '🏠', label: 'Home' },
  { path: '/history', icon: '📋', label: 'History' },
  { path: '/profile', icon: '👤', label: 'Profile' },
  { path: '/settings', icon: '⚙️', label: 'Settings' },
];

export function BottomNav() {
  const location = useLocation();
  
  return (
    <nav className={styles.bottomNav} aria-label="Main navigation">
      {navItems.map(({ path, icon, label }) => {
        const isActive = location.pathname === path || 
          (path === '/history' && location.pathname.startsWith('/history'));
        
        return (
          <Link
            key={path}
            to={path}
            className={`${styles.navItem} ${isActive ? styles.active : ''}`}
            aria-current={isActive ? 'page' : undefined}
          >
            <span className={styles.icon} aria-hidden="true">{icon}</span>
            <span className={styles.label}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

