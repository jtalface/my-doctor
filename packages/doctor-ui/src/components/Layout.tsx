/**
 * Layout Component
 * 
 * Main application layout with sidebar and header.
 */

import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../auth';
import styles from './Layout.module.css';

export default function Layout() {
  const { doctor, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/conversations', label: 'Messages', icon: '💬' },
    { path: '/patients', label: 'Patients', icon: '👥' },
    { path: '/profile', label: 'Profile', icon: '⚙️' },
  ];

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>🏥</span>
          <span className={styles.logoText}>MyDoctor</span>
        </div>

        <nav className={styles.nav}>
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive || (item.path !== '/' && location.pathname.startsWith(item.path)) ? styles.navItemActive : ''}`
              }
              end={item.path === '/'}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span className={styles.navLabel}>{item.label}</span>
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
            Logout
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

