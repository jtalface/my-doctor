import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, Button } from '@components/common';
import { useUser } from '../store/UserContext';
import styles from './ProfileSetupPage.module.css';

type Step = 'personal' | 'medical' | 'lifestyle';

export function ProfileSetupPage() {
  const navigate = useNavigate();
  const { user, updateProfile, setIsNewUser } = useUser();
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
        setError('Failed to save profile. Please try again.');
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
          <h1 className={styles.title}>Welcome, {firstName}! 👋</h1>
          <p className={styles.subtitle}>Let's set up your health profile</p>
        </div>
        <button className={styles.skipButton} onClick={handleSkip}>
          Skip for now
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
            <span className={styles.stepLabel}>Personal</span>
          </div>
          <div className={`${styles.stepItem} ${step === 'medical' ? styles.active : ''} ${step === 'lifestyle' ? styles.completed : ''}`}>
            <span className={styles.stepNumber}>2</span>
            <span className={styles.stepLabel}>Medical</span>
          </div>
          <div className={`${styles.stepItem} ${step === 'lifestyle' ? styles.active : ''}`}>
            <span className={styles.stepNumber}>3</span>
            <span className={styles.stepLabel}>Lifestyle</span>
          </div>
        </div>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <main className={styles.main}>
        {step === 'personal' && (
          <Card variant="default" padding="lg">
            <CardContent>
              <h2 className={styles.sectionTitle}>Personal Information</h2>
              <p className={styles.sectionDesc}>Basic information helps us personalize your health recommendations</p>
              <div className={styles.form}>
                <div className={styles.inputGroup}>
                  <label htmlFor="dob">Date of Birth</label>
                  <input 
                    id="dob"
                    type="date" 
                    value={dateOfBirth} 
                    onChange={e => setDateOfBirth(e.target.value)} 
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label htmlFor="sex">Sex at Birth</label>
                  <select 
                    id="sex"
                    value={sexAtBirth} 
                    onChange={e => setSexAtBirth(e.target.value as 'male' | 'female' | 'other' | '')}
                  >
                    <option value="">Select...</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className={styles.row}>
                  <div className={styles.inputGroup}>
                    <label htmlFor="height">Height (cm)</label>
                    <input 
                      id="height"
                      type="number" 
                      value={heightCm} 
                      onChange={e => setHeightCm(e.target.value)} 
                      placeholder="170" 
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label htmlFor="weight">Weight (kg)</label>
                    <input 
                      id="weight"
                      type="number" 
                      value={weightKg} 
                      onChange={e => setWeightKg(e.target.value)} 
                      placeholder="70" 
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
              <h2 className={styles.sectionTitle}>Medical Information</h2>
              <p className={styles.sectionDesc}>Help us understand your health history for better recommendations</p>
              <div className={styles.form}>
                <div className={styles.inputGroup}>
                  <label htmlFor="allergies">Allergies</label>
                  <input 
                    id="allergies"
                    type="text" 
                    value={allergies} 
                    onChange={e => setAllergies(e.target.value)} 
                    placeholder="Penicillin, Peanuts (comma separated)" 
                  />
                  <span className={styles.hint}>Leave empty if none</span>
                </div>
                <div className={styles.inputGroup}>
                  <label htmlFor="conditions">Chronic Conditions</label>
                  <input 
                    id="conditions"
                    type="text" 
                    value={conditions} 
                    onChange={e => setConditions(e.target.value)} 
                    placeholder="Diabetes, Hypertension (comma separated)" 
                  />
                  <span className={styles.hint}>Leave empty if none</span>
                </div>
                <div className={styles.inputGroup}>
                  <label htmlFor="medications">Current Medications</label>
                  <input 
                    id="medications"
                    type="text" 
                    value={medications} 
                    onChange={e => setMedications(e.target.value)} 
                    placeholder="Vitamin D, Aspirin (comma separated)" 
                  />
                  <span className={styles.hint}>Leave empty if none</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 'lifestyle' && (
          <Card variant="default" padding="lg">
            <CardContent>
              <h2 className={styles.sectionTitle}>Lifestyle</h2>
              <p className={styles.sectionDesc}>Your lifestyle habits help us provide relevant health insights</p>
              <div className={styles.form}>
                <div className={styles.inputGroup}>
                  <label htmlFor="smoking">Smoking Status</label>
                  <select 
                    id="smoking"
                    value={smoking} 
                    onChange={e => setSmoking(e.target.value as 'never' | 'former' | 'current' | '')}
                  >
                    <option value="">Select...</option>
                    <option value="never">Never smoked</option>
                    <option value="former">Former smoker</option>
                    <option value="current">Current smoker</option>
                  </select>
                </div>
                <div className={styles.inputGroup}>
                  <label htmlFor="alcohol">Alcohol Use</label>
                  <select 
                    id="alcohol"
                    value={alcohol} 
                    onChange={e => setAlcohol(e.target.value as 'never' | 'occasional' | 'regular' | 'heavy' | '')}
                  >
                    <option value="">Select...</option>
                    <option value="never">Never</option>
                    <option value="occasional">Occasional (1-2 drinks/week)</option>
                    <option value="regular">Regular (3-7 drinks/week)</option>
                    <option value="heavy">Heavy (8+ drinks/week)</option>
                  </select>
                </div>
                <div className={styles.inputGroup}>
                  <label htmlFor="exercise">Exercise Level</label>
                  <select 
                    id="exercise"
                    value={exercise} 
                    onChange={e => setExercise(e.target.value as 'sedentary' | 'light' | 'moderate' | 'active' | '')}
                  >
                    <option value="">Select...</option>
                    <option value="sedentary">Sedentary (little to no exercise)</option>
                    <option value="light">Light (1-2 days/week)</option>
                    <option value="moderate">Moderate (3-4 days/week)</option>
                    <option value="active">Active (5+ days/week)</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className={styles.actions}>
          {step !== 'personal' && (
            <Button variant="outline" onClick={handleBack} size="lg">
              ← Back
            </Button>
          )}
          <Button onClick={handleNext} isLoading={isLoading} size="lg" fullWidth={step === 'personal'}>
            {step === 'lifestyle' ? 'Complete Setup ✓' : 'Next →'}
          </Button>
        </div>
      </main>
    </div>
  );
}

