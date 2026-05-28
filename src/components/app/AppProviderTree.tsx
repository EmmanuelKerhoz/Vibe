import React from 'react';
import { SimilarityProvider } from '../../contexts/SimilarityContext';
import { DragProvider } from '../../contexts/DragContext';
import { AppStateProvider } from '../../contexts/AppStateContext';
import { LibraryProvider } from '../../contexts/LibraryContext';
import { VersionProvider } from '../../contexts/VersionContext';
import { SongProvider } from '../../contexts/SongContext';
import { SongMutationProvider } from '../../contexts/SongMutationContext';
import { ComposerProvider } from '../../contexts/ComposerContext';
import type { SessionSnapshot } from '../../lib/sessionPersistence';

/**
 * AppProviderTree — Static, declarative composition of the app-wide context
 * providers that only depend on `initialSession`. Extracted from App.tsx so the
 * root component is limited to session loading + rendering.
 *
 * Context-consuming providers that wire props/refs (Editor, Modal, Analysis,
 * RhymeProxy) intentionally stay in App.tsx's `AppProviders`, which is rendered
 * as a child of this tree.
 */
export function AppProviderTree({
  initialSession,
  children,
}: {
  initialSession: SessionSnapshot | null;
  children: React.ReactNode;
}) {
  return (
    <AppStateProvider initialSession={initialSession}>
      <LibraryProvider>
        <DragProvider>
          <SongProvider initialSession={initialSession}>
            <SongMutationProvider>
              <ComposerProvider>
                <VersionProvider initialVersions={initialSession?.versions}>
                  <SimilarityProvider>
                    {children}
                  </SimilarityProvider>
                </VersionProvider>
              </ComposerProvider>
            </SongMutationProvider>
          </SongProvider>
        </DragProvider>
      </LibraryProvider>
    </AppStateProvider>
  );
}
