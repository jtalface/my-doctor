import React from 'react';
import { createRoot } from 'react-dom/client';
import styles from './App.module.css';

const App: React.FC = () => {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Hello World! 👋</h1>
      <p className={styles.subtitle}>
        Welcome to your React + TypeScript + Parcel app
      </p>
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
