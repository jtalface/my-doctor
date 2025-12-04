import React, { useEffect, useState, useMemo } from 'react';
import styles from './App.module.css';

// Using the new state-machine package (v2)
import { 
  Orchestrator, 
  State,
  mvpNodes,
  standardNodes,
  extendedNodes,
  InMemoryProfileStore, 
  InMemorySessionMemory, 
  DummyNLP, 
  PromptEngine,
  Router,
  AnalyticsConsole,
  ScreeningLogicImpl,
  RiskScoresImpl,
  TranslatorStub,
  NodeMap
} from "@mydoctor/state-machine";

export type NodeType = 'mvp' | 'standard' | 'extended';

const nodeConfigs: Record<NodeType, { nodes: NodeMap; label: string }> = {
  mvp: { nodes: mvpNodes, label: 'MVP' },
  standard: { nodes: standardNodes, label: 'Standard' },
  extended: { nodes: extendedNodes, label: 'Extended' }
};

// Helper to get node count
const getNodeCount = (nodes: NodeMap) => Object.keys(nodes).length;

interface AppProps {
  onBack?: () => void;
  nodeType: NodeType;
}

const App: React.FC<AppProps> = ({ onBack, nodeType }) => {
  // Create orchestrator based on selected node type
  const orchestrator = useMemo(() => {
    const { nodes } = nodeConfigs[nodeType];
    return new Orchestrator({
      profileStore: new InMemoryProfileStore(),
      sessionMemory: new InMemorySessionMemory(),
      nlp: new DummyNLP(),
      promptEngine: new PromptEngine(),
      router: new Router(),
      analytics: new AnalyticsConsole(),
      screening: new ScreeningLogicImpl(),
      risk: new RiskScoresImpl(),
      translator: new TranslatorStub(),
      nodes
    });
  }, [nodeType]);

  const [currentState, setCurrentState] = useState<State>(orchestrator.getState());
  const [response, setResponse] = useState<string>("");

  useEffect(() => {
    // Reset state when orchestrator changes
    setCurrentState(orchestrator.getState());
    setResponse("");
  }, [orchestrator]);

  useEffect(() => {
    console.log(`=== MyDoctor App (v2 - ${nodeConfigs[nodeType].label}) ===`);
    console.log("Current State:", currentState);
  }, [currentState, nodeType]);

  const handleUserInput = async (input: string) => {
    const context = { sessionId: 'demo-session-v2', userId: 'demo-user' };
    const output = await orchestrator.handleInput(input, context);
    setCurrentState(orchestrator.getState());
    setResponse(output);
  };

  const config = nodeConfigs[nodeType];

  return (
    <div className={styles.container}>
      {onBack && (
        <button className={styles.backButton} onClick={onBack}>
          ← Back to Selection
        </button>
      )}
      <div className={styles.versionBadge}>
        v2 - {config.label} ({getNodeCount(config.nodes)} states)
      </div>
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
