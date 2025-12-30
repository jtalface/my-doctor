import { useNavigate } from 'react-router-dom';
import { Card, CardContent, Button } from '@components/common';
import { useTranslate } from '../i18n';
import styles from './RedFlagAlertPage.module.css';

export function RedFlagAlertPage() {
  const navigate = useNavigate();
  const t = useTranslate();

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
            <h1 className={styles.alertTitle}>{t('red_flag_important')}</h1>
            <p className={styles.alertSubtitle}>
              {t('red_flag_subtitle')}
            </p>
          </CardContent>
        </Card>

        <Card variant="default" padding="md" className={styles.section}>
          <CardContent>
            <h2 className={styles.sectionTitle}>{t('red_flag_symptoms_title')}</h2>
            <ul className={styles.flagList}>
              {redFlags.map((flag, i) => (
                <li key={i} className={styles.flagItem}>{flag}</li>
              ))}
            </ul>
            <p className={styles.flagNote}>
              {t('red_flag_symptoms_note')}
            </p>
          </CardContent>
        </Card>

        <Card variant="default" padding="md" className={styles.section}>
          <CardContent>
            <h2 className={styles.sectionTitle}>{t('red_flag_actions_title')}</h2>
            <ul className={styles.actionList}>
              <li>{t('red_flag_action1')}</li>
              <li>{t('red_flag_action2')}</li>
              <li>
                <strong>
                  {t('red_flag_action3')}
                </strong>
              </li>
            </ul>
          </CardContent>
        </Card>

        <div className={styles.buttons}>
          <Button fullWidth size="lg" variant="primary">
            {t('red_flag_find_healthcare')}
          </Button>
          
          <Button fullWidth size="lg" variant="outline" onClick={handleContinue}>
            {t('red_flag_continue_session')}
          </Button>
          
          <Button fullWidth size="lg" variant="ghost" onClick={handleEndSession}>
            {t('red_flag_end_session')}
          </Button>
        </div>
      </main>
    </div>
  );
}

