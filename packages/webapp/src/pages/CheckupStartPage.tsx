import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@components/common';
import { useTranslate } from '../i18n';
import type { CheckupSessionType } from '../services/api';
import styles from './CheckupStartPage.module.css';

export function CheckupStartPage() {
  const navigate = useNavigate();
  const t = useTranslate();

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
    navigate('/checkup/consent', { state: { sessionType: type } });
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link to="/dashboard" className={styles.backButton}>{t('common_back')}</Link>
        <h1 className={styles.title}>{t('checkup_start_title')}</h1>
      </header>

      <main className={styles.main}>
        <p className={styles.subtitle}>{t('checkup_start_subtitle')}</p>

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
      </main>
    </div>
  );
}

