import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useActiveProfile } from '../contexts';
import { useCycleData } from '../hooks/useCycleData';
import { useTranslate } from '../i18n';
import * as cycleApi from '../services/cycleApi';
import styles from './CycleSettingsPage.module.css';

export function CycleSettingsPage() {
  const navigate = useNavigate();
  const t = useTranslate();
  const { activeProfile } = useActiveProfile();
  
  const {
    settings,
    isLoading: isLoadingSettings,
    refreshSettings,
  } = useCycleData({
    userId: activeProfile?.id,
    autoLoad: true,
  });
  
  // Form state
  const [lastPeriodStart, setLastPeriodStart] = useState('');
  const [averageCycleLength, setAverageCycleLength] = useState(28);
  const [averagePeriodLength, setAveragePeriodLength] = useState(5);
  const [irregularCycle, setIrregularCycle] = useState(false);
  const [periodExpectedReminder, setPeriodExpectedReminder] = useState(true);
  const [fertileWindowReminder, setFertileWindowReminder] = useState(false);
  
  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showExportSuccess, setShowExportSuccess] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  
  // Load settings into form
  useEffect(() => {
    if (settings) {
      setLastPeriodStart(settings.lastPeriodStart);
      setAverageCycleLength(settings.averageCycleLength);
      setAveragePeriodLength(settings.averagePeriodLength);
      setIrregularCycle(settings.irregularCycle);
      setPeriodExpectedReminder(settings.reminders.periodExpected);
      setFertileWindowReminder(settings.reminders.fertileWindow);
    }
  }, [settings]);
  
  const handleSave = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsSaving(true);
    
    try {
      await cycleApi.updateSettings(
        {
          lastPeriodStart,
          averageCycleLength,
          averagePeriodLength,
          irregularCycle,
          reminders: {
            periodExpected: periodExpectedReminder,
            fertileWindow: fertileWindowReminder,
          },
        },
        activeProfile?.id
      );
      
      await refreshSettings();
      setSuccessMessage('Settings saved successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  }, [
    lastPeriodStart,
    averageCycleLength,
    averagePeriodLength,
    irregularCycle,
    periodExpectedReminder,
    fertileWindowReminder,
    activeProfile?.id,
    refreshSettings,
  ]);
  
  const handleExport = useCallback(async () => {
    try {
      const data = await cycleApi.exportData(activeProfile?.id);
      cycleApi.downloadExportFile(data, `cycle-data-${Date.now()}.json`);
      setShowExportSuccess(true);
      setTimeout(() => setShowExportSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to export data');
    }
  }, [activeProfile?.id]);
  
  const handleImport = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setImportError(null);
    
    try {
      const data = await cycleApi.readImportFile(file);
      
      // Confirm import
      const confirmed = window.confirm(
        'This will replace your current cycle data. Are you sure you want to continue?'
      );
      
      if (!confirmed) {
        event.target.value = '';
        return;
      }
      
      await cycleApi.importData(
        { ...data, mode: 'replace' },
        activeProfile?.id
      );
      
      await refreshSettings();
      setSuccessMessage('Data imported successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setImportError(err.message || 'Failed to import data');
    }
    
    // Clear input
    event.target.value = '';
  }, [activeProfile?.id, refreshSettings]);
  
  const handleDeleteAll = useCallback(async () => {
    setIsDeleting(true);
    setError(null);
    
    try {
      await cycleApi.deleteAllData(activeProfile?.id);
      setShowDeleteConfirm(false);
      
      // Navigate back to onboarding
      navigate('/cycle/onboarding');
    } catch (err: any) {
      setError(err.message || 'Failed to delete data');
    } finally {
      setIsDeleting(false);
    }
  }, [activeProfile?.id, navigate]);
  
  if (isLoadingSettings) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }
  
  if (!settings) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <span className={styles.errorIcon}>⚠️</span>
          <h3>No Settings Found</h3>
          <p>Please complete the onboarding first.</p>
          <button
            className={styles.primaryButton}
            onClick={() => navigate('/cycle/onboarding')}
          >
            Start Setup
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button
          className={styles.backButton}
          onClick={() => navigate('/cycle')}
          aria-label="Back to cycle tracker"
        >
          ←
        </button>
        <h1 className={styles.title}>{t('cycle_settings_title')}</h1>
      </header>
      
      <main className={styles.main}>
        {error && (
          <div className={styles.errorBanner}>
            <span className={styles.errorIcon}>⚠️</span>
            <span>{error}</span>
          </div>
        )}
        
        {successMessage && (
          <div className={styles.successBanner}>
            <span className={styles.successIcon}>✓</span>
            <span>{successMessage}</span>
          </div>
        )}
        
        <form onSubmit={handleSave} className={styles.form}>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>{t('cycle_info_section')}</h2>
            
            <div className={styles.field}>
              <label htmlFor="lastPeriodStart" className={styles.label}>
                {t('cycle_last_period_label')}
              </label>
              <input
                id="lastPeriodStart"
                type="date"
                value={lastPeriodStart}
                onChange={(e) => setLastPeriodStart(e.target.value)}
                className={styles.input}
                required
              />
              <p className={styles.hint}>
                The first day of your most recent period
              </p>
            </div>
            
            <div className={styles.field}>
              <label htmlFor="cycleLength" className={styles.label}>
                {t('cycle_cycle_length_label')}
              </label>
              <input
                id="cycleLength"
                type="number"
                min="21"
                max="45"
                value={averageCycleLength}
                onChange={(e) => setAverageCycleLength(Number(e.target.value))}
                className={styles.input}
                required
              />
              <p className={styles.hint}>
                From the first day of one period to the first day of the next (21-45 days)
              </p>
            </div>
            
            <div className={styles.field}>
              <label htmlFor="periodLength" className={styles.label}>
                {t('cycle_period_length_label')}
              </label>
              <input
                id="periodLength"
                type="number"
                min="2"
                max="10"
                value={averagePeriodLength}
                onChange={(e) => setAveragePeriodLength(Number(e.target.value))}
                className={styles.input}
                required
              />
              <p className={styles.hint}>
                How many days your period typically lasts (2-10 days)
              </p>
            </div>
            
            <div className={styles.field}>
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
                Predictions will show ranges (±2 days) if enabled
              </p>
            </div>
          </section>
          
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>{t('cycle_reminders_section')}</h2>
            
            <div className={styles.field}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={periodExpectedReminder}
                  onChange={(e) => setPeriodExpectedReminder(e.target.checked)}
                  className={styles.checkbox}
                />
                <span>Period expected soon</span>
              </label>
              <p className={styles.hint}>
                Reminder 2 days before expected period
              </p>
            </div>
            
            <div className={styles.field}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={fertileWindowReminder}
                  onChange={(e) => setFertileWindowReminder(e.target.checked)}
                  className={styles.checkbox}
                />
                <span>Fertile window starts</span>
              </label>
              <p className={styles.hint}>
                Reminder when fertile window begins
              </p>
            </div>
          </section>
          
          <button
            type="submit"
            className={styles.primaryButton}
            disabled={isSaving}
          >
            {isSaving ? t('cycle_settings_saving') : t('cycle_save_settings')}
          </button>
        </form>
        
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('cycle_data_section')}</h2>
          
          <div className={styles.dataActions}>
            <button
              type="button"
              onClick={handleExport}
              className={styles.secondaryButton}
            >
              📥 Export Data
            </button>
            
            <label className={styles.secondaryButton}>
              📤 Import Data
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className={styles.fileInput}
              />
            </label>
          </div>
          
          {showExportSuccess && (
            <p className={styles.successText}>Data exported successfully!</p>
          )}
          
          {importError && (
            <p className={styles.errorText}>{importError}</p>
          )}
          
          <p className={styles.hint}>
            Export your data as a backup or import previously exported data
          </p>
        </section>
        
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('cycle_danger_zone')}</h2>
          
          {!showDeleteConfirm ? (
            <>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className={styles.dangerButton}
              >
                Delete All Data
              </button>
              <p className={styles.hint}>
                Permanently delete all cycle tracking data
              </p>
            </>
          ) : (
            <div className={styles.deleteConfirm}>
              <p className={styles.warningText}>
                ⚠️ Are you sure? This will permanently delete all your cycle data including settings, logs, and history. This action cannot be undone.
              </p>
              <div className={styles.confirmActions}>
                <button
                  type="button"
                  onClick={handleDeleteAll}
                  className={styles.dangerButton}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Yes, Delete Everything'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className={styles.secondaryButton}
                  disabled={isDeleting}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default CycleSettingsPage;

