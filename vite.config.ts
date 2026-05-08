import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { readFileSync } from 'fs';
import type { Plugin } from 'vite';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8')) as { version: string };

// Use VITE_BASE env var for GitHub Pages (/Vibe/), default to / for Vercel
const base = process.env.VITE_BASE ?? '/';

/**
 * Injects <link rel="preload" as="image"> for every UI locale flag SVG.
 * These 8 SVGs are guaranteed to exist in /twemoji/ (copied by copy-twemoji.mjs
 * before the build). Preloading them eliminates the CDN fallback flash in
 * EmojiSign because the browser fetches them in parallel with the JS bundle.
 */
function emojiToCodepoints(emoji: string): string {
  return [...emoji]
    .map(char => char.codePointAt(0)!)
    .filter(cp => cp !== 0xfe0f)
    .map(cp => cp.toString(16))
    .join('-');
}

const UI_FLAGS = ['🇺🇸', '🇫🇷', '🇪🇸', '🇩🇪', '🇵🇹', '🇸🇦', '🇨🇳', '🇰🇷'];

function twemojiPreloadPlugin(): Plugin {
  return {
    name: 'twemoji-preload',
    transformIndexHtml() {
      return UI_FLAGS.map(flag => ({
        tag: 'link',
        attrs: {
          rel: 'preload',
          as: 'image',
          href: `${base}twemoji/${emojiToCodepoints(flag)}.svg`,
          type: 'image/svg+xml',
        },
        injectTo: 'head' as const,
      }));
    },
  };
}

export default defineConfig(({ mode }) => ({
  base,
  plugins: [
    react(),
    tailwindcss(),
    twemojiPreloadPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png', 'icons/*.svg'],
      manifest: {
        name: 'VIBE — Lyricist Pro',
        short_name: 'VIBE',
        description: 'AI-powered lyric writing assistant with Star Trek LCARS interface',
        theme_color: '#0a0a1a',
        background_color: '#0a0a1a',
        display: 'standalone',
        orientation: 'any',
        scope: base,
        start_url: base,
        lang: 'en',
        categories: ['music', 'productivity', 'utilities'],
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        shortcuts: [
          {
            name: 'New Song',
            short_name: 'New',
            description: 'Start a new lyric session',
            url: base + '?action=new',
            icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }]
          }
        ]
      },
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        globPatterns: ['**/*.{js,css,html,png,svg,woff,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            urlPattern: /^https:\/\/generativelanguage\.googleapis\.com\/.*/i,
            handler: 'NetworkOnly'
          },
          {
            urlPattern: /^\/api\/ddg.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'ddg-api-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 },
              networkTimeoutSeconds: 10,
              cacheableResponse: { statuses: [200] }
            }
          },
          {
            urlPattern: /^\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 5 },
              networkTimeoutSeconds: 10,
              cacheableResponse: { statuses: [200] }
            }
          }
        ]
      },
      devOptions: {
        enabled: false
      }
    })
  ],
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: false,
    proxy: {
      '/api/ddg': {
        target: 'https://api.duckduckgo.com',
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/api\/ddg/, ''),
      },
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-fluent': ['@fluentui/react-components', '@fluentui/react-icons'],
          'vendor-motion': ['motion'],
        },
      },
    },
    chunkSizeWarningLimit: 800,
  },
  publicDir: 'public',
  assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.svg'],
  define: {
    'process.env.NODE_ENV': JSON.stringify(mode),
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(pkg.version),
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [],
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    typecheck: {
      tsconfig: './tsconfig.test.json',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/hooks/**'],
    },
  },
}));
