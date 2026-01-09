import { Link, useLocation } from 'react-router-dom';
import { useCycleEligibility } from '../../hooks/useCycleEligibility';
import styles from './BottomNav.module.css';

const baseNavItems = [
  { path: '/dashboard', icon: '🏠', label: 'Home' },
  { path: '/history', icon: '📋', label: 'History' },
  { path: '/messages', icon: '💬', label: 'Messages' },
  { path: '/profile', icon: '👤', label: 'Profile' },
  { path: '/settings', icon: '⚙️', label: 'Settings' },
];

export function BottomNav() {
  const location = useLocation();
  const { isEligible } = useCycleEligibility();
  
  // Add cycle tracker for eligible users
  const navItems = isEligible
    ? [
        baseNavItems[0], // Home
        baseNavItems[1], // History
        { path: '/cycle', icon: '🌸', label: 'Cycle' }, // Add Cycle
        baseNavItems[2], // Messages
        baseNavItems[3], // Profile
      ]
    : baseNavItems;
  
  return (
    <nav className={styles.bottomNav} aria-label="Main navigation">
      {navItems.map(({ path, icon, label }) => {
        const isActive = location.pathname === path || 
          (path === '/history' && location.pathname.startsWith('/history')) ||
          (path === '/cycle' && location.pathname.startsWith('/cycle'));
        
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

