import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, Button } from '@components/common';
import { LLMSelector, LanguageSelector, ChangePasswordModal } from '@components/settings';
import { DependentsManager } from '@components/dependents';
import { useAuth } from '../auth';
import { useTranslate } from '../i18n';
import { type LanguageCode } from '../config/languages';
import styles from './SettingsPage.module.css';

// App version - could be pulled from package.json in a real app
const APP_VERSION = '1.0.0';

export function SettingsPage() {
  const navigate = useNavigate();
  const { user, logout, updateUserPreferences } = useAuth();
  const t = useTranslate();
  
  // Local state for settings that can be updated
  const [isUpdating, setIsUpdating] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  // Get current values from user preferences
  const notifications = user?.preferences?.notifications ?? true;
  const currentLanguage = (user?.preferences?.language as LanguageCode) || 'en';

  const handleNotificationsToggle = async () => {
    if (!user || isUpdating) return;
    
    setIsUpdating(true);
    try {
      await updateUserPreferences({ notifications: !notifications });
    } catch (error) {
      console.error('Failed to update notifications:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLanguageChange = async (newLanguage: LanguageCode) => {
    if (!user || isUpdating) return;
    
    setIsUpdating(true);
    try {
      await updateUserPreferences({ language: newLanguage });
    } catch (error) {
      console.error('Failed to update language:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Link to="/dashboard" className={styles.backButton}>←</Link>
          <h1 className={styles.title}>{t('settings_title')}</h1>
        </div>
        <div className={styles.headerRight} />
      </header>

      <main className={styles.main}>
        {/* AI Model Section */}
        <section className={styles.section}>
          <Card variant="default" padding="none">
            <CardContent>
              <LLMSelector />
            </CardContent>
          </Card>
        </section>

        {/* Family Members Section */}
        <section className={styles.section}>
          <DependentsManager />
        </section>

        {/* Account Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('settings_account')}</h2>
          <Card variant="default" padding="none">
            <CardContent>
              {/* Email - from user data */}
              <SettingsRow 
                label={t('settings_email')} 
                value={user?.email || t('common_not_set')} 
              />
              {/* Change Password */}
              <SettingsRow 
                label={t('settings_change_password')} 
                hasArrow 
                onClick={() => setShowChangePassword(true)}
              />
              {/* Two-Factor - not yet implemented */}
              <SettingsRow 
                label={t('settings_two_factor')} 
                value={t('settings_disabled')} 
                hasArrow 
                disabled
                hint={t('settings_coming_soon')}
              />
            </CardContent>
          </Card>
        </section>

        {/* Preferences Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('settings_preferences')}</h2>
          <Card variant="default" padding="none">
            <CardContent>
              {/* Language - from user preferences */}
              <div className={styles.settingsRow}>
                <span className={styles.rowLabel}>{t('settings_language')}</span>
                <div className={styles.rowRight}>
                  <LanguageSelector 
                    value={currentLanguage} 
                    onChange={handleLanguageChange}
                  />
                </div>
              </div>
              
              {/* Units - not yet implemented */}
              <SettingsRow 
                label={t('settings_units')} 
                value={t('settings_units_imperial')} 
                hasArrow 
                disabled
                hint={t('settings_coming_soon')}
              />
              
              {/* Notifications Toggle - from user preferences */}
              <div className={styles.settingsRow}>
                <span className={styles.rowLabel}>{t('settings_notifications')}</span>
                <button 
                  className={`${styles.toggle} ${notifications ? styles.toggleOn : ''} ${isUpdating ? styles.disabled : ''}`}
                  onClick={handleNotificationsToggle}
                  aria-pressed={notifications}
                  disabled={isUpdating}
                >
                  <span className={styles.toggleThumb} />
                </button>
              </div>
              
              {/* Email Reminders - not yet implemented */}
              <SettingsRow 
                label={t('settings_email_reminders')} 
                value={t('settings_weekly_digest')} 
                hasArrow 
                disabled
                hint={t('settings_coming_soon')}
              />
            </CardContent>
          </Card>
        </section>

        {/* Privacy & Data Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('settings_privacy_data')}</h2>
          <Card variant="default" padding="none">
            <CardContent>
              <SettingsRow label={t('settings_privacy_policy')} hasArrow disabled />
              <SettingsRow label={t('settings_terms')} hasArrow disabled />
              <SettingsRow 
                label={t('settings_download_data')} 
                hasArrow 
                disabled
                hint={t('settings_coming_soon')}
              />
              <SettingsRow 
                label={t('settings_delete_account')} 
                hasArrow 
                isDanger 
                disabled
                hint={t('settings_coming_soon')}
              />
            </CardContent>
          </Card>
        </section>

        {/* About Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('settings_about')}</h2>
          <Card variant="default" padding="none">
            <CardContent>
              <SettingsRow label={t('settings_app_version')} value={APP_VERSION} />
              <SettingsRow label={t('settings_help_support')} hasArrow disabled />
              <SettingsRow label={t('settings_send_feedback')} hasArrow disabled />
            </CardContent>
          </Card>
        </section>

        {/* Sign Out Button */}
        <Button 
          variant="outline" 
          fullWidth 
          size="lg" 
          className={styles.signOut}
          onClick={handleLogout}
        >
          {t('settings_sign_out')}
        </Button>
      </main>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
      />
    </div>
  );
}

interface SettingsRowProps {
  label: string;
  value?: string;
  hasArrow?: boolean;
  isDanger?: boolean;
  disabled?: boolean;
  hint?: string;
  onClick?: () => void;
}

function SettingsRow({ 
  label, 
  value, 
  hasArrow,
  isDanger,
  disabled,
  hint,
  onClick,
}: SettingsRowProps) {
  const rowClasses = [
    styles.settingsRow,
    isDanger ? styles.danger : '',
    disabled ? styles.disabled : '',
    onClick ? styles.clickable : '',
  ].filter(Boolean).join(' ');

  return (
    <div 
      className={rowClasses}
      onClick={disabled ? undefined : onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick && !disabled ? 0 : undefined}
    >
      <div className={styles.rowLeft}>
        <span className={styles.rowLabel}>{label}</span>
        {hint && <span className={styles.rowHint}>{hint}</span>}
      </div>
      <div className={styles.rowRight}>
        {value && <span className={styles.rowValue}>{value}</span>}
        {hasArrow && <span className={styles.arrow}>▶</span>}
      </div>
    </div>
  );
}
