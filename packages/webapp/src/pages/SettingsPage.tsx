import { useState } from 'react';
import { Card, CardContent, Button } from '@components/common';
import { LLMSelector } from '@components/settings';
import styles from './SettingsPage.module.css';

export function SettingsPage() {
  const [notifications, setNotifications] = useState(true);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Settings</h1>
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
          <h2 className={styles.sectionTitle}>Account</h2>
          <Card variant="default" padding="none">
            <CardContent>
              <SettingsRow label="Email" value="sarah@email.com" hasArrow />
              <SettingsRow label="Change Password" hasArrow />
              <SettingsRow label="Two-Factor Authentication" value="Disabled" hasArrow />
            </CardContent>
          </Card>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Preferences</h2>
          <Card variant="default" padding="none">
            <CardContent>
              <SettingsRow label="Language" value="English" hasArrow />
              <SettingsRow label="Units" value="Imperial (lbs, ft)" hasArrow />
              <div className={styles.settingsRow}>
                <span className={styles.rowLabel}>Notifications</span>
                <button 
                  className={`${styles.toggle} ${notifications ? styles.toggleOn : ''}`}
                  onClick={() => setNotifications(!notifications)}
                  aria-pressed={notifications}
                >
                  <span className={styles.toggleThumb} />
                </button>
              </div>
              <SettingsRow label="Email Reminders" value="Weekly digest" hasArrow />
            </CardContent>
          </Card>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Privacy & Data</h2>
          <Card variant="default" padding="none">
            <CardContent>
              <SettingsRow label="Privacy Policy" hasArrow />
              <SettingsRow label="Terms of Service" hasArrow />
              <SettingsRow label="Download My Data" hasArrow />
              <SettingsRow label="Delete My Account" hasArrow isDanger />
            </CardContent>
          </Card>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>About</h2>
          <Card variant="default" padding="none">
            <CardContent>
              <SettingsRow label="App Version" value="1.0.0" />
              <SettingsRow label="Help & Support" hasArrow />
              <SettingsRow label="Send Feedback" hasArrow />
            </CardContent>
          </Card>
        </section>

        <Button variant="outline" fullWidth size="lg" className={styles.signOut}>
          Sign Out
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

