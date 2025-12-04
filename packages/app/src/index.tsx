import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import AppV1 from './App.v1';
import styles from './App.module.css';

type SelectedVersion = 'none' | 'v1' | 'v2';

const Root = () => {
  const [selectedVersion, setSelectedVersion] = useState<SelectedVersion>('none');

  if (selectedVersion === 'v1') {
    return <AppV1 onBack={() => setSelectedVersion('none')} />;
  }

  if (selectedVersion === 'v2') {
    return <App onBack={() => setSelectedVersion('none')} />;
  }

  // Selection screen
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>MyDoctor 👋</h1>
      <p className={styles.subtitle}>
        Select a State Machine Version
      </p>
      <div className={styles.versionSelector}>
        <button 
          className={styles.versionButton}
          onClick={() => setSelectedVersion('v1')}
        >
          <span className={styles.versionNumber}>v1</span>
          <span className={styles.versionName}>State Machine Legacy</span>
          <span className={styles.versionDesc}>Original implementation with basic flow</span>
        </button>
        <button 
          className={styles.versionButton + ' ' + styles.versionButtonPrimary}
          onClick={() => setSelectedVersion('v2')}
        >
          <span className={styles.versionNumber}>v2</span>
          <span className={styles.versionName}>State Machine Enhanced</span>
          <span className={styles.versionDesc}>Analytics, screening, risk scores, multilingual</span>
        </button>
      </div>
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<Root />);
}
