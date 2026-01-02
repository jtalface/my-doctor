import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, Button } from '@components/common';
import { useAuth } from '../auth';
import { useTranslate } from '../i18n';
import styles from './ProfileSetupPage.module.css';

type Step = 'personal' | 'medical' | 'lifestyle';

export function ProfileSetupPage() {
  const navigate = useNavigate();
  const { user, updateProfile, setIsNewUser } = useAuth();
  const t = useTranslate();
  const [step, setStep] = useState<Step>('personal');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Personal Info
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [sexAtBirth, setSexAtBirth] = useState<'male' | 'female' | 'other' | ''>('');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');

  // Medical Info
  const [allergies, setAllergies] = useState('');
  const [conditions, setConditions] = useState('');
  const [medications, setMedications] = useState('');

  // Lifestyle
  const [smoking, setSmoking] = useState<'never' | 'former' | 'current' | ''>('');
  const [alcohol, setAlcohol] = useState<'never' | 'occasional' | 'regular' | 'heavy' | ''>('');
  const [exercise, setExercise] = useState<'sedentary' | 'light' | 'moderate' | 'active' | ''>('');

  const handleNext = async () => {
    if (step === 'personal') {
      setStep('medical');
    } else if (step === 'medical') {
      setStep('lifestyle');
    } else {
      setIsLoading(true);
      setError('');
      try {
        await updateProfile({
          demographics: {
            dateOfBirth: dateOfBirth || undefined,
            sexAtBirth: sexAtBirth || undefined,
            heightCm: heightCm ? parseFloat(heightCm) : undefined,
            weightKg: weightKg ? parseFloat(weightKg) : undefined,
          },
          medicalHistory: {
            allergies: allergies.split(',').map(s => s.trim()).filter(Boolean),
            chronicConditions: conditions.split(',').map(s => s.trim()).filter(Boolean),
            medications: medications.split(',').map(s => s.trim()).filter(Boolean),
            surgeries: [],
            familyHistory: [],
          },
          lifestyle: {
            smoking: smoking || undefined,
            alcohol: alcohol || undefined,
            exercise: exercise || undefined,
          },
        });
        setIsNewUser(false);
        navigate('/dashboard');
      } catch (err) {
        console.error('Failed to save profile:', err);
        setError(t('profile_setup_error'));
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleBack = () => {
    if (step === 'medical') setStep('personal');
    else if (step === 'lifestyle') setStep('medical');
  };

  const handleSkip = () => {
    setIsNewUser(false);
    navigate('/dashboard');
  };

  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>{t('profile_setup_welcome')}, {firstName}! 👋</h1>
          <p className={styles.subtitle}>{t('profile_setup_subtitle')}</p>
        </div>
        <button className={styles.skipButton} onClick={handleSkip}>
          {t('common_skip')}
        </button>
      </header>

      <div className={styles.progress}>
        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill} 
            style={{ width: step === 'personal' ? '33%' : step === 'medical' ? '66%' : '100%' }}
          />
        </div>
        <div className={styles.steps}>
          <div className={`${styles.stepItem} ${step === 'personal' ? styles.active : ''} ${step !== 'personal' ? styles.completed : ''}`}>
            <span className={styles.stepNumber}>1</span>
            <span className={styles.stepLabel}>{t('profile_setup_step_personal')}</span>
          </div>
          <div className={`${styles.stepItem} ${step === 'medical' ? styles.active : ''} ${step === 'lifestyle' ? styles.completed : ''}`}>
            <span className={styles.stepNumber}>2</span>
            <span className={styles.stepLabel}>{t('profile_setup_step_medical')}</span>
          </div>
          <div className={`${styles.stepItem} ${step === 'lifestyle' ? styles.active : ''}`}>
            <span className={styles.stepNumber}>3</span>
            <span className={styles.stepLabel}>{t('profile_setup_step_lifestyle')}</span>
          </div>
        </div>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <main className={styles.main}>
        {step === 'personal' && (
          <Card variant="default" padding="lg">
            <CardContent>
              <h2 className={styles.sectionTitle}>{t('profile_setup_personal_title')}</h2>
              <p className={styles.sectionDesc}>{t('profile_setup_personal_desc')}</p>
              <div className={styles.form}>
                <div className={styles.inputGroup}>
                  <label htmlFor="dob">{t('profile_setup_dob_label')}</label>
                  <input 
                    id="dob"
                    type="date" 
                    value={dateOfBirth} 
                    onChange={e => setDateOfBirth(e.target.value)} 
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label htmlFor="sex">{t('profile_setup_sex_label')}</label>
                  <select 
                    id="sex"
                    value={sexAtBirth} 
                    onChange={e => setSexAtBirth(e.target.value as 'male' | 'female' | 'other' | '')}
                  >
                    <option value="">{t('profile_setup_sex_placeholder')}</option>
                    <option value="male">{t('profile_setup_sex_male')}</option>
                    <option value="female">{t('profile_setup_sex_female')}</option>
                    <option value="other">{t('profile_setup_sex_other')}</option>
                  </select>
                </div>
                <div className={styles.row}>
                  <div className={styles.inputGroup}>
                    <label htmlFor="height">{t('profile_setup_height_label')}</label>
                    <input 
                      id="height"
                      type="number" 
                      value={heightCm} 
                      onChange={e => setHeightCm(e.target.value)} 
                      placeholder={t('profile_setup_height_placeholder')}
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label htmlFor="weight">{t('profile_setup_weight_label')}</label>
                    <input 
                      id="weight"
                      type="number" 
                      value={weightKg} 
                      onChange={e => setWeightKg(e.target.value)} 
                      placeholder={t('profile_setup_weight_placeholder')}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 'medical' && (
          <Card variant="default" padding="lg">
            <CardContent>
              <h2 className={styles.sectionTitle}>{t('profile_setup_medical_title')}</h2>
              <p className={styles.sectionDesc}>{t('profile_setup_medical_desc')}</p>
              <div className={styles.form}>
                <div className={styles.inputGroup}>
                  <label htmlFor="allergies">{t('profile_setup_allergies_label')}</label>
                  <input 
                    id="allergies"
                    type="text" 
                    value={allergies} 
                    onChange={e => setAllergies(e.target.value)} 
                    placeholder={t('profile_setup_allergies_placeholder')}
                  />
                  <span className={styles.hint}>{t('profile_setup_hint_empty')}</span>
                </div>
                <div className={styles.inputGroup}>
                  <label htmlFor="conditions">{t('profile_setup_conditions_label')}</label>
                  <input 
                    id="conditions"
                    type="text" 
                    value={conditions} 
                    onChange={e => setConditions(e.target.value)} 
                    placeholder={t('profile_setup_conditions_placeholder')}
                  />
                  <span className={styles.hint}>{t('profile_setup_hint_empty')}</span>
                </div>
                <div className={styles.inputGroup}>
                  <label htmlFor="medications">{t('profile_setup_medications_label')}</label>
                  <input 
                    id="medications"
                    type="text" 
                    value={medications} 
                    onChange={e => setMedications(e.target.value)} 
                    placeholder={t('profile_setup_medications_placeholder')}
                  />
                  <span className={styles.hint}>{t('profile_setup_hint_empty')}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 'lifestyle' && (
          <Card variant="default" padding="lg">
            <CardContent>
              <h2 className={styles.sectionTitle}>{t('profile_setup_lifestyle_title')}</h2>
              <p className={styles.sectionDesc}>{t('profile_setup_lifestyle_desc')}</p>
              <div className={styles.form}>
                <div className={styles.inputGroup}>
                  <label htmlFor="smoking">{t('profile_setup_smoking_label')}</label>
                  <select 
                    id="smoking"
                    value={smoking} 
                    onChange={e => setSmoking(e.target.value as 'never' | 'former' | 'current' | '')}
                  >
                    <option value="">{t('profile_setup_sex_placeholder')}</option>
                    <option value="never">{t('profile_setup_smoking_never')}</option>
                    <option value="former">{t('profile_setup_smoking_former')}</option>
                    <option value="current">{t('profile_setup_smoking_current')}</option>
                  </select>
                </div>
                <div className={styles.inputGroup}>
                  <label htmlFor="alcohol">{t('profile_setup_alcohol_label')}</label>
                  <select 
                    id="alcohol"
                    value={alcohol} 
                    onChange={e => setAlcohol(e.target.value as 'never' | 'occasional' | 'regular' | 'heavy' | '')}
                  >
                    <option value="">{t('profile_setup_sex_placeholder')}</option>
                    <option value="never">{t('profile_setup_alcohol_never')}</option>
                    <option value="occasional">{t('profile_setup_alcohol_occasional')}</option>
                    <option value="regular">{t('profile_setup_alcohol_regular')}</option>
                    <option value="heavy">{t('profile_setup_alcohol_heavy')}</option>
                  </select>
                </div>
                <div className={styles.inputGroup}>
                  <label htmlFor="exercise">{t('profile_setup_exercise_label')}</label>
                  <select 
                    id="exercise"
                    value={exercise} 
                    onChange={e => setExercise(e.target.value as 'sedentary' | 'light' | 'moderate' | 'active' | '')}
                  >
                    <option value="">{t('profile_setup_sex_placeholder')}</option>
                    <option value="sedentary">{t('profile_setup_exercise_sedentary')}</option>
                    <option value="light">{t('profile_setup_exercise_light')}</option>
                    <option value="moderate">{t('profile_setup_exercise_moderate')}</option>
                    <option value="active">{t('profile_setup_exercise_active')}</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className={styles.actions}>
          {step !== 'personal' && (
            <Button variant="outline" onClick={handleBack} size="lg">
              {t('common_previous')}
            </Button>
          )}
          <Button onClick={handleNext} isLoading={isLoading} size="lg" fullWidth={step === 'personal'}>
            {step === 'lifestyle' ? t('profile_setup_complete_button') : t('common_next')}
          </Button>
        </div>
      </main>
    </div>
  );
}

