import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@components/common';
import styles from './CheckupStartPage.module.css';

const sessionTypes = [
  {
    id: 'annual-checkup',
    icon: '🩺',
    title: 'Annual Wellness Checkup',
    description: 'Complete health assessment covering medical history, systems review, and preventive screening recommendations.',
    duration: '15-20 minutes',
    featured: true,
  },
  {
    id: 'symptom-check',
    icon: '🤒',
    title: 'Symptom Checker',
    description: 'Describe what you\'re experiencing and receive educational guidance.',
    duration: '5-10 minutes',
    featured: false,
  },
  {
    id: 'medication-review',
    icon: '💊',
    title: 'Medication Review',
    description: 'Review your current medications and receive educational information.',
    duration: '5 minutes',
    featured: false,
  },
];

export function CheckupStartPage() {
  const navigate = useNavigate();

  const handleStartSession = (type: string) => {
    // TODO: Create session via API
    navigate('/checkup/consent', { state: { sessionType: type } });
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link to="/dashboard" className={styles.backButton}>← Back</Link>
        <h1 className={styles.title}>Start Checkup</h1>
      </header>

      <main className={styles.main}>
        <p className={styles.subtitle}>What would you like to do today?</p>

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

