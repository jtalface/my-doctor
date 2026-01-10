/**
 * Glucose Onboarding Page
 * 
 * CRITICAL: User must accept disclaimers before accessing glucose tracking
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGlucoseData } from '../hooks/useGlucoseData';
import { useTranslate } from '../i18n';
import { DIABETES_TYPES, UNIT_OPTIONS, CreateSettingsRequest } from '../types/glucose';
import styles from './GlucoseOnboardingPage.module.css';

export function GlucoseOnboardingPage() {
  const navigate = useNavigate();
  const t = useTranslate();
  const { createSettings, isLoading } = useGlucoseData();

  const [step, setStep] = useState(1); // 1: Disclaimer, 2: Setup
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [formData, setFormData] = useState<CreateSettingsRequest>({
    diabetesType: 'T2',
    unitPreference: 'mg/dL',
    targetRanges: {
      fasting: { min: 80, max: 130 },
      preMeal: { min: 80, max: 130 },
      postMeal: { min: 80, max: 180 },
      bedtime: { min: 100, max: 140 },
    },
    medications: [],
  });
  const [medicationInput, setMedicationInput] = useState('');
  const [isInsulin, setIsInsulin] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDisclaimerAccept = () => {
    if (disclaimerAccepted) {
      setStep(2);
    }
  };

  const handleAddMedication = () => {
    if (medicationInput.trim()) {
      setFormData({
        ...formData,
        medications: [
          ...(formData.medications || []),
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
      medications: formData.medications?.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await createSettings(formData);
      // Give a moment for settings to propagate, then navigate
      setTimeout(() => {
        navigate('/glucose/dashboard', { replace: true });
      }, 100);
    } catch (err: any) {
      setError(err.message || t('glucose_failed_save'));
      setIsSubmitting(false);
    }
  };

  if (step === 1) {
    return (
      <div className={styles.container}>
        <div className={styles.disclaimerCard}>
          <h1 className={styles.title}>🩸 {t('glucose_onboarding_title')}</h1>

          <div className={styles.disclaimerSection}>
            <h2>⚠️ {t('glucose_disclaimer_medical')}</h2>
            <p>
              <strong>{t('glucose_disclaimer_text')}</strong> {t('glucose_not_intended')}
            </p>
            <ul>
              <li>{t('glucose_not_medical_advice')}</li>
              <li>{t('glucose_not_replace_care')}</li>
              <li>{t('glucose_not_recommend_changes')}</li>
              <li>{t('glucose_not_substitute')}</li>
            </ul>
          </div>

          <div className={styles.disclaimerSection}>
            <h2>🏥 {t('glucose_consult_provider')}</h2>
            <p>{t('glucose_you_should_always')}</p>
            <ul>
              <li>{t('glucose_follow_plan')}</li>
              <li>{t('glucose_consult_before_changes')}</li>
              <li>{t('glucose_seek_emergency')}</li>
              <li>{t('glucose_discuss_patterns')}</li>
            </ul>
          </div>

          <div className={styles.disclaimerSection}>
            <h2>🚨 {t('glucose_emergency_title')}</h2>
            <p>
              <strong>{t('glucose_emergency_call')}</strong>
            </p>
            <ul>
              <li>{t('glucose_emergency_low')}</li>
              <li>{t('glucose_emergency_high')}</li>
              <li>{t('glucose_emergency_concern')}</li>
            </ul>
          </div>

          <div className={styles.disclaimerSection}>
            <h2>📊 {t('glucose_what_app_does')}</h2>
            <p>{t('glucose_app_helps')}</p>
            <ul>
              <li>{t('glucose_track_readings')}</li>
              <li>{t('glucose_log_meals')}</li>
              <li>{t('glucose_view_suggestions')}</li>
              <li>{t('glucose_generate_reports')}</li>
            </ul>
            <p>
              <strong>{t('glucose_suggestions_educational')}</strong>
            </p>
          </div>

          <div className={styles.disclaimerSection}>
            <h2>🔒 {t('glucose_privacy_title')}</h2>
            <p>{t('glucose_data_secure')}</p>
            <ul>
              <li>{t('glucose_stored_securely')}</li>
              <li>{t('glucose_only_accessible')}</li>
              <li>{t('glucose_exportable')}</li>
              <li>{t('glucose_deletable')}</li>
            </ul>
          </div>

          <div className={styles.acceptSection}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={disclaimerAccepted}
                onChange={(e) => setDisclaimerAccepted(e.target.checked)}
              />
              <span>{t('glucose_disclaimer_accept')}</span>
            </label>

            {!disclaimerAccepted && (
              <p className={styles.checkboxHint}>
                ☝️ {t('glucose_check_to_continue')}
              </p>
            )}

            <button
              className={styles.continueButton}
              onClick={handleDisclaimerAccept}
              disabled={!disclaimerAccepted}
            >
              {disclaimerAccepted ? `✓ ${t('glucose_continue_to_setup')}` : t('glucose_continue_check_box')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.setupCard}>
        <h1 className={styles.title}>🩸 {t('glucose_setup_title')}</h1>
        <p className={styles.subtitle}>{t('glucose_setup_subtitle')}</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Diabetes Type */}
          <div className={styles.field}>
            <label htmlFor="diabetesType">{t('glucose_diabetes_type')} *</label>
            <select
              id="diabetesType"
              value={formData.diabetesType}
              onChange={(e) =>
                setFormData({ ...formData, diabetesType: e.target.value as any })
              }
              required
            >
              {DIABETES_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Unit Preference */}
          <div className={styles.field}>
            <label htmlFor="unitPreference">{t('glucose_glucose_unit')} *</label>
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
            <small>{t('glucose_unit_help')}</small>
          </div>

          {/* Target Ranges */}
          <div className={styles.fieldGroup}>
            <h3>{t('glucose_target_ranges')} ({formData.unitPreference})</h3>
            <p className={styles.hint}>{t('glucose_target_ranges_help')}</p>

            <div className={styles.rangeGrid}>
              <div className={styles.rangeField}>
                <label>{t('glucose_fasting')}</label>
                <div className={styles.rangeInputs}>
                  <input
                    type="number"
                    value={formData.targetRanges?.fasting.min}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        targetRanges: {
                          ...formData.targetRanges!,
                          fasting: {
                            ...formData.targetRanges!.fasting,
                            min: Number(e.target.value),
                          },
                        },
                      })
                    }
                    min="40"
                    max="200"
                    required
                  />
                  <span>{t('glucose_to')}</span>
                  <input
                    type="number"
                    value={formData.targetRanges?.fasting.max}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        targetRanges: {
                          ...formData.targetRanges!,
                          fasting: {
                            ...formData.targetRanges!.fasting,
                            max: Number(e.target.value),
                          },
                        },
                      })
                    }
                    min="40"
                    max="300"
                    required
                  />
                </div>
              </div>

              <div className={styles.rangeField}>
                <label>{t('glucose_post_meal')}</label>
                <div className={styles.rangeInputs}>
                  <input
                    type="number"
                    value={formData.targetRanges?.postMeal.min}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        targetRanges: {
                          ...formData.targetRanges!,
                          postMeal: {
                            ...formData.targetRanges!.postMeal,
                            min: Number(e.target.value),
                          },
                        },
                      })
                    }
                    min="40"
                    max="200"
                    required
                  />
                  <span>{t('glucose_to')}</span>
                  <input
                    type="number"
                    value={formData.targetRanges?.postMeal.max}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        targetRanges: {
                          ...formData.targetRanges!,
                          postMeal: {
                            ...formData.targetRanges!.postMeal,
                            max: Number(e.target.value),
                          },
                        },
                      })
                    }
                    min="40"
                    max="300"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Medications */}
          <div className={styles.fieldGroup}>
            <h3>{t('glucose_medications_optional')}</h3>
            <p className={styles.hint}>{t('glucose_medications_help')}</p>

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

            {formData.medications && formData.medications.length > 0 && (
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

          <div className={styles.actions}>
            <button
              type="button"
              onClick={() => navigate('/')}
              className={styles.cancelButton}
              disabled={isSubmitting}
            >
              {t('glucose_cancel')}
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={isSubmitting || isLoading}
            >
              {isSubmitting ? t('glucose_setting_up') : t('glucose_start_tracking')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

