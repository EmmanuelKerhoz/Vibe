import React from 'react';
import { FluentProvider, webLightTheme, webDarkTheme } from '@fluentui/react-components';

interface AppShellProps {
  theme: 'light' | 'dark';
  isMobileOrTablet: boolean;
  showBackdrop: boolean;
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
        {children}
      </div>
    </FluentProvider>
  );
}
