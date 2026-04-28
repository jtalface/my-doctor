/**
 * Profile Page
 * 
 * Doctor profile management.
 */

import { useEffect, useState } from 'react';
import { useAuth } from '../auth';
import * as api from '../services/api';
import { LanguageSelector } from '../components/LanguageSelector';
import { useLanguage, useTranslate } from '../i18n';
import styles from './ProfilePage.module.css';

export default function ProfilePage() {
  const { doctor: _doctor } = useAuth();
  const { language, setLanguage } = useLanguage();
  const t = useTranslate();
  const [profile, setProfile] = useState<api.DoctorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Editable fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await api.getProfile();
        setProfile(res.profile);
        setName(res.profile.name);
        setPhone(res.profile.phone || '');
        setBio(res.profile.bio || '');
        setIsAvailable(res.profile.isAvailable);
      } catch (error) {
        console.error('Failed to load profile:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage(null);

    try {
      const res = await api.updateProfile({ name, phone, bio });
      setProfile(res.profile);
      setSuccessMessage(t('profile_updated'));
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Failed to save profile:', error);
      alert(t('profile_save_failed'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvailabilityToggle = async () => {
    try {
      const newValue = !isAvailable;
      await api.updateAvailability(newValue);
      setIsAvailable(newValue);
    } catch (error) {
      console.error('Failed to update availability:', error);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>{t('profile_page_title')}</h1>
      </header>

      {/* Profile Card */}
      <div className={styles.profileCard}>
        <div className={styles.profileHeader}>
          <div className={styles.avatar}>
            {profile?.avatarUrl ? (
              <img src={profile.avatarUrl} alt={profile.name} />
            ) : (
              <span>{profile?.name?.charAt(0) || 'D'}</span>
            )}
          </div>
          <div className={styles.profileInfo}>
            <h2>{profile?.name}</h2>
            <p>{profile?.specialty}</p>
            <span className={styles.badge}>
              {profile?.isVerified ? t('profile_verified') : t('profile_pending')}
            </span>
          </div>
        </div>

        {/* Availability Toggle */}
        <div className={styles.availabilitySection}>
          <div className={styles.availabilityInfo}>
            <h3>{t('profile_avail_heading')}</h3>
            <p>{t('profile_avail_body')}</p>
          </div>
          <button
            className={`${styles.availabilityToggle} ${isAvailable ? styles.available : ''}`}
            onClick={handleAvailabilityToggle}
          >
            <span className={styles.toggleDot}></span>
            <span>{isAvailable ? t('profile_avail_on') : t('profile_avail_off')}</span>
          </button>
        </div>
      </div>

      {/* Edit Form */}
      <form className={styles.form} onSubmit={handleSave}>
        <h2>{t('profile_form_heading')}</h2>

        <div className={styles.field}>
          <label htmlFor="doctor-ui-lang-profile">{t('profile_language_label')}</label>
          <LanguageSelector
            id="doctor-ui-lang-profile"
            value={language}
            onChange={(lang) => void setLanguage(lang)}
            aria-label={t('profile_language_label')}
          />
          <span className={styles.hint}>{t('profile_language_hint')}</span>
        </div>

        {successMessage && (
          <div className={styles.successMessage}>{successMessage}</div>
        )}

        <div className={styles.formGrid}>
          <div className={styles.field}>
            <label>{t('profile_full_name')}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className={styles.field}>
            <label>{t('profile_email_label')}</label>
            <input
              type="email"
              value={profile?.email || ''}
              disabled
              className={styles.disabled}
            />
            <span className={styles.hint}>{t('profile_email_locked')}</span>
          </div>

          <div className={styles.field}>
            <label>{t('profile_specialty_label')}</label>
            <input
              type="text"
              value={profile?.specialty || ''}
              disabled
              className={styles.disabled}
            />
          </div>

          <div className={styles.field}>
            <label>{t('profile_license_label')}</label>
            <input
              type="text"
              value={profile?.licenseNumber || ''}
              disabled
              className={styles.disabled}
            />
          </div>

          <div className={styles.field}>
            <label>{t('profile_phone_label')}</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+258 84 XXX XXXX"
            />
          </div>
        </div>

        <div className={styles.field}>
          <label>{t('profile_bio_label')}</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder={t('profile_bio_placeholder')}
            rows={4}
            maxLength={500}
          />
          <span className={styles.hint}>
            {t('profile_bio_chars', { count: bio.length })}
          </span>
        </div>

        <div className={styles.formActions}>
          <button
            type="submit"
            className={styles.saveBtn}
            disabled={isSaving}
          >
            {isSaving ? t('profile_saving') : t('profile_save_changes')}
          </button>
        </div>
      </form>

      {/* Account Info */}
      <div className={styles.infoSection}>
        <h2>{t('profile_account_heading')}</h2>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>{t('profile_info_title')}</span>
            <span className={styles.infoValue}>{profile?.title || 'Dr.'}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>{t('profile_info_languages')}</span>
            <span className={styles.infoValue}>
              {profile?.languages?.join(', ') || 'English'}
            </span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>{t('profile_info_hours')}</span>
            <span className={styles.infoValue}>
              {profile?.workingHours
                ? `${profile.workingHours.start} - ${profile.workingHours.end}`
                : t('profile_hours_not_set')}
            </span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>{t('profile_info_status')}</span>
            <span className={styles.infoValue}>
              {profile?.isActive ? t('profile_status_active') : t('profile_status_inactive')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

