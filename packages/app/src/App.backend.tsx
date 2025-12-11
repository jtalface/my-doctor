import React, { useState, useEffect } from 'react';
import { apiClient, SendInputResponse, LLMProviderType, LLMProviderInfo } from './services/api';
import styles from './App.module.css';

interface AppBackendProps {
  userEmail: string;
  userName?: string;
  onBack: () => void;
}

interface ConversationStep {
  nodeId: string;
  input: string;
  response: string;
  timestamp: Date;
}

/**
 * App.backend.tsx
 * 
 * Full Mode - Uses the backend API for:
 * - Persistent sessions (MongoDB)
 * - Medical reasoning engine
 * - User profiles & health records
 * - Conversation history
 */
const AppBackend: React.FC<AppBackendProps> = ({ userEmail, userName, onBack }) => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentState, setCurrentState] = useState<string>('');
  const [prompt, setPrompt] = useState<string>('');
  const [inputType, setInputType] = useState<'choice' | 'text' | 'none'>('none');
  const [choices, setChoices] = useState<string[]>([]);
  const [response, setResponse] = useState<string>('');
  const [isTerminal, setIsTerminal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');
  const [conversation, setConversation] = useState<ConversationStep[]>([]);
  const [reasoning, setReasoning] = useState<SendInputResponse['data']['reasoning'] | null>(null);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  
  // LLM Provider state
  const [llmProviders, setLlmProviders] = useState<LLMProviderInfo[]>([]);
  const [activeProvider, setActiveProvider] = useState<LLMProviderType>('lm-studio');
  const [showLLMSettings, setShowLLMSettings] = useState(false);
  const [llmLoading, setLlmLoading] = useState(false);

  // Check backend health on mount
  useEffect(() => {
    checkBackendHealth();
  }, []);

  // Load LLM providers when backend is online
  useEffect(() => {
    if (backendStatus === 'online') {
      loadLLMProviders();
    }
  }, [backendStatus]);

  // Start session when backend is online
  useEffect(() => {
    if (backendStatus === 'online' && !sessionId) {
      startSession();
    }
  }, [backendStatus]);

  const checkBackendHealth = async () => {
    try {
      await apiClient.checkHealth();
      setBackendStatus('online');
    } catch {
      setBackendStatus('offline');
      setError('Backend server is not running. Please start it with: cd packages/backend && pnpm dev');
    }
  };

  const loadLLMProviders = async () => {
    try {
      const result = await apiClient.getLLMProviders();
      setLlmProviders(result.providers);
      setActiveProvider(result.activeProvider);
    } catch (err) {
      console.error('Failed to load LLM providers:', err);
    }
  };

  const handleProviderChange = async (type: LLMProviderType) => {
    setLlmLoading(true);
    try {
      await apiClient.setLLMProvider(type);
      setActiveProvider(type);
      // Refresh provider status
      await loadLLMProviders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change provider');
    } finally {
      setLlmLoading(false);
    }
  };

  const handleCheckAvailability = async () => {
    setLlmLoading(true);
    try {
      await apiClient.checkLLMAvailability();
      await loadLLMProviders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check availability');
    } finally {
      setLlmLoading(false);
    }
  };

  const startSession = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.startSession(userEmail, userName);
      setSessionId(result.data.sessionId);
      setCurrentState(result.data.currentState);
      setPrompt(result.data.prompt);
      setInputType(result.data.inputType);
      setChoices(result.data.choices);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start session');
    } finally {
      setLoading(false);
    }
  };

  const handleInput = async (input: string) => {
    if (!sessionId || loading) return;

    setLoading(true);
    setError(null);
    setTextInput('');

    try {
      const result = await apiClient.sendInput(sessionId, input);
      
      // Add to conversation history
      setConversation(prev => [...prev, {
        nodeId: result.data.previousState,
        input,
        response: result.data.response,
        timestamp: new Date()
      }]);

      // Update state
      setResponse(result.data.response);
      setCurrentState(result.data.currentState);
      setPrompt(result.data.prompt);
      setInputType(result.data.inputType);
      setChoices(result.data.choices);
      setIsTerminal(result.data.isTerminal);
      setReasoning(result.data.reasoning || null);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send input');
    } finally {
      setLoading(false);
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (textInput.trim()) {
      handleInput(textInput.trim());
    }
  };

  const handleNewSession = () => {
    setSessionId(null);
    setConversation([]);
    setResponse('');
    setReasoning(null);
    setIsTerminal(false);
    startSession();
  };

  // Render backend offline state
  if (backendStatus === 'offline') {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>🏥 MyDoctor - Full Mode</h1>
          <button onClick={onBack} className={styles.backButton}>
            ← Back to Menu
          </button>
        </div>
        <div className={styles.error}>
          <h2>⚠️ Backend Offline</h2>
          <p>The backend server is not running.</p>
          <pre className={styles.code}>
            cd packages/backend && pnpm dev
          </pre>
          <button onClick={checkBackendHealth} className={styles.demoButton}>
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // Render loading state
  if (backendStatus === 'checking' || (!sessionId && loading)) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>🏥 MyDoctor - Full Mode</h1>
        </div>
        <div className={styles.loading}>
          <p>🔄 {backendStatus === 'checking' ? 'Connecting to backend...' : 'Starting session...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>🏥 MyDoctor - Full Mode</h1>
        <div className={styles.headerButtons}>
          <span className={styles.sessionInfo}>
            📧 {userEmail} | Session: {sessionId?.slice(-8)}
          </span>
          <button 
            onClick={() => setShowLLMSettings(!showLLMSettings)} 
            className={styles.settingsButton}
            title="LLM Settings"
          >
            🤖 {llmProviders.find(p => p.type === activeProvider)?.name || 'LLM'}
          </button>
          <button onClick={onBack} className={styles.backButton}>
            ← Back to Menu
          </button>
        </div>
      </div>

      {/* LLM Provider Settings Panel */}
      {showLLMSettings && (
        <div className={styles.llmSettings}>
          <div className={styles.llmSettingsHeader}>
            <h3>🤖 LLM Provider Settings</h3>
            <button onClick={() => setShowLLMSettings(false)} className={styles.closeButton}>×</button>
          </div>
          <div className={styles.providerList}>
            {llmProviders.map((provider) => (
              <div 
                key={provider.type} 
                className={`${styles.providerCard} ${provider.type === activeProvider ? styles.providerActive : ''}`}
              >
                <div className={styles.providerInfo}>
                  <div className={styles.providerName}>
                    {provider.type === 'lm-studio' ? '🖥️' : provider.type === 'openai' ? '🧠' : '🔮'}
                    {' '}{provider.name}
                  </div>
                  <div className={styles.providerModel}>Model: {provider.model}</div>
                  <div className={styles.providerStatus}>
                    Status: {' '}
                    <span className={provider.available === true ? styles.statusOnline : 
                                    provider.available === false ? styles.statusOffline : 
                                    styles.statusUnknown}>
                      {provider.available === true ? '🟢 Available' : 
                       provider.available === false ? '🔴 Unavailable' : 
                       '⚪ Unknown'}
                    </span>
                    {!provider.configured && <span className={styles.notConfigured}> (Not configured)</span>}
                  </div>
                </div>
                <button
                  onClick={() => handleProviderChange(provider.type)}
                  disabled={llmLoading || provider.type === activeProvider || !provider.configured}
                  className={`${styles.selectProviderButton} ${provider.type === activeProvider ? styles.selectedProvider : ''}`}
                >
                  {provider.type === activeProvider ? '✓ Active' : 'Select'}
                </button>
              </div>
            ))}
          </div>
          <div className={styles.llmActions}>
            <button 
              onClick={handleCheckAvailability} 
              disabled={llmLoading}
              className={styles.checkButton}
            >
              {llmLoading ? '⏳ Checking...' : '🔄 Check Availability'}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className={styles.error}>
          <p>❌ {error}</p>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      <div className={styles.mainContent}>
        {/* Conversation History */}
        {conversation.length > 0 && (
          <div className={styles.conversationHistory}>
            <h3>💬 Conversation History</h3>
            <div className={styles.historyScroll}>
              {conversation.map((step, index) => (
                <div key={index} className={styles.historyItem}>
                  <div className={styles.historyState}>[{step.nodeId}]</div>
                  <div className={styles.historyUser}>You: {step.input}</div>
                  <div className={styles.historyAssistant}>Assistant: {step.response}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Current State */}
        <div className={styles.stateInfo}>
          <p><strong>Current State:</strong> {currentState}</p>
          {!isTerminal && <p><strong>Prompt:</strong> {prompt}</p>}
        </div>

        {/* Response */}
        {response && (
          <div className={styles.response}>
            <h3>🤖 Response:</h3>
            <p>{response}</p>
          </div>
        )}

        {/* Reasoning Display */}
        {reasoning && (reasoning.redFlags.length > 0 || Object.keys(reasoning.scores).length > 0) && (
          <div className={styles.reasoning}>
            <h3>🧠 Medical Reasoning</h3>
            
            {reasoning.redFlags.length > 0 && (
              <div className={styles.redFlags}>
                <h4>⚠️ Red Flags:</h4>
                <ul>
                  {reasoning.redFlags.map((flag, i) => (
                    <li key={i} className={styles[`severity-${flag.severity}`]}>
                      <strong>{flag.label}</strong>: {flag.reason}
                      <span className={styles.severityBadge}>{flag.severity}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {Object.keys(reasoning.scores).length > 0 && (
              <div className={styles.scores}>
                <h4>📊 Health Scores:</h4>
                <ul>
                  {Object.entries(reasoning.scores).map(([key, value]) => (
                    <li key={key}>
                      {key}: {typeof value === 'number' ? value.toFixed(1) : value}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {reasoning.recommendations.screeningSuggestions.length > 0 && (
              <div className={styles.recommendations}>
                <h4>📋 Recommendations:</h4>
                <ul>
                  {reasoning.recommendations.screeningSuggestions.slice(0, 3).map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Input Controls */}
        {!isTerminal ? (
          <div className={styles.inputSection}>
            {inputType === 'choice' && choices.length > 0 && (
              <div className={styles.choices}>
                {choices.map((choice, index) => (
                  <button
                    key={index}
                    onClick={() => handleInput(choice)}
                    disabled={loading}
                    className={styles.choiceButton}
                  >
                    {choice}
                  </button>
                ))}
              </div>
            )}

            {inputType === 'text' && (
              <form onSubmit={handleTextSubmit} className={styles.textInputForm}>
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Type your response..."
                  disabled={loading}
                  className={styles.textInput}
                />
                <button type="submit" disabled={loading || !textInput.trim()} className={styles.submitButton}>
                  {loading ? '...' : 'Send'}
                </button>
              </form>
            )}

            {inputType === 'none' && (
              <button
                onClick={() => handleInput('continue')}
                disabled={loading}
                className={styles.continueButton}
              >
                {loading ? 'Processing...' : 'Continue'}
              </button>
            )}
          </div>
        ) : (
          <div className={styles.sessionComplete}>
            <h3>✅ Session Complete</h3>
            <p>Your conversation has been saved to your health record.</p>
            <button onClick={handleNewSession} className={styles.newSessionButton}>
              Start New Session
            </button>
          </div>
        )}
      </div>

      {/* Footer with session info */}
      <div className={styles.footer}>
        <p>
          🔒 Full Mode: Sessions are saved to MongoDB | 
          🧠 Medical reasoning enabled | 
          📊 Health records tracked
        </p>
      </div>
    </div>
  );
};

export default AppBackend;

