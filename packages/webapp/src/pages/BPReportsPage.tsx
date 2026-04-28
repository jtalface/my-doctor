/**
 * BP Reports Page
 * 
 * Export and share BP data with healthcare providers
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBPData } from '../hooks/useBPData';
import { useTranslate } from '../i18n';
import * as bpApi from '../services/bpApi';
import styles from './BPReportsPage.module.css';

export function BPReportsPage() {
  const navigate = useNavigate();
  const t = useTranslate();
  const { settings, sessions, analytics } = useBPData();
  const [isExporting, setIsExporting] = useState(false);

  const getClassificationLabel = (classification: string): string => {
    const classMap: Record<string, string> = {
      normal: t('bp_classification_normal'),
      elevated: t('bp_classification_elevated'),
      stage1: t('bp_classification_stage1'),
      stage2: t('bp_classification_stage2'),
      crisis: t('bp_classification_crisis'),
    };
    return classMap[classification] || classification;
  };

  const getContextLabel = (context: string): string => {
    const contextMap: Record<string, string> = {
      resting: t('bp_context_resting'),
      after_exercise: t('bp_context_after_exercise'),
      stressed: t('bp_context_stressed'),
      clinic: t('bp_context_clinic'),
      other: t('bp_context_other'),
    };
    return contextMap[context] || context.replace('_', ' ');
  };

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
      alert(t('bp_reports_export_failed') + ' ' + error.message);
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
        <div className={styles.emptyState}>{t('bp_reports_no_data')}</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={() => navigate('/bp/dashboard')} className={styles.backButton}>
          {t('common_back')}
        </button>
        <h1 className={styles.title}>📄 {t('bp_reports_title')}</h1>
      </div>

      <div className={styles.actions}>
        <button onClick={handlePrint} className={styles.actionButton}>
          {t('bp_reports_print_button')}
        </button>
        <button onClick={handleExport} disabled={isExporting} className={styles.actionButton}>
          {isExporting ? t('bp_exporting') : t('bp_reports_export_json_button')}
        </button>
      </div>

      <div className={styles.reportCard}>
        <div className={styles.reportHeader}>
          <h2>{t('bp_reports_summary_title')}</h2>
          <p className={styles.reportDate}>{t('bp_reports_generated')} {new Date().toLocaleDateString()}</p>
        </div>

        {/* Patient Info */}
        <div className={styles.section}>
          <h3>{t('bp_reports_settings_section')}</h3>
          <div className={styles.infoGrid}>
            <div><strong>{t('bp_reports_target_label')}</strong> {settings.targets.systolic}/{settings.targets.diastolic} mmHg</div>
            <div><strong>{t('bp_reports_schedule_label')}</strong> {settings.measurementSchedule.join(', ')}</div>
            {settings.medications.length > 0 && (
              <div><strong>{t('bp_reports_medications_label')}</strong> {settings.medications.map(m => m.name).join(', ')}</div>
            )}
          </div>
        </div>

        {/* Summary */}
        {analytics && (
          <div className={styles.section}>
            <h3>{t('bp_7day_summary')}</h3>
            <div className={styles.summaryGrid}>
              <div>
                <div className={styles.label}>{t('bp_average_bp')}</div>
                <div className={styles.value}>{analytics.summary.avgSystolic}/{analytics.summary.avgDiastolic} mmHg</div>
              </div>
              <div>
                <div className={styles.label}>{t('bp_sessions')}</div>
                <div className={styles.value}>{analytics.summary.totalSessions}</div>
              </div>
              <div>
                <div className={styles.label}>{t('bp_above_target')}</div>
                <div className={styles.value}>{analytics.aboveTarget.percentage}%</div>
              </div>
              <div>
                <div className={styles.label}>{t('bp_adherence')}</div>
                <div className={styles.value}>{analytics.adherence.adherenceRate}%</div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Readings */}
        <div className={styles.section}>
          <h3>{t('bp_reports_recent_readings_section')}</h3>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{t('bp_reports_table_date_time')}</th>
                <th>{t('bp_reports_table_systolic')}</th>
                <th>{t('bp_reports_table_diastolic')}</th>
                <th>{t('bp_reports_table_pulse')}</th>
                <th>{t('bp_reports_table_classification')}</th>
                <th>{t('bp_reports_table_context')}</th>
              </tr>
            </thead>
            <tbody>
              {sessions.slice(0, 30).map((session) => (
                <tr key={session._id}>
                  <td>{new Date(session.timestamp).toLocaleString()}</td>
                  <td>{session.averages.systolic}</td>
                  <td>{session.averages.diastolic}</td>
                  <td>{session.averages.pulse || '—'}</td>
                  <td>{getClassificationLabel(session.classification)}</td>
                  <td>{getContextLabel(session.context)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.reportFooter}>
          <p><strong>{t('bp_reports_disclaimer_important')}</strong> {t('bp_reports_disclaimer_text')}</p>
        </div>
      </div>
    </div>
  );
}

