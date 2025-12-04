import React, { useEffect, useState } from 'react';
import styles from './App.module.css';
import { 
  Orchestrator, 
  Router, 
  State,
  InMemoryProfileStore, 
  InMemorySessionMemory, 
  DummyNLP, 
  PromptEngine 
} from "@mydoctor/state-machine-v1";

// Initialize dependencies
const profileStore = new InMemoryProfileStore();
const sessionMemory = new InMemorySessionMemory();
const nlp = new DummyNLP();
const promptEngine = new PromptEngine();
const router = new Router();

// Create orchestrator with dependencies
const orchestrator = new Orchestrator({
  profileStore,
  sessionMemory,
  nlp,
  promptEngine,
  router
});

const App = () => {
  const [currentState, setCurrentState] = useState<State>(orchestrator.getCurrentState());
  const [prompt, setPrompt] = useState<string>(orchestrator.getCurrentPrompt());

  useEffect(() => {
    // Demo: Log initial state
    console.log("=== MyDoctor App Started ===");
    console.log("Current State:", currentState);
    console.log("Current Prompt:", prompt);
  }, [currentState, prompt]);

  // Example handler for future use - demonstrates state updates
  const handleUserInput = async (input: string) => {
    const context = { sessionId: 'demo-session', userId: 'demo-user' };
    await orchestrator.handleInput(input, context);
    setCurrentState(orchestrator.getCurrentState());
    setPrompt(orchestrator.getCurrentPrompt());
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>MyDoctor 👋</h1>
      <p className={styles.subtitle}>
        Your AI-powered health assistant
      </p>
      <div className={styles.stateInfo}>
        <p><strong>Current State:</strong> {currentState}</p>
        <p><strong>Prompt:</strong> {prompt}</p>
      </div>
      {/* Handler available for UI integration */}
      <button 
        className={styles.demoButton}
        onClick={() => handleUserInput('yes')}
      >
        Demo: Send "yes"
      </button>
    </div>
  );
};

export default App;
