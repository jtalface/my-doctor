import { Link, useLocation } from 'react-router-dom';
import { useTranslate } from '../../i18n';
import styles from './BottomNav.module.css';

export function BottomNav() {
  const location = useLocation();
  const t = useTranslate();
  
  const baseNavItems = [
    { path: '/dashboard', icon: '🏠', labelKey: 'nav_home' },
    { path: '/checkup/start', icon: '🩺', labelKey: 'nav_virtual_doctor' },
    { path: '/messages', icon: '💬', labelKey: 'nav_messages' },
    { path: '/profile', icon: '👤', labelKey: 'nav_profile' },
  ];
  
  return (
    <nav className={styles.bottomNav} aria-label="Main navigation">
      {baseNavItems.map(({ path, icon, labelKey }) => {
        const isActive = location.pathname === path || 
          (path === '/checkup/start' && location.pathname.startsWith('/checkup'));
        
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

