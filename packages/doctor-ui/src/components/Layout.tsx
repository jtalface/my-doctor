/**
 * Layout Component
 * 
 * Main application layout with sidebar and header.
 */

import { Outlet, NavLink, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth';
import { Logo } from './Logo';
import { useTranslate, type TranslationKey } from '../i18n';
import styles from './Layout.module.css';

const NAV_ITEMS: {
  path: string;
  labelKey: TranslationKey;
  shortKey?: TranslationKey;
  icon: string;
}[] = [
  { path: '/', labelKey: 'nav_dashboard', shortKey: 'nav_short_home', icon: '📊' },
  { path: '/conversations', labelKey: 'nav_messages', shortKey: 'nav_short_msgs', icon: '💬' },
  { path: '/patients', labelKey: 'nav_patients', icon: '👥' },
  { path: '/profile', labelKey: 'nav_profile', icon: '⚙️' },
];

export default function Layout() {
  const { doctor, logout } = useAuth();
  const location = useLocation();
  const t = useTranslate();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <Link to="/" className={styles.logo} aria-label="Zambe home">
          <Logo variant="mark" size="md" />
        </Link>

        <nav className={styles.nav}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive || (item.path !== '/' && location.pathname.startsWith(item.path)) ? styles.navItemActive : ''}`
              }
              end={item.path === '/'}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span className={styles.navLabel}>{t(item.labelKey)}</span>
              <span className={styles.navLabelMobile}>
                {t(item.shortKey ?? item.labelKey)}
              </span>
            </NavLink>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.doctorInfo}>
            <div className={styles.avatar}>
              {doctor?.avatarUrl ? (
                <img src={doctor.avatarUrl} alt={doctor.name} />
              ) : (
                <span>{doctor?.name?.charAt(0) || 'D'}</span>
              )}
            </div>
            <div className={styles.doctorDetails}>
              <p className={styles.doctorName}>{doctor?.name}</p>
              <p className={styles.doctorSpecialty}>{doctor?.specialty}</p>
            </div>
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            {t('layout_logout')}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}

