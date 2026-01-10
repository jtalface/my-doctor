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

  // Create translated schedule options
  const translatedScheduleOptions = SCHEDULE_OPTIONS.map(opt => ({
    value: opt.value,
    label: t(`bp_schedule_${opt.value.toLowerCase()}` as any) || opt.label,
  }));

  // Create translated medication classes
  const translatedMedicationClasses = MEDICATION_CLASSES.map(cls => {
    const keyMap: Record<string, string> = {
      'ACE Inhibitor': 'bp_med_class_ace',
      'ARB': 'bp_med_class_arb',
      'Beta Blocker': 'bp_med_class_beta',
      'Calcium Channel Blocker': 'bp_med_class_calcium',
      'Diuretic': 'bp_med_class_diuretic',
      'Other': 'bp_med_class_other',
    };
    return t(keyMap[cls] as any) || cls;
  });

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
      t('bp_confirm_delete_title')
    );

    if (!confirmed) return;

    const doubleConfirmed = window.confirm(
      t('bp_confirm_delete_double')
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
          {t('bp_back')}
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
            {translatedScheduleOptions.map((option) => (
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
              placeholder={t('bp_medication_name')}
              value={medicationName}
              onChange={(e) => setMedicationName(e.target.value)}
            />
            <select value={medicationClass} onChange={(e) => setMedicationClass(e.target.value)}>
              <option value="">{t('bp_medication_class')}</option>
              {translatedMedicationClasses.map((cls, index) => (
                <option key={MEDICATION_CLASSES[index]} value={MEDICATION_CLASSES[index]}>
                  {cls}
                </option>
              ))}
            </select>
            <button type="button" onClick={handleAddMedication} className={styles.addButton}>
              {t('bp_add')}
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
              <span>{t('bp_diabetes')}</span>
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
              <span>{t('bp_ckd')}</span>
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
              <span>{t('bp_cad')}</span>
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
              <span>{t('bp_stroke_tia')}</span>
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
              <span>{t('bp_currently_pregnant')}</span>
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
        <p>{t('bp_danger_description')}</p>
        <button onClick={handleDeleteAllData} disabled={isDeleting} className={styles.deleteButton}>
          {isDeleting ? t('bp_deleting') : t('bp_delete_all_data')}
        </button>
      </div>
    </div>
  );
}

