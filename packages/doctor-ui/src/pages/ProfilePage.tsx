/**
 * Profile Page
 * 
 * Doctor profile management.
 */

import { useEffect, useState } from 'react';
import { useAuth } from '../auth';
import * as api from '../services/api';
import styles from './ProfilePage.module.css';

export default function ProfilePage() {
  const { doctor } = useAuth();
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
      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Failed to save profile:', error);
      alert('Failed to save profile');
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
        <h1>Profile Settings</h1>
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
              {profile?.isVerified ? '✓ Verified' : 'Pending Verification'}
            </span>
          </div>
        </div>

        {/* Availability Toggle */}
        <div className={styles.availabilitySection}>
          <div className={styles.availabilityInfo}>
            <h3>Availability Status</h3>
            <p>When available, patients can see you're online and ready to respond.</p>
          </div>
          <button
            className={`${styles.availabilityToggle} ${isAvailable ? styles.available : ''}`}
            onClick={handleAvailabilityToggle}
          >
            <span className={styles.toggleDot}></span>
            <span>{isAvailable ? 'Available' : 'Unavailable'}</span>
          </button>
        </div>
      </div>

      {/* Edit Form */}
      <form className={styles.form} onSubmit={handleSave}>
        <h2>Edit Profile</h2>

        {successMessage && (
          <div className={styles.successMessage}>{successMessage}</div>
        )}

        <div className={styles.formGrid}>
          <div className={styles.field}>
            <label>Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className={styles.field}>
            <label>Email</label>
            <input
              type="email"
              value={profile?.email || ''}
              disabled
              className={styles.disabled}
            />
            <span className={styles.hint}>Email cannot be changed</span>
          </div>

          <div className={styles.field}>
            <label>Specialty</label>
            <input
              type="text"
              value={profile?.specialty || ''}
              disabled
              className={styles.disabled}
            />
          </div>

          <div className={styles.field}>
            <label>License Number</label>
            <input
              type="text"
              value={profile?.licenseNumber || ''}
              disabled
              className={styles.disabled}
            />
          </div>

          <div className={styles.field}>
            <label>Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+258 84 XXX XXXX"
            />
          </div>
        </div>

        <div className={styles.field}>
          <label>Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell patients about yourself..."
            rows={4}
            maxLength={500}
          />
          <span className={styles.hint}>{bio.length}/500 characters</span>
        </div>

        <div className={styles.formActions}>
          <button
            type="submit"
            className={styles.saveBtn}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>

      {/* Account Info */}
      <div className={styles.infoSection}>
        <h2>Account Information</h2>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Title</span>
            <span className={styles.infoValue}>{profile?.title || 'Dr.'}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Languages</span>
            <span className={styles.infoValue}>
              {profile?.languages?.join(', ') || 'English'}
            </span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Working Hours</span>
            <span className={styles.infoValue}>
              {profile?.workingHours
                ? `${profile.workingHours.start} - ${profile.workingHours.end}`
                : 'Not set'}
            </span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Status</span>
            <span className={styles.infoValue}>
              {profile?.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

