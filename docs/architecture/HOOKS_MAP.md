# Hooks Map — Feature Boundaries

> Sprint A — Barrels créés, logique inchangée. Les fichiers `.ts` restent dans `src/hooks/`.
> Sprint B — Migration physique vers `src/features/<domain>/hooks/`.

## Feature: Editor
`src/hooks/editor/index.ts`

| Hook | Rôle |
|---|---|
| `useEditorState` | État local de l'éditeur (curseur, sélection, mode) |
| `useEditorHandlers` | Handlers UI de l'éditeur |
| `useSongEditor` | Orchestration éditeur ↔ session |
| `useMarkupEditor` | Markup/annotation inline |
| `useDragHandlers` | Drag & drop sections/lignes |
| `useStructureDragHandlers` | Drag structure (couplet/refrain/pont) |
| `useSectionManager` | CRUD sections |
| `useSongMeta` | Métadonnées titre/artiste/BPM |
| `useSongHistoryState` | Undo/redo stack |

## Feature: Session
`src/hooks/session/index.ts`

| Hook | Rôle |
|---|---|
| `useSessionState` | État session active |
| `useSessionActions` | Actions CRUD session |
| `useSessionPersistence` | Sauvegarde IndexedDB / export |
| `useImportHandlers` | Import fichiers externes |
| `useAppState` | État global app (à réduire en Sprint 2) |
| `useDerivedAppState` | Dérivations calculées depuis AppState |

## Feature: Library
`src/hooks/library/index.ts`

| Hook | Rôle |
|---|---|
| `useLibraryState` | État bibliothèque de chansons |
| `useLibraryActions` | CRUD bibliothèque |

## Feature: Analysis
`src/hooks/analysis/index.ts`

| Hook | Rôle |
|---|---|
| `useSongAnalysis` | Analyse globale de la chanson |
| `useSimilarityEngine` | Moteur de similarité phonétique |
| `useLinguisticsWorker` | Worker linguistique (Web Worker) |
| `useDerivedPhonology` | Phonologie dérivée |
| `usePhoneticTranscription` | Transcription IPA |
| `useRhymeSuggestions` | Suggestions de rimes |
| `useAnalysisCounter` | Compteur d'analyses (quota/rate-limit) |
| `useAppKpis` | KPIs dashboard |

## Feature: Audio
`src/hooks/audio/index.ts`

| Hook | Rôle |
|---|---|
| `useAudioFeedback` | Feedback sonore UI |
| `useMetronome` | Métronome WebAudio |

## Feature: Composer
`src/hooks/composer/index.ts`

| Hook | Rôle |
|---|---|
| `useSongComposer` | Composition assistée IA |

## Shared
`src/hooks/shared/index.ts`

| Hook | Rôle |
|---|---|
| `useFocusTrap` | Trap focus accessibilité |
| `useKeyboardShortcuts` | Raccourcis clavier globaux |
| `useMobileLayout` | Layout responsive détection |
| `useMobileInitPanels` | Init panels mobile |
| `useThemeState` | Thème clair/sombre |
| `useStorageEstimate` | Estimation quota stockage |
| `useApiStatus` | Status APIs externes |
| `useModalHandlers` | Handlers modales |
| `useAppHandlers` | Handlers globaux app (à décomposer Sprint 2) |

## Orchestration (à traiter Sprint B)
- `useAppOrchestration` — nœud central, sera décomposé
- `useAppHandlers` — candidat à la dissolution dans les features
