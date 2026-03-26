import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/app/ErrorBoundary';
import { LanguageProvider } from './i18n/LanguageProvider';
import { RefsProvider } from './contexts/RefsContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <RefsProvider>
        <LanguageProvider>
          <App />
        </LanguageProvider>
      </RefsProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
