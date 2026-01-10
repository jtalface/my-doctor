/**
 * BP Onboarding Page
 * 
 * CRITICAL: User must accept disclaimers before using BP tracking
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBPData } from '../hooks/useBPData';
import { useTranslate } from '../i18n';
import { CreateSettingsRequest, MEDICATION_CLASSES, SCHEDULE_OPTIONS } from '../types/bp';
import styles from './BPOnboardingPage.module.css';

export function BPOnboardingPage() {
  const navigate = useNavigate();
  const t = useTranslate();
  const { createSettings, isLoading } = useBPData();

  const [step, setStep] = useState(1); // 1: Disclaimer, 2: Setup
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [formData, setFormData] = useState<CreateSettingsRequest>({
    targets: { systolic: 130, diastolic: 80 },
    measurementSchedule: ['AM', 'PM'],
    medications: [],
    comorbidities: {
      diabetes: false,
      ckd: false,
      cad: false,
      stroke: false,
      pregnancy: false,
    },
  });
  const [medicationName, setMedicationName] = useState('');
  const [medicationClass, setMedicationClass] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDisclaimerAccept = () => {
    if (disclaimerAccepted) {
      setStep(2);
    }
  };

  const handleAddMedication = () => {
    if (medicationName.trim()) {
      setFormData({
        ...formData,
        medications: [
          ...(formData.medications || []),
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
      medications: formData.medications?.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await createSettings(formData);
      setTimeout(() => {
        navigate('/bp/dashboard', { replace: true });
      }, 100);
    } catch (err: any) {
      setError(err.message || t('bp_failed_save'));
      setIsSubmitting(false);
    }
  };

  if (step === 1) {
    return (
      <div className={styles.container}>
        <div className={styles.disclaimerCard}>
          <h1 className={styles.title}>❤️ {t('bp_onboarding_title')}</h1>

          <div className={styles.disclaimerSection}>
            <h2>⚠️ {t('bp_disclaimer_medical')}</h2>
            <p>
              <strong>{t('bp_disclaimer_text')}</strong> {t('bp_not_intended')}
            </p>
            <ul>
              <li>{t('bp_not_medical_advice')}</li>
              <li>{t('bp_not_replace_care')}</li>
              <li>{t('bp_not_recommend_changes')}</li>
              <li>{t('bp_not_substitute')}</li>
            </ul>
          </div>

          <div className={styles.disclaimerSection}>
            <h2>🏥 {t('bp_consult_provider')}</h2>
            <p>{t('bp_you_should_always')}</p>
            <ul>
              <li>{t('bp_follow_plan')}</li>
              <li>{t('bp_take_meds')}</li>
              <li>{t('bp_seek_emergency')}</li>
              <li>{t('bp_discuss_patterns')}</li>
              <li>{t('bp_get_approval')}</li>
            </ul>
          </div>

          <div className={styles.disclaimerSection}>
            <h2>🚨 {t('bp_emergency_title')}</h2>
            <p>
              <strong>{t('bp_emergency_call')}</strong>
            </p>
            <ul>
              <li>{t('bp_emergency_chest')}</li>
              <li>{t('bp_emergency_breath')}</li>
              <li>{t('bp_emergency_headache')}</li>
              <li>{t('bp_emergency_vision')}</li>
              <li>{t('bp_emergency_confusion')}</li>
              <li>{t('bp_emergency_weakness')}</li>
            </ul>
          </div>

          <div className={styles.disclaimerSection}>
            <h2>📊 {t('bp_what_app_does')}</h2>
            <p>{t('bp_app_helps')}</p>
            <ul>
              <li>{t('bp_track_readings')}</li>
              <li>{t('bp_record_quality')}</li>
              <li>{t('bp_identify_patterns')}</li>
              <li>{t('bp_view_suggestions')}</li>
              <li>{t('bp_generate_reports')}</li>
            </ul>
            <p>
              <strong>{t('bp_suggestions_educational')}</strong>
            </p>
          </div>

          <div className={styles.disclaimerSection}>
            <h2>🩺 {t('bp_measurement_technique')}</h2>
            <p>{t('bp_technique_intro')}</p>
            <ul>
              <li>{t('bp_technique_validated')}</li>
              <li>{t('bp_technique_cuff')}</li>
              <li>{t('bp_technique_proper')}</li>
              <li>{t('bp_technique_consistent')}</li>
            </ul>
          </div>

          <div className={styles.acceptSection}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={disclaimerAccepted}
                onChange={(e) => setDisclaimerAccepted(e.target.checked)}
              />
              <span>{t('bp_disclaimer_accept')}</span>
            </label>

            {!disclaimerAccepted && (
              <p className={styles.checkboxHint}>☝️ {t('bp_check_to_continue')}</p>
            )}

            <button
              className={styles.continueButton}
              onClick={handleDisclaimerAccept}
              disabled={!disclaimerAccepted}
              type="button"
            >
              {disclaimerAccepted ? `✓ ${t('bp_continue_to_setup')}` : t('bp_continue_check_box')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.setupCard}>
        <h1 className={styles.title}>❤️ {t('bp_setup_title')}</h1>
        <p className={styles.subtitle}>{t('bp_setup_subtitle')}</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* BP Targets */}
          <div className={styles.section}>
            <h3>{t('bp_targets_title')}</h3>
            <p className={styles.hint}>{t('bp_targets_hint')}</p>
            <div className={styles.targetInputs}>
              <div className={styles.targetField}>
                <label>{t('bp_systolic')}</label>
                <div className={styles.inputWithUnit}>
                  <input
                    type="number"
                    value={formData.targets?.systolic}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        targets: { ...formData.targets!, systolic: Number(e.target.value) },
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
              <div className={styles.targetField}>
                <label>{t('bp_diastolic')}</label>
                <div className={styles.inputWithUnit}>
                  <input
                    type="number"
                    value={formData.targets?.diastolic}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        targets: { ...formData.targets!, diastolic: Number(e.target.value) },
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

          {/* Measurement Schedule */}
          <div className={styles.section}>
            <h3>{t('bp_measurement_schedule')}</h3>
            <p className={styles.hint}>{t('bp_schedule_hint')}</p>
            <div className={styles.scheduleOptions}>
              {SCHEDULE_OPTIONS.map((option) => (
                <label key={option.value} className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={formData.measurementSchedule?.includes(option.value as any)}
                    onChange={(e) => {
                      const current = formData.measurementSchedule || [];
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
            <h3>{t('bp_medications_title')}</h3>
            <p className={styles.hint}>{t('bp_medications_hint')}</p>

            <div className={styles.medicationInput}>
              <input
                type="text"
                placeholder={t('bp_medication_name')}
                value={medicationName}
                onChange={(e) => setMedicationName(e.target.value)}
              />
              <select value={medicationClass} onChange={(e) => setMedicationClass(e.target.value)}>
                <option value="">{t('bp_medication_class')}</option>
                {MEDICATION_CLASSES.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
              <button type="button" onClick={handleAddMedication} className={styles.addButton}>
                {t('bp_add')}
              </button>
            </div>

            {formData.medications && formData.medications.length > 0 && (
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
            <h3>{t('bp_health_conditions')}</h3>
            <p className={styles.hint}>{t('bp_conditions_hint')}</p>
            <div className={styles.comorbidityOptions}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={formData.comorbidities?.diabetes}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      comorbidities: {
                        ...formData.comorbidities!,
                        diabetes: e.target.checked,
                      },
                    })
                  }
                />
                <span>{t('bp_diabetes')}</span>
              </label>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={formData.comorbidities?.ckd}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      comorbidities: {
                        ...formData.comorbidities!,
                        ckd: e.target.checked,
                      },
                    })
                  }
                />
                <span>{t('bp_kidney_disease')}</span>
              </label>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={formData.comorbidities?.cad}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      comorbidities: {
                        ...formData.comorbidities!,
                        cad: e.target.checked,
                      },
                    })
                  }
                />
                <span>{t('bp_heart_disease')}</span>
              </label>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={formData.comorbidities?.stroke}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      comorbidities: {
                        ...formData.comorbidities!,
                        stroke: e.target.checked,
                      },
                    })
                  }
                />
                <span>{t('bp_stroke')}</span>
              </label>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={formData.comorbidities?.pregnancy}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      comorbidities: {
                        ...formData.comorbidities!,
                        pregnancy: e.target.checked,
                      },
                    })
                  }
                />
                <span>{t('bp_pregnancy')}</span>
              </label>
            </div>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.actions}>
            <button type="button" onClick={() => navigate('/')} className={styles.cancelButton} disabled={isSubmitting}>
              {t('bp_cancel')}
            </button>
            <button type="submit" className={styles.submitButton} disabled={isSubmitting || isLoading}>
              {isSubmitting ? t('bp_setting_up') : t('bp_start_tracking')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

