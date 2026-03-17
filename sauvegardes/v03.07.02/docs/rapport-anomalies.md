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

### 8. Désynchronisation version app / package.json *(incident 2026-03-17, première occurrence)*

**Description :**

Entre les versions 3.6.12 et 3.6.14, les messages de commit mentionnaient les bumps de version mais le fichier `package.json` n'était pas mis à jour. L'application affichait une version obsolète (3.6.8) en production.

**Chaîne de versioning :**

```
package.json  →  vite.config.ts (define VITE_APP_VERSION)  →  src/version.ts (APP_VERSION)  →  affichage dans l'app
```

`vite.config.ts` lit `package.json` au build via `readFileSync('./package.json')` et injecte la valeur dans `import.meta.env.VITE_APP_VERSION`. Si `package.json` n'est pas bumped, la version injectée dans le bundle reste celle de la dernière mise à jour du fichier, indépendamment du message de commit.

Le service worker PWA (`skipWaiting: true`, `clientsClaim: true`) peut aggraver le décalage en servant un bundle caché encore plus ancien jusqu'au prochain rebuild forcé.

**Remédiation appliquée le 2026-03-17 :**

- `package.json` mis à jour de `3.6.11` → `3.6.14` (commit `e3b71b6`).

**Règle à appliquer systématiquement :**

> Tout bump de version mentionné dans un message de commit **doit** s'accompagner de la mise à jour correspondante du champ `version` dans `package.json`. C'est le seul fichier qui pilote la version affichée dans l'application.

### 9. package.json oublié dans commit groupé *(récidive 2026-03-17, v3.7.2)*

**Description :**

Lors du commit groupé `9df286c` (fix rhyme + i18n + test, v3.7.2), `package.json` n'a pas été inclus dans le `push_files`. Résultat : `package.json` affichait `3.7.1` alors que les fichiers source correspondaient à v3.7.2. L'application déployée par Vercel affichait donc `3.7.1` au lieu de `3.7.2`.

**Symptôme observé :**

L'utilisateur a constaté une divergence de version selon les navigateurs/appareils utilisés — lié à la combinaison cache SW + version erronée injectée au build.

**Remédiation appliquée le 2026-03-17 :**

- `package.json` bumped `3.7.1` → `3.7.2` en commit séparé `e71dcf8`.

**Cause racine :**

Les commits groupés multi-fichiers ne passent pas par le workflow habituel (`package.json` en tête de liste). Quand la liste est construite manuellement, `package.json` peut être omis.

**Règle renforcée :**

> **Avant tout `push_files` groupé** : vérifier que `package.json` est dans la liste si la version change. `package.json` doit être le **premier fichier** de la liste pour être visible en revue de diff.

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
7. **Toujours bumper `package.json` en premier dans tout commit de version** (cf. §8 et §9).

## Conclusion

Le projet est exploitable dans son état actuel, mais il présente surtout des **anomalies de robustesse, de sécurité des dépendances et de qualité de validation** plutôt que des erreurs de compilation immédiates.
