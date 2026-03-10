# Rapport d'anomalies du projet

Date de vérification : 2026-03-10

## Méthode de contrôle

Les vérifications suivantes ont été exécutées sur le dépôt :

- `npm ci`
- `npm run lint`
- `npm run build`
- `npm audit --json`
- revue ciblée de quelques zones critiques du code source

## Résultat global

Le projet est actuellement **compilable** et passe la vérification TypeScript disponible (`npm run lint`), mais plusieurs anomalies et fragilités ont été détectées.

## Anomalies détectées

### 1. Vulnérabilités de dépendances

`npm audit --json` remonte **8 vulnérabilités** :

- **5 élevées**
- **3 modérées**

Chaîne principalement concernée :

- `@vercel/node`
- `@vercel/build-utils`
- `@vercel/python-analysis`
- `minimatch`
- `path-to-regexp`
- `undici`
- `ajv`

Observation :

- la correction proposée par `npm audit` passe par une **mise à jour majeure** de `@vercel/node` vers `4.0.0`, ce qui nécessite une validation de compatibilité avant application.

### 2. Couverture de validation trop limitée

Les scripts disponibles dans `package.json` sont :

- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm run clean`
- `npm run lint` (`tsc --noEmit`)

Anomalies constatées :

- **aucun test automatisé** détecté dans le dépôt
- **aucun script `test`**
- **aucun ESLint**
- **aucun Prettier**

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

Dans `/home/runner/work/Vibe/Vibe/src/utils/aiUtils.ts`, la fonction `handleApiError()` :

- s'appuie sur une variable globale `isErrorDialogOpen`
- ouvre des messages via `alert()`

Risques :

- UX bloquante
- logique globale difficile à fiabiliser et à tester
- comportement potentiellement fragile si plusieurs erreurs arrivent rapidement

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

## Points vérifiés sans anomalie immédiate

- le projet **passe** `npm run lint`
- le projet **passe** `npm run build`
- `.env.local` et les autres fichiers d'environnement sont bien exclus via `.gitignore` (`.env*` avec exception pour `.env.example`)
- la CI existante (`.github/workflows/ci.yml`) exécute correctement `npm ci`, `npm run lint` et `npm run build`

## Priorités recommandées

1. Traiter les vulnérabilités liées à `@vercel/node` après vérification de compatibilité.
2. Ajouter une base minimale de tests automatisés.
3. Ajouter un vrai linter de qualité de code (ESLint).
4. Remplacer progressivement les `alert()` et le verrou global d'erreur par un mécanisme UI non bloquant.
5. Réduire les manipulations DOM différées dans `useSongComposer`.
6. Rationaliser les logs runtime.

## Conclusion

Le projet est exploitable dans son état actuel, mais il présente surtout des **anomalies de robustesse, de sécurité des dépendances et de qualité de validation** plutôt que des erreurs de compilation immédiates.
