import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './auth/AuthContext';
import { CallProvider } from './contexts';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename="/doctor">
      <AuthProvider>
        <CallProvider>
          <App />
        </CallProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

