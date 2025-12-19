import { Link } from 'react-router-dom';
import { Button } from '@components/common';
import styles from './NotFoundPage.module.css';

export function NotFoundPage() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <span className={styles.icon}>🔍</span>
        <h1 className={styles.title}>Page Not Found</h1>
        <p className={styles.description}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/dashboard">
          <Button size="lg">Return to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}

