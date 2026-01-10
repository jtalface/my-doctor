/**
 * Glucose Settings Page
 * 
 * Manage targets, units, medications, and data
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGlucoseData } from '../hooks/useGlucoseData';
import { useTranslate } from '../i18n';
import * as glucoseApi from '../services/glucoseApi';
import { useActiveProfile } from '../contexts';
import { DIABETES_TYPES, UNIT_OPTIONS } from '../types/glucose';
import styles from './GlucoseSettingsPage.module.css';

export function GlucoseSettingsPage() {
  const navigate = useNavigate();
  const t = useTranslate();
  const { activeProfile } = useActiveProfile();
  const { settings, updateSettings, isLoading } = useGlucoseData();

  const [formData, setFormData] = useState(settings);

  // Update formData when settings load
  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);
  const [medicationInput, setMedicationInput] = useState('');
  const [isInsulin, setIsInsulin] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isLoading && !settings) {
    navigate('/glucose/onboarding');
    return null;
  }

  if (isLoading || !formData) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  const handleAddMedication = () => {
    if (medicationInput.trim()) {
      setFormData({
        ...formData,
        medications: [
          ...formData.medications,
          { name: medicationInput.trim(), isInsulin },
        ],
      });
      setMedicationInput('');
      setIsInsulin(false);
    }
  };

  const handleRemoveMedication = (index: number) => {
    setFormData({
      ...formData,
      medications: formData.medications.filter((_, i) => i !== index),
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSaving(true);

    try {
      await updateSettings(formData);
      setSuccess(t('glucose_settings_saved'));
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || t('glucose_failed_settings'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAllData = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    setIsDeleting(true);
    setError('');

    try {
      await glucoseApi.deleteAllData(activeProfile?.id);
      navigate('/glucose/onboarding');
    } catch (err: any) {
      setError(err.message || 'Failed to delete data');
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={() => navigate('/glucose/dashboard')} className={styles.backButton}>
          ← {t('glucose_back')}
        </button>
        <h1 className={styles.title}>⚙️ {t('glucose_settings_title')}</h1>
      </div>

      <form onSubmit={handleSave} className={styles.form}>
        {/* Basic Settings */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('glucose_basic_settings')}</h2>

          <div className={styles.field}>
            <label htmlFor="diabetesType">{t('glucose_diabetes_type')}</label>
            <select
              id="diabetesType"
              value={formData.diabetesType}
              onChange={(e) =>
                setFormData({ ...formData, diabetesType: e.target.value as any })
              }
            >
              {DIABETES_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label htmlFor="unitPreference">{t('glucose_glucose_unit')}</label>
            <select
              id="unitPreference"
              value={formData.unitPreference}
              onChange={(e) =>
                setFormData({ ...formData, unitPreference: e.target.value as any })
              }
            >
              {UNIT_OPTIONS.map((unit) => (
                <option key={unit.value} value={unit.value}>
                  {unit.label}
                </option>
              ))}
            </select>
            <small>{t('glucose_unit_warning')}</small>
          </div>
        </div>

        {/* Target Ranges */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('glucose_target_ranges_section', { unit: formData.unitPreference })}</h2>
          <p className={styles.hint}>{t('glucose_target_ranges_hint')}</p>

          <div className={styles.rangeGrid}>
            <div className={styles.rangeField}>
              <label>{t('glucose_fasting')}</label>
              <div className={styles.rangeInputs}>
                <input
                  type="number"
                  value={formData.targetRanges.fasting.min}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      targetRanges: {
                        ...formData.targetRanges,
                        fasting: {
                          ...formData.targetRanges.fasting,
                          min: Number(e.target.value),
                        },
                      },
                    })
                  }
                  min="40"
                  max="200"
                />
                <span>to</span>
                <input
                  type="number"
                  value={formData.targetRanges.fasting.max}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      targetRanges: {
                        ...formData.targetRanges,
                        fasting: {
                          ...formData.targetRanges.fasting,
                          max: Number(e.target.value),
                        },
                      },
                    })
                  }
                  min="40"
                  max="300"
                />
              </div>
            </div>

            <div className={styles.rangeField}>
              <label>{t('glucose_pre_meal')}</label>
              <div className={styles.rangeInputs}>
                <input
                  type="number"
                  value={formData.targetRanges.preMeal.min}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      targetRanges: {
                        ...formData.targetRanges,
                        preMeal: {
                          ...formData.targetRanges.preMeal,
                          min: Number(e.target.value),
                        },
                      },
                    })
                  }
                  min="40"
                  max="200"
                />
                <span>to</span>
                <input
                  type="number"
                  value={formData.targetRanges.preMeal.max}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      targetRanges: {
                        ...formData.targetRanges,
                        preMeal: {
                          ...formData.targetRanges.preMeal,
                          max: Number(e.target.value),
                        },
                      },
                    })
                  }
                  min="40"
                  max="300"
                />
              </div>
            </div>

            <div className={styles.rangeField}>
              <label>{t('glucose_post_meal')}</label>
              <div className={styles.rangeInputs}>
                <input
                  type="number"
                  value={formData.targetRanges.postMeal.min}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      targetRanges: {
                        ...formData.targetRanges,
                        postMeal: {
                          ...formData.targetRanges.postMeal,
                          min: Number(e.target.value),
                        },
                      },
                    })
                  }
                  min="40"
                  max="200"
                />
                <span>to</span>
                <input
                  type="number"
                  value={formData.targetRanges.postMeal.max}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      targetRanges: {
                        ...formData.targetRanges,
                        postMeal: {
                          ...formData.targetRanges.postMeal,
                          max: Number(e.target.value),
                        },
                      },
                    })
                  }
                  min="40"
                  max="300"
                />
              </div>
            </div>

            <div className={styles.rangeField}>
              <label>{t('glucose_bedtime')}</label>
              <div className={styles.rangeInputs}>
                <input
                  type="number"
                  value={formData.targetRanges.bedtime.min}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      targetRanges: {
                        ...formData.targetRanges,
                        bedtime: {
                          ...formData.targetRanges.bedtime,
                          min: Number(e.target.value),
                        },
                      },
                    })
                  }
                  min="40"
                  max="200"
                />
                <span>to</span>
                <input
                  type="number"
                  value={formData.targetRanges.bedtime.max}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      targetRanges: {
                        ...formData.targetRanges,
                        bedtime: {
                          ...formData.targetRanges.bedtime,
                          max: Number(e.target.value),
                        },
                      },
                    })
                  }
                  min="40"
                  max="300"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Medications */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('glucose_medications')}</h2>
          <p className={styles.hint}>{t('glucose_medications_hint')}</p>

          <div className={styles.medicationInput}>
            <input
              type="text"
              placeholder={t('glucose_medication_name')}
              value={medicationInput}
              onChange={(e) => setMedicationInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddMedication();
                }
              }}
            />
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={isInsulin}
                onChange={(e) => setIsInsulin(e.target.checked)}
              />
              <span>{t('glucose_insulin')}</span>
            </label>
            <button
              type="button"
              onClick={handleAddMedication}
              className={styles.addButton}
            >
              {t('glucose_add')}
            </button>
          </div>

          {formData.medications.length > 0 && (
            <div className={styles.medicationList}>
              {formData.medications.map((med, index) => (
                <div key={index} className={styles.medicationItem}>
                  <span>
                    {med.name} {med.isInsulin && `(${t('glucose_insulin')})`}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveMedication(index)}
                    className={styles.removeButton}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>{success}</div>}

        <button type="submit" className={styles.saveButton} disabled={isSaving}>
          {isSaving ? t('glucose_saving') : t('glucose_save_settings')}
        </button>
      </form>

      {/* Danger Zone */}
      <div className={styles.dangerZone}>
        <h2 className={styles.dangerTitle}>⚠️ {t('glucose_danger_zone')}</h2>
        <p className={styles.dangerDescription}>
          {t('glucose_danger_description')}
        </p>

        {!showDeleteConfirm ? (
          <button
            onClick={handleDeleteAllData}
            className={styles.deleteButton}
          >
            {t('glucose_delete_all_data')}
          </button>
        ) : (
          <div className={styles.confirmDelete}>
            <p className={styles.confirmText}>
              <strong>{t('glucose_confirm_delete')}</strong> {t('glucose_confirm_delete_text')}
            </p>
            <div className={styles.confirmActions}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className={styles.cancelButton}
                disabled={isDeleting}
              >
                {t('glucose_cancel')}
              </button>
              <button
                onClick={handleDeleteAllData}
                className={styles.confirmDeleteButton}
                disabled={isDeleting}
              >
                {isDeleting ? t('glucose_deleting') : t('glucose_yes_delete')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

