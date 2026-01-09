/**
 * Glucose Onboarding Page
 * 
 * CRITICAL: User must accept disclaimers before accessing glucose tracking
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGlucoseData } from '../hooks/useGlucoseData';
import { DIABETES_TYPES, UNIT_OPTIONS, CreateSettingsRequest } from '../types/glucose';
import styles from './GlucoseOnboardingPage.module.css';

export function GlucoseOnboardingPage() {
  const navigate = useNavigate();
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
      setError(err.message || 'Failed to complete onboarding');
      setIsSubmitting(false);
    }
  };

  if (step === 1) {
    return (
      <div className={styles.container}>
        <div className={styles.disclaimerCard}>
          <h1 className={styles.title}>🩸 GlucoGuide - Important Information</h1>

          <div className={styles.disclaimerSection}>
            <h2>⚠️ Medical Disclaimer</h2>
            <p>
              <strong>This application is for informational and educational purposes only.</strong> It is NOT intended to:
            </p>
            <ul>
              <li>Provide medical advice, diagnosis, or treatment</li>
              <li>Replace professional medical care or consultation</li>
              <li>Recommend changes to medications or insulin doses</li>
              <li>Substitute for blood glucose monitoring prescribed by your healthcare provider</li>
            </ul>
          </div>

          <div className={styles.disclaimerSection}>
            <h2>🏥 Always Consult Your Healthcare Provider</h2>
            <p>You should ALWAYS:</p>
            <ul>
              <li>Follow your healthcare provider's treatment plan</li>
              <li>Consult your doctor before making any changes to medications</li>
              <li>Seek immediate medical attention for emergencies</li>
              <li>Discuss patterns and concerns with your diabetes care team</li>
            </ul>
          </div>

          <div className={styles.disclaimerSection}>
            <h2>🚨 Emergency Situations</h2>
            <p>
              <strong>Call 911 or seek immediate medical care if you experience:</strong>
            </p>
            <ul>
              <li>Very low blood sugar with confusion, unconsciousness, or seizures</li>
              <li>Very high blood sugar with nausea, vomiting, rapid breathing, or confusion</li>
              <li>Any symptoms that concern you</li>
            </ul>
          </div>

          <div className={styles.disclaimerSection}>
            <h2>📊 What This App Does</h2>
            <p>GlucoGuide helps you:</p>
            <ul>
              <li>Track glucose readings and identify patterns</li>
              <li>Log meals, activity, and symptoms</li>
              <li>View educational suggestions based on transparent rules</li>
              <li>Generate reports to share with your healthcare team</li>
            </ul>
            <p>
              <strong>All suggestions are educational and include clear explanations.</strong> We never recommend medication or insulin dose changes.
            </p>
          </div>

          <div className={styles.disclaimerSection}>
            <h2>🔒 Privacy & Data</h2>
            <p>Your glucose data is:</p>
            <ul>
              <li>Stored securely and encrypted</li>
              <li>Only accessible to you (and guardians for dependents)</li>
              <li>Exportable at any time</li>
              <li>Deletable at any time from Settings</li>
            </ul>
          </div>

          <div className={styles.acceptSection}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={disclaimerAccepted}
                onChange={(e) => setDisclaimerAccepted(e.target.checked)}
              />
              <span>
                I have read and understand the above information. I understand this app provides educational information only and does not replace medical advice. I will consult my healthcare provider for all medical decisions.
              </span>
            </label>

            {!disclaimerAccepted && (
              <p className={styles.checkboxHint}>
                ☝️ Please check the box above to continue
              </p>
            )}

            <button
              className={styles.continueButton}
              onClick={handleDisclaimerAccept}
              disabled={!disclaimerAccepted}
            >
              {disclaimerAccepted ? '✓ Continue to Setup' : 'Continue to Setup (check box above)'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.setupCard}>
        <h1 className={styles.title}>🩸 Setup Your Glucose Tracking</h1>
        <p className={styles.subtitle}>This information helps us provide personalized insights</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Diabetes Type */}
          <div className={styles.field}>
            <label htmlFor="diabetesType">Diabetes Type *</label>
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
            <label htmlFor="unitPreference">Glucose Unit *</label>
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
            <small>mg/dL is used in the US; mmol/L is used internationally</small>
          </div>

          {/* Target Ranges */}
          <div className={styles.fieldGroup}>
            <h3>Target Ranges ({formData.unitPreference})</h3>
            <p className={styles.hint}>These are typical defaults. You can adjust them in Settings.</p>

            <div className={styles.rangeGrid}>
              <div className={styles.rangeField}>
                <label>Fasting (morning)</label>
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
                  <span>to</span>
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
                <label>Post-meal (2 hours)</label>
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
                  <span>to</span>
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
            <h3>Medications (Optional)</h3>
            <p className={styles.hint}>List your diabetes medications. We do NOT use this to suggest dose changes.</p>

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

            {formData.medications && formData.medications.length > 0 && (
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

          <div className={styles.actions}>
            <button
              type="button"
              onClick={() => navigate('/')}
              className={styles.cancelButton}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={isSubmitting || isLoading}
            >
              {isSubmitting ? 'Setting up...' : 'Start Tracking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

