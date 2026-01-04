/**
 * VaccinationModal
 * 
 * Modal wrapper for the vaccination form.
 */

import { useState, useEffect } from 'react';
import { Button } from '../common';
import { 
  api, 
  VaccinationStatus_Response, 
  VaccinationRecord,
  VaccineDose,
  VaccinationStatus,
} from '../../services/api';
import styles from './VaccinationModal.module.css';

interface VaccinationModalProps {
  dependentId: string;
  dependentName: string;
  onClose: () => void;
  onSave?: () => void;
}

type StatusValue = VaccinationStatus;

interface DoseFormState {
  status: StatusValue;
  dateAdministered?: string;
  notes?: string;
}

export function VaccinationModal({
  dependentId,
  dependentName,
  onClose,
  onSave,
}: VaccinationModalProps) {
  const [status, setStatus] = useState<VaccinationStatus_Response | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Form state: map of doseId -> form values
  const [formState, setFormState] = useState<Record<string, DoseFormState>>({});
  
  // Track which doses have been modified
  const [modifiedDoses, setModifiedDoses] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadStatus = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const data = await api.getDependentVaccinationStatus(dependentId);
        setStatus(data);
        
        // Initialize form state from existing records
        const initialState: Record<string, DoseFormState> = {};
        for (const record of data.records) {
          initialState[record.doseId] = {
            status: record.status,
            dateAdministered: record.dateAdministered,
            notes: record.notes,
          };
        }
        setFormState(initialState);
      } catch (err) {
        console.error('[VaccinationModal] Failed to load:', err);
        setError('Não foi possível carregar os dados de vacinação');
      } finally {
        setIsLoading(false);
      }
    };

    loadStatus();
  }, [dependentId]);

  const handleStatusChange = (doseId: string, newStatus: StatusValue) => {
    setFormState(prev => ({
      ...prev,
      [doseId]: {
        ...prev[doseId],
        status: newStatus,
      },
    }));
    setModifiedDoses(prev => new Set(prev).add(doseId));
    setSaveSuccess(false);
  };

  const handleDateChange = (doseId: string, date: string) => {
    setFormState(prev => {
      const existing = prev[doseId] || { status: 'unknown' as StatusValue };
      return {
        ...prev,
        [doseId]: {
          ...existing,
          dateAdministered: date || undefined,
        },
      };
    });
    setModifiedDoses(prev => new Set(prev).add(doseId));
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    if (modifiedDoses.size === 0) {
      onClose();
      return;
    }

    setIsSaving(true);
    setError(null);
    
    try {
      // Collect all modified records
      const records: VaccinationRecord[] = Array.from(modifiedDoses)
        .filter(doseId => formState[doseId] !== undefined)
        .map(doseId => {
          const state = formState[doseId]!;
          return {
            doseId,
            status: state.status,
            dateAdministered: state.dateAdministered,
            notes: state.notes,
          };
        });

      await api.updateDependentVaccinationRecords(dependentId, records);
      
      setSaveSuccess(true);
      setModifiedDoses(new Set());
      onSave?.();
      
      // Auto-close after short delay
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error('[VaccinationModal] Failed to save:', err);
      setError('Não foi possível guardar as alterações');
    } finally {
      setIsSaving(false);
    }
  };

  // Group doses by age milestone
  const groupDosesByAge = (doses: VaccineDose[]): Record<string, VaccineDose[]> => {
    const groups: Record<string, VaccineDose[]> = {};
    
    for (const dose of doses) {
      const label = dose.ageLabel;
      if (!groups[label]) {
        groups[label] = [];
      }
      groups[label]!.push(dose);
    }
    
    return groups;
  };

  const getStatusIcon = (status?: StatusValue): string => {
    switch (status) {
      case 'yes': return '✅';
      case 'no': return '❌';
      case 'unknown': return '❓';
      default: return '⭕';
    }
  };

  const isOverdue = (dose: VaccineDose): boolean => {
    const currentStatus = formState[dose.id]?.status;
    return !currentStatus || currentStatus === 'no';
  };

  if (isLoading) {
    return (
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.modal} onClick={e => e.stopPropagation()}>
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <p>A carregar dados de vacinação...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !status) {
    return (
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.modal} onClick={e => e.stopPropagation()}>
          <div className={styles.error}>
            <span className={styles.errorIcon}>⚠️</span>
            <p>{error}</p>
            <Button onClick={onClose}>Fechar</Button>
          </div>
        </div>
      </div>
    );
  }

  if (!status?.applicable) {
    return (
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.modal} onClick={e => e.stopPropagation()}>
          <div className={styles.notApplicable}>
            <span className={styles.icon}>👶</span>
            <h3>Vacinação Infantil</h3>
            <p>O calendário de vacinação infantil aplica-se apenas a crianças até aos 5 anos de idade.</p>
            <Button onClick={onClose}>Fechar</Button>
          </div>
        </div>
      </div>
    );
  }

  const groupedDoses = groupDosesByAge(status.relevantDoses);
  const ageLabels = Object.keys(groupedDoses);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        {/* Header - Fixed at top */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <h2 className={styles.title}>Registo de Vacinação</h2>
            <p className={styles.subtitle}>
              {dependentName} • {status.ageMonths ?? 0} meses ({status.ageYears ?? 0} anos)
            </p>
          </div>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        {/* Progress - Fixed */}
        <div className={styles.progressSection}>
          <div className={styles.progressInfo}>
            <span>Progresso</span>
            <span className={styles.progressPercent}>{status.progress}%</span>
          </div>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill} 
              style={{ width: `${status.progress}%` }}
            />
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className={styles.errorBanner}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Success message */}
        {saveSuccess && (
          <div className={styles.successBanner}>
            <span>✅</span>
            <span>Alterações guardadas com sucesso!</span>
          </div>
        )}

        {/* Scrollable Form */}
        <div className={styles.formContainer}>
              {ageLabels.map(ageLabel => (
                <div key={ageLabel} className={styles.ageGroup}>
                  <h3 className={styles.ageLabel}>{ageLabel}</h3>
                  
                  <div className={styles.doseList}>
                    {(groupedDoses[ageLabel] ?? []).map(dose => {
                      const currentState = formState[dose.id];
                      const ageMonths = status.ageMonths ?? 0;
                      const overdueFlag = isOverdue(dose) && ageMonths > dose.ageMonths + 1;
                      
                      return (
                        <div 
                          key={dose.id} 
                          className={`${styles.doseRow} ${overdueFlag ? styles.overdueRow : ''}`}
                        >
                          <div className={styles.doseInfo}>
                            <span className={styles.doseIcon}>
                              {getStatusIcon(currentState?.status)}
                            </span>
                            <div className={styles.doseText}>
                              <span className={styles.doseName}>
                                {dose.vaccineAbbrev}
                                {dose.totalDoses > 1 && (
                                  <span className={styles.doseNumber}>
                                    {' '}({dose.doseNumber}ª de {dose.totalDoses})
                                  </span>
                                )}
                              </span>
                              <span className={styles.doseDescription}>
                                {dose.vaccineName}
                              </span>
                              {dose.description && (
                                <span className={styles.doseNote}>{dose.description}</span>
                              )}
                              {overdueFlag && (
                                <span className={styles.overdueTag}>Em atraso</span>
                              )}
                            </div>
                          </div>
                          
                          <div className={styles.doseActions}>
                            <select
                              value={currentState?.status || ''}
                              onChange={e => handleStatusChange(dose.id, e.target.value as StatusValue)}
                              className={styles.statusSelect}
                            >
                              <option value="">Selecionar...</option>
                              <option value="yes">✅ Sim</option>
                              <option value="no">❌ Não</option>
                              <option value="unknown">❓ Não sei</option>
                            </select>
                            
                            {currentState?.status === 'yes' && (
                              <input
                                type="date"
                                value={currentState.dateAdministered || ''}
                                onChange={e => handleDateChange(dose.id, e.target.value)}
                                className={styles.dateInput}
                                placeholder="Data"
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

        {/* Footer - Fixed at bottom */}
        <div className={styles.footer}>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            isLoading={isSaving}
            disabled={modifiedDoses.size === 0}
          >
            {modifiedDoses.size === 0 ? 'Sem alterações' : 'Guardar'}
          </Button>
        </div>
      </div>
    </div>
  );
}

