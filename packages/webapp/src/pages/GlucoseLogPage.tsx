/**
 * Glucose Log Page
 * 
 * Form for logging glucose readings with optional metadata
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGlucoseData } from '../hooks/useGlucoseData';
import { CONTEXT_OPTIONS, SYMPTOM_OPTIONS, CreateReadingRequest, GlucoseContext } from '../types/glucose';
import styles from './GlucoseLogPage.module.css';

export function GlucoseLogPage() {
  const navigate = useNavigate();
  const { settings, createReading, isLoading } = useGlucoseData();

  const [formData, setFormData] = useState<CreateReadingRequest>({
    timestamp: new Date().toISOString().slice(0, 16), // datetime-local format
    glucoseValue: 0,
    unit: settings?.unitPreference || 'mg/dL',
    context: 'other',
    symptoms: [],
  });

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationWarning, setValidationWarning] = useState('');

  // Redirect if not onboarded
  if (!isLoading && !settings) {
    navigate('/glucose/onboarding');
    return null;
  }

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  const handleGlucoseChange = (value: number) => {
    setFormData({ ...formData, glucoseValue: value });
    setValidationWarning('');

    // Client-side validation warnings
    const unit = formData.unit;
    if (unit === 'mg/dL') {
      if (value < 40 || value > 500) {
        setValidationWarning('This value seems unusual. Please double-check your reading.');
      }
    } else {
      // mmol/L
      if (value < 2.2 || value > 27.8) {
        setValidationWarning('This value seems unusual. Please double-check your reading.');
      }
    }
  };

  const handleSymptomToggle = (symptom: string) => {
    const current = formData.symptoms || [];
    if (current.includes(symptom)) {
      setFormData({
        ...formData,
        symptoms: current.filter((s) => s !== symptom),
      });
    } else {
      setFormData({
        ...formData,
        symptoms: [...current, symptom],
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.glucoseValue <= 0) {
      setError('Please enter a valid glucose value');
      return;
    }

    setIsSubmitting(true);

    try {
      await createReading({
        ...formData,
        timestamp: new Date(formData.timestamp).toISOString(),
      });
      navigate('/glucose/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to log reading');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={() => navigate('/glucose/dashboard')} className={styles.backButton}>
          ← Back
        </button>
        <h1 className={styles.title}>📝 Log Glucose Reading</h1>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Glucose Value (Required) */}
        <div className={styles.primarySection}>
          <div className={styles.field}>
            <label htmlFor="glucoseValue">Glucose Reading *</label>
            <div className={styles.glucoseInput}>
              <input
                type="number"
                id="glucoseValue"
                value={formData.glucoseValue || ''}
                onChange={(e) => handleGlucoseChange(Number(e.target.value))}
                step={formData.unit === 'mmol/L' ? '0.1' : '1'}
                min="0"
                max={formData.unit === 'mmol/L' ? '40' : '700'}
                required
                className={styles.glucoseValueInput}
              />
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value as any })}
                className={styles.unitSelect}
              >
                <option value="mg/dL">mg/dL</option>
                <option value="mmol/L">mmol/L</option>
              </select>
            </div>
            {validationWarning && (
              <div className={styles.warning}>⚠️ {validationWarning}</div>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="timestamp">Date & Time *</label>
            <input
              type="datetime-local"
              id="timestamp"
              value={formData.timestamp}
              onChange={(e) => setFormData({ ...formData, timestamp: e.target.value })}
              max={new Date().toISOString().slice(0, 16)}
              required
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="context">Context *</label>
            <select
              id="context"
              value={formData.context}
              onChange={(e) => setFormData({ ...formData, context: e.target.value as GlucoseContext })}
              required
            >
              {CONTEXT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <small>When was this reading taken?</small>
          </div>
        </div>

        {/* Optional Details */}
        <div className={styles.optionalSection}>
          <h3 className={styles.sectionTitle}>Optional Details</h3>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="carbsGrams">Carbs (grams)</label>
              <input
                type="number"
                id="carbsGrams"
                value={formData.carbsGrams || ''}
                onChange={(e) =>
                  setFormData({ ...formData, carbsGrams: e.target.value ? Number(e.target.value) : undefined })
                }
                min="0"
                max="500"
                placeholder="e.g., 45"
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="activityMinutes">Activity (minutes)</label>
              <input
                type="number"
                id="activityMinutes"
                value={formData.activityMinutes || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    activityMinutes: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                min="0"
                max="1440"
                placeholder="e.g., 30"
              />
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="insulinUnits">Insulin Taken (units) - LOG ONLY</label>
            <input
              type="number"
              id="insulinUnits"
              value={formData.insulinUnits || ''}
              onChange={(e) =>
                setFormData({ ...formData, insulinUnits: e.target.value ? Number(e.target.value) : undefined })
              }
              min="0"
              max="200"
              step="0.1"
              placeholder="e.g., 5.5"
            />
            <small className={styles.disclaimer}>
              ⚠️ For logging only. Never used to suggest dose changes.
            </small>
          </div>

          <div className={styles.field}>
            <label>Symptoms (select all that apply)</label>
            <div className={styles.symptomGrid}>
              {SYMPTOM_OPTIONS.map((symptom) => (
                <label key={symptom} className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={formData.symptoms?.includes(symptom)}
                    onChange={() => handleSymptomToggle(symptom)}
                  />
                  <span>{symptom}</span>
                </label>
              ))}
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any additional notes or observations..."
              rows={3}
              maxLength={500}
            />
            <small>{(formData.notes?.length || 0)} / 500 characters</small>
          </div>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.actions}>
          <button
            type="button"
            onClick={() => navigate('/glucose/dashboard')}
            className={styles.cancelButton}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button type="submit" className={styles.submitButton} disabled={isSubmitting || isLoading}>
            {isSubmitting ? 'Saving...' : 'Save Reading'}
          </button>
        </div>
      </form>
    </div>
  );
}

