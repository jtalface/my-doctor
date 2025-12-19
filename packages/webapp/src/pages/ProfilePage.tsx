import { useNavigate } from 'react-router-dom';
import { Card, CardContent, Button } from '@components/common';
import { useUser } from '../store/UserContext';
import styles from './ProfilePage.module.css';

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, profile, logout } = useUser();

  // Format date from ISO string
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Not set';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // Format sex at birth
  const formatSex = (sex?: string) => {
    if (!sex) return 'Not set';
    return sex.charAt(0).toUpperCase() + sex.slice(1);
  };

  // Format height
  const formatHeight = (cm?: number) => {
    if (!cm) return 'Not set';
    const feet = Math.floor(cm / 30.48);
    const inches = Math.round((cm / 2.54) % 12);
    return `${feet}'${inches}" (${cm} cm)`;
  };

  // Format weight
  const formatWeight = (kg?: number) => {
    if (!kg) return 'Not set';
    const lbs = Math.round(kg * 2.205);
    return `${lbs} lbs (${kg} kg)`;
  };

  // Format array to string
  const formatArray = (arr?: string[], defaultValue = 'None reported') => {
    if (!arr || arr.length === 0) return defaultValue;
    return arr.join(', ');
  };

  // Format lifestyle options
  const formatLifestyle = (value?: string, defaultValue = 'Not set') => {
    if (!value) return defaultValue;
    const labels: Record<string, string> = {
      never: 'Never',
      former: 'Former',
      current: 'Current',
      occasional: 'Occasional',
      regular: 'Regular',
      heavy: 'Heavy',
      sedentary: 'Sedentary',
      light: 'Light',
      moderate: 'Moderate',
      active: 'Active',
    };
    return labels[value] || value.charAt(0).toUpperCase() + value.slice(1);
  };

  const profileData = {
    name: user?.name || 'Guest User',
    email: user?.email || 'No email',
    dob: formatDate(profile?.demographics?.dateOfBirth),
    sex: formatSex(profile?.demographics?.sexAtBirth),
    height: formatHeight(profile?.demographics?.heightCm),
    weight: formatWeight(profile?.demographics?.weightKg),
    allergies: formatArray(profile?.medicalHistory?.allergies),
    conditions: formatArray(profile?.medicalHistory?.chronicConditions),
    medications: formatArray(profile?.medicalHistory?.medications, 'None'),
    smoking: profile?.lifestyle?.smoking 
      ? `${formatLifestyle(profile.lifestyle.smoking)} smoker`
      : 'Not set',
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
        <h1 className={styles.title}>Profile</h1>
      </header>

      <main className={styles.main}>
        <div className={styles.profileHeader}>
          <div className={styles.avatar}>👤</div>
          <h2 className={styles.name}>{profileData.name}</h2>
          <p className={styles.email}>{profileData.email}</p>
        </div>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Personal Information</h3>
          <Card variant="default" padding="none">
            <CardContent>
              <ProfileRow label="Date of Birth" value={profileData.dob} />
              <ProfileRow label="Sex at Birth" value={profileData.sex} />
              <ProfileRow label="Height" value={profileData.height} />
              <ProfileRow label="Weight" value={profileData.weight} />
            </CardContent>
          </Card>
        </section>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Medical Information</h3>
          <Card variant="default" padding="none">
            <CardContent>
              <ProfileRow label="Allergies" value={profileData.allergies} />
              <ProfileRow label="Chronic Conditions" value={profileData.conditions} />
              <ProfileRow label="Current Medications" value={profileData.medications} />
            </CardContent>
          </Card>
        </section>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Lifestyle</h3>
          <Card variant="default" padding="none">
            <CardContent>
              <ProfileRow label="Smoking Status" value={profileData.smoking} />
              <ProfileRow label="Alcohol Use" value={profileData.alcohol} />
              <ProfileRow label="Exercise Level" value={profileData.exercise} />
            </CardContent>
          </Card>
        </section>

        <div className={styles.buttonGroup}>
          <Button fullWidth size="lg" onClick={handleEditProfile}>
            Update Profile Information
          </Button>
          <Button fullWidth size="lg" variant="outline" onClick={handleLogout}>
            Sign Out
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
