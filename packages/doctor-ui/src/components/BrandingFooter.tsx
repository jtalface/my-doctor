/**
 * Fixed branding bar for auth screens (matches patient webapp footer pattern).
 */
import { useTranslate } from '../i18n';
import styles from './BrandingFooter.module.css';

export function BrandingFooter() {
  const year = new Date().getFullYear();
  const t = useTranslate();

  return (
    <footer className={styles.footerContainer}>
      <div className={styles.footerMain}>
        <div className={styles.footerBrand}>
          <span className={styles.footerBrandName}>{t('footer_brand')}</span>
        </div>
        <div className={styles.footerDivider} aria-hidden />
        <span className={styles.footerCopyright}>
          {t('footer_rights_reserved', { year })}
        </span>
      </div>
    </footer>
  );
}
