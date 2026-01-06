/**
 * Patients Page
 * 
 * List of all patients the doctor has communicated with.
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as api from '../services/api';
import styles from './PatientsPage.module.css';

export default function PatientsPage() {
  const [patients, setPatients] = useState<api.Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const loadPatients = async () => {
      try {
        const res = await api.getPatients();
        setPatients(res.patients);
      } catch (error) {
        console.error('Failed to load patients:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadPatients();
  }, []);

  const filteredPatients = patients.filter(
    (p) =>
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.email?.toLowerCase().includes(search.toLowerCase())
  );

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
        <h1>Patients</h1>
        <div className={styles.searchBox}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Search patients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </header>

      {filteredPatients.length > 0 ? (
        <div className={styles.grid}>
          {filteredPatients.map((patient) => (
            <Link
              key={patient._id}
              to={`/patients/${patient._id}`}
              className={styles.patientCard}
            >
              <div className={styles.avatar}>
                {patient.name?.charAt(0) || 'P'}
              </div>
              <div className={styles.info}>
                <h3 className={styles.name}>{patient.name || 'Unknown'}</h3>
                <p className={styles.email}>{patient.email || 'No email'}</p>
              </div>
              <span className={styles.arrow}>→</span>
            </Link>
          ))}
        </div>
      ) : (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>👥</span>
          <h3>No patients found</h3>
          <p>
            {search
              ? 'Try a different search term'
              : 'When patients message you, they will appear here.'}
          </p>
        </div>
      )}
    </div>
  );
}

