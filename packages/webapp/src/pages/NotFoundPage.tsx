import { Link } from 'react-router-dom';
import { Button } from '@components/common';
import { useTranslate } from '../i18n';
import styles from './NotFoundPage.module.css';

export function NotFoundPage() {
  const t = useTranslate();
  
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <span className={styles.icon}>🔍</span>
        <h1 className={styles.title}>{t('not_found_title')}</h1>
        <p className={styles.description}>
          {t('not_found_description')}
        </p>
        <Link to="/dashboard">
          <Button size="lg">{t('not_found_return_button')}</Button>
        </Link>
      </div>
    </div>
  );
}

