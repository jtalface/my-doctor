/**
 * Register Page
 *
 * Doctor registration form with professional credentials.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BrandingFooter } from '../components/BrandingFooter';
import { Logo } from '../components/Logo';
import { LanguageSelector } from '../components/LanguageSelector';
import { useAuth } from '../auth';
import { useLanguage, useTranslate } from '../i18n';
import styles from './RegisterPage.module.css';

const SPECIALTIES = [
  'General Medicine',
  'Pediatrics',
  'Cardiology',
  'Dermatology',
  'Endocrinology',
  'Gastroenterology',
  'Neurology',
  'Obstetrics & Gynecology',
  'Oncology',
  'Ophthalmology',
  'Orthopedics',
  'Psychiatry',
  'Pulmonology',
  'Radiology',
  'Surgery',
  'Urology',
  'Other',
];

const TITLES = ['Dr.', 'Prof.', 'Nurse', 'PA', 'NP'];

export default function RegisterPage() {
  const { register } = useAuth();
  const { language, setLanguage } = useLanguage();
  const t = useTranslate();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    specialty: '',
    title: 'Dr.',
    licenseNumber: '',
    phone: '',
  });

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateStep1 = () => {
    if (!formData.firstName.trim()) {
      setError(t('err_first_name_required'));
      return false;
    }
    if (!formData.lastName.trim()) {
      setError(t('err_last_name_required'));
      return false;
    }
    if (!formData.email.trim()) {
      setError(t('err_email_required'));
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError(t('err_email_invalid'));
      return false;
    }
    if (!formData.password) {
      setError(t('err_password_required'));
      return false;
    }
    if (formData.password.length < 8) {
      setError(t('err_password_short'));
      return false;
    }
    if (!/[A-Z]/.test(formData.password)) {
      setError(t('err_password_upper'));
      return false;
    }
    if (!/[a-z]/.test(formData.password)) {
      setError(t('err_password_lower'));
      return false;
    }
    if (!/[0-9]/.test(formData.password)) {
      setError(t('err_password_number'));
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError(t('err_password_mismatch'));
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.specialty) {
      setError(t('err_specialty_required'));
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    setError(null);
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handlePrevStep = () => {
    setError(null);
    setStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateStep2()) return;

    setIsLoading(true);

    try {
      await register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        specialty: formData.specialty,
        title: formData.title || undefined,
        licenseNumber: formData.licenseNumber || undefined,
        phone: formData.phone || undefined,
        language,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('register_error_generic'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className={styles.page}>
        <div className={styles.background}>
          <div className={styles.pattern}></div>
        </div>

        <div className={styles.card}>
          <div className={styles.header}>
            <div className={styles.logo}>
              <Logo variant="icon" size="lg" />
              <h1 className={styles.logoTitle}>Zambe</h1>
            </div>
            <p className={styles.subtitle}>{t('auth_register_subtitle')}</p>
          </div>

          <div className={styles.progress}>
            <div className={`${styles.progressStep} ${step >= 1 ? styles.active : ''}`}>
              <span className={styles.stepNumber}>1</span>
              <span className={styles.stepLabel}>{t('register_progress_account')}</span>
            </div>
            <div className={styles.progressLine}></div>
            <div className={`${styles.progressStep} ${step >= 2 ? styles.active : ''}`}>
              <span className={styles.stepNumber}>2</span>
              <span className={styles.stepLabel}>{t('register_progress_credentials')}</span>
            </div>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            {step === 1 && (
              <div className={styles.stepContent}>
                <div className={styles.fieldRow}>
                  <div className={styles.field}>
                    <label htmlFor="firstName">{t('register_first_name_label')}</label>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      value={formData.firstName}
                      onChange={handleChange}
                      placeholder="Maria"
                      autoComplete="given-name"
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="lastName">{t('register_last_name_label')}</label>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      value={formData.lastName}
                      onChange={handleChange}
                      placeholder="Silva"
                      autoComplete="family-name"
                    />
                  </div>
                </div>

                <div className={styles.field}>
                  <label htmlFor="email">{t('register_email_label')}</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder={t('login_email_placeholder')}
                    autoComplete="email"
                  />
                </div>

                <div className={styles.field}>
                  <label htmlFor="password">{t('register_password_label')}</label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder={t('login_password_placeholder')}
                    autoComplete="new-password"
                  />
                  <span className={styles.hint}>{t('register_password_hint')}</span>
                </div>

                <div className={styles.field}>
                  <label htmlFor="confirmPassword">{t('register_confirm_password_label')}</label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder={t('login_password_placeholder')}
                    autoComplete="new-password"
                  />
                </div>

                <div className={styles.field}>
                  <label htmlFor="doctor-ui-lang-reg">{t('common_language_label')}</label>
                  <LanguageSelector
                    id="doctor-ui-lang-reg"
                    value={language}
                    onChange={(lang) => void setLanguage(lang)}
                    aria-label={t('common_language_label')}
                  />
                </div>

                {error && <div className={styles.error}>{error}</div>}

                <button type="button" className={styles.nextBtn} onClick={handleNextStep}>
                  {t('register_continue')}
                </button>
              </div>
            )}

            {step === 2 && (
              <div className={styles.stepContent}>
                <div className={styles.fieldRow}>
                  <div className={styles.field}>
                    <label htmlFor="title">{t('register_title_label')}</label>
                    <select id="title" name="title" value={formData.title} onChange={handleChange}>
                      {TITLES.map((title) => (
                        <option key={title} value={title}>
                          {title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.field} style={{ flex: 2 }}>
                    <label htmlFor="specialty">{t('register_specialty_label')}</label>
                    <select
                      id="specialty"
                      name="specialty"
                      value={formData.specialty}
                      onChange={handleChange}
                    >
                      <option value="">{t('register_specialty_placeholder')}</option>
                      {SPECIALTIES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles.field}>
                  <label htmlFor="licenseNumber">{t('register_license_label')}</label>
                  <input
                    id="licenseNumber"
                    name="licenseNumber"
                    type="text"
                    value={formData.licenseNumber}
                    onChange={handleChange}
                    placeholder={t('register_license_placeholder')}
                  />
                  <span className={styles.hint}>{t('register_license_hint')}</span>
                </div>

                <div className={styles.field}>
                  <label htmlFor="phone">{t('register_phone_label')}</label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder={t('register_phone_placeholder')}
                    autoComplete="tel"
                  />
                </div>

                {error && <div className={styles.error}>{error}</div>}

                <div className={styles.buttonRow}>
                  <button type="button" className={styles.backBtn} onClick={handlePrevStep}>
                    {t('register_back')}
                  </button>
                  <button type="submit" className={styles.submitBtn} disabled={isLoading}>
                    {isLoading ? t('register_submit_loading') : t('register_submit')}
                  </button>
                </div>
              </div>
            )}
          </form>

          <div className={styles.footer}>
            <p>
              {t('register_footer_already')}{' '}
              <Link to="/login" className={styles.link}>
                {t('register_footer_sign_in')}
              </Link>
            </p>
          </div>
        </div>
      </div>
      <BrandingFooter />
    </>
  );
}
