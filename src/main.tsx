import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/app/ErrorBoundary';
import { LanguageProvider } from './i18n/LanguageProvider';
import { RefsProvider } from './contexts/RefsContext';
import './index.css';

// Explicit guard replaces the non-null assertion (!). If the root element is
// absent (misconfigured HTML, aggressive browser extension), this throws a
// descriptive Error instead of a cryptic React crash that would bypass
// ErrorBoundary (which mounts after createRoot — too late for pre-mount failures).
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error(
    '[Lyricist] Root element #root not found in the DOM. ' +
    'Check index.html for a <div id="root"> element.',
  );
}

ReactDOM.createRoot(rootElement).render(
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
