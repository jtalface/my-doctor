/**
 * Glucose Reports Page
 * 
 * Export and share glucose data
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGlucoseData } from '../hooks/useGlucoseData';
import * as glucoseApi from '../services/glucoseApi';
import { useActiveProfile } from '../contexts';
import styles from './GlucoseReportsPage.module.css';

export function GlucoseReportsPage() {
  const navigate = useNavigate();
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
        <div className={styles.loading}>Loading...</div>
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
      setExportError(err.message || 'Failed to export data');
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
      setExportError(err.message || 'Failed to export CSV');
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
          ← Back
        </button>
        <h1 className={styles.title}>📄 Reports & Export</h1>
      </div>

      <div className={styles.summaryCard}>
        <h2 className={styles.cardTitle}>Data Summary</h2>
        <div className={styles.summaryGrid}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Total Readings:</span>
            <span className={styles.summaryValue}>{readings.length}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Last 7 Days:</span>
            <span className={styles.summaryValue}>{last7Days.length} readings</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Last 30 Days:</span>
            <span className={styles.summaryValue}>{last30Days.length} readings</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Diabetes Type:</span>
            <span className={styles.summaryValue}>{settings?.diabetesType}</span>
          </div>
        </div>
      </div>

      {analytics && (
        <div className={styles.summaryCard}>
          <h2 className={styles.cardTitle}>7-Day Statistics</h2>
          <div className={styles.summaryGrid}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Average Glucose:</span>
              <span className={styles.summaryValue}>
                {analytics.averageGlucose} {settings?.unitPreference}
              </span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Time in Range:</span>
              <span className={styles.summaryValue}>{analytics.timeInRange.percentage}%</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>High Readings:</span>
              <span className={styles.summaryValue}>{analytics.highCount}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Low Readings:</span>
              <span className={styles.summaryValue}>{analytics.lowCount}</span>
            </div>
          </div>
        </div>
      )}

      <div className={styles.exportSection}>
        <h2 className={styles.sectionTitle}>Export Options</h2>

        <div className={styles.exportCard}>
          <div className={styles.exportIcon}>📊</div>
          <div className={styles.exportInfo}>
            <h3>CSV Export (Spreadsheet)</h3>
            <p>Download your glucose readings in CSV format for Excel or Google Sheets.</p>
            <ul>
              <li>All glucose readings with timestamps</li>
              <li>Carbs, insulin, activity data</li>
              <li>Symptoms and notes</li>
            </ul>
          </div>
          <button onClick={handleExportCSV} className={styles.exportButton} disabled={readings.length === 0}>
            Download CSV
          </button>
        </div>

        <div className={styles.exportCard}>
          <div className={styles.exportIcon}>📦</div>
          <div className={styles.exportInfo}>
            <h3>JSON Export (Complete Data)</h3>
            <p>Download all your data including settings, analytics, and suggestions.</p>
            <ul>
              <li>All glucose readings</li>
              <li>Settings and target ranges</li>
              <li>7-day analytics and patterns</li>
              <li>Complete data backup</li>
            </ul>
          </div>
          <button
            onClick={handleExportJSON}
            className={styles.exportButton}
            disabled={isExporting || readings.length === 0}
          >
            {isExporting ? 'Exporting...' : 'Download JSON'}
          </button>
        </div>

        {exportError && <div className={styles.error}>{exportError}</div>}
      </div>

      <div className={styles.infoSection}>
        <h2 className={styles.sectionTitle}>💡 Share with Your Healthcare Team</h2>
        <div className={styles.infoCard}>
          <p>
            Your healthcare provider can use these exports to review your glucose patterns and make informed
            decisions about your diabetes management plan.
          </p>
          <ul>
            <li>Share the CSV file for easy viewing in any spreadsheet program</li>
            <li>Email or print reports before your appointment</li>
            <li>Discuss patterns and trends with your care team</li>
            <li>Keep regular backups of your data</li>
          </ul>
          <div className={styles.disclaimer}>
            <strong>Remember:</strong> Always consult your healthcare provider before making changes to your
            diabetes management plan. This app provides data tracking, not medical advice.
          </div>
        </div>
      </div>
    </div>
  );
}

