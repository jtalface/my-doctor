/**
 * Glucose Reports Page
 * 
 * Export and share glucose data
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGlucoseData } from '../hooks/useGlucoseData';
import { useTranslate } from '../i18n';
import * as glucoseApi from '../services/glucoseApi';
import { useActiveProfile } from '../contexts';
import styles from './GlucoseReportsPage.module.css';

export function GlucoseReportsPage() {
  const navigate = useNavigate();
  const t = useTranslate();
  const { activeProfile } = useActiveProfile();
  const { settings, readings, analytics, isLoading } = useGlucoseData();
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState('');

  if (!isLoading && !settings) {
    navigate('/glucose/onboarding');
    return null;
  }

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>{t('common_loading')}</div>
      </div>
    );
  }

  const handleExportJSON = async () => {
    setIsExporting(true);
    setExportError('');

    try {
      const data = await glucoseApi.exportData(activeProfile?.id);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `glucose-data-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setExportError(err.message || t('glucose_export_failed'));
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCSV = () => {
    try {
      // Generate CSV from readings
      const headers = ['Date', 'Time', 'Glucose', 'Unit', 'Context', 'Carbs', 'Insulin', 'Activity', 'Symptoms', 'Notes'];
      const rows = readings.map((r) => [
        new Date(r.timestamp).toLocaleDateString(),
        new Date(r.timestamp).toLocaleTimeString(),
        r.glucoseValueRaw,
        r.unit,
        r.context,
        r.carbsGrams || '',
        r.insulinUnits || '',
        r.activityMinutes || '',
        r.symptoms.join('; '),
        r.notes || '',
      ]);

      const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `glucose-readings-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setExportError(err.message || t('glucose_csv_export_failed'));
    }
  };

  const last7Days = readings.filter(
    (r) => new Date(r.timestamp) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  );
  const last30Days = readings.filter(
    (r) => new Date(r.timestamp) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={() => navigate('/glucose/dashboard')} className={styles.backButton}>
          ← {t('glucose_back')}
        </button>
        <h1 className={styles.title}>📄 {t('glucose_reports_title')}</h1>
      </div>

      <div className={styles.summaryCard}>
        <h2 className={styles.cardTitle}>{t('glucose_data_summary')}</h2>
        <div className={styles.summaryGrid}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>{t('glucose_total_readings')}</span>
            <span className={styles.summaryValue}>{readings.length}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>{t('glucose_last_7days')}</span>
            <span className={styles.summaryValue}>{t('glucose_readings_count', { count: last7Days.length })}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>{t('glucose_last_30days')}</span>
            <span className={styles.summaryValue}>{t('glucose_readings_count', { count: last30Days.length })}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>{t('glucose_diabetes_type')}:</span>
            <span className={styles.summaryValue}>{settings?.diabetesType}</span>
          </div>
        </div>
      </div>

      {analytics && (
        <div className={styles.summaryCard}>
          <h2 className={styles.cardTitle}>{t('glucose_statistics')}</h2>
          <div className={styles.summaryGrid}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>{t('glucose_average_glucose')}:</span>
              <span className={styles.summaryValue}>
                {analytics.averageGlucose} {settings?.unitPreference}
              </span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>{t('glucose_time_in_range')}:</span>
              <span className={styles.summaryValue}>{analytics.timeInRange.percentage}%</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>{t('glucose_high_readings')}</span>
              <span className={styles.summaryValue}>{analytics.highCount}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>{t('glucose_low_readings')}</span>
              <span className={styles.summaryValue}>{analytics.lowCount}</span>
            </div>
          </div>
        </div>
      )}

      <div className={styles.exportSection}>
        <h2 className={styles.sectionTitle}>{t('glucose_export_options')}</h2>

        <div className={styles.exportCard}>
          <div className={styles.exportIcon}>📊</div>
          <div className={styles.exportInfo}>
            <h3>{t('glucose_csv_export')}</h3>
            <p>{t('glucose_csv_description')}</p>
            <ul>
              <li>{t('glucose_csv_includes')}</li>
              <li>{t('glucose_csv_carbs_insulin')}</li>
              <li>{t('glucose_csv_symptoms')}</li>
            </ul>
          </div>
          <button onClick={handleExportCSV} className={styles.exportButton} disabled={readings.length === 0}>
            {t('glucose_download_csv')}
          </button>
        </div>

        <div className={styles.exportCard}>
          <div className={styles.exportIcon}>📦</div>
          <div className={styles.exportInfo}>
            <h3>{t('glucose_json_export')}</h3>
            <p>{t('glucose_json_description')}</p>
            <ul>
              <li>{t('glucose_json_includes')}</li>
              <li>{t('glucose_json_settings')}</li>
              <li>{t('glucose_json_analytics')}</li>
              <li>{t('glucose_json_backup')}</li>
            </ul>
          </div>
          <button
            onClick={handleExportJSON}
            className={styles.exportButton}
            disabled={isExporting || readings.length === 0}
          >
            {isExporting ? t('glucose_exporting') : t('glucose_download_json')}
          </button>
        </div>

        {exportError && <div className={styles.error}>{exportError}</div>}
      </div>

      <div className={styles.infoSection}>
        <h2 className={styles.sectionTitle}>💡 {t('glucose_share_with_team')}</h2>
        <div className={styles.infoCard}>
          <p>
            {t('glucose_share_description')}
          </p>
          <ul>
            <li>{t('glucose_share_csv')}</li>
            <li>{t('glucose_share_email')}</li>
            <li>{t('glucose_share_discuss')}</li>
            <li>{t('glucose_share_backups')}</li>
          </ul>
          <div className={styles.disclaimer}>
            <strong>{t('glucose_remember')}</strong> {t('glucose_remember_text')}
          </div>
        </div>
      </div>
    </div>
  );
}

