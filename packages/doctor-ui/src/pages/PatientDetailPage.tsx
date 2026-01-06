/**
 * Patient Detail Page
 * 
 * View patient profile and health history.
 */

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import * as api from '../services/api';
import styles from './PatientDetailPage.module.css';

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [patient, setPatient] = useState<api.PatientProfile | null>(null);
  const [history, setHistory] = useState<Array<{
    _id: string;
    subject?: string;
    status: string;
    messageCount: number;
    createdAt: string;
    lastMessageAt: string;
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const loadPatient = async () => {
      try {
        const [patientRes, historyRes] = await Promise.all([
          api.getPatientProfile(id),
          api.getPatientHistory(id),
        ]);
        setPatient(patientRes.patient);
        setHistory(historyRes.conversations);
      } catch (error) {
        console.error('Failed to load patient:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadPatient();
  }, [id]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString();
  };

  const calculateAge = (dateOfBirth?: string) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birth = new Date(dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className={styles.error}>
        <h2>Patient not found</h2>
        <Link to="/patients">Back to patients</Link>
      </div>
    );
  }

  const profile = patient.profile;
  const age = calculateAge(profile?.dateOfBirth);

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <Link to="/patients" className={styles.backBtn}>
          ← Back to Patients
        </Link>
      </header>

      {/* Patient Info */}
      <div className={styles.patientHeader}>
        <div className={styles.avatar}>
          {patient.name?.charAt(0) || 'P'}
        </div>
        <div className={styles.patientInfo}>
          <h1>{patient.name || 'Unknown Patient'}</h1>
          <p className={styles.email}>{patient.email || 'No email'}</p>
          <div className={styles.quickInfo}>
            {age && <span>Age: {age}</span>}
            {profile?.gender && (
              <span>{profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1)}</span>
            )}
            {profile?.bloodType && <span>Blood: {profile.bloodType}</span>}
          </div>
        </div>
      </div>

      <div className={styles.content}>
        {/* Health Profile */}
        <section className={styles.section}>
          <h2>Health Profile</h2>
          
          {profile ? (
            <div className={styles.profileGrid}>
              {/* Basic Info */}
              <div className={styles.card}>
                <h3>📋 Basic Information</h3>
                <div className={styles.infoList}>
                  <div className={styles.infoRow}>
                    <span>Date of Birth</span>
                    <strong>{formatDate(profile.dateOfBirth)}</strong>
                  </div>
                  <div className={styles.infoRow}>
                    <span>Gender</span>
                    <strong>{profile.gender || 'Not specified'}</strong>
                  </div>
                  <div className={styles.infoRow}>
                    <span>Blood Type</span>
                    <strong>{profile.bloodType || 'Unknown'}</strong>
                  </div>
                </div>
              </div>

              {/* Allergies */}
              <div className={styles.card}>
                <h3>⚠️ Allergies</h3>
                {profile.allergies && profile.allergies.length > 0 ? (
                  <div className={styles.tagList}>
                    {profile.allergies.map((allergy, i) => (
                      <span key={i} className={styles.tagDanger}>{allergy}</span>
                    ))}
                  </div>
                ) : (
                  <p className={styles.noData}>No known allergies</p>
                )}
              </div>

              {/* Chronic Conditions */}
              <div className={styles.card}>
                <h3>🏥 Chronic Conditions</h3>
                {profile.chronicConditions && profile.chronicConditions.length > 0 ? (
                  <div className={styles.tagList}>
                    {profile.chronicConditions.map((condition, i) => (
                      <span key={i} className={styles.tag}>{condition}</span>
                    ))}
                  </div>
                ) : (
                  <p className={styles.noData}>No chronic conditions</p>
                )}
              </div>

              {/* Medications */}
              <div className={styles.card}>
                <h3>💊 Current Medications</h3>
                {profile.currentMedications && profile.currentMedications.length > 0 ? (
                  <div className={styles.medicationList}>
                    {profile.currentMedications.map((med, i) => (
                      <div key={i} className={styles.medication}>
                        <strong>{med.name}</strong>
                        <span>{med.dosage} • {med.frequency}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.noData}>No current medications</p>
                )}
              </div>

              {/* Emergency Contact */}
              {profile.emergencyContact && (
                <div className={styles.card}>
                  <h3>🚨 Emergency Contact</h3>
                  <div className={styles.infoList}>
                    <div className={styles.infoRow}>
                      <span>Name</span>
                      <strong>{profile.emergencyContact.name}</strong>
                    </div>
                    <div className={styles.infoRow}>
                      <span>Phone</span>
                      <strong>{profile.emergencyContact.phone}</strong>
                    </div>
                    <div className={styles.infoRow}>
                      <span>Relationship</span>
                      <strong>{profile.emergencyContact.relationship}</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.noProfile}>
              <p>No health profile available for this patient.</p>
            </div>
          )}
        </section>

        {/* Conversation History */}
        <section className={styles.section}>
          <h2>Conversation History</h2>
          {history.length > 0 ? (
            <div className={styles.historyList}>
              {history.map((conv) => (
                <Link
                  key={conv._id}
                  to={`/conversations/${conv._id}`}
                  className={styles.historyCard}
                >
                  <div className={styles.historyInfo}>
                    <span className={styles.historySubject}>
                      {conv.subject || 'No subject'}
                    </span>
                    <span className={styles.historyMeta}>
                      {conv.messageCount} messages • {formatDate(conv.lastMessageAt)}
                    </span>
                  </div>
                  <span className={`${styles.historyStatus} ${styles[conv.status]}`}>
                    {conv.status}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className={styles.noData}>No conversation history</p>
          )}
        </section>
      </div>
    </div>
  );
}

