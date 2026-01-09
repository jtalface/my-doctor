import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useActiveProfile } from '../contexts';
import { useCycleData } from '../hooks/useCycleData';
import { useTranslate } from '../i18n';
import styles from './CycleOnboardingPage.module.css';

export function CycleOnboardingPage() {
  const navigate = useNavigate();
  const t = useTranslate();
  const { activeProfile } = useActiveProfile();
  
  const { createSettings } = useCycleData({
    userId: activeProfile?.id,
    autoLoad: false,
  });
  
  // Form state
  const [lastPeriodStart, setLastPeriodStart] = useState('');
  const [averageCycleLength, setAverageCycleLength] = useState(28);
  const [averagePeriodLength, setAveragePeriodLength] = useState(5);
  const [irregularCycle, setIrregularCycle] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!lastPeriodStart) {
      setError(t('cycle_last_period_required'));
      return;
    }
    
    setIsSaving(true);
    setError(null);
    
    try {
      await createSettings({
        lastPeriodStart,
        averageCycleLength,
        averagePeriodLength,
        irregularCycle,
        reminders: {
          periodExpected: true,
          periodExpectedDays: 2,
          fertileWindow: false,
        },
      });
      
      // Navigate to main cycle tracker
      navigate('/cycle');
    } catch (err) {
      console.error('Failed to create settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate('/cycle')}>
          ←
        </button>
        <h1 className={styles.title}>{t('cycle_onboarding_title')}</h1>
        <div className={styles.headerRight} />
      </header>
      
      <main className={styles.main}>
        <div className={styles.intro}>
          <span className={styles.icon}>🌸</span>
          <h2>{t('cycle_welcome_title')}</h2>
          <p>{t('cycle_onboarding_subtitle')}</p>
        </div>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Last Period Start */}
          <div className={styles.formGroup}>
            <label htmlFor="lastPeriodStart" className={styles.label}>
              {t('cycle_last_period_label')}
            </label>
            <input
              id="lastPeriodStart"
              type="date"
              className={styles.input}
              value={lastPeriodStart}
              onChange={(e) => setLastPeriodStart(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              required
            />
          </div>
          
          {/* Average Cycle Length */}
          <div className={styles.formGroup}>
            <label htmlFor="cycleLenght" className={styles.label}>
              {t('cycle_cycle_length_label')}
            </label>
            <div className={styles.sliderContainer}>
              <input
                id="cycleLength"
                type="range"
                className={styles.slider}
                min="21"
                max="45"
                value={averageCycleLength}
                onChange={(e) => setAverageCycleLength(parseInt(e.target.value))}
              />
              <div className={styles.sliderValue}>{averageCycleLength} {t('cycle_stat_days')}</div>
            </div>
            <p className={styles.hint}>
              {t('cycle_cycle_length_help')}
            </p>
          </div>
          
          {/* Average Period Length */}
          <div className={styles.formGroup}>
            <label htmlFor="periodLength" className={styles.label}>
              {t('cycle_period_length_label')}
            </label>
            <div className={styles.sliderContainer}>
              <input
                id="periodLength"
                type="range"
                className={styles.slider}
                min="2"
                max="10"
                value={averagePeriodLength}
                onChange={(e) => setAveragePeriodLength(parseInt(e.target.value))}
              />
              <div className={styles.sliderValue}>{averagePeriodLength} {t('cycle_stat_days')}</div>
            </div>
            <p className={styles.hint}>
              {t('cycle_period_length_help')}
            </p>
          </div>
          
          {/* Irregular Cycle Toggle */}
          <div className={styles.formGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={irregularCycle}
                onChange={(e) => setIrregularCycle(e.target.checked)}
                className={styles.checkbox}
              />
              <span>{t('cycle_irregular_label')}</span>
            </label>
            <p className={styles.hint}>
              {t('cycle_irregular_help')}
            </p>
          </div>
          
          {error && (
            <div className={styles.error}>
              <span className={styles.errorIcon}>⚠️</span>
              <span>{error}</span>
            </div>
          )}
          
          <button
            type="submit"
            className={styles.submitButton}
            disabled={isSaving}
          >
            {isSaving ? t('cycle_settings_saving') : t('cycle_setup_complete')}
          </button>
          
          <div className={styles.privacyNote}>
            <span className={styles.lockIcon}>🔒</span>
            <p>{t('cycle_privacy_description')}</p>
          </div>
        </form>
      </main>
    </div>
  );
}

