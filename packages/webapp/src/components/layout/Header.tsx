import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Logo } from '@components/common';
import { ProfileSwitcher, AddDependentModal } from '@components/dependents';
import { useActiveProfile } from '../../contexts';
import { useTranslate } from '../../i18n';
import styles from './Header.module.css';

export function Header() {
  const location = useLocation();
  const { isViewingDependent, activeProfile } = useActiveProfile();
  const t = useTranslate();
  const [showAddDependent, setShowAddDependent] = useState(false);
  
  return (
    <>
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
            <ProfileSwitcher onAddDependent={() => setShowAddDependent(true)} />
            <Link to="/settings" className={styles.settingsButton} aria-label="Settings">
              <span className={styles.settingsIcon}>⚙️</span>
            </Link>
          </div>
        </div>
        
        {/* Banner when viewing a dependent */}
        {isViewingDependent && activeProfile && (
          <div className={styles.dependentBanner}>
            <span>
              {t('active_profile_banner', { name: activeProfile.name })}
            </span>
          </div>
        )}
      </header>
      
      {/* Add Dependent Modal */}
      {showAddDependent && (
        <AddDependentModal
          onClose={() => setShowAddDependent(false)}
        />
      )}
    </>
  );
}

