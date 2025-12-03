import React from 'react';
import styles from './App.module.css';
import { StateMachine } from "./components/StateMachine/StateMachine";
import { State } from "./components/StateMachine/types/states";

const sm = new StateMachine();

const App: React.FC = () => {

  console.log(sm.getPrompt());  // GREET prompt
  sm.transition(State.COLLECT_BASIC_INFO);
  
  console.log(sm.getPrompt());  // COLLECT_BASIC_INFO prompt

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Hello World! 👋</h1>
      <p className={styles.subtitle}>
        Welcome to your React + TypeScript + Parcel app
      </p>
    </div>
  );
};

export default App;

