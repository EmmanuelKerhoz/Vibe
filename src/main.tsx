import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import { LanguageProvider } from './i18n';
import { ModalProvider } from './contexts/ModalContext';
import './index.css';

// Dev-only: warn in the browser console when locale files have missing keys.
if (import.meta.env.DEV) {
  import('./i18n/validateLocales').then(({ printLocaleReport }) => printLocaleReport());
}

// Register PWA Service Worker with auto-update
// The SW is only generated in production build (devOptions.enabled = false)
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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <ModalProvider>
        <App />
      </ModalProvider>
    </LanguageProvider>
  </StrictMode>,
);
