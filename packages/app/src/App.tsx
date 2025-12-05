import React, { useEffect, useState, useMemo } from 'react';
import styles from './App.module.css';
import { NodeInput } from './components';

// Using the new state-machine package (v2)
import { 
  Orchestrator, 
  State,
  mvpNodes,
  standardNodes,
  extendedNodes,
  originalNodes,
  InMemoryProfileStore, 
  InMemorySessionMemory, 
  DummyNLP, 
  PromptEngine,
  Router,
  AnalyticsConsole,
  ScreeningLogicImpl,
  RiskScoresImpl,
  TranslatorStub,
  NodeMap,
  NodeDef,
  OriginalNodeDef
} from "@mydoctor/state-machine";

export type NodeType = 'mvp' | 'standard' | 'extended' | 'original';

// Convert originalNodes array to NodeMap format for orchestrator compatibility
const originalNodesAsMap: NodeMap = originalNodes.reduce((acc, node: OriginalNodeDef) => {
  acc[node.id as State] = {
    id: node.id as State,
    prompt: node.prompt,
    inputType: node.input.type === 'structured' ? 'text' : node.input.type,
    choices: node.input.choices,
    transitions: node.transitions.map(t => ({ condition: t.condition, next: t.next as State }))
  };
  return acc;
}, {} as NodeMap);

const nodeConfigs: Record<NodeType, { nodes: NodeMap; label: string; isOriginal?: boolean }> = {
  mvp: { nodes: mvpNodes, label: 'MVP' },
  standard: { nodes: standardNodes, label: 'Standard' },
  extended: { nodes: extendedNodes, label: 'Extended' },
  original: { nodes: originalNodesAsMap, label: 'Original', isOriginal: true }
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
  const [prompt, setPrompt] = useState<string>(orchestrator.getPrompt());
  const [currentNode, setCurrentNode] = useState<NodeDef | null>(orchestrator.getNode());
  const [response, setResponse] = useState<string>("");

  useEffect(() => {
    // Reset state when orchestrator changes
    setCurrentState(orchestrator.getState());
    setPrompt(orchestrator.getPrompt());
    setCurrentNode(orchestrator.getNode());
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
    setPrompt(orchestrator.getPrompt());
    setCurrentNode(orchestrator.getNode());
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
        <p><strong>Prompt:</strong> {prompt}</p>
        {response && (
          <div className={styles.response}>
            <strong>Response:</strong>
            <pre>{response}</pre>
          </div>
        )}
      </div>
      <NodeInput 
        node={currentNode}
        onInput={handleUserInput}
        className={styles.buttonGroup}
        styles={{
          buttonClassName: styles.demoButton,
          inputClassName: styles.textInput
        }}
      />
    </div>
  );
};

export default App;
