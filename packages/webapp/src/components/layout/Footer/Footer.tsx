import { useTranslate } from '../../../i18n';
import type { LanguageCode } from '../../../config/languages';
import styles from './Footer.module.css';

type FooterProps = {
  /** When set (e.g. login/register language dropdown), footer strings follow this locale before sign-in. */
  language?: LanguageCode;
};

export function Footer({ language }: FooterProps) {
  const currentYear = new Date().getFullYear();
  const t = useTranslate(language);

  return (
    <footer className={styles.footerContainer}>
      <div className={styles.footerMain}>
        <div className={styles.footerBrand}>
          <span className={styles.footerLink}>Zeus Technologies</span>
        </div>
        <div className={styles.footerDivider} />
        <span className={styles.footerCopyright}>
          {t('footer_rights_reserved', { year: currentYear })}
        </span>
      </div>
    </footer>
  );
}

