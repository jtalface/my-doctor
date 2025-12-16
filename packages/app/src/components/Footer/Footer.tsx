import React from 'react';
import styles from '../../App.module.css';

const Footer: React.FC = () => {
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
      <div className={styles.footerGlow} />
    </footer>
  );
};

export default Footer;

