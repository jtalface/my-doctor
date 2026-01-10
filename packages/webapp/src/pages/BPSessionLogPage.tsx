/**
 * BP Session Log Page
 * 
 * Log blood pressure readings with multi-reading support and quality checklist
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBPData } from '../hooks/useBPData';
import { useTranslate } from '../i18n';
import { BPReading, MeasurementQuality, CONTEXT_OPTIONS, SYMPTOM_OPTIONS } from '../types/bp';
import styles from './BPSessionLogPage.module.css';

export function BPSessionLogPage() {
  const navigate = useNavigate();
  const t = useTranslate();
  const { createSession, isLoading } = useBPData();

  const [readings, setReadings] = useState<BPReading[]>([{ systolic: 0, diastolic: 0, pulse: undefined }]);
  const [context, setContext] = useState<'resting' | 'after_exercise' | 'stressed' | 'clinic' | 'other'>('resting');
  const [symptoms, setSymptoms] = useState<string[]>(['none']);
  const [quality, setQuality] = useState<MeasurementQuality>({
    rested_5_min: false,
    feet_flat: false,
    back_supported: false,
    arm_supported_heart_level: false,
    correct_cuff_size: undefined,
    no_caffeine_30_min: undefined,
    no_exercise_30_min: undefined,
    no_smoking_30_min: undefined,
  });
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReadingChange = (index: number, field: keyof BPReading, value: number | undefined) => {
    const newReadings = [...readings];
    newReadings[index] = { ...newReadings[index], [field]: value };
    setReadings(newReadings);
  };

  const addReading = () => {
    if (readings.length < 3) {
      setReadings([...readings, { systolic: 0, diastolic: 0, pulse: undefined }]);
    }
  };

  const removeReading = (index: number) => {
    if (readings.length > 1) {
      setReadings(readings.filter((_, i) => i !== index));
    }
  };

  const toggleSymptom = (symptom: string) => {
    if (symptom === 'none') {
      setSymptoms(['none']);
    } else {
      const filtered = symptoms.filter((s) => s !== 'none');
      if (symptoms.includes(symptom)) {
        const newSymptoms = filtered.filter((s) => s !== symptom);
        setSymptoms(newSymptoms.length === 0 ? ['none'] : newSymptoms);
      } else {
        setSymptoms([...filtered, symptom]);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    for (const reading of readings) {
      if (!reading.systolic || !reading.diastolic) {
        setError(t('bp_validation_fill_all'));
        return;
      }
      if (reading.systolic <= reading.diastolic) {
        setError(t('bp_validation_systolic_greater'));
        return;
      }
      if (reading.systolic < 70 || reading.systolic > 300) {
        setError(t('bp_validation_systolic_range'));
        return;
      }
      if (reading.diastolic < 40 || reading.diastolic > 200) {
        setError(t('bp_validation_diastolic_range'));
        return;
      }
      if (reading.pulse && (reading.pulse < 30 || reading.pulse > 220)) {
        setError(t('bp_validation_pulse_range'));
        return;
      }
    }

    setIsSubmitting(true);

    try {
      await createSession({
        timestamp: new Date().toISOString(),
        readings: readings.map((r) => ({
          systolic: r.systolic,
          diastolic: r.diastolic,
          pulse: r.pulse || undefined,
        })),
        context,
        symptoms: symptoms as any,
        measurementQuality: quality,
        notes: notes.trim() || undefined,
      });

      navigate('/bp/dashboard');
    } catch (err: any) {
      setError(err.message || t('bp_failed_save'));
      setIsSubmitting(false);
    }
  };

  const coreQualityScore = [
    quality.rested_5_min,
    quality.feet_flat,
    quality.back_supported,
    quality.arm_supported_heart_level,
  ].filter(Boolean).length;

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>📝 {t('bp_log_title')}</h1>
        <p className={styles.subtitle}>{t('bp_log_subtitle')}</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Measurement Quality Checklist */}
          <div className={styles.section}>
            <h3>{t('bp_preparation_title')}</h3>
            <div className={styles.qualityChecklist}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={quality.rested_5_min}
                  onChange={(e) => setQuality({ ...quality, rested_5_min: e.target.checked })}
                />
                <span>✅ {t('bp_prep_rested')}</span>
              </label>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={quality.feet_flat}
                  onChange={(e) => setQuality({ ...quality, feet_flat: e.target.checked })}
                />
                <span>✅ {t('bp_prep_feet')}</span>
              </label>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={quality.back_supported}
                  onChange={(e) => setQuality({ ...quality, back_supported: e.target.checked })}
                />
                <span>✅ {t('bp_prep_back')}</span>
              </label>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={quality.arm_supported_heart_level}
                  onChange={(e) => setQuality({ ...quality, arm_supported_heart_level: e.target.checked })}
                />
                <span>✅ {t('bp_prep_arm')}</span>
              </label>
            </div>

            <div className={styles.qualityScore}>
              {t('bp_prep_score', { score: coreQualityScore })} {coreQualityScore === 4 ? '✅' : '⚠️'}
            </div>

            <details className={styles.optionalDetails}>
              <summary>{t('bp_optional_factors')}</summary>
              <div className={styles.qualityChecklist}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={quality.correct_cuff_size || false}
                    onChange={(e) => setQuality({ ...quality, correct_cuff_size: e.target.checked })}
                  />
                  <span>{t('bp_correct_cuff')}</span>
                </label>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={quality.no_caffeine_30_min || false}
                    onChange={(e) => setQuality({ ...quality, no_caffeine_30_min: e.target.checked })}
                  />
                  <span>{t('bp_no_caffeine')}</span>
                </label>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={quality.no_exercise_30_min || false}
                    onChange={(e) => setQuality({ ...quality, no_exercise_30_min: e.target.checked })}
                  />
                  <span>{t('bp_no_exercise')}</span>
                </label>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={quality.no_smoking_30_min || false}
                    onChange={(e) => setQuality({ ...quality, no_smoking_30_min: e.target.checked })}
                  />
                  <span>{t('bp_no_smoking')}</span>
                </label>
              </div>
            </details>
          </div>

          {/* Readings */}
          <div className={styles.section}>
            <h3>{t('bp_readings_title')}</h3>
            <p className={styles.hint}>Take 2-3 readings, waiting 1 minute between each</p>

            {readings.map((reading, index) => (
              <div key={index} className={styles.readingRow}>
                <span className={styles.readingLabel}>Reading {index + 1}:</span>
                <div className={styles.readingInputs}>
                  <div className={styles.inputGroup}>
                    <input
                      type="number"
                      placeholder="120"
                      value={reading.systolic || ''}
                      onChange={(e) => handleReadingChange(index, 'systolic', parseInt(e.target.value) || 0)}
                      min="70"
                      max="300"
                      required
                    />
                    <label>Systolic</label>
                  </div>
                  <span className={styles.slash}>/</span>
                  <div className={styles.inputGroup}>
                    <input
                      type="number"
                      placeholder="80"
                      value={reading.diastolic || ''}
                      onChange={(e) => handleReadingChange(index, 'diastolic', parseInt(e.target.value) || 0)}
                      min="40"
                      max="200"
                      required
                    />
                    <label>Diastolic</label>
                  </div>
                  <div className={styles.inputGroup}>
                    <input
                      type="number"
                      placeholder="72"
                      value={reading.pulse || ''}
                      onChange={(e) => handleReadingChange(index, 'pulse', e.target.value ? parseInt(e.target.value) : undefined)}
                      min="30"
                      max="220"
                    />
                    <label>Pulse (optional)</label>
                  </div>
                  {readings.length > 1 && (
                    <button type="button" onClick={() => removeReading(index)} className={styles.removeButton}>
                      ×
                    </button>
                  )}
                </div>
              </div>
            ))}

            {readings.length < 3 && (
              <button type="button" onClick={addReading} className={styles.addReadingButton}>
                + Add Another Reading
              </button>
            )}
          </div>

          {/* Context */}
          <div className={styles.section}>
            <h3>{t('bp_context_title')}</h3>
            <select
              value={context}
              onChange={(e) => setContext(e.target.value as any)}
              className={styles.select}
              required
            >
              {CONTEXT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Symptoms */}
          <div className={styles.section}>
            <h3>{t('bp_symptoms_title')}</h3>
            <div className={styles.symptomGrid}>
              {SYMPTOM_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`${styles.symptomCard} ${symptoms.includes(opt.value) ? styles.selected : ''} ${opt.icon === '⚠️' ? styles.warning : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={symptoms.includes(opt.value)}
                    onChange={() => toggleSymptom(opt.value)}
                  />
                  <span className={styles.symptomIcon}>{opt.icon}</span>
                  <span className={styles.symptomLabel}>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className={styles.section}>
            <h3>{t('bp_notes_title')}</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional context (e.g., 'before breakfast', 'felt anxious')..."
              className={styles.textarea}
              maxLength={500}
              rows={3}
            />
            <div className={styles.charCount}>{notes.length}/500</div>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.actions}>
            <button type="button" onClick={() => navigate('/bp/dashboard')} className={styles.cancelButton} disabled={isSubmitting}>
              {t('bp_cancel')}
            </button>
            <button type="submit" className={styles.submitButton} disabled={isSubmitting || isLoading}>
              {isSubmitting ? t('bp_saving') : t('bp_save_session')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

