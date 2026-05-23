import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/app/ErrorBoundary';
import { LanguageProvider } from './i18n/LanguageProvider';
import { RefsProvider } from './contexts/RefsContext';
import { SpotifyAuthProvider } from './contexts/SpotifyAuthContext';
import { SpotifyEngineProvider } from './contexts/SpotifyEngineContext';
import './index.css';

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
          <SpotifyAuthProvider>
            <SpotifyEngineProvider>
              <App />
            </SpotifyEngineProvider>
          </SpotifyAuthProvider>
        </LanguageProvider>
      </RefsProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
