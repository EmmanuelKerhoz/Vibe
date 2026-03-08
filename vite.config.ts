import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: false,
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-fluent': ['@fluentui/react-components'],
          'vendor-motion': ['motion'],
        },
      },
    },
    chunkSizeWarningLimit: 800,
  },
  // Expose docs folder as static asset
  publicDir: false,
  assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.svg'],
  // Copy docs assets to build
  define: {
    'process.env.NODE_ENV': JSON.stringify(mode),
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  // Serve docs folder as static
  base: '/',
}));
