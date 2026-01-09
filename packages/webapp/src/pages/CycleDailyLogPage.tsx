import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useActiveProfile } from '../contexts';
import { useCycleData } from '../hooks/useCycleData';
import { useTranslate } from '../i18n';
import type { Symptom, Mood, FlowLevel } from '../types/cycle';
import styles from './CycleDailyLogPage.module.css';

export function CycleDailyLogPage() {
  const { date } = useParams<{ date: string }>();
  const navigate = useNavigate();
  const t = useTranslate();
  const { activeProfile } = useActiveProfile();
  
  // Translation-aware constants
  const SYMPTOMS: { value: Symptom; label: string; icon: string }[] = [
    { value: 'cramps', label: t('cycle_symptom_cramps'), icon: '💢' },
    { value: 'headache', label: t('cycle_symptom_headache'), icon: '🤕' },
    { value: 'bloating', label: t('cycle_symptom_bloating'), icon: '🎈' },
    { value: 'acne', label: t('cycle_symptom_acne'), icon: '😣' },
    { value: 'breast_tenderness', label: t('cycle_symptom_breast_tenderness'), icon: '💛' },
    { value: 'fatigue', label: t('cycle_symptom_fatigue'), icon: '😴' },
    { value: 'nausea', label: t('cycle_symptom_nausea'), icon: '🤢' },
    { value: 'back_pain', label: t('cycle_symptom_back_pain'), icon: '🔙' },
  ];

  const MOODS: { value: Mood; label: string; icon: string }[] = [
    { value: 'happy', label: t('cycle_mood_happy'), icon: '😊' },
    { value: 'anxious', label: t('cycle_mood_anxious'), icon: '😰' },
    { value: 'irritable', label: t('cycle_mood_irritable'), icon: '😠' },
    { value: 'sad', label: t('cycle_mood_sad'), icon: '😢' },
    { value: 'energetic', label: t('cycle_mood_energetic'), icon: '⚡' },
    { value: 'calm', label: t('cycle_mood_calm'), icon: '😌' },
  ];

  const FLOW_LEVELS: { value: FlowLevel; label: string; icon: string }[] = [
    { value: 'none', label: t('cycle_flow_none'), icon: '⚪' },
    { value: 'light', label: t('cycle_flow_light'), icon: '🔴' },
    { value: 'medium', label: t('cycle_flow_medium'), icon: '🔴🔴' },
    { value: 'heavy', label: t('cycle_flow_heavy'), icon: '🔴🔴🔴' },
  ];
  
  const {
    dailyLogs,
    createOrUpdateLog,
    deleteLog,
    loadDailyLogs,
  } = useCycleData({
    userId: activeProfile?.id,
    autoLoad: false,
  });
  
  // Find existing log for this date
  const existingLog = dailyLogs.find(log => log.date === date);
  
  // Form state
  const [isPeriodDay, setIsPeriodDay] = useState(existingLog?.isPeriodDay || false);
  const [flowLevel, setFlowLevel] = useState<FlowLevel>(existingLog?.flowLevel || 'none');
  const [symptoms, setSymptoms] = useState<Symptom[]>(existingLog?.symptoms || []);
  const [mood, setMood] = useState<Mood[]>(existingLog?.mood || []);
  const [notes, setNotes] = useState(existingLog?.notes || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Load log for this date
  useEffect(() => {
    if (date) {
      loadDailyLogs(date, date);
    }
  }, [date, loadDailyLogs]);
  
  // Update form when log changes
  useEffect(() => {
    if (existingLog) {
      setIsPeriodDay(existingLog.isPeriodDay);
      setFlowLevel(existingLog.flowLevel);
      setSymptoms(existingLog.symptoms);
      setMood(existingLog.mood);
      setNotes(existingLog.notes);
    }
  }, [existingLog]);
  
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric' 
    });
  };
  
  const toggleSymptom = (symptom: Symptom) => {
    setSymptoms(prev => 
      prev.includes(symptom)
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
  };
  
  const toggleMood = (m: Mood) => {
    setMood(prev => 
      prev.includes(m)
        ? prev.filter(x => x !== m)
        : [...prev, m]
    );
  };
  
  const handleSave = async () => {
    if (!date) return;
    
    setIsSaving(true);
    try {
      await createOrUpdateLog({
        date,
        isPeriodDay,
        flowLevel,
        symptoms,
        mood,
        notes,
      });
      
      // Navigate back
      navigate('/cycle');
    } catch (error) {
      console.error('Failed to save log:', error);
      alert('Failed to save log. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleDelete = async () => {
    if (!date || !existingLog) return;
    
    if (!confirm('Are you sure you want to delete this log?')) {
      return;
    }
    
    setIsDeleting(true);
    try {
      await deleteLog(date);
      navigate('/cycle');
    } catch (error) {
      console.error('Failed to delete log:', error);
      alert('Failed to delete log. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };
  
  if (!date) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{t('cycle_invalid_date')}</div>
      </div>
    );
  }
  
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate('/cycle')}>
          ←
        </button>
        <h1 className={styles.title}>Daily Log</h1>
        <div className={styles.headerRight} />
      </header>
      
      <main className={styles.main}>
        <div className={styles.dateHeader}>
          <h2>{formatDate(date)}</h2>
        </div>
        
        {/* Period Day Toggle */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>{t('cycle_period_section')}</h3>
          <div className={styles.toggleContainer}>
            <button
              className={`${styles.toggleButton} ${isPeriodDay ? styles.active : ''}`}
              onClick={() => setIsPeriodDay(!isPeriodDay)}
              type="button"
            >
              <span className={styles.toggleIcon}>🩸</span>
              <span>Period Day</span>
            </button>
          </div>
        </section>
        
        {/* Flow Level */}
        {isPeriodDay && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>{t('cycle_flow_section')}</h3>
            <div className={styles.optionGrid}>
              {FLOW_LEVELS.map(level => (
                <button
                  key={level.value}
                  className={`${styles.optionButton} ${flowLevel === level.value ? styles.active : ''}`}
                  onClick={() => setFlowLevel(level.value)}
                  type="button"
                >
                  <span className={styles.optionIcon}>{level.icon}</span>
                  <span className={styles.optionLabel}>{level.label}</span>
                </button>
              ))}
            </div>
          </section>
        )}
        
        {/* Symptoms */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>{t('cycle_symptoms_section')}</h3>
          <div className={styles.optionGrid}>
            {SYMPTOMS.map(symptom => (
              <button
                key={symptom.value}
                className={`${styles.optionButton} ${symptoms.includes(symptom.value) ? styles.active : ''}`}
                onClick={() => toggleSymptom(symptom.value)}
                type="button"
              >
                <span className={styles.optionIcon}>{symptom.icon}</span>
                <span className={styles.optionLabel}>{symptom.label}</span>
              </button>
            ))}
          </div>
        </section>
        
        {/* Mood */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>{t('cycle_mood_section')}</h3>
          <div className={styles.optionGrid}>
            {MOODS.map(m => (
              <button
                key={m.value}
                className={`${styles.optionButton} ${mood.includes(m.value) ? styles.active : ''}`}
                onClick={() => toggleMood(m.value)}
                type="button"
              >
                <span className={styles.optionIcon}>{m.icon}</span>
                <span className={styles.optionLabel}>{m.label}</span>
              </button>
            ))}
          </div>
        </section>
        
        {/* Notes */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Notes</h3>
          <textarea
            className={styles.textarea}
            placeholder={t('cycle_notes_placeholder')}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={500}
            rows={4}
          />
          <div className={styles.charCount}>{t('cycle_char_count', { count: notes.length })}</div>
        </section>
        
        {/* Actions */}
        <div className={styles.actions}>
          <button
            className={styles.primaryButton}
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? t('cycle_settings_saving') : t('cycle_save_log')}
          </button>
          
          {existingLog && (
            <button
              className={styles.deleteButton}
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Log'}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}

