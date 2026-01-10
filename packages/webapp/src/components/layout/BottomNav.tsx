import { Link, useLocation } from 'react-router-dom';
import { useCycleEligibility } from '../../hooks/useCycleEligibility';
import { useTranslate } from '../../i18n';
import styles from './BottomNav.module.css';

export function BottomNav() {
  const location = useLocation();
  const { isEligible } = useCycleEligibility();
  const t = useTranslate();
  
  const baseNavItems = [
    { path: '/dashboard', icon: '🏠', labelKey: 'nav_home' },
    { path: '/history', icon: '📋', labelKey: 'nav_history' },
    { path: '/messages', icon: '💬', labelKey: 'nav_messages' },
    { path: '/profile', icon: '👤', labelKey: 'nav_profile' },
    { path: '/settings', icon: '⚙️', labelKey: 'nav_settings' },
  ];
  
  // Add cycle tracker for eligible users
  const navItems = isEligible
    ? [
        baseNavItems[0], // Home
        baseNavItems[1], // History
        { path: '/cycle', icon: '🌸', labelKey: 'nav_cycle' }, // Add Cycle
        baseNavItems[2], // Messages
        baseNavItems[3], // Profile
      ]
    : baseNavItems;
  
  return (
    <nav className={styles.bottomNav} aria-label="Main navigation">
      {navItems.map(({ path, icon, labelKey }) => {
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
            <span className={styles.label}>{t(labelKey as any)}</span>
          </Link>
        );
      })}
    </nav>
  );
}

