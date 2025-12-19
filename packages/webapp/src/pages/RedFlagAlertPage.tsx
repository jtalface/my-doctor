import { useNavigate } from 'react-router-dom';
import { Card, CardContent, Button } from '@components/common';
import styles from './RedFlagAlertPage.module.css';

export function RedFlagAlertPage() {
  const navigate = useNavigate();

  // Mock data - TODO: Get from session state
  const redFlags = [
    'Chest pain with shortness of breath',
    'Symptoms occurring during physical activity',
  ];

  const handleContinue = () => {
    navigate(-1); // Go back to session
  };

  const handleEndSession = () => {
    navigate('/checkup/summary/current');
  };

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <Card variant="outline" padding="lg" className={styles.alertCard}>
          <CardContent>
            <div className={styles.alertIcon}>⚠️</div>
            <h1 className={styles.alertTitle}>IMPORTANT</h1>
            <p className={styles.alertSubtitle}>
              Based on your responses, we recommend you seek medical attention promptly.
            </p>
          </CardContent>
        </Card>

        <Card variant="default" padding="md" className={styles.section}>
          <CardContent>
            <h2 className={styles.sectionTitle}>🚨 Concerning Symptoms Identified:</h2>
            <ul className={styles.flagList}>
              {redFlags.map((flag, i) => (
                <li key={i} className={styles.flagItem}>{flag}</li>
              ))}
            </ul>
            <p className={styles.flagNote}>
              These symptoms may indicate a condition that requires professional evaluation.
            </p>
          </CardContent>
        </Card>

        <Card variant="default" padding="md" className={styles.section}>
          <CardContent>
            <h2 className={styles.sectionTitle}>📞 Recommended Actions:</h2>
            <ul className={styles.actionList}>
              <li>Contact your primary care provider today</li>
              <li>If symptoms worsen, go to urgent care or ER</li>
              <li>
                <strong>
                  Call 911 if you experience severe chest pain, difficulty breathing, or feel faint
                </strong>
              </li>
            </ul>
          </CardContent>
        </Card>

        <div className={styles.buttons}>
          <Button fullWidth size="lg" variant="primary">
            📞 Find Nearby Healthcare
          </Button>
          
          <Button fullWidth size="lg" variant="outline" onClick={handleContinue}>
            I Understand, Continue Session
          </Button>
          
          <Button fullWidth size="lg" variant="ghost" onClick={handleEndSession}>
            End Session & View Summary
          </Button>
        </div>
      </main>
    </div>
  );
}

