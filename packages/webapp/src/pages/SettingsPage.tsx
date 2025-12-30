import { useState } from 'react';
import { Card, CardContent, Button } from '@components/common';
import { LLMSelector } from '@components/settings';
import { useTranslate } from '../i18n';
import styles from './SettingsPage.module.css';

export function SettingsPage() {
  const [notifications, setNotifications] = useState(true);
  const t = useTranslate();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t('settings_title')}</h1>
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

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('settings_account')}</h2>
          <Card variant="default" padding="none">
            <CardContent>
              <SettingsRow label={t('settings_email')} value="sarah@email.com" hasArrow />
              <SettingsRow label={t('settings_change_password')} hasArrow />
              <SettingsRow label={t('settings_two_factor')} value={t('settings_disabled')} hasArrow />
            </CardContent>
          </Card>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('settings_preferences')}</h2>
          <Card variant="default" padding="none">
            <CardContent>
              <SettingsRow label={t('settings_language')} value="English" hasArrow />
              <SettingsRow label={t('settings_units')} value={t('settings_units_imperial')} hasArrow />
              <div className={styles.settingsRow}>
                <span className={styles.rowLabel}>{t('settings_notifications')}</span>
                <button 
                  className={`${styles.toggle} ${notifications ? styles.toggleOn : ''}`}
                  onClick={() => setNotifications(!notifications)}
                  aria-pressed={notifications}
                >
                  <span className={styles.toggleThumb} />
                </button>
              </div>
              <SettingsRow label={t('settings_email_reminders')} value={t('settings_weekly_digest')} hasArrow />
            </CardContent>
          </Card>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('settings_privacy_data')}</h2>
          <Card variant="default" padding="none">
            <CardContent>
              <SettingsRow label={t('settings_privacy_policy')} hasArrow />
              <SettingsRow label={t('settings_terms')} hasArrow />
              <SettingsRow label={t('settings_download_data')} hasArrow />
              <SettingsRow label={t('settings_delete_account')} hasArrow isDanger />
            </CardContent>
          </Card>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('settings_about')}</h2>
          <Card variant="default" padding="none">
            <CardContent>
              <SettingsRow label={t('settings_app_version')} value="1.0.0" />
              <SettingsRow label={t('settings_help_support')} hasArrow />
              <SettingsRow label={t('settings_send_feedback')} hasArrow />
            </CardContent>
          </Card>
        </section>

        <Button variant="outline" fullWidth size="lg" className={styles.signOut}>
          {t('settings_sign_out')}
        </Button>
      </main>
    </div>
  );
}

function SettingsRow({ 
  label, 
  value, 
  hasArrow,
  isDanger 
}: { 
  label: string; 
  value?: string; 
  hasArrow?: boolean;
  isDanger?: boolean;
}) {
  return (
    <div className={`${styles.settingsRow} ${isDanger ? styles.danger : ''}`}>
      <span className={styles.rowLabel}>{label}</span>
      <div className={styles.rowRight}>
        {value && <span className={styles.rowValue}>{value}</span>}
        {hasArrow && <span className={styles.arrow}>▶</span>}
      </div>
    </div>
  );
}

