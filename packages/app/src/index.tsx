import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import App, { NodeType } from './App';
import AppV1 from './App.v1';
import styles from './App.module.css';
import { mvpNodes, standardNodes, extendedNodes, originalNodes } from '@mydoctor/state-machine';

type SelectedVersion = 'none' | 'v1' | 'v2-select' | 'v2';

// Calculate node counts dynamically
const nodeCounts = {
  mvp: Object.keys(mvpNodes).length,
  standard: Object.keys(standardNodes).length,
  extended: Object.keys(extendedNodes).length,
  original: originalNodes.length  // originalNodes is an array
};

const Root = () => {
  const [selectedVersion, setSelectedVersion] = useState<SelectedVersion>('none');
  const [nodeType, setNodeType] = useState<NodeType>('standard');

  if (selectedVersion === 'v1') {
    return <AppV1 onBack={() => setSelectedVersion('none')} />;
  }

  if (selectedVersion === 'v2') {
    return <App onBack={() => setSelectedVersion('v2-select')} nodeType={nodeType} />;
  }

  if (selectedVersion === 'v2-select') {
    // Node type selection screen for v2
    return (
      <div className={styles.container}>
        <button className={styles.backButton} onClick={() => setSelectedVersion('none')}>
          ← Back to Versions
        </button>
        <h1 className={styles.title}>MyDoctor 👋</h1>
        <p className={styles.subtitle}>
          Select Node Configuration
        </p>
        <div className={styles.versionSelector}>
          <button 
            className={styles.versionButton}
            onClick={() => { setNodeType('mvp'); setSelectedVersion('v2'); }}
          >
            <span className={styles.versionNumber}>MVP</span>
            <span className={styles.versionName}>Minimal Flow</span>
            <span className={styles.versionDesc}>{nodeCounts.mvp} states — Quick health check-in</span>
          </button>
          <button 
            className={styles.versionButton + ' ' + styles.versionButtonPrimary}
            onClick={() => { setNodeType('standard'); setSelectedVersion('v2'); }}
          >
            <span className={styles.versionNumber}>Standard</span>
            <span className={styles.versionName}>Full Flow</span>
            <span className={styles.versionDesc}>{nodeCounts.standard} states — Consent, systems review, preventive</span>
          </button>
          <button 
            className={styles.versionButton}
            onClick={() => { setNodeType('extended'); setSelectedVersion('v2'); }}
          >
            <span className={styles.versionNumber}>Extended</span>
            <span className={styles.versionName}>Clinical Workflow</span>
            <span className={styles.versionDesc}>{nodeCounts.extended} states — PHQ-2, escalation, detailed systems</span>
          </button>
          <button 
            className={styles.versionButton}
            onClick={() => { setNodeType('original'); setSelectedVersion('v2'); }}
          >
            <span className={styles.versionNumber}>Original</span>
            <span className={styles.versionName}>Full Annual Checkup</span>
            <span className={styles.versionDesc}>{nodeCounts.original} nodes — Actions, structured input, red flags</span>
          </button>
        </div>
      </div>
    );
  }

  // Main version selection screen
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
          onClick={() => setSelectedVersion('v2-select')}
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
