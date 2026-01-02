import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, Button } from '@components/common';
import { useAuth } from '../auth';
import { useTranslate } from '../i18n';
import { getLanguageInfo } from '../config/languages';
import styles from './ProfilePage.module.css';

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, profile, logout } = useAuth();
  const t = useTranslate();

  // Format date from ISO string
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return t('common_not_set');
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // Format sex at birth
  const formatSex = (sex?: string) => {
    if (!sex) return t('common_not_set');
    return sex.charAt(0).toUpperCase() + sex.slice(1);
  };

  // Format height
  const formatHeight = (cm?: number) => {
    if (!cm) return t('common_not_set');
    const feet = Math.floor(cm / 30.48);
    const inches = Math.round((cm / 2.54) % 12);
    return `${feet}'${inches}" (${cm} cm)`;
  };

  // Format weight
  const formatWeight = (kg?: number) => {
    if (!kg) return t('common_not_set');
    const lbs = Math.round(kg * 2.205);
    return `${lbs} lbs (${kg} kg)`;
  };

  // Format array to string
  const formatArray = (arr?: string[], defaultValue?: string) => {
    if (!arr || arr.length === 0) return defaultValue || t('profile_none_reported');
    return arr.join(', ');
  };

  // Format lifestyle options
  const formatLifestyle = (value?: string) => {
    if (!value) return t('common_not_set');
    const labels: Record<string, string> = {
      never: t('profile_setup_smoking_never'),
      former: t('profile_setup_smoking_former'),
      current: t('profile_setup_smoking_current'),
      occasional: t('profile_setup_alcohol_occasional'),
      regular: t('profile_setup_alcohol_regular'),
      heavy: t('profile_setup_alcohol_heavy'),
      sedentary: t('profile_setup_exercise_sedentary'),
      light: t('profile_setup_exercise_light'),
      moderate: t('profile_setup_exercise_moderate'),
      active: t('profile_setup_exercise_active'),
    };
    return labels[value] || value.charAt(0).toUpperCase() + value.slice(1);
  };

  const languageInfo = getLanguageInfo(user?.preferences?.language || 'en');

  const profileData = {
    name: user?.name || t('common_guest_user'),
    email: user?.email || t('common_no_email'),
    language: `${languageInfo.flag} ${languageInfo.nativeName}`,
    dob: formatDate(profile?.demographics?.dateOfBirth),
    sex: formatSex(profile?.demographics?.sexAtBirth),
    height: formatHeight(profile?.demographics?.heightCm),
    weight: formatWeight(profile?.demographics?.weightKg),
    allergies: formatArray(profile?.medicalHistory?.allergies),
    conditions: formatArray(profile?.medicalHistory?.chronicConditions),
    medications: formatArray(profile?.medicalHistory?.medications, t('common_none')),
    smoking: profile?.lifestyle?.smoking 
      ? `${formatLifestyle(profile.lifestyle.smoking)} ${t('profile_smoker')}`
      : t('common_not_set'),
    alcohol: formatLifestyle(profile?.lifestyle?.alcohol),
    exercise: formatLifestyle(profile?.lifestyle?.exercise),
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleEditProfile = () => {
    navigate('/profile/setup');
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Link to="/dashboard" className={styles.backButton}>←</Link>
          <h1 className={styles.title}>{t('profile_title')}</h1>
        </div>
        <div className={styles.headerRight} />
      </header>

      <main className={styles.main}>
        <div className={styles.profileHeader}>
          <div className={styles.avatar}>👤</div>
          <h2 className={styles.name}>{profileData.name}</h2>
          <p className={styles.email}>{profileData.email}</p>
        </div>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>{t('profile_personal_information')}</h3>
          <Card variant="default" padding="none">
            <CardContent>
              <ProfileRow label={t('profile_preferred_language')} value={profileData.language} />
              <ProfileRow label={t('profile_date_of_birth')} value={profileData.dob} />
              <ProfileRow label={t('profile_sex_at_birth')} value={profileData.sex} />
              <ProfileRow label={t('profile_height')} value={profileData.height} />
              <ProfileRow label={t('profile_weight')} value={profileData.weight} />
            </CardContent>
          </Card>
        </section>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>{t('profile_medical_information')}</h3>
          <Card variant="default" padding="none">
            <CardContent>
              <ProfileRow label={t('profile_allergies')} value={profileData.allergies} />
              <ProfileRow label={t('profile_chronic_conditions')} value={profileData.conditions} />
              <ProfileRow label={t('profile_current_medications')} value={profileData.medications} />
            </CardContent>
          </Card>
        </section>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>{t('profile_section_lifestyle')}</h3>
          <Card variant="default" padding="none">
            <CardContent>
              <ProfileRow label={t('profile_smoking_status')} value={profileData.smoking} />
              <ProfileRow label={t('profile_alcohol_use')} value={profileData.alcohol} />
              <ProfileRow label={t('profile_exercise_level')} value={profileData.exercise} />
            </CardContent>
          </Card>
        </section>

        <div className={styles.buttonGroup}>
          <Button fullWidth size="lg" onClick={handleEditProfile}>
            {t('profile_update_profile_information')}
          </Button>
          <Button fullWidth size="lg" variant="outline" onClick={handleLogout}>
            {t('profile_sign_out')}
          </Button>
        </div>
      </main>
    </div>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.profileRow}>
      <span className={styles.rowLabel}>{label}</span>
      <div className={styles.rowRight}>
        <span className={styles.rowValue}>{value}</span>
      </div>
    </div>
  );
}
