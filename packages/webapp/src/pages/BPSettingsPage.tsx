/**
 * BP Settings Page
 * 
 * Manage BP tracking settings and data
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBPData } from '../hooks/useBPData';
import { useTranslate } from '../i18n';
import * as bpApi from '../services/bpApi';
import { MEDICATION_CLASSES, SCHEDULE_OPTIONS } from '../types/bp';
import styles from './BPSettingsPage.module.css';

export function BPSettingsPage() {
  const navigate = useNavigate();
  const t = useTranslate();
  const { settings, updateSettings, refreshData } = useBPData();

  // Helper to translate backend error messages
  const translateError = (errorMessage: string): string => {
    if (errorMessage.includes('Settings already exist')) return t('bp_error_settings_exist');
    if (errorMessage.includes('Failed to create')) return t('bp_error_failed_create');
    if (errorMessage.includes('Failed to update')) return t('bp_error_failed_update');
    if (errorMessage.includes('Failed to delete')) return t('bp_error_failed_delete');
    if (errorMessage.includes('Server error') || errorMessage.includes('SERVER_ERROR')) return t('bp_error_server');
    return t('bp_error_unknown');
  };

  const [formData, setFormData] = useState(settings || null);
  const [medicationName, setMedicationName] = useState('');
  const [medicationClass, setMedicationClass] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  if (!formData) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>{t('bp_loading_insights')}</div>
      </div>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsSaving(true);

    try {
      await updateSettings({
        targets: formData.targets,
        measurementSchedule: formData.measurementSchedule,
        medications: formData.medications,
        comorbidities: formData.comorbidities,
      });
      setSuccessMessage(t('bp_settings_saved'));
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(translateError(err.message || t('bp_failed_settings')));
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddMedication = () => {
    if (medicationName.trim()) {
      setFormData({
        ...formData,
        medications: [
          ...formData.medications,
          { name: medicationName.trim(), class: medicationClass || undefined },
        ],
      });
      setMedicationName('');
      setMedicationClass('');
    }
  };

  const handleRemoveMedication = (index: number) => {
    setFormData({
      ...formData,
      medications: formData.medications.filter((_, i) => i !== index),
    });
  };

  const handleDeleteAllData = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete ALL your blood pressure data? This action cannot be undone.'
    );

    if (!confirmed) return;

    const doubleConfirmed = window.confirm(
      'This will permanently delete all your BP readings, settings, and history. Type DELETE to confirm.'
    );

    if (!doubleConfirmed) return;

    setIsDeleting(true);
    try {
      await bpApi.deleteAllData();
      navigate('/bp/onboarding', { replace: true });
    } catch (err: any) {
      setError(translateError(err.message || t('bp_error_failed_delete')));
      setIsDeleting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={() => navigate('/bp/dashboard')} className={styles.backButton}>
          ← {t('bp_back')}
        </button>
        <h1 className={styles.title}>⚙️ {t('bp_settings_title')}</h1>
      </div>

      <form onSubmit={handleSave} className={styles.form}>
        {/* Targets */}
        <div className={styles.section}>
          <h3>{t('bp_targets_title')}</h3>
          <p className={styles.hint}>{t('bp_target_ranges_hint')}</p>
          <div className={styles.targetInputs}>
            <div className={styles.inputGroup}>
              <label>{t('bp_systolic')}</label>
              <div className={styles.inputWithUnit}>
                <input
                  type="number"
                  value={formData.targets.systolic}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      targets: { ...formData.targets, systolic: Number(e.target.value) },
                    })
                  }
                  min="90"
                  max="180"
                  required
                />
                <span>mmHg</span>
              </div>
            </div>
            <span className={styles.slash}>/</span>
            <div className={styles.inputGroup}>
              <label>{t('bp_diastolic')}</label>
              <div className={styles.inputWithUnit}>
                <input
                  type="number"
                  value={formData.targets.diastolic}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      targets: { ...formData.targets, diastolic: Number(e.target.value) },
                    })
                  }
                  min="60"
                  max="110"
                  required
                />
                <span>mmHg</span>
              </div>
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className={styles.section}>
          <h3>{t('bp_measurement_schedule')}</h3>
          <div className={styles.checkboxGroup}>
            {SCHEDULE_OPTIONS.map((option) => (
              <label key={option.value} className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={formData.measurementSchedule.includes(option.value as any)}
                  onChange={(e) => {
                    const current = formData.measurementSchedule;
                    if (e.target.checked) {
                      setFormData({
                        ...formData,
                        measurementSchedule: [...current, option.value as any],
                      });
                    } else {
                      setFormData({
                        ...formData,
                        measurementSchedule: current.filter((s) => s !== option.value),
                      });
                    }
                  }}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Medications */}
        <div className={styles.section}>
          <h3>{t('bp_medications')}</h3>
          <div className={styles.medicationInput}>
            <input
              type="text"
              placeholder="Medication name"
              value={medicationName}
              onChange={(e) => setMedicationName(e.target.value)}
            />
            <select value={medicationClass} onChange={(e) => setMedicationClass(e.target.value)}>
              <option value="">Class (optional)</option>
              {MEDICATION_CLASSES.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
            <button type="button" onClick={handleAddMedication} className={styles.addButton}>
              Add
            </button>
          </div>

          {formData.medications.length > 0 && (
            <div className={styles.medicationList}>
              {formData.medications.map((med, index) => (
                <div key={index} className={styles.medicationItem}>
                  <span>
                    {med.name} {med.class && `(${med.class})`}
                  </span>
                  <button type="button" onClick={() => handleRemoveMedication(index)} className={styles.removeButton}>
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Comorbidities */}
        <div className={styles.section}>
          <h3>{t('bp_health_conditions_section')}</h3>
          <div className={styles.checkboxGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.comorbidities.diabetes}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    comorbidities: { ...formData.comorbidities, diabetes: e.target.checked },
                  })
                }
              />
              <span>Diabetes</span>
            </label>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.comorbidities.ckd}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    comorbidities: { ...formData.comorbidities, ckd: e.target.checked },
                  })
                }
              />
              <span>Chronic Kidney Disease</span>
            </label>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.comorbidities.cad}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    comorbidities: { ...formData.comorbidities, cad: e.target.checked },
                  })
                }
              />
              <span>Heart Disease (CAD/MI)</span>
            </label>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.comorbidities.stroke}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    comorbidities: { ...formData.comorbidities, stroke: e.target.checked },
                  })
                }
              />
              <span>Stroke/TIA History</span>
            </label>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.comorbidities.pregnancy}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    comorbidities: { ...formData.comorbidities, pregnancy: e.target.checked },
                  })
                }
              />
              <span>Currently Pregnant</span>
            </label>
          </div>
        </div>

        {error && <div className={styles.error}>{error}</div>}
        {successMessage && <div className={styles.success}>{successMessage}</div>}

        <button type="submit" className={styles.saveButton} disabled={isSaving}>
          {isSaving ? t('bp_saving') : t('bp_save_settings')}
        </button>
      </form>

      {/* Danger Zone */}
      <div className={styles.dangerZone}>
        <h3>⚠️ {t('bp_danger_zone')}</h3>
        <p>Permanently delete all your blood pressure data. This cannot be undone.</p>
        <button onClick={handleDeleteAllData} disabled={isDeleting} className={styles.deleteButton}>
          {isDeleting ? 'Deleting...' : 'Delete All Data'}
        </button>
      </div>
    </div>
  );
}

