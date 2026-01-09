import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useActiveProfile } from '../contexts';
import { useCycleData } from '../hooks/useCycleData';
import styles from './CycleOnboardingPage.module.css';

export function CycleOnboardingPage() {
  const navigate = useNavigate();
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
      setError('Please select your last period start date');
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
        <h1 className={styles.title}>Setup Cycle Tracking</h1>
        <div className={styles.headerRight} />
      </header>
      
      <main className={styles.main}>
        <div className={styles.intro}>
          <span className={styles.icon}>🌸</span>
          <h2>Welcome to Cycle Tracking</h2>
          <p>
            Answer a few quick questions to get personalized predictions for your period and fertile window.
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Last Period Start */}
          <div className={styles.formGroup}>
            <label htmlFor="lastPeriodStart" className={styles.label}>
              When did your last period start? *
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
              Average cycle length
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
              <div className={styles.sliderValue}>{averageCycleLength} days</div>
            </div>
            <p className={styles.hint}>
              A typical cycle is 28 days, measured from the first day of one period to the first day of the next.
            </p>
          </div>
          
          {/* Average Period Length */}
          <div className={styles.formGroup}>
            <label htmlFor="periodLength" className={styles.label}>
              Average period length
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
              <div className={styles.sliderValue}>{averagePeriodLength} days</div>
            </div>
            <p className={styles.hint}>
              The average period lasts 3-7 days.
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
              <span>My cycle is irregular</span>
            </label>
            <p className={styles.hint}>
              If your cycle length varies by more than a few days each month, check this box. We'll show prediction ranges instead of exact dates.
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
            {isSaving ? 'Saving...' : 'Start Tracking'}
          </button>
          
          <div className={styles.privacyNote}>
            <span className={styles.lockIcon}>🔒</span>
            <p>
              Your cycle data is private and stored securely. You can export or delete it at any time.
            </p>
          </div>
        </form>
      </main>
    </div>
  );
}

