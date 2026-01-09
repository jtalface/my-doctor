/**
 * BP Reports Page
 * 
 * Export and share BP data with healthcare providers
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBPData } from '../hooks/useBPData';
import * as bpApi from '../services/bpApi';
import styles from './BPReportsPage.module.css';

export function BPReportsPage() {
  const navigate = useNavigate();
  const { settings, sessions, analytics } = useBPData();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const data = await bpApi.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pressurepal-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      alert('Export failed: ' + error.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!settings) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>No data to export yet.</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={() => navigate('/bp/dashboard')} className={styles.backButton}>
          ← Back
        </button>
        <h1 className={styles.title}>📄 Blood Pressure Report</h1>
      </div>

      <div className={styles.actions}>
        <button onClick={handlePrint} className={styles.actionButton}>
          🖨️ Print Report
        </button>
        <button onClick={handleExport} disabled={isExporting} className={styles.actionButton}>
          {isExporting ? 'Exporting...' : '💾 Export Data (JSON)'}
        </button>
      </div>

      <div className={styles.reportCard}>
        <div className={styles.reportHeader}>
          <h2>Blood Pressure Summary Report</h2>
          <p className={styles.reportDate}>Generated: {new Date().toLocaleDateString()}</p>
        </div>

        {/* Patient Info */}
        <div className={styles.section}>
          <h3>Settings</h3>
          <div className={styles.infoGrid}>
            <div><strong>Target BP:</strong> {settings.targets.systolic}/{settings.targets.diastolic} mmHg</div>
            <div><strong>Schedule:</strong> {settings.measurementSchedule.join(', ')}</div>
            {settings.medications.length > 0 && (
              <div><strong>Medications:</strong> {settings.medications.map(m => m.name).join(', ')}</div>
            )}
          </div>
        </div>

        {/* Summary */}
        {analytics && (
          <div className={styles.section}>
            <h3>7-Day Summary</h3>
            <div className={styles.summaryGrid}>
              <div>
                <div className={styles.label}>Average BP</div>
                <div className={styles.value}>{analytics.summary.avgSystolic}/{analytics.summary.avgDiastolic} mmHg</div>
              </div>
              <div>
                <div className={styles.label}>Total Readings</div>
                <div className={styles.value}>{analytics.summary.totalSessions}</div>
              </div>
              <div>
                <div className={styles.label}>Above Target</div>
                <div className={styles.value}>{analytics.aboveTarget.percentage}%</div>
              </div>
              <div>
                <div className={styles.label}>Adherence Rate</div>
                <div className={styles.value}>{analytics.adherence.adherenceRate}%</div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Readings */}
        <div className={styles.section}>
          <h3>Recent Readings (Last 30)</h3>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date/Time</th>
                <th>Systolic</th>
                <th>Diastolic</th>
                <th>Pulse</th>
                <th>Classification</th>
                <th>Context</th>
              </tr>
            </thead>
            <tbody>
              {sessions.slice(0, 30).map((session) => (
                <tr key={session._id}>
                  <td>{new Date(session.timestamp).toLocaleString()}</td>
                  <td>{session.averages.systolic}</td>
                  <td>{session.averages.diastolic}</td>
                  <td>{session.averages.pulse || '—'}</td>
                  <td style={{ textTransform: 'capitalize' }}>{session.classification.replace('stage', 'Stage ')}</td>
                  <td style={{ textTransform: 'capitalize' }}>{session.context.replace('_', ' ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.reportFooter}>
          <p><strong>Important:</strong> This report is for informational purposes only and should be reviewed with your healthcare provider. Do not make medical decisions based solely on this report.</p>
        </div>
      </div>
    </div>
  );
}

