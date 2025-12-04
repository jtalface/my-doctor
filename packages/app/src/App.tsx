import React, { useEffect, useState } from 'react';
import styles from './App.module.css';

// Using the new state-machine package (v2)
import { 
  Orchestrator, 
  State,
  fullNodes,
  InMemoryProfileStore, 
  InMemorySessionMemory, 
  DummyNLP, 
  PromptEngine,
  Router,
  AnalyticsConsole,
  ScreeningLogicImpl,
  RiskScoresImpl,
  TranslatorStub
} from "@mydoctor/state-machine";

// Initialize all dependencies for the v2 orchestrator
const orchestrator = new Orchestrator({
  profileStore: new InMemoryProfileStore(),
  sessionMemory: new InMemorySessionMemory(),
  nlp: new DummyNLP(),
  promptEngine: new PromptEngine(),
  router: new Router(),
  analytics: new AnalyticsConsole(),
  screening: new ScreeningLogicImpl(),
  risk: new RiskScoresImpl(),
  translator: new TranslatorStub(),
  nodes: fullNodes
});

interface AppProps {
  onBack?: () => void;
}

const App: React.FC<AppProps> = ({ onBack }) => {
  const [currentState, setCurrentState] = useState<State>(orchestrator.getState());
  const [response, setResponse] = useState<string>("");

  useEffect(() => {
    console.log("=== MyDoctor App (v2 State Machine) ===");
    console.log("Current State:", currentState);
  }, [currentState]);

  const handleUserInput = async (input: string) => {
    const context = { sessionId: 'demo-session-v2', userId: 'demo-user' };
    const output = await orchestrator.handleInput(input, context);
    setCurrentState(orchestrator.getState());
    setResponse(output);
  };

  return (
    <div className={styles.container}>
      {onBack && (
        <button className={styles.backButton} onClick={onBack}>
          ← Back to Selection
        </button>
      )}
      <div className={styles.versionBadge}>v2 - State Machine</div>
      <h1 className={styles.title}>MyDoctor 👋</h1>
      <p className={styles.subtitle}>
        AI-powered health assistant with enhanced features
      </p>
      <div className={styles.stateInfo}>
        <p><strong>Current State:</strong> {currentState}</p>
        {response && (
          <div className={styles.response}>
            <strong>Response:</strong>
            <pre>{response}</pre>
          </div>
        )}
      </div>
      <div className={styles.buttonGroup}>
        <button 
          className={styles.demoButton}
          onClick={() => handleUserInput('yes')}
        >
          Send "yes"
        </button>
        <button 
          className={styles.demoButton}
          onClick={() => handleUserInput('routine checkup')}
        >
          Send "routine checkup"
        </button>
        <button 
          className={styles.demoButton}
          onClick={() => handleUserInput('30 male')}
        >
          Send "30 male"
        </button>
      </div>
    </div>
  );
};

export default App;
