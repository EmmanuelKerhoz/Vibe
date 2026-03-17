<div align="center">
  <img width="1200" height="475" alt="Lyricist Pro banner" src="docs/Lyricist_Splash_Medium.png" />
</div>

# Lyricist Pro

[![Tests](https://github.com/EmmanuelKerhoz/Vibe/actions/workflows/test.yml/badge.svg)](https://github.com/EmmanuelKerhoz/Vibe/actions/workflows/test.yml)

Lyricist Pro est une application React/Vite/Fluent pour générer, éditer et analyser des paroles avec Gemini.

## Prérequis

- Node.js 18+
- npm
- Une clé API Gemini

## Installation

1. Installer les dépendances :

   ```bash
   npm install
   ```

2. Créer un fichier `.env.local` à partir de `.env.example`.

3. Définir la clé API **côté serveur** (ne pas préfixer avec `VITE_`) :

   ```env
   GEMINI_API_KEY=YOUR_KEY
   ```

   La clé est lue par le proxy serveur et n'est jamais exposée au navigateur.

## Démarrage local

```bash
npm run dev
```

Application disponible sur `http://localhost:3000`.

Le serveur est lancé avec `--host=0.0.0.0`, donc vous pouvez aussi y accéder depuis un autre appareil du même réseau local avec l'URL **Network** affichée par Vite (par ex. `http://192.168.x.x:3000`).

## Déploiement sur Vercel (recommandé pour la production)

Ce projet inclut un endpoint serverless (`/api/generate`) qui agit comme proxy sécurisé vers l'API Gemini.
La clé API n'est **jamais** transmise au navigateur.

### Étapes

1. Poussez votre dépôt sur GitHub (branche `main`).
2. Importez le projet dans [Vercel](https://vercel.com/new).
3. Ajoutez la variable d'environnement suivante dans **Settings → Environment Variables** de votre projet Vercel :

   | Nom              | Valeur              |
   |------------------|---------------------|
   | `GEMINI_API_KEY` | `<votre clé Gemini>` |

4. Déployez. Vercel détecte automatiquement Vite comme framework.

> ⚠️ **GitHub Pages** expose les clés injectées au build dans le bundle JS.  
> Pour une configuration sécurisée en production, utilisez **Vercel** avec le proxy `/api/generate` décrit ci-dessus.

## Dépannage (localhost refusé)

Si votre navigateur affiche `localhost refused to connect` :

1. Vérifiez que le serveur est bien lancé (`npm run dev`) et qu'il reste actif dans le terminal.
2. Utilisez l'URL exacte affichée par Vite :
   - `Local: http://localhost:3000/` (même machine)
   - `Network: http://<ip>:3000/` (WSL/Docker/VM ou autre appareil du LAN)
3. Si vous exécutez le code dans un conteneur distant (Codespaces, VM, serveur), `localhost` du navigateur ne pointe pas ce conteneur : utilisez l'URL de port-forwarding de votre plateforme.

## Scripts utiles

- `npm run dev` : serveur de développement Vite
- `npm run build` : build de production
- `npm run preview` : prévisualisation locale du build
- `npm run lint` : vérification TypeScript (`tsc --noEmit`)
- `npm run clean` : suppression du dossier `dist`
- `npm test` : lance la suite Vitest
- `npm run test:coverage` : tests + rapport de couverture lcov

## Stack

- React 19 + Vite
- Fluent UI 2 (`@fluentui/react-components`)
- Tailwind CSS
- Gemini via proxy serverless (`/api/generate`)
- Vitest + Testing Library (tests unitaires)
