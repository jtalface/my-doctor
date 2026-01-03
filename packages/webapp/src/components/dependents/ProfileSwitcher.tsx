/**
 * ProfileSwitcher
 * 
 * Dropdown component for switching between the account holder's profile
 * and their dependents' profiles.
 */

import { useState, useRef, useEffect } from 'react';
import { useActiveProfile } from '../../contexts';
import { useAuth } from '../../auth';
import { useTranslate } from '../../i18n';
import styles from './ProfileSwitcher.module.css';

interface ProfileSwitcherProps {
  onAddDependent?: () => void;
}

export function ProfileSwitcher({ onAddDependent }: ProfileSwitcherProps) {
  const { user } = useAuth();
  const { 
    activeProfile, 
    dependents, 
    isLoadingDependents,
    switchToSelf, 
    switchToDependent,
  } = useActiveProfile();
  const t = useTranslate();
  
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  if (!user || !activeProfile) return null;

  const handleProfileSelect = async (profileId: string) => {
    if (profileId === user.id) {
      switchToSelf();
    } else {
      await switchToDependent(profileId);
    }
    setIsOpen(false);
  };

  const getRelationshipLabel = (relationship: string): string => {
    const key = `dependents_relationship_${relationship}` as const;
    return t(key as any) || relationship;
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={styles.container} ref={dropdownRef}>
      <button 
        className={styles.trigger}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <div className={styles.avatar}>
          {getInitials(activeProfile.name)}
        </div>
        <span className={styles.name}>{activeProfile.name}</span>
        <span className={styles.chevron}>{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className={styles.dropdown} role="listbox">
          <div className={styles.header}>
            {t('profile_switcher_title')}
          </div>
          
          {/* Self profile option */}
          <button
            className={`${styles.option} ${!activeProfile.isDependent ? styles.active : ''}`}
            onClick={() => handleProfileSelect(user.id)}
            role="option"
            aria-selected={!activeProfile.isDependent}
          >
            <div className={styles.optionAvatar}>
              {getInitials(user.name)}
            </div>
            <div className={styles.optionInfo}>
              <span className={styles.optionName}>{user.name}</span>
              <span className={styles.optionLabel}>{t('profile_switcher_self')}</span>
            </div>
            {!activeProfile.isDependent && (
              <span className={styles.checkmark}>✓</span>
            )}
          </button>

          {/* Dependents section */}
          {isLoadingDependents ? (
            <div className={styles.loading}>
              {t('dependents_loading')}
            </div>
          ) : dependents.length > 0 ? (
            <>
              <div className={styles.divider} />
              {dependents.map(dependent => (
                <button
                  key={dependent.id}
                  className={`${styles.option} ${activeProfile.id === dependent.id ? styles.active : ''}`}
                  onClick={() => handleProfileSelect(dependent.id)}
                  role="option"
                  aria-selected={activeProfile.id === dependent.id}
                >
                  <div className={styles.optionAvatar}>
                    {getInitials(dependent.name)}
                  </div>
                  <div className={styles.optionInfo}>
                    <span className={styles.optionName}>{dependent.name}</span>
                    <span className={styles.optionLabel}>
                      {getRelationshipLabel(dependent.relationship)} • {t('dependents_age_years', { age: dependent.age })}
                    </span>
                  </div>
                  {activeProfile.id === dependent.id && (
                    <span className={styles.checkmark}>✓</span>
                  )}
                </button>
              ))}
            </>
          ) : null}

          {/* Add dependent button */}
          {onAddDependent && (
            <>
              <div className={styles.divider} />
              <button 
                className={styles.addButton}
                onClick={() => {
                  setIsOpen(false);
                  onAddDependent();
                }}
              >
                <span className={styles.addIcon}>+</span>
                {t('profile_switcher_add_family_member')}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

