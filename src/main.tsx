import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { LanguageProvider } from './i18n';
import './index.css';

// Dev-only: warn in the browser console when locale files have missing keys.
if (import.meta.env.DEV) {
  import('./i18n/validateLocales').then(({ printLocaleReport }) => printLocaleReport());
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </StrictMode>,
);
