/**
 * Register Page
 * 
 * Doctor registration form with professional credentials.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BrandingFooter } from '../components/BrandingFooter';
import { Logo } from '../components/Logo';
import { useAuth } from '../auth';
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
  
  // Form state
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
  const [step, setStep] = useState(1); // Multi-step form

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateStep1 = () => {
    if (!formData.firstName.trim()) {
      setError('First name is required');
      return false;
    }
    if (!formData.lastName.trim()) {
      setError('Last name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!formData.password) {
      setError('Password is required');
      return false;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    if (!/[A-Z]/.test(formData.password)) {
      setError('Password must contain at least one uppercase letter');
      return false;
    }
    if (!/[a-z]/.test(formData.password)) {
      setError('Password must contain at least one lowercase letter');
      return false;
    }
    if (!/[0-9]/.test(formData.password)) {
      setError('Password must contain at least one number');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.specialty) {
      setError('Please select a specialty');
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
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
    <div className={styles.page}>
      {/* Background Pattern */}
      <div className={styles.background}>
        <div className={styles.pattern}></div>
      </div>

      {/* Register Card */}
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <Logo variant="icon" size="lg" />
            <h1 className={styles.logoTitle}>Zambe</h1>
          </div>
          <p className={styles.subtitle}>Create Your Provider Account</p>
        </div>

        {/* Progress Indicator */}
        <div className={styles.progress}>
          <div className={`${styles.progressStep} ${step >= 1 ? styles.active : ''}`}>
            <span className={styles.stepNumber}>1</span>
            <span className={styles.stepLabel}>Account</span>
          </div>
          <div className={styles.progressLine}></div>
          <div className={`${styles.progressStep} ${step >= 2 ? styles.active : ''}`}>
            <span className={styles.stepNumber}>2</span>
            <span className={styles.stepLabel}>Credentials</span>
          </div>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {step === 1 && (
            <div className={styles.stepContent}>
              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label htmlFor="firstName">First Name *</label>
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
                  <label htmlFor="lastName">Last Name *</label>
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
                <label htmlFor="email">Email Address *</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="doctor@example.com"
                  autoComplete="email"
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="password">Password *</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
                <span className={styles.hint}>
                  Min 8 characters with uppercase, lowercase, and number
                </span>
              </div>

              <div className={styles.field}>
                <label htmlFor="confirmPassword">Confirm Password *</label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </div>

              {error && <div className={styles.error}>{error}</div>}

              <button
                type="button"
                className={styles.nextBtn}
                onClick={handleNextStep}
              >
                Continue →
              </button>
            </div>
          )}

          {step === 2 && (
            <div className={styles.stepContent}>
              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label htmlFor="title">Title</label>
                  <select
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                  >
                    {TITLES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.field} style={{ flex: 2 }}>
                  <label htmlFor="specialty">Specialty *</label>
                  <select
                    id="specialty"
                    name="specialty"
                    value={formData.specialty}
                    onChange={handleChange}
                  >
                    <option value="">Select your specialty</option>
                    {SPECIALTIES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.field}>
                <label htmlFor="licenseNumber">Medical License Number</label>
                <input
                  id="licenseNumber"
                  name="licenseNumber"
                  type="text"
                  value={formData.licenseNumber}
                  onChange={handleChange}
                  placeholder="e.g., MOZ-2024-12345"
                />
                <span className={styles.hint}>
                  Your medical license will be verified
                </span>
              </div>

              <div className={styles.field}>
                <label htmlFor="phone">Phone Number</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+258 84 XXX XXXX"
                  autoComplete="tel"
                />
              </div>

              {error && <div className={styles.error}>{error}</div>}

              <div className={styles.buttonRow}>
                <button
                  type="button"
                  className={styles.backBtn}
                  onClick={handlePrevStep}
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </button>
              </div>
            </div>
          )}
        </form>

        <div className={styles.footer}>
          <p>
            Already have an account?{' '}
            <Link to="/login" className={styles.link}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
    <BrandingFooter />
    </>
  );
}

