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
  const demographics = profile?.demographics;
  const medicalHistory = profile?.medicalHistory;
  const lifestyle = profile?.lifestyle;
  const age = calculateAge(demographics?.dateOfBirth);

  const formatSex = (sex?: string) => {
    if (!sex) return null;
    const labels: Record<string, string> = {
      male: 'Male',
      female: 'Female',
      other: 'Other',
    };
    return labels[sex] || sex;
  };

  const formatRace = (race?: string) => {
    if (!race) return null;
    const labels: Record<string, string> = {
      black: 'Black',
      white: 'White',
      asian: 'Asian',
      latin_american: 'Latin American',
      mixed: 'Mixed',
      other: 'Other',
      prefer_not_to_say: 'Prefer not to say',
    };
    return labels[race] || race;
  };

  const formatEthnicGroup = (ethnicGroup?: string) => {
    if (!ethnicGroup) return null;
    const labels: Record<string, string> = {
      tsonga: 'Tsonga (Changana, Ronga, Tswa)',
      tonga: 'Tonga (Bitonga)',
      sena: 'Sena',
      nyungwe: 'Nyungwe',
      makua: 'Makua (Lomwe, Makua-Metto)',
      yao: 'Yao',
      makonde: 'Makonde',
      ndau: 'Ndau',
      shona: 'Shona (Manyika, Korekore)',
      chuabo: 'Chuabo',
      chopi: 'Chopi',
      outro: 'Other',
    };
    return labels[ethnicGroup] || ethnicGroup;
  };

  const formatLifestyle = (value?: string) => {
    if (!value) return 'Not specified';
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
    return labels[value] || value;
  };

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
            {demographics?.sexAtBirth && (
              <span>{formatSex(demographics.sexAtBirth)}</span>
            )}
          </div>
        </div>
      </div>

      <div className={styles.content}>
        {/* Health Profile */}
        <section className={styles.section}>
          <h2>Health Profile</h2>
          
          {profile ? (
            <div className={styles.profileGrid}>
              {/* Demographics */}
              <div className={styles.card}>
                <h3>📋 Demographics</h3>
                <div className={styles.infoList}>
                  <div className={styles.infoRow}>
                    <span>Date of Birth</span>
                    <strong>{formatDate(demographics?.dateOfBirth)}</strong>
                  </div>
                  <div className={styles.infoRow}>
                    <span>Sex at Birth</span>
                    <strong>{formatSex(demographics?.sexAtBirth) || 'Not specified'}</strong>
                  </div>
                  <div className={styles.infoRow}>
                    <span>Race</span>
                    <strong>{formatRace(demographics?.race) || 'Not specified'}</strong>
                  </div>
                  <div className={styles.infoRow}>
                    <span>Ethnic Group</span>
                    <strong>{formatEthnicGroup(demographics?.ethnicGroup) || 'Not specified'}</strong>
                  </div>
                  <div className={styles.infoRow}>
                    <span>Height</span>
                    <strong>{demographics?.heightCm ? `${demographics.heightCm} cm` : 'Not specified'}</strong>
                  </div>
                  <div className={styles.infoRow}>
                    <span>Weight</span>
                    <strong>{demographics?.weightKg ? `${demographics.weightKg} kg` : 'Not specified'}</strong>
                  </div>
                </div>
              </div>

              {/* Allergies */}
              <div className={styles.card}>
                <h3>⚠️ Allergies</h3>
                {medicalHistory?.allergies && medicalHistory.allergies.length > 0 ? (
                  <div className={styles.tagList}>
                    {medicalHistory.allergies.map((allergy, i) => (
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
                {medicalHistory?.chronicConditions && medicalHistory.chronicConditions.length > 0 ? (
                  <div className={styles.tagList}>
                    {medicalHistory.chronicConditions.map((condition, i) => (
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
                {medicalHistory?.medications && medicalHistory.medications.length > 0 ? (
                  <div className={styles.tagList}>
                    {medicalHistory.medications.map((med, i) => (
                      <span key={i} className={styles.tag}>{med}</span>
                    ))}
                  </div>
                ) : (
                  <p className={styles.noData}>No current medications</p>
                )}
              </div>

              {/* Lifestyle */}
              <div className={styles.card}>
                <h3>🏃 Lifestyle</h3>
                <div className={styles.infoList}>
                  <div className={styles.infoRow}>
                    <span>Smoking</span>
                    <strong>{formatLifestyle(lifestyle?.smoking)}</strong>
                  </div>
                  <div className={styles.infoRow}>
                    <span>Alcohol</span>
                    <strong>{formatLifestyle(lifestyle?.alcohol)}</strong>
                  </div>
                  <div className={styles.infoRow}>
                    <span>Exercise</span>
                    <strong>{formatLifestyle(lifestyle?.exercise)}</strong>
                  </div>
                </div>
              </div>

              {/* Medical History */}
              {(medicalHistory?.surgeries?.length || medicalHistory?.familyHistory?.length) && (
                <div className={styles.card}>
                  <h3>📜 Medical History</h3>
                  {medicalHistory?.surgeries && medicalHistory.surgeries.length > 0 && (
                    <>
                      <h4 className={styles.subheading}>Surgeries</h4>
                      <div className={styles.tagList}>
                        {medicalHistory.surgeries.map((surgery, i) => (
                          <span key={i} className={styles.tag}>{surgery}</span>
                        ))}
                      </div>
                    </>
                  )}
                  {medicalHistory?.familyHistory && medicalHistory.familyHistory.length > 0 && (
                    <>
                      <h4 className={styles.subheading}>Family History</h4>
                      <div className={styles.tagList}>
                        {medicalHistory.familyHistory.map((item, i) => (
                          <span key={i} className={styles.tag}>{item}</span>
                        ))}
                      </div>
                    </>
                  )}
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

