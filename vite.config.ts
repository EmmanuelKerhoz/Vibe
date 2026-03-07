import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import type { Connect } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  const basePath = env.VITE_BASE_PATH || '/';

  return {
    base: basePath,
    plugins: [
      react(),
      tailwindcss(),
      // Dev-only: inline /api/generate handler so `npm run dev` works without Vercel CLI.
      {
        name: 'local-api-generate',
        configureServer(server) {
          server.middlewares.use(
            '/api/generate',
            async (req: IncomingMessage, res: ServerResponse, next: Connect.NextFunction) => {
              if (req.method !== 'POST') {
                next();
                return;
              }

              let body = '';
              req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
              req.on('end', async () => {
                try {
                  const { GoogleGenAI } = await import('@google/genai');
                  const serverEnv = process.env;
                  const apiKey =
                    serverEnv.GEMINI_API_KEY;

                  if (!apiKey) {
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ error: 'No API key found. Set GEMINI_API_KEY in your .env.local file.' }));
                    return;
                  }

                  const { model, contents, config } = JSON.parse(body) as {
                    model: string;
                    contents: string;
                    config?: Record<string, unknown>;
                  };

                  const ai = new GoogleGenAI({ apiKey });
                  const response = await ai.models.generateContent({ model, contents, config });
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ text: response.text ?? '' }));
                } catch (e: unknown) {
                  const message = e instanceof Error ? e.message : 'Unknown error';
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: message }));
                }
              });
            }
          );
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // Allow disabling HMR in constrained environments via DISABLE_HMR.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
