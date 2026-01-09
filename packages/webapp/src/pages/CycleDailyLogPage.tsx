import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useActiveProfile } from '../contexts';
import { useCycleData } from '../hooks/useCycleData';
import type { Symptom, Mood, FlowLevel } from '../types/cycle';
import styles from './CycleDailyLogPage.module.css';

const SYMPTOMS: { value: Symptom; label: string; icon: string }[] = [
  { value: 'cramps', label: 'Cramps', icon: '💢' },
  { value: 'headache', label: 'Headache', icon: '🤕' },
  { value: 'bloating', label: 'Bloating', icon: '🎈' },
  { value: 'acne', label: 'Acne', icon: '😣' },
  { value: 'breast_tenderness', label: 'Breast Tenderness', icon: '💛' },
  { value: 'fatigue', label: 'Fatigue', icon: '😴' },
  { value: 'nausea', label: 'Nausea', icon: '🤢' },
  { value: 'back_pain', label: 'Back Pain', icon: '🔙' },
];

const MOODS: { value: Mood; label: string; icon: string }[] = [
  { value: 'happy', label: 'Happy', icon: '😊' },
  { value: 'anxious', label: 'Anxious', icon: '😰' },
  { value: 'irritable', label: 'Irritable', icon: '😠' },
  { value: 'sad', label: 'Sad', icon: '😢' },
  { value: 'energetic', label: 'Energetic', icon: '⚡' },
  { value: 'calm', label: 'Calm', icon: '😌' },
];

const FLOW_LEVELS: { value: FlowLevel; label: string; icon: string }[] = [
  { value: 'none', label: 'None', icon: '⚪' },
  { value: 'light', label: 'Light', icon: '🔴' },
  { value: 'medium', label: 'Medium', icon: '🔴🔴' },
  { value: 'heavy', label: 'Heavy', icon: '🔴🔴🔴' },
];

export function CycleDailyLogPage() {
  const { date } = useParams<{ date: string }>();
  const navigate = useNavigate();
  const { activeProfile } = useActiveProfile();
  
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
        <div className={styles.error}>Invalid date</div>
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
          <h3 className={styles.sectionTitle}>Period</h3>
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
            <h3 className={styles.sectionTitle}>Flow Level</h3>
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
          <h3 className={styles.sectionTitle}>Symptoms</h3>
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
          <h3 className={styles.sectionTitle}>Mood</h3>
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
            placeholder="Add any additional notes about today..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={500}
            rows={4}
          />
          <div className={styles.charCount}>{notes.length}/500</div>
        </section>
        
        {/* Actions */}
        <div className={styles.actions}>
          <button
            className={styles.primaryButton}
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : existingLog ? 'Update Log' : 'Save Log'}
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

