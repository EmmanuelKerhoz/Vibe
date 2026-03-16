import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import { LanguageProvider } from './i18n';
import './index.css';

// Dev-only: warn in the browser console when locale files have missing keys.
if (import.meta.env.DEV) {
  import('./i18n/validateLocales').then(({ printLocaleReport }) => printLocaleReport());
}

// Register PWA Service Worker with auto-update
if (import.meta.env.PROD) {
  registerSW({
    onNeedRefresh() {
      console.info('[PWA] New version available. Reloading...');
    },
    onOfflineReady() {
      console.info('[PWA] App ready for offline use.');
    },
    onRegistered(registration) {
      console.info('[PWA] Service Worker registered:', registration?.scope);
    },
    onRegisterError(error) {
      console.warn('[PWA] Service Worker registration failed:', error);
    }
  });
}

// ModalProvider is now mounted inside App.tsx so it can receive the
// uiState instance created by useAppState — eliminating the split-brain
// that caused all modals to never open.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </StrictMode>,
);
