import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@components/common';
import { PromptPanel, UserInput, LLMResponse, SessionProgress } from '@components/session';
import { useTranslate } from '../i18n';
import { api, SessionResponse, SessionNode } from '../services/api';
import styles from './CheckupSessionPage.module.css';

const MULTI_SELECT_NODE_IDS = new Set(['chronic_conditions', 'red_flag_check', 'family_history']);

function getLocalizedSessionNode(
  node: SessionNode | null,
  t: ReturnType<typeof useTranslate>
): { prompt: string; helpText?: string; choiceLabels?: string[] } {
  if (!node) {
    return { prompt: '' };
  }

  const translate = t as unknown as (key: string, params?: Record<string, string | number>) => string;
  const prompt = translate(`session_node_${node.id}_prompt`) || node.prompt;
  const helpText = node.helpText
    ? (translate(`session_node_${node.id}_help`) || node.helpText)
    : undefined;
  const choiceLabels = node.choices?.map((choice, index) => {
    const localized = translate(`session_node_${node.id}_choice_${index + 1}`);
    return localized || choice;
  });

  return { prompt, helpText, choiceLabels };
}

export function CheckupSessionPage() {
  const { id: sessionId } = useParams();
  const navigate = useNavigate();
  const t = useTranslate();
  
  // Session state
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [llmResponse, setLlmResponse] = useState('');
  const [isExitDialogOpen, setIsExitDialogOpen] = useState(false);
  
  // Current node state
  const [currentNode, setCurrentNode] = useState<SessionNode | null>(null);
  const [progress, setProgress] = useState({ current: 1, total: 10, percentage: 10 });
  const [sessionData, setSessionData] = useState<SessionResponse | null>(null);

  // Load session on mount
  useEffect(() => {
    if (sessionId) {
      loadSession(sessionId);
    }
  }, [sessionId]);

  const loadSession = async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.getSession(id);
      
      setSessionData(response);
      setCurrentNode(response.node);
      setProgress(response.progress);
      
      if (response.llmResponse) {
        setLlmResponse(response.llmResponse);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load session');
      console.error('Failed to load session:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInput = async (input: string) => {
    if (!sessionId) return;
    
    try {
      setIsProcessing(true);
      setError(null);
      
      const response = await api.sendInput(sessionId, input);
      
      // Update state with response
      setSessionData(response);
      setProgress(response.progress);
      
      if (response.llmResponse) {
        setLlmResponse(response.llmResponse);
      }
      
      // Check if we've reached a terminal state
      if (response.node.isTerminal) {
        // Navigate to summary after a brief delay
        setTimeout(() => {
          navigate(`/checkup/summary/${sessionId}`, { 
            state: { summary: response.summary, sessionType: response.sessionType } 
          });
        }, 2000);
      } else {
        // Move to next node
        setCurrentNode(response.node);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process input');
      console.error('Failed to process input:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleContinue = () => {
    // Clear LLM response and show next question
    setLlmResponse('');
    if (sessionData?.node) {
      setCurrentNode(sessionData.node);
    }
  };

  const handleExitConfirm = async () => {
    if (!sessionId) return;

    try {
      await api.abandonSession(sessionId);
    } catch (err) {
      console.error('Failed to abandon session:', err);
    } finally {
      setIsExitDialogOpen(false);
      navigate('/dashboard');
    }
  };

  const handleBack = async () => {
    if (!sessionId || isProcessing) return;

    try {
      setIsProcessing(true);
      setError(null);
      const response = await api.backSession(sessionId);

      setSessionData(response);
      setCurrentNode(response.node);
      setProgress(response.progress);
      setLlmResponse('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to go back';
      if (message.includes('HTTP 404') || message.includes('Cannot POST')) {
        setError('Back action is unavailable right now. Please restart the backend server and try again.');
      } else {
        setError(message);
      }
      console.error('Failed to go back:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <p>{t('session_loading')}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !currentNode) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <p className={styles.errorIcon}>⚠️</p>
          <h2>{t('session_error_title')}</h2>
          <p>{error}</p>
          <Button onClick={() => navigate('/dashboard')}>
            {t('common_return_to_dashboard')}
          </Button>
        </div>
      </div>
    );
  }

  if (!currentNode) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <p>{t('session_no_data')}</p>
          <Button onClick={() => navigate('/dashboard')}>
            {t('common_return_to_dashboard')}
          </Button>
        </div>
      </div>
    );
  }

  const localizedNode = getLocalizedSessionNode(currentNode, t);
  const allowMultipleChoice =
    currentNode.inputType === 'choice' && MULTI_SELECT_NODE_IDS.has(currentNode.id);
  const structuredFields = currentNode.id === 'medication_catalog_all'
    ? []
    : [];
  const structuredMedication = currentNode.id === 'medication_catalog_all'
    ? {
        nameLabel: t('session_medication_field_name'),
        namePlaceholder: t('session_medication_field_name_placeholder'),
        mgLabel: t('session_medication_field_mg'),
        mgPlaceholder: t('session_medication_field_mg_placeholder'),
        dosageLabel: t('session_medication_field_dosage'),
        dosageOptions: [
          t('session_medication_dosage_4_day'),
          t('session_medication_dosage_3_day'),
          t('session_medication_dosage_2_day'),
          t('session_medication_dosage_1_day'),
          t('session_medication_dosage_every_other_day'),
          t('session_medication_dosage_1_week'),
        ],
        addRowLabel: t('session_medication_add_row'),
      }
    : undefined;
  const structuredSideEffects = currentNode.id === 'medication_wrapup'
    ? {
        sideEffectsLabel: t('session_medication_side_effects_label'),
        sideEffectsPlaceholder: t('session_medication_side_effects_placeholder'),
        sideEffectsNoneLabel: t('session_medication_side_effects_none'),
        sideEffectsOptions: [
          t('session_medication_side_effect_nausea'),
          t('session_medication_side_effect_vomiting'),
          t('session_medication_side_effect_diarrhea'),
          t('session_medication_side_effect_abdominal_pain'),
          t('session_medication_side_effect_loss_of_appetite'),
          t('session_medication_side_effect_dizziness'),
          t('session_medication_side_effect_headache'),
          t('session_medication_side_effect_drowsiness'),
          t('session_medication_side_effect_insomnia'),
          t('session_medication_side_effect_fatigue'),
          t('session_medication_side_effect_tremors'),
          t('session_medication_side_effect_palpitations'),
          t('session_medication_side_effect_shortness_of_breath'),
          t('session_medication_side_effect_dry_mouth'),
          t('session_medication_side_effect_blurred_vision'),
          t('session_medication_side_effect_sweating'),
          t('session_medication_side_effect_sexual_dysfunction'),
          t('session_medication_side_effect_rash'),
          t('session_medication_side_effect_itching'),
          t('session_medication_side_effect_swelling'),
        ],
        additionalInfoLabel: t('session_medication_side_effects_other_label'),
        additionalInfoPlaceholder: t('session_medication_side_effects_other_placeholder'),
      }
    : undefined;

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <button 
          className={styles.exitButton}
          onClick={() => setIsExitDialogOpen(true)}
          aria-label={t('session_exit_label')}
        >
          ✕ {t('session_exit')}
        </button>
        <SessionProgress 
          current={progress.current} 
          total={progress.total} 
          className={styles.progress}
        />
      </header>

      {/* Main content */}
      <main className={styles.main}>
        <div className={styles.content}>
          {/* Error banner */}
          {error && (
            <div className={styles.errorBanner}>
              {error}
              <button onClick={() => setError(null)}>✕</button>
            </div>
          )}

          {/* Prompt */}
          <PromptPanel
            title={localizedNode.prompt}
            subtitle={localizedNode.helpText}
            isLoading={isProcessing}
            className={styles.prompt}
          />

          {/* User Input - only show if no LLM response yet */}
          {!llmResponse && (
            <UserInput
              inputType={currentNode.inputType}
              choices={currentNode.choices}
              choiceLabels={localizedNode.choiceLabels}
              allowMultipleChoice={allowMultipleChoice}
              continueLabel={t('common_continue')}
              structuredFields={structuredFields}
              structuredMedication={structuredMedication}
              structuredSideEffects={structuredSideEffects}
              onSubmit={handleInput}
              isLoading={isProcessing}
              className={styles.input}
            />
          )}

          {/* LLM Response */}
          {(llmResponse || isProcessing) && (
            <LLMResponse
              content={llmResponse}
              isLoading={isProcessing}
              className={styles.response}
            />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <Button
          variant="ghost"
          onClick={handleBack}
          disabled={isProcessing}
        >
          {t('session_back')}
        </Button>
        
        {llmResponse && !currentNode.isTerminal && (
          <Button
            onClick={handleContinue}
            disabled={isProcessing}
          >
            {t('session_continue')}
          </Button>
        )}
      </footer>

      {isExitDialogOpen && (
        <div className={styles.exitOverlay} role="dialog" aria-modal="true" aria-labelledby="exit-dialog-title">
          <div className={styles.exitBackdrop} onClick={() => setIsExitDialogOpen(false)} />
          <div className={styles.exitModal}>
            <h2 id="exit-dialog-title" className={styles.exitTitle}>
              {t('session_exit')}
            </h2>
            <p className={styles.exitMessage}>{t('session_exit_confirm')}</p>
            <div className={styles.exitActions}>
              <Button variant="ghost" onClick={() => setIsExitDialogOpen(false)}>
                {t('common_cancel')}
              </Button>
              <Button variant="danger" onClick={handleExitConfirm}>
                {t('session_exit')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
