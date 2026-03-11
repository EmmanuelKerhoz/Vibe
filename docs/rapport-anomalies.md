# Rapport d'anomalies du projet

Date de vérification : 2026-03-11

## Méthode de contrôle

Les vérifications suivantes ont été exécutées sur le dépôt :

- `npm ci`
- `npm run lint`
- `npm run build`
- `npm audit --json`
- revue ciblée de quelques zones critiques du code source

## Résultat global

Le projet est actuellement **compilable** et passe `npm run lint` ainsi que `npm run build`, mais plusieurs anomalies et fragilités ont été détectées.

## Anomalies détectées

### 1. Vulnérabilités de dépendances

`npm audit --json` remonte **9 vulnérabilités** :

- **6 élevées**
- **3 modérées**

Chaîne principalement concernée :

- `@vercel/node`
- `@vercel/build-utils`
- `@vercel/python-analysis`
- `minimatch`
- `path-to-regexp`
- `undici`
- `ajv`
- `tar`

Observation :

- la correction proposée par `npm audit` passe par une **mise à jour majeure** de `@vercel/node` vers `4.0.0`, ce qui nécessite une validation de compatibilité avant application.

### 2. Couverture de validation trop limitée

Les scripts disponibles dans `package.json` sont :

- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm run clean`
- `npm run lint` (`eslint src --ext .ts,.tsx && tsc --noEmit`)

Anomalies constatées :

- **aucun test automatisé** détecté dans le dépôt
- **aucun script `test`**
- **aucun Prettier**
- `npm run lint` passe mais remonte actuellement **1 warning React Hooks** dans `src/hooks/analysis/useSongAnalysisEngine.ts`

Impact :

- les régressions fonctionnelles ou d'interface ne sont pas couvertes automatiquement
- la CI valide uniquement le typage TypeScript et le build Vite

### 3. Anomalie de build

Le build Vite aboutit correctement, mais affiche :

- `Generated an empty chunk: "vendor-react"`

Cette anomalie n'est pas bloquante, mais elle peut signaler :

- un découpage de bundle inutile
- une configuration de chunking à revoir
- un coût de maintenance/performance sans bénéfice réel

### 4. Gestion d'erreur bloquante côté interface

Le flux principal d'erreur API s'appuie désormais sur `ApiErrorModal`, mais un `alert()` bloquant reste présent dans `/home/runner/work/Vibe/Vibe/src/App.tsx` :

- `handleApiKeyHelp()` ouvre encore un message via `alert(t.tooltips.aiUnavailableHelp)`

Risques :

- UX bloquante
- comportement différent du reste de l'application, qui utilise déjà une modal non bloquante
- logique plus difficile à tester qu'un composant UI piloté par l'état

### 5. Timers DOM sans stratégie de nettoyage

Dans `/home/runner/work/Vibe/Vibe/src/hooks/useSongComposer.ts`, plusieurs `setTimeout(..., 0)` sont utilisés pour repositionner le focus sur des champs `input`.

Risques :

- logique fortement couplée au DOM
- maintenance plus difficile
- exécution de callbacks après un changement de rendu ou un démontage de composant

### 6. Logs console en code applicatif

Des appels `console.error(...)` et `console.warn(...)` sont présents dans plusieurs fichiers applicatifs, notamment :

- `src/App.tsx`
- `src/hooks/useSongAnalysis.ts`
- `src/utils/libraryUtils.ts`
- `src/utils/copyrightCheckUtils.ts`
- `src/utils/aiUtils.ts`

Impact :

- bruit en production
- diagnostic hétérogène
- risque d'exposer trop d'informations techniques dans la console

### 7. Typage et validation trop permissifs dans l'API copyright

Dans `/home/runner/work/Vibe/Vibe/api/copyright/check.ts`, l'endpoint utilisait plusieurs `any` pour :

- les erreurs serveur (`catch (error: any)`)
- les sections reçues dans le body
- les résultats intermédiaires renvoyés par la recherche Genius

Risques :

- perte de garanties TypeScript sur un endpoint exposé
- erreurs 500 déclenchées par des payloads mal formés
- maintenance plus difficile sur une route orientée sécurité/comparaison de contenu

Remédiation appliquée le 2026-03-11 :

- ajout de types dédiés pour le payload et les résultats
- validation explicite du body avant traitement
- suppression des `any` principaux dans cet endpoint

## Points vérifiés sans anomalie immédiate

- le projet **passe** `npm run lint`
- le projet **passe** `npm run build`
- `.env.local` et les autres fichiers d'environnement sont bien exclus via `.gitignore` (`.env*` avec exception pour `.env.example`)
- la CI existante (`.github/workflows/ci.yml`) exécute correctement `npm ci`, `npm run lint` et `npm run build`

## Priorités recommandées

1. Traiter les vulnérabilités liées à `@vercel/node` après vérification de compatibilité.
2. Ajouter une base minimale de tests automatisés.
3. Corriger le warning React Hooks dans `useSongAnalysisEngine`.
4. Remplacer l'`alert()` restant de `handleApiKeyHelp()` par le mécanisme modal déjà utilisé ailleurs.
5. Réduire les manipulations DOM différées dans `useSongComposer`.
6. Rationaliser les logs runtime.

## Conclusion

Le projet est exploitable dans son état actuel, mais il présente surtout des **anomalies de robustesse, de sécurité des dépendances et de qualité de validation** plutôt que des erreurs de compilation immédiates.
