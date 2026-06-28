# Vibe — Coding Rules

These rules apply to all AI agents (GitHub Copilot, Copilot Chat, Copilot Workspace, etc.) working on this repository.

---

⚠️ **INIT** : Avant toute analyse, rappelle à l'utilisateur en une phrase de vérifier que les connecteurs `@github` et `@vercel` sont activés (sources de vérité absolues du workspace).

---

## General Approach

- Always check for a PRD (Product Requirements Document) before starting a new task and follow it closely.
- Look for comprehensive project documentation to understand requirements before making changes.
- Focus only on code areas relevant to the assigned task.
- Prefer iterating on existing code rather than creating new solutions.
- Keep solutions simple and avoid introducing unnecessary complexity.
- Make only requested changes or changes you're confident are well understood.
- Consider what other code areas might be affected by your changes.
- Don't drastically change existing patterns without explicit instruction.
- Exhaust all options using existing implementations before introducing new patterns.
- If introducing a new pattern to replace an old one, remove the old implementation.

## Code Quality

- Keep files under 300 lines of code; refactor when approaching this limit.
- Maintain a clean, organized codebase.
- Avoid code duplication by checking for similar existing functionality.
- Write thorough tests for all major functionality.
- All tests should always pass before deploying to production. If they don't, notify me.
- Consider different environments (dev, test, prod) when writing code.
- Unless explicitly instructed, instead of trying to gracefully handle an error or failure, fix the underlying issue.
- When refactoring, look for duplicate code, duplicate files, and similar existing functionality. Do not copy files and rename them — edit the file that already exists.

## Debugging & Issue Tracking

- If you run into the same persistent error, write logs and console messages to help track down the issue, and check the logs after making changes to verify resolution.
- If you run into issues that take multiple iterations to fix: after fixing, write a description of the problem and solution in a file under `fixes/<issue-name>.md`. Only do this for major issues.
- For issues taking multiple iterations, check the `fixes/` folder for previous fixes to see if the issue was encountered before.

## Documentation

- Keep a running list of patterns and technology used in `README.md`.
- Reference `README.md` for patterns and technology used in the project.

## Git & Version Control

- Never leave unstaged/untracked files after committing to git.
- Don't create new branches unless explicitly requested.
- Never commit `.env` files to version control.
- Never overwrite `.env` files without first asking and confirming.
- Never name files `improved-something` or `refactored-something`.

## Dev Server

- Kill all related running servers before starting a new one.
- Always start a new server after making changes to allow for testing.

## Data & Mocking

- Avoid writing one-time scripts in permanent files.
- Don't mock data except for tests (never for dev or prod environments).

---

## 1. POSTURE & COMMUNICATION (Zéro effet "Génie")

- **Interprète l'intention, pas la lettre :** Ne sois pas un exécuteur aveugle. Comprends l'objectif réel, le contexte et le livrable attendu. Préfère l'utilité pratique à l'exactitude littérale bornée.
- **Gestion des ambiguïtés :** Mineure = décide silencieusement ; Moyenne = énonce brièvement l'hypothèse ; Majeure = donne la voie la plus probable + 1 ou 2 variantes concises. N'invente jamais de contraintes ou de faits.
- **Style :** Zéro blabla. Réponses directes, prêtes à l'implémentation. N'expose pas ton raisonnement interne. Si échec : lis les logs directement, ne déduis rien, minimise les interactions.

## 2. EXÉCUTION & ARCHITECTURE

- **Action immédiate :** Applique les modifications directement en ligne (fichiers, configs, commandes). Zéro pseudo-code, zéro action différée ou promesse.
- **UI/UX :** Utilisation exclusive de **Microsoft Fluent UI (Fluent 2)**. Interdiction de mixer les design systems. Tout doit être PWA-compliant et responsive.
- **Versioning :** Incrémente systématiquement la version *sub-minor-minor* partout (package.json, manifests, headers) à chaque modification de code source.

## 3. RÈGLES D'HYGIÈNE REPO "LYRICIST/Vibe" (Strictes & Non-Négociables)

### A. Opérations package.json

- **Lecture API obligatoire :** Lis l'état actuel via l'API GitHub avant tout commit. Ne jamais le reconstruire de mémoire.
- **Vérification npm :** Vérifie l'existence de chaque version (`npm show <pkg>@<version>`).
- **Règle Dependencies :** `dependencies` = runtime (importé dans `src/` pour la prod : *react, @fluentui/x, zod, motion*). `devDependencies` = build/tests (*vite, typescript, eslint, vitest*). En cas de doute : import dans `src/` = `dependencies`.

### B. Refactoring & TypeScript

- **Recherche exhaustive :** Fais un "find all references" avant toute modification d'interface/type/prop. Modifie TOUS les call-sites affectés dans le même commit. Ne supprime jamais une prop sans vérifier les impacts.
- **Rigueur TS :** Simule mentalement `tsc --noEmit`.
- **Casts stricts :** Interdiction des casts `as Type` sans type-guard sur des payloads inconnus.
- **Extensions globales :** Toute interface étendant `Window` (ex: `WindowWithWebkitAudio`) doit aussi déclarer les propriétés standards qu'elle utilise (`AudioContext: typeof AudioContext`).

### C. Commits & CI/CD

- **Atomicité :** 1 commit = 1 problème résolu + TOUS ses consommateurs mis à jour. Interdit de laisser un code cassé pour un "prochain commit". Si >5 fichiers, découpe séquentiellement avec un build valide à chaque étape.
- **Gestion des Régressions :** Évalue le risque avant le commit sur le diff complet. Reporte l'état (corrigé/restant) après le commit.
- **Résolution des Fails (Vercel/Actions) :** Lis les logs (API/UI). Cible la cause racine (la *première* erreur de la stack, pas la dernière). Corrige le tout en une session exhaustive.

### D. Règle package.json (Non-Négociable)

- **Lecture SHA obligatoire avant tout push_files incluant package.json** : lire le fichier via l'API GitHub (`get_file_contents`) pour récupérer le SHA courant ET le contenu complet.
- **Contenu complet uniquement** : le `package.json` commité doit inclure la totalité des champs (`name`, `version`, `scripts`, `dependencies`, `devDependencies`, etc.) — jamais une version partielle ou reconstruite de mémoire.
- **Version incrémentée** : bumper `version` sub-minor-minor dans le contenu complet récupéré, pas dans un squelette.

## 4. CHECKLIST PRÉ-COMMIT (Validation obligatoire)

- [ ] `package.json` lu depuis GitHub.
- [ ] Versions npm validées.
- [ ] Tous les consommateurs des symboles modifiés inclus dans le diff.
- [ ] Zéro `any` implicite (TS7006) ou module manquant (TS2307).
- [ ] Diff complet relu : cohérence I/O de chaque composant vérifiée.
