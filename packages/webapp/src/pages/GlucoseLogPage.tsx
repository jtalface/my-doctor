/**
 * Glucose Log Page
 * 
 * Form for logging glucose readings with optional metadata
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGlucoseData } from '../hooks/useGlucoseData';
import { useTranslate } from '../i18n';
import { CONTEXT_OPTIONS, SYMPTOM_OPTIONS, CreateReadingRequest, GlucoseContext } from '../types/glucose';
import styles from './GlucoseLogPage.module.css';

export function GlucoseLogPage() {
  const navigate = useNavigate();
  const t = useTranslate();
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
  const symptomLabelMap: Record<string, string> = {
    'Shaky/Trembling': t('glucose_symptom_shaky_trembling'),
    Sweating: t('glucose_symptom_sweating'),
    Hungry: t('glucose_symptom_hungry'),
    'Dizzy/Lightheaded': t('glucose_symptom_dizzy_lightheaded'),
    Confused: t('glucose_symptom_confused'),
    'Blurred vision': t('glucose_symptom_blurred_vision'),
    Headache: t('glucose_symptom_headache'),
    'Fatigue/Tired': t('glucose_symptom_fatigue_tired'),
    Thirsty: t('glucose_symptom_thirsty'),
    'Frequent urination': t('glucose_symptom_frequent_urination'),
    Nausea: t('glucose_symptom_nausea'),
    'Rapid breathing': t('glucose_symptom_rapid_breathing'),
    'Fruity breath odor': t('glucose_symptom_fruity_breath_odor'),
    'Abdominal pain': t('glucose_symptom_abdominal_pain'),
  };

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
        setValidationWarning(t('glucose_validation_warning'));
      }
    } else {
      // mmol/L
      if (value < 2.2 || value > 27.8) {
        setValidationWarning(t('glucose_validation_warning'));
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
      setError(t('glucose_validation_required'));
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
      setError(err.message || t('glucose_failed_save'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={() => navigate('/glucose/dashboard')} className={styles.backButton}>
          ← {t('glucose_back')}
        </button>
        <h1 className={styles.title}>📝 {t('glucose_log_title')}</h1>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Glucose Value (Required) */}
        <div className={styles.primarySection}>
          <div className={styles.field}>
            <label htmlFor="glucoseValue">{t('glucose_reading_required')}</label>
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
            <label htmlFor="timestamp">{t('glucose_date_time_required')}</label>
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
            <label htmlFor="context">{t('glucose_context_required')}</label>
            <select
              id="context"
              value={formData.context}
              onChange={(e) => setFormData({ ...formData, context: e.target.value as GlucoseContext })}
              required
            >
              {CONTEXT_OPTIONS.map((option) => {
                const contextLabelMap: Record<string, string> = {
                  fasting: t('glucose_fasting'),
                  pre_meal: t('glucose_pre_meal'),
                  post_meal: t('glucose_post_meal'),
                  bedtime: t('glucose_bedtime'),
                  overnight: t('glucose_overnight'),
                  other: t('glucose_other'),
                };
                return (
                <option key={option.value} value={option.value}>
                  {contextLabelMap[option.value] || option.label}
                </option>
                );
              })}
            </select>
            <small>{t('glucose_context_help')}</small>
          </div>
        </div>

        {/* Optional Details */}
        <div className={styles.optionalSection}>
          <h3 className={styles.sectionTitle}>{t('glucose_optional_details')}</h3>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="carbsGrams">{t('glucose_carbs_grams')}</label>
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
              <label htmlFor="activityMinutes">{t('glucose_activity_minutes')}</label>
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
            <label htmlFor="insulinUnits">{t('glucose_insulin_units')}</label>
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
              ⚠️ {t('glucose_insulin_disclaimer')}
            </small>
          </div>

          <div className={styles.field}>
            <label>{t('glucose_symptoms')}</label>
            <div className={styles.symptomGrid}>
              {SYMPTOM_OPTIONS.map((symptom) => (
                <label key={symptom} className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={formData.symptoms?.includes(symptom)}
                    onChange={() => handleSymptomToggle(symptom)}
                  />
                  <span>{symptomLabelMap[symptom] || symptom}</span>
                </label>
              ))}
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="notes">{t('glucose_notes')}</label>
            <textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder={t('glucose_notes_placeholder')}
              rows={3}
              maxLength={500}
            />
            <small>{t('glucose_char_count', { count: formData.notes?.length || 0 })}</small>
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
            {t('glucose_cancel')}
          </button>
          <button type="submit" className={styles.submitButton} disabled={isSubmitting || isLoading}>
            {isSubmitting ? t('glucose_saving') : t('glucose_save_reading')}
          </button>
        </div>
      </form>
    </div>
  );
}

