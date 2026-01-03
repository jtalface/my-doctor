/**
 * DependentsManager
 * 
 * Component for managing family members/dependents in the Settings page.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, Button } from '../common';
import { AddDependentModal } from './AddDependentModal';
import { ShareDependentModal } from './ShareDependentModal';
import { useActiveProfile } from '../../contexts';
import { useTranslate } from '../../i18n';
import { api, type Dependent } from '../../services/api';
import styles from './DependentsManager.module.css';

export function DependentsManager() {
  const { dependents, isLoadingDependents, deleteDependent, refreshDependents } = useActiveProfile();
  const t = useTranslate();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [shareDependent, setShareDependent] = useState<Dependent | null>(null);
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Dependent | null>(null);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    
    setDeletingId(confirmDelete.id);
    try {
      await deleteDependent(confirmDelete.id);
      setConfirmDelete(null);
    } catch (error) {
      console.error('Failed to delete dependent:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleExport = async (dependent: Dependent) => {
    setExportingId(dependent.id);
    try {
      // Fetch all dependent data
      const [profile, sessions] = await Promise.all([
        api.getDependentProfile(dependent.id),
        api.getDependentSessions(dependent.id),
      ]);

      // Create export data
      const exportData = {
        exportedAt: new Date().toISOString(),
        dependent: {
          name: dependent.name,
          dateOfBirth: dependent.dateOfBirth,
          age: dependent.age,
          relationship: dependent.relationship,
          preferences: dependent.preferences,
        },
        profile,
        sessions: sessions.map(s => ({
          id: s._id,
          status: s.status,
          startedAt: s.startedAt,
          completedAt: s.completedAt,
          summary: s.summary,
        })),
      };

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${dependent.name.replace(/\s+/g, '_')}_health_data_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export data:', error);
    } finally {
      setExportingId(null);
    }
  };

  const getRelationshipLabel = (relationship: string): string => {
    const key = `dependents_relationship_${relationship}` as const;
    return t(key as any) || relationship;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>{t('dependents_title')}</h2>
        <Button 
          size="sm"
          onClick={() => setShowAddModal(true)}
        >
          {t('dependents_add_button')}
        </Button>
      </div>

      {isLoadingDependents ? (
        <Card variant="outline" padding="lg">
          <CardContent>
            <div className={styles.loading}>
              <div className={styles.spinner} />
              <p>{t('dependents_loading')}</p>
            </div>
          </CardContent>
        </Card>
      ) : dependents.length === 0 ? (
        <Card variant="outline" padding="lg">
          <CardContent>
            <div className={styles.empty}>
              <span className={styles.emptyIcon}>👨‍👩‍👧‍👦</span>
              <h3>{t('dependents_empty_title')}</h3>
              <p>{t('dependents_empty_message')}</p>
              <Button onClick={() => setShowAddModal(true)}>
                {t('dependents_add_button')}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className={styles.list}>
          {dependents.map(dependent => (
            <Card key={dependent.id} variant="default" padding="md">
              <CardContent>
                <div className={styles.dependentCard}>
                  <div className={styles.dependentAvatar}>
                    {getInitials(dependent.name)}
                  </div>
                  <div className={styles.dependentInfo}>
                    <div className={styles.dependentHeader}>
                      <span className={styles.dependentName}>{dependent.name}</span>
                      {dependent.isPrimary && (
                        <span className={styles.primaryBadge}>
                          {t('dependents_primary_manager')}
                        </span>
                      )}
                    </div>
                    <div className={styles.dependentMeta}>
                      <span>{getRelationshipLabel(dependent.relationship)}</span>
                      <span>•</span>
                      <span>{t('dependents_age_years', { age: dependent.age })}</span>
                    </div>
                    <div className={styles.dependentDob}>
                      {formatDate(dependent.dateOfBirth)}
                    </div>
                  </div>
                  <div className={styles.dependentActions}>
                    <Link 
                      to={`/dependent/${dependent.id}/profile/setup`}
                      className={styles.actionButton}
                      aria-label={t('dependents_edit')}
                      title={t('dependents_edit')}
                    >
                      ✏️
                    </Link>
                    <button 
                      className={styles.actionButton}
                      onClick={() => setShareDependent(dependent)}
                      aria-label={t('dependents_share')}
                      title={t('dependents_share')}
                    >
                      🔗
                    </button>
                    <button 
                      className={styles.actionButton}
                      onClick={() => handleExport(dependent)}
                      disabled={exportingId === dependent.id}
                      aria-label={t('dependents_export')}
                      title={t('dependents_export')}
                    >
                      {exportingId === dependent.id ? '⏳' : '📥'}
                    </button>
                    <button 
                      className={styles.actionButton}
                      onClick={() => setConfirmDelete(dependent)}
                      aria-label={t('dependents_delete')}
                      title={t('dependents_delete')}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Dependent Modal */}
      {showAddModal && (
        <AddDependentModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            refreshDependents();
          }}
        />
      )}

      {/* Share Dependent Modal */}
      {shareDependent && (
        <ShareDependentModal
          dependentId={shareDependent.id}
          dependentName={shareDependent.name}
          onClose={() => setShareDependent(null)}
          onSuccess={() => {
            refreshDependents();
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className={styles.confirmOverlay} onClick={() => setConfirmDelete(null)}>
          <div className={styles.confirmModal} onClick={e => e.stopPropagation()}>
            <Card variant="default" padding="lg">
              <CardContent>
                <h3 className={styles.confirmTitle}>
                  {t('dependents_delete_confirm_title')}
                </h3>
                <p className={styles.confirmMessage}>
                  {t('dependents_delete_confirm_message', { name: confirmDelete.name })}
                </p>
                <div className={styles.confirmActions}>
                  <Button
                    variant="outline"
                    onClick={() => setConfirmDelete(null)}
                    disabled={!!deletingId}
                  >
                    {t('common_cancel')}
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleDelete}
                    isLoading={deletingId === confirmDelete.id}
                    className={styles.deleteButton}
                  >
                    {t('dependents_delete_confirm_button')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

