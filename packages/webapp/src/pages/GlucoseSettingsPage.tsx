/**
 * Glucose Settings Page
 * 
 * Manage targets, units, medications, and data
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGlucoseData } from '../hooks/useGlucoseData';
import * as glucoseApi from '../services/glucoseApi';
import { useActiveProfile } from '../contexts';
import { DIABETES_TYPES, UNIT_OPTIONS } from '../types/glucose';
import styles from './GlucoseSettingsPage.module.css';

export function GlucoseSettingsPage() {
  const navigate = useNavigate();
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
      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
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
          ← Back
        </button>
        <h1 className={styles.title}>⚙️ Glucose Settings</h1>
      </div>

      <form onSubmit={handleSave} className={styles.form}>
        {/* Basic Settings */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Basic Settings</h2>

          <div className={styles.field}>
            <label htmlFor="diabetesType">Diabetes Type</label>
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
            <label htmlFor="unitPreference">Glucose Unit</label>
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
            <small>Changing this won't convert existing readings</small>
          </div>
        </div>

        {/* Target Ranges */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Target Ranges ({formData.unitPreference})</h2>
          <p className={styles.hint}>Set your personalized target ranges. Discuss these with your healthcare provider.</p>

          <div className={styles.rangeGrid}>
            <div className={styles.rangeField}>
              <label>Fasting (morning)</label>
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
              <label>Pre-meal</label>
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
              <label>Post-meal (2 hours)</label>
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
              <label>Bedtime</label>
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
          <h2 className={styles.sectionTitle}>Medications</h2>
          <p className={styles.hint}>For tracking only. Never used to suggest dose changes.</p>

          <div className={styles.medicationInput}>
            <input
              type="text"
              placeholder="Medication name"
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
              <span>Insulin</span>
            </label>
            <button
              type="button"
              onClick={handleAddMedication}
              className={styles.addButton}
            >
              Add
            </button>
          </div>

          {formData.medications.length > 0 && (
            <div className={styles.medicationList}>
              {formData.medications.map((med, index) => (
                <div key={index} className={styles.medicationItem}>
                  <span>
                    {med.name} {med.isInsulin && '(Insulin)'}
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
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>

      {/* Danger Zone */}
      <div className={styles.dangerZone}>
        <h2 className={styles.dangerTitle}>⚠️ Danger Zone</h2>
        <p className={styles.dangerDescription}>
          Deleting your data is permanent and cannot be undone. Export your data first if you want to keep a backup.
        </p>

        {!showDeleteConfirm ? (
          <button
            onClick={handleDeleteAllData}
            className={styles.deleteButton}
          >
            Delete All Glucose Data
          </button>
        ) : (
          <div className={styles.confirmDelete}>
            <p className={styles.confirmText}>
              <strong>Are you absolutely sure?</strong> This will permanently delete all your glucose data, settings, and history.
            </p>
            <div className={styles.confirmActions}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className={styles.cancelButton}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAllData}
                className={styles.confirmDeleteButton}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete Everything'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

