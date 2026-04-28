/**
 * Loading Screen
 * 
 * Full-screen loading indicator.
 */

import { useTranslate } from '../i18n';
import styles from './LoadingScreen.module.css';

export default function LoadingScreen() {
  const t = useTranslate();
  return (
    <div className={styles.container}>
      <div className={styles.spinner}>
        <div className={styles.dot}></div>
        <div className={styles.dot}></div>
        <div className={styles.dot}></div>
      </div>
      <p className={styles.text}>{t('common_loading')}</p>
    </div>
  );
}

