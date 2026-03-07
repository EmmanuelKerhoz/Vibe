<div align="center">
  <img width="1200" height="475" alt="Lyricist Pro banner" src="docs/Lyricist_Splash_Medium.png" />
</div>

# Lyricist Pro

Lyricist Pro est une application React/Vite pour générer, éditer et analyser des paroles avec Gemini.

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

3. Définir une clé API (recommandé) :

   ```env
   VITE_GEMINI_API_KEY=YOUR_KEY
   ```

   Alias accepté : `VITE_API_KEY`.

## Démarrage local

```bash
npm run dev
```

Application disponible sur `http://localhost:3000`.

Le serveur est lancé avec `--host=0.0.0.0`, donc vous pouvez aussi y accéder depuis un autre appareil du même réseau local avec l'URL **Network** affichée par Vite (par ex. `http://192.168.x.x:3000`).

## Dépannage (localhost refusé)

Si votre navigateur affiche `localhost refused to connect` :

1. Vérifiez que le serveur est bien lancé (`npm run dev`) et qu'il reste actif dans le terminal.
2. Utilisez l'URL exacte affichée par Vite :
   - `Local: http://localhost:3000/` (même machine)
   - `Network: http://<ip>:3000/` (WSL/Docker/VM ou autre appareil du LAN)
3. Si vous exécutez le code dans un conteneur distant (Codespaces, VM, serveur), `localhost` du navigateur ne pointe pas ce conteneur : utilisez l'URL de port-forwarding de votre plateforme.

## Windows + dépôt GitHub (lien partageable)

Si vous êtes sous Windows et que le code est sur GitHub, le plus simple pour obtenir un lien accessible est de déployer sur **GitHub Pages** (workflow fourni dans `.github/workflows/deploy-pages.yml`).

1. Poussez votre branche sur `main`.
2. Dans GitHub → **Settings → Pages**, choisissez **GitHub Actions** comme source.
3. (Optionnel) Ajoutez les secrets `VITE_GEMINI_API_KEY` et/ou `VITE_API_KEY` dans **Settings → Secrets and variables → Actions**.
4. Attendez le workflow **Deploy Vite app to GitHub Pages**.

Votre lien public sera : `https://<votre-user>.github.io/<nom-du-repo>/`.

> ⚠️ Important : dans une app front-end, une clé API injectée au build devient visible côté client. Pour un usage production, utilisez plutôt un backend/proxy pour protéger la clé.

## Scripts utiles

- `npm run dev` : serveur de développement Vite
- `npm run build` : build de production
- `npm run preview` : prévisualisation locale du build
- `npm run lint` : vérification TypeScript (`tsc --noEmit`)
- `npm run clean` : suppression du dossier `dist`

## Stack

- React 19 + Vite
- Fluent UI 2 (`@fluentui/react-components`)
- Tailwind CSS
- Gemini via `@google/genai`
