import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import App, { NodeType } from './App';
import AppV1 from './App.v1';
import AppBackend from './App.backend';
import { Footer } from './components';
import styles from './App.module.css';
import { mvpNodes, standardNodes, extendedNodes, originalNodes } from '@mydoctor/state-machine';

type AppMode = 'select-mode' | 'demo' | 'full-login' | 'full';
type DemoVersion = 'none' | 'v1' | 'v2-select' | 'v2';

// Calculate node counts dynamically
const nodeCounts = {
  mvp: Object.keys(mvpNodes).length,
  standard: Object.keys(standardNodes).length,
  extended: Object.keys(extendedNodes).length,
  original: originalNodes.length  // originalNodes is an array
};

const Root = () => {
  // Mode selection: Demo (client-side) vs Full (backend)
  const [appMode, setAppMode] = useState<AppMode>('select-mode');
  
  // Demo mode state
  const [demoVersion, setDemoVersion] = useState<DemoVersion>('none');
  const [nodeType, setNodeType] = useState<NodeType>('standard');
  
  // Full mode state
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');

  // =========================================
  // FULL MODE (Backend)
  // =========================================
  if (appMode === 'full') {
    return (
      <AppBackend 
        userEmail={userEmail} 
        userName={userName}
        onBack={() => setAppMode('select-mode')} 
      />
    );
  }

  if (appMode === 'full-login') {
    return (
      <>
        <div className={`${styles.container} ${styles.containerWithFooter}`}>
          <button className={styles.backButton} onClick={() => setAppMode('select-mode')}>
            ← Back
          </button>
          <h1 className={styles.title}>🏥 Full Mode Login</h1>
          <p className={styles.subtitle}>
            Enter your email to start a persistent session
          </p>
          <form 
            className={styles.loginForm}
            onSubmit={(e) => {
              e.preventDefault();
              if (userEmail.trim()) {
                setAppMode('full');
              }
            }}
          >
            <input
              type="email"
              placeholder="your@email.com"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              className={styles.loginInput}
              required
            />
            <input
              type="text"
              placeholder="Your Name (optional)"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className={styles.loginInput}
            />
            <button type="submit" className={styles.loginButton} disabled={!userEmail.trim()}>
              Start Session →
            </button>
          </form>
          <div className={styles.fullModeFeatures}>
            <h3>Full Mode Features:</h3>
            <ul>
              <li>✅ Sessions saved to MongoDB</li>
              <li>✅ Medical reasoning engine</li>
              <li>✅ Health records & history</li>
              <li>✅ Red flag detection</li>
              <li>✅ Screening recommendations</li>
            </ul>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  // =========================================
  // DEMO MODE (Client-side State Machine)
  // =========================================
  if (appMode === 'demo') {
    if (demoVersion === 'v1') {
      return <AppV1 onBack={() => setDemoVersion('none')} />;
    }

    if (demoVersion === 'v2') {
      return <App onBack={() => setDemoVersion('v2-select')} nodeType={nodeType} />;
    }

    if (demoVersion === 'v2-select') {
      // Node type selection screen for v2
      return (
        <>
          <div className={`${styles.container} ${styles.containerWithFooter}`}>
            <button className={styles.backButton} onClick={() => setDemoVersion('none')}>
              ← Back to Versions
            </button>
            <h1 className={styles.title}>MyDoctor 👋</h1>
            <p className={styles.subtitle}>
              Select Node Configuration
            </p>
            <div className={styles.versionSelector}>
              <button 
                className={styles.versionButton}
                onClick={() => { setNodeType('mvp'); setDemoVersion('v2'); }}
              >
                <span className={styles.versionNumber}>MVP</span>
                <span className={styles.versionName}>Minimal Flow</span>
                <span className={styles.versionDesc}>{nodeCounts.mvp} states — Quick health check-in</span>
              </button>
              <button 
                className={styles.versionButton + ' ' + styles.versionButtonPrimary}
                onClick={() => { setNodeType('standard'); setDemoVersion('v2'); }}
              >
                <span className={styles.versionNumber}>Standard</span>
                <span className={styles.versionName}>Full Flow</span>
                <span className={styles.versionDesc}>{nodeCounts.standard} states — Consent, systems review, preventive</span>
              </button>
              <button 
                className={styles.versionButton}
                onClick={() => { setNodeType('extended'); setDemoVersion('v2'); }}
              >
                <span className={styles.versionNumber}>Extended</span>
                <span className={styles.versionName}>Clinical Workflow</span>
                <span className={styles.versionDesc}>{nodeCounts.extended} states — PHQ-2, escalation, detailed systems</span>
              </button>
              <button 
                className={styles.versionButton}
                onClick={() => { setNodeType('original'); setDemoVersion('v2'); }}
              >
                <span className={styles.versionNumber}>Original</span>
                <span className={styles.versionName}>Full Annual Checkup</span>
                <span className={styles.versionDesc}>{nodeCounts.original} nodes — Actions, structured input, red flags</span>
              </button>
            </div>
          </div>
          <Footer />
        </>
      );
    }

    // Demo version selection (v1 vs v2)
    return (
      <>
        <div className={`${styles.container} ${styles.containerWithFooter}`}>
          <button className={styles.backButton} onClick={() => setAppMode('select-mode')}>
            ← Back to Mode Selection
          </button>
          <h1 className={styles.title}>MyDoctor 👋</h1>
          <p className={styles.subtitle}>
            Select a State Machine Version
          </p>
          <div className={styles.versionSelector}>
            <button 
              className={styles.versionButton}
              onClick={() => setDemoVersion('v1')}
            >
              <span className={styles.versionNumber}>v1</span>
              <span className={styles.versionName}>State Machine Legacy</span>
              <span className={styles.versionDesc}>Original implementation with basic flow</span>
            </button>
            <button 
              className={styles.versionButton + ' ' + styles.versionButtonPrimary}
              onClick={() => setDemoVersion('v2-select')}
            >
              <span className={styles.versionNumber}>v2</span>
              <span className={styles.versionName}>State Machine Enhanced</span>
              <span className={styles.versionDesc}>Analytics, screening, risk scores, multilingual</span>
            </button>
          </div>
          <div className={styles.demoModeNote}>
            <p>⚡ Demo Mode: State machine runs in browser (no persistence)</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  // =========================================
  // MODE SELECTION SCREEN (Default)
  // =========================================
  return (
    <>
      <div className={`${styles.container} ${styles.containerWithFooter}`}>
        <h1 className={styles.title}>🏥 MyDoctor</h1>
        <p className={styles.subtitle}>
          AI-Powered Health Assistant
        </p>
        <div className={styles.modeSelector}>
          <button 
            className={styles.modeButton + ' ' + styles.modeButtonDemo}
            onClick={() => setAppMode('demo')}
          >
            <span className={styles.modeIcon}>⚡</span>
            <span className={styles.modeName}>Demo Mode</span>
            <span className={styles.modeDesc}>
              Quick start • No login • Runs in browser
            </span>
            <ul className={styles.modeFeatures}>
              <li>✓ Multiple state machine versions</li>
              <li>✓ Switch between node configurations</li>
              <li>✓ No server required</li>
              <li>✗ Data not saved</li>
            </ul>
          </button>
          
          <button 
            className={styles.modeButton + ' ' + styles.modeButtonFull}
            onClick={() => setAppMode('full-login')}
          >
            <span className={styles.modeIcon}>🔒</span>
            <span className={styles.modeName}>Full Mode</span>
            <span className={styles.modeDesc}>
              Persistent sessions • MongoDB • Medical AI
            </span>
            <ul className={styles.modeFeatures}>
              <li>✓ Sessions saved to database</li>
              <li>✓ Medical reasoning engine</li>
              <li>✓ Health records & history</li>
              <li>✓ Red flag detection</li>
            </ul>
          </button>
        </div>
        <div className={styles.modeNote}>
          <p>
            <strong>Demo Mode</strong> runs entirely in your browser — great for testing.<br/>
            <strong>Full Mode</strong> requires the backend server running on port 3002.
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<Root />);
}
