/**
 * VaccinationAlert
 * 
 * Shows a notification banner when a dependent is missing vaccination records
 * or has overdue vaccinations.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, Button } from '../common';
import { api, VaccinationStatus_Response } from '../../services/api';
import styles from './VaccinationAlert.module.css';

interface VaccinationAlertProps {
  dependentId: string;
  dependentName: string;
  onOpenVaccinationModal: () => void;
}

export function VaccinationAlert({
  dependentId,
  dependentName,
  onOpenVaccinationModal,
}: VaccinationAlertProps) {
  const [status, setStatus] = useState<VaccinationStatus_Response | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const loadStatus = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const data = await api.getDependentVaccinationStatus(dependentId);
        setStatus(data);
      } catch (err) {
        console.error('[VaccinationAlert] Failed to load status:', err);
        setError('Não foi possível verificar o estado de vacinação');
      } finally {
        setIsLoading(false);
      }
    };

    loadStatus();
  }, [dependentId]);

  // Don't show if dismissed, loading, has error, or not applicable
  if (isDismissed || isLoading || error || !status?.applicable) {
    return null;
  }

  // Don't show if vaccination is up to date
  if (!status.needsAttention) {
    return null;
  }

  const overdueCount = status.overdueDoses.length;
  const hasNoRecords = !status.hasRecords;

  return (
    <Card variant="outline" className={styles.alertCard}>
      <CardContent>
        <div className={styles.content}>
          <div className={styles.iconContainer}>
            <span className={styles.icon}>💉</span>
          </div>
          
          <div className={styles.textContent}>
            <h3 className={styles.title}>
              {hasNoRecords
                ? 'Registo de Vacinação em Falta'
                : 'Vacinas Pendentes'}
            </h3>
            <p className={styles.message}>
              {hasNoRecords
                ? `Adicione os registos de vacinação de ${dependentName} para acompanhar o calendário de vacinação.`
                : `${dependentName} tem ${overdueCount} vacina${overdueCount > 1 ? 's' : ''} em atraso ou por registar.`}
            </p>
            
            {/* Show progress if there are some records */}
            {status.hasRecords && (
              <div className={styles.progressContainer}>
                <div className={styles.progressBar}>
                  <div 
                    className={styles.progressFill} 
                    style={{ width: `${status.progress}%` }}
                  />
                </div>
                <span className={styles.progressText}>{status.progress}% completo</span>
              </div>
            )}
          </div>
          
          <div className={styles.actions}>
            <Button
              size="sm"
              onClick={onOpenVaccinationModal}
            >
              {hasNoRecords ? 'Adicionar Registos' : 'Ver Vacinas'}
            </Button>
            <button
              className={styles.dismissButton}
              onClick={() => setIsDismissed(true)}
              aria-label="Dispensar"
            >
              ×
            </button>
          </div>
        </div>
        
        {/* Show overdue vaccines summary */}
        {overdueCount > 0 && overdueCount <= 3 && (
          <div className={styles.overdueSummary}>
            <span className={styles.overdueLabel}>Em atraso:</span>
            {status.overdueDoses.slice(0, 3).map((dose, i) => (
              <span key={dose.id} className={styles.overdueVaccine}>
                {dose.vaccineAbbrev}
                {dose.doseNumber > 0 && ` (${dose.doseNumber}ª dose)`}
                {i < Math.min(overdueCount, 3) - 1 && ', '}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

