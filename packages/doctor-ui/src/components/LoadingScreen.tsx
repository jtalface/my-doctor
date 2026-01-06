/**
 * Loading Screen
 * 
 * Full-screen loading indicator.
 */

import styles from './LoadingScreen.module.css';

export default function LoadingScreen() {
  return (
    <div className={styles.container}>
      <div className={styles.spinner}>
        <div className={styles.dot}></div>
        <div className={styles.dot}></div>
        <div className={styles.dot}></div>
      </div>
      <p className={styles.text}>Loading...</p>
    </div>
  );
}

