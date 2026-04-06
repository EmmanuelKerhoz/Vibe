import React from 'react';
import { FluentProvider, Spinner, webLightTheme, webDarkTheme } from '@fluentui/react-components';
import bannerImage from '../../../docs/Lyricist_Splash_Medium.png';

interface AppShellProps {
  theme: 'light' | 'dark';
  isMobileOrTablet: boolean;
  showBackdrop: boolean;
  isGenerating: boolean;
  onBackdropClick: () => void;
  children: React.ReactNode;
}

/**
 * AppShell — pure layout wrapper.
 * Owns: FluentProvider theming, mobile backdrop overlay, outer flex structure.
 * Contains zero business logic and zero hooks.
 * Phase 1 of AppInnerContent god-component refactor.
 */
export function AppShell({
  theme,
  isMobileOrTablet,
  showBackdrop,
  isGenerating,
  onBackdropClick,
  children,
}: AppShellProps) {
  return (
    <FluentProvider
      theme={theme === 'dark' ? webDarkTheme : webLightTheme}
      style={{ height: '100%', width: '100%', backgroundColor: 'transparent' }}
    >
      <div
        className={`fui-FluentProvider ui-fluent h-screen w-full bg-fluent-bg text-[var(--text-primary)] flex flex-col overflow-hidden font-sans selection:bg-[var(--accent-color)]/30 ${
          theme === 'dark' ? 'dark' : ''
        }`}
      >
        {showBackdrop && (
          <button
            type="button"
            className="mobile-panel-backdrop"
            onClick={onBackdropClick}
            aria-label="Close mobile panels"
          />
        )}
        {isGenerating && (
          <div
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 backdrop-blur-[1px] p-4"
            aria-busy="true"
          >
            <div
              role="status"
              aria-live="polite"
              aria-label="Song generation in progress"
              className="w-full max-w-md overflow-hidden rounded-[24px_8px_24px_8px] border border-[var(--border-color)] bg-[var(--bg-sidebar)] shadow-2xl"
            >
              <img
                src={bannerImage}
                alt=""
                aria-hidden="true"
                className="w-full block"
              />
              <div className="flex items-center gap-3 px-5 py-4">
                <Spinner size="medium" />
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Generating your song…</p>
                  <p className="text-xs text-[var(--text-secondary)]">Please wait while the editor is temporarily locked.</p>
                </div>
              </div>
            </div>
          </div>
        )}
        {children}
      </div>
    </FluentProvider>
  );
}
