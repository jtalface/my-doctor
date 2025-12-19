import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@components/common';
import { PromptPanel, UserInput, LLMResponse, SessionProgress } from '@components/session';
import { api, SessionResponse, SessionNode } from '../services/api';
import styles from './CheckupSessionPage.module.css';

export function CheckupSessionPage() {
  const { id: sessionId } = useParams();
  const navigate = useNavigate();
  
  // Session state
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [llmResponse, setLlmResponse] = useState('');
  
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
            state: { summary: response.summary } 
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

  const handleExit = async () => {
    if (sessionId && window.confirm('Are you sure you want to exit? Your progress will be saved.')) {
      try {
        await api.abandonSession(sessionId);
      } catch (err) {
        console.error('Failed to abandon session:', err);
      }
      navigate('/dashboard');
    }
  };

  const handleBack = () => {
    // Note: Back functionality would require session history tracking
    // For now, just clear the LLM response
    setLlmResponse('');
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <p>Loading your session...</p>
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
          <h2>Something went wrong</h2>
          <p>{error}</p>
          <Button onClick={() => navigate('/dashboard')}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (!currentNode) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <p>No session data available</p>
          <Button onClick={() => navigate('/dashboard')}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <button 
          className={styles.exitButton}
          onClick={handleExit}
          aria-label="Exit session"
        >
          ✕ Exit
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
            title={currentNode.prompt}
            subtitle={currentNode.helpText}
            isLoading={isProcessing}
            className={styles.prompt}
          />

          {/* User Input - only show if no LLM response yet */}
          {!llmResponse && (
            <UserInput
              inputType={currentNode.inputType}
              choices={currentNode.choices}
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
          ← Back
        </Button>
        
        {llmResponse && !currentNode.isTerminal && (
          <Button
            onClick={handleContinue}
            disabled={isProcessing}
          >
            Continue →
          </Button>
        )}
      </footer>
    </div>
  );
}
