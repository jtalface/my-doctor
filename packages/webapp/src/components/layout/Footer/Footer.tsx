import styles from './Footer.module.css';

export function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className={styles.footerContainer}>
      <div className={styles.footerMain}>
        <div className={styles.footerBrand}>
          <span className={styles.footerLogo}>🎬</span>
          <span className={styles.footerLink}>Alface Productions</span>
        </div>
        <div className={styles.footerDivider} />
        <span className={styles.footerCopyright}>
          © {currentYear} All rights reserved
        </span>
      </div>
    </footer>
  );
}

