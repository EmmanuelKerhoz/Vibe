import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8')) as { version: string };

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icons/*.png', 'icons/*.svg'],
      manifest: {
        name: 'VIBE — Lyricist Pro',
        short_name: 'VIBE',
        description: 'AI-powered lyric writing assistant with Star Trek LCARS interface',
        theme_color: '#0a0a1a',
        background_color: '#0a0a1a',
        display: 'standalone',
        orientation: 'any',
        scope: '/',
        start_url: '/',
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
            url: '/?action=new',
            icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }]
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
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
              networkTimeoutSeconds: 10
            }
          },
          {
            urlPattern: /^\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 5 },
              networkTimeoutSeconds: 10
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
          'vendor-react': ['react', 'react-dom'],
          'vendor-fluent': ['@fluentui/react-components'],
          'vendor-motion': ['motion'],
          'vendor-lucide': ['lucide-react'],
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
  base: '/',
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [],
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/hooks/**'],
    },
  },
}));
