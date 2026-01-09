/**
 * BP Onboarding Page
 * 
 * CRITICAL: User must accept disclaimers before using BP tracking
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBPData } from '../hooks/useBPData';
import { CreateSettingsRequest, MEDICATION_CLASSES, SCHEDULE_OPTIONS } from '../types/bp';
import styles from './BPOnboardingPage.module.css';

export function BPOnboardingPage() {
  const navigate = useNavigate();
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
      setError(err.message || 'Failed to complete onboarding');
      setIsSubmitting(false);
    }
  };

  if (step === 1) {
    return (
      <div className={styles.container}>
        <div className={styles.disclaimerCard}>
          <h1 className={styles.title}>❤️ PressurePal - Important Safety Information</h1>

          <div className={styles.disclaimerSection}>
            <h2>⚠️ Medical Disclaimer</h2>
            <p>
              <strong>This application is for tracking and educational purposes only.</strong> It is NOT intended to:
            </p>
            <ul>
              <li>Provide medical advice, diagnosis, or treatment</li>
              <li>Replace professional medical care or monitoring</li>
              <li>Recommend changes to blood pressure medications or doses</li>
              <li>Substitute for medical equipment prescribed by your healthcare provider</li>
            </ul>
          </div>

          <div className={styles.disclaimerSection}>
            <h2>🏥 Always Consult Your Healthcare Provider</h2>
            <p>You should ALWAYS:</p>
            <ul>
              <li>Follow your healthcare provider's treatment plan</li>
              <li>Take medications exactly as prescribed</li>
              <li>Seek immediate medical attention for emergencies</li>
              <li>Discuss blood pressure patterns and concerns with your medical team</li>
              <li>Get approval before changing your diet, exercise, or medication routine</li>
            </ul>
          </div>

          <div className={styles.disclaimerSection}>
            <h2>🚨 When to Call 911</h2>
            <p>
              <strong>Call 911 or go to the emergency room immediately if you have high blood pressure WITH:</strong>
            </p>
            <ul>
              <li>Chest pain or pressure</li>
              <li>Severe shortness of breath</li>
              <li>Severe headache</li>
              <li>Vision changes (blurred, spots, loss of vision)</li>
              <li>Confusion or difficulty speaking</li>
              <li>Weakness or numbness (especially on one side)</li>
            </ul>
          </div>

          <div className={styles.disclaimerSection}>
            <h2>📊 What This App Does</h2>
            <p>PressurePal helps you:</p>
            <ul>
              <li>Track blood pressure readings at home</li>
              <li>Record measurement quality and context</li>
              <li>Identify patterns and trends</li>
              <li>View educational suggestions based on transparent rules</li>
              <li>Generate reports to share with your healthcare team</li>
            </ul>
            <p>
              <strong>All suggestions are educational and include clear explanations.</strong> We NEVER recommend medication changes.
            </p>
          </div>

          <div className={styles.disclaimerSection}>
            <h2>🩺 Proper Measurement Technique</h2>
            <p>For accurate readings:</p>
            <ul>
              <li>Use a validated, properly calibrated BP monitor</li>
              <li>Use the correct cuff size for your arm</li>
              <li>Follow proper technique (we'll guide you)</li>
              <li>Take readings at consistent times</li>
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
                I have read and understand the above information. I understand this app provides tracking and educational information only and does not replace medical advice. I will consult my healthcare provider for all medical decisions and will seek emergency care if I experience concerning symptoms.
              </span>
            </label>

            {!disclaimerAccepted && (
              <p className={styles.checkboxHint}>☝️ Please check the box above to continue</p>
            )}

            <button
              className={styles.continueButton}
              onClick={handleDisclaimerAccept}
              disabled={!disclaimerAccepted}
              type="button"
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
        <h1 className={styles.title}>❤️ Setup Your BP Tracking</h1>
        <p className={styles.subtitle}>This helps us provide personalized insights</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* BP Targets */}
          <div className={styles.section}>
            <h3>Blood Pressure Targets</h3>
            <p className={styles.hint}>Default: 130/80 mmHg (discuss with your doctor)</p>
            <div className={styles.targetInputs}>
              <div className={styles.targetField}>
                <label>Systolic (top number)</label>
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
                <label>Diastolic (bottom number)</label>
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
            <h3>Measurement Schedule</h3>
            <p className={styles.hint}>When will you check your blood pressure?</p>
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
            <h3>Blood Pressure Medications (Optional)</h3>
            <p className={styles.hint}>For tracking only. We do NOT use this to suggest dose changes.</p>

            <div className={styles.medicationInput}>
              <input
                type="text"
                placeholder="Medication name (e.g., Lisinopril)"
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
            <h3>Health Conditions (Optional)</h3>
            <p className={styles.hint}>Select any that apply - this helps us provide relevant information</p>
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
                <span>Diabetes</span>
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
                <span>Chronic Kidney Disease</span>
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
                <span>Heart Disease (CAD/MI)</span>
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
                <span>Stroke/TIA History</span>
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
                <span>Currently Pregnant</span>
              </label>
            </div>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.actions}>
            <button type="button" onClick={() => navigate('/')} className={styles.cancelButton} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className={styles.submitButton} disabled={isSubmitting || isLoading}>
              {isSubmitting ? 'Setting up...' : 'Start Tracking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

