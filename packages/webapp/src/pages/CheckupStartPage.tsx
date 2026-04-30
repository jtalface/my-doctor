import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, Button } from '@components/common';
import { useActiveProfile } from '../contexts';
import { useAuth } from '../auth';
import { useTranslate } from '../i18n';
import type { CheckupSessionType } from '../services/api';
import styles from './CheckupStartPage.module.css';

export function CheckupStartPage() {
  const navigate = useNavigate();
  const t = useTranslate();
  const { user } = useAuth();
  const { dependents } = useActiveProfile();
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [showSessionTypes, setShowSessionTypes] = useState(false);
  const [selectionError, setSelectionError] = useState<string | null>(null);

  const patientOptions = useMemo(() => {
    const selfName = user?.name || t('checkup_start_patient_self_fallback');
    const options = [{ id: user?.id || '', name: selfName }];
    for (const dependent of dependents) {
      options.push({ id: dependent.id, name: dependent.name });
    }
    return options.filter((option) => option.id);
  }, [user?.id, user?.name, dependents, t]);

  const hasDependents = dependents.length > 0;
  const shouldShowPatientSelection = hasDependents;

  useEffect(() => {
    if (!hasDependents && user?.id) {
      setSelectedPatientId(user.id);
      setShowSessionTypes(true);
      setSelectionError(null);
      return;
    }

    if (hasDependents && !selectedPatientId) {
      setShowSessionTypes(false);
    }
  }, [hasDependents, user?.id, selectedPatientId]);

  const sessionTypes: Array<{
    id: CheckupSessionType;
    icon: string;
    title: string;
    description: string;
    duration: string;
    featured: boolean;
  }> = [
    {
      id: 'annual-checkup',
      icon: '🩺',
      title: t('checkup_start_annual_title'),
      description: t('checkup_start_annual_desc'),
      duration: t('checkup_start_annual_duration'),
      featured: true,
    },
    {
      id: 'symptom-check',
      icon: '🤒',
      title: t('checkup_start_symptom_title'),
      description: t('checkup_start_symptom_desc'),
      duration: t('checkup_start_symptom_duration'),
      featured: false,
    },
    {
      id: 'medication-review',
      icon: '💊',
      title: t('checkup_start_medication_title'),
      description: t('checkup_start_medication_desc'),
      duration: t('checkup_start_medication_duration'),
      featured: false,
    },
  ];

  const handleStartSession = (type: CheckupSessionType) => {
    const patientId = selectedPatientId || user?.id || '';
    if (!patientId) {
      setSelectionError(t('checkup_start_patient_required'));
      setShowSessionTypes(false);
      return;
    }

    const selectedPatient = patientOptions.find((patient) => patient.id === patientId);
    navigate('/checkup/consent', {
      state: {
        sessionType: type,
        patientId: patientId,
        patientName: selectedPatient?.name,
      },
    });
  };

  const handlePatientContinue = () => {
    if (!selectedPatientId) {
      setSelectionError(t('checkup_start_patient_required'));
      return;
    }

    setSelectionError(null);
    setShowSessionTypes(true);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link
          to={showSessionTypes && shouldShowPatientSelection ? '#' : '/dashboard'}
          className={styles.backButton}
          onClick={(event) => {
            if (showSessionTypes && shouldShowPatientSelection) {
              event.preventDefault();
              setShowSessionTypes(false);
            }
          }}
        >
          {t('common_back')}
        </Link>
        <h1 className={styles.title}>{t('checkup_start_title')}</h1>
      </header>

      <main className={styles.main}>
        {!showSessionTypes && shouldShowPatientSelection ? (
          <>
            <p className={styles.subtitle}>{t('checkup_start_patient_subtitle')}</p>
            <div className={styles.patientSelector}>
              <label htmlFor="checkup-patient-select" className={styles.patientLabel}>
                {t('checkup_start_patient_label')}
              </label>
              <select
                id="checkup-patient-select"
                className={styles.patientSelect}
                value={selectedPatientId}
                onChange={(event) => {
                  setSelectedPatientId(event.target.value);
                  if (selectionError) setSelectionError(null);
                }}
              >
                <option value="">{t('checkup_start_patient_placeholder')}</option>
                {patientOptions.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.name}
                  </option>
                ))}
              </select>
              {selectionError && <p className={styles.selectionError}>{selectionError}</p>}
              <Button size="lg" fullWidth onClick={handlePatientContinue}>
                {t('common_continue')}
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className={styles.subtitle}>{t('checkup_start_subtitle')}</p>
            <div className={styles.selectedPatientBanner}>
              <span>
                {t('checkup_start_selected_patient')}:{' '}
                <strong>{patientOptions.find((patient) => patient.id === selectedPatientId)?.name}</strong>
              </span>
              {shouldShowPatientSelection && (
                <button
                  type="button"
                  className={styles.changePatientButton}
                  onClick={() => setShowSessionTypes(false)}
                >
                  {t('checkup_start_change_patient')}
                </button>
              )}
            </div>

            <div className={styles.sessionTypes}>
              {sessionTypes.map((type) => (
                <Card
                  key={type.id}
                  variant="interactive"
                  padding="lg"
                  className={type.featured ? styles.featuredCard : ''}
                  onClick={() => handleStartSession(type.id)}
                >
                  <CardContent>
                    <div className={styles.sessionIcon}>{type.icon}</div>
                    <h3 className={styles.sessionTitle}>{type.title}</h3>
                    <p className={styles.sessionDescription}>{type.description}</p>
                    <div className={styles.sessionMeta}>
                      <span className={styles.duration}>⏱️ {type.duration}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

