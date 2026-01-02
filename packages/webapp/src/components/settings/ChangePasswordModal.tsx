import { useState, useEffect } from 'react';
import { Button } from '@components/common';
import { changePassword, getPasswordRequirements } from '../../auth/authService';
import { useTranslate } from '../../i18n';
import styles from './ChangePasswordModal.module.css';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ChangePasswordModal({ isOpen, onClose, onSuccess }: ChangePasswordModalProps) {
  const t = useTranslate();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [requirements, setRequirements] = useState<string[]>([]);

  // Load password requirements
  useEffect(() => {
    if (isOpen) {
      getPasswordRequirements().then(setRequirements).catch(console.error);
    }
  }, [isOpen]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      setSuccess(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!currentPassword) {
      setError(t('change_password_error_current_required'));
      return;
    }

    if (!newPassword) {
      setError(t('change_password_error_new_required'));
      return;
    }

    if (newPassword.length < 8) {
      setError(t('change_password_error_too_short'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('change_password_error_mismatch'));
      return;
    }

    if (currentPassword === newPassword) {
      setError(t('change_password_error_same'));
      return;
    }

    setIsLoading(true);

    try {
      await changePassword(currentPassword, newPassword);
      setSuccess(true);
      onSuccess?.();
      
      // Close modal after showing success message
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('change_password_error_failed'));
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>{t('change_password_title')}</h2>
          <button className={styles.closeButton} onClick={onClose} aria-label={t('common_close')}>
            ✕
          </button>
        </div>

        {success ? (
          <div className={styles.successMessage}>
            <span className={styles.successIcon}>✅</span>
            <p>{t('change_password_success')}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            {error && <p className={styles.error}>{error}</p>}

            <div className={styles.inputGroup}>
              <label htmlFor="currentPassword" className={styles.label}>
                {t('change_password_current_label')}
              </label>
              <div className={styles.inputWrapper}>
                <input
                  id="currentPassword"
                  type={showPasswords ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder={t('change_password_current_placeholder')}
                  className={styles.input}
                  autoComplete="current-password"
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="newPassword" className={styles.label}>
                {t('change_password_new_label')}
              </label>
              <div className={styles.inputWrapper}>
                <input
                  id="newPassword"
                  type={showPasswords ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t('change_password_new_placeholder')}
                  className={styles.input}
                  autoComplete="new-password"
                />
              </div>
              {requirements.length > 0 && (
                <ul className={styles.requirements}>
                  {requirements.map((req, i) => (
                    <li key={i}>{req}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="confirmPassword" className={styles.label}>
                {t('change_password_confirm_label')}
              </label>
              <div className={styles.inputWrapper}>
                <input
                  id="confirmPassword"
                  type={showPasswords ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('change_password_confirm_placeholder')}
                  className={`${styles.input} ${confirmPassword && newPassword !== confirmPassword ? styles.inputError : ''}`}
                  autoComplete="new-password"
                />
                {confirmPassword && (
                  newPassword === confirmPassword ? (
                    <span className={styles.validIcon}>✓</span>
                  ) : (
                    <span className={styles.invalidIcon}>✕</span>
                  )
                )}
              </div>
            </div>

            <label className={styles.showPassword}>
              <input
                type="checkbox"
                checked={showPasswords}
                onChange={(e) => setShowPasswords(e.target.checked)}
              />
              {t('change_password_show_passwords')}
            </label>

            <div className={styles.actions}>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                {t('common_cancel')}
              </Button>
              <Button
                type="submit"
                isLoading={isLoading}
                disabled={!currentPassword || !newPassword || !confirmPassword}
              >
                {t('change_password_submit')}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

