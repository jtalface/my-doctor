/**
 * Fixed branding bar for auth screens (matches patient webapp footer pattern).
 */
import styles from './BrandingFooter.module.css';

export function BrandingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footerContainer}>
      <div className={styles.footerMain}>
        <div className={styles.footerBrand}>
          <span className={styles.footerBrandName}>Zeus Technologies</span>
        </div>
        <div className={styles.footerDivider} aria-hidden />
        <span className={styles.footerCopyright}>
          © {year} All rights reserved
        </span>
      </div>
    </footer>
  );
}
