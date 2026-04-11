/**
 * _aiProvider.ts
 * Resolves the active AI provider from environment variables and exposes
 * a unified generateContent() interface consumed by generate.ts.
 *
 * Supported providers (AI_PROVIDER env var):
 *   gemini     — Google Gemini via @google/genai  (default)
 *   openai     — OpenAI via openai SDK
 *   anthropic  — Anthropic via @anthropic-ai/sdk
 *
 * Per-provider env vars:
 *   GEMINI_API_KEY      — required for gemini
 *   OPENAI_API_KEY      — required for openai
 *   ANTHROPIC_API_KEY   — required for anthropic
 *
 * AI_MODEL overrides the default model for the active provider.
 */

export type ProviderName = 'gemini' | 'openai' | 'anthropic';

export interface ProviderInfo {
  provider: ProviderName;
  model: string;
  available: boolean;
}

export interface GenerateParams {
  model: string;
  contents: string;
  config?: Record<string, unknown>;
  abortSignal?: AbortSignal;
}

// ─── Per-provider defaults ────────────────────────────────────────────────────

const PROVIDER_DEFAULTS: Record<ProviderName, { model: string; keyEnv: string; prefixes: string[] }> = {
  gemini:    { model: 'gemini-2.5-flash', keyEnv: 'GEMINI_API_KEY',    prefixes: ['gemini-'] },
  openai:    { model: 'gpt-4o-mini',      keyEnv: 'OPENAI_API_KEY',    prefixes: ['gpt-', 'o1-', 'o3-', 'chatgpt-'] },
  anthropic: { model: 'claude-3-5-haiku-20241022', keyEnv: 'ANTHROPIC_API_KEY', prefixes: ['claude-'] },
};

function resolveProvider(): ProviderName {
  const raw = (process.env.AI_PROVIDER ?? 'gemini').toLowerCase();
  if (raw === 'openai' || raw === 'anthropic') return raw;
  return 'gemini';
}

export function getProviderInfo(): ProviderInfo {
  const provider = resolveProvider();
  const defaults = PROVIDER_DEFAULTS[provider];
  const model = process.env.AI_MODEL || defaults.model;
  const available = Boolean(process.env[defaults.keyEnv]);
  return { provider, model, available };
}

export function getAllowedModelPrefixes(): string[] {
  return PROVIDER_DEFAULTS[resolveProvider()].prefixes;
}

// ─── Allowed SDK config keys (shared across providers) ───────────────────────

export const ALLOWED_CONFIG_KEYS = new Set([
  'temperature', 'topP', 'topK', 'maxOutputTokens', 'stopSequences',
  'candidateCount', 'presencePenalty', 'frequencyPenalty', 'seed',
  'responseMimeType',
  'responseSchema', // required for Gemini structured JSON output
] as const);

// ─── Provider-specific generate implementations ──────────────────────────────

async function generateGemini(apiKey: string, params: GenerateParams): Promise<string> {
  const { GoogleGenAI } = await import('@google/genai') as typeof import('@google/genai');
  const ai = new GoogleGenAI({ apiKey });
  const controller = new AbortController();
  const externalSignal = params.abortSignal;
  // Forward external abort to the internal controller.
  externalSignal?.addEventListener('abort', () => controller.abort(), { once: true });

  const TIMEOUT_MS = 55_000;
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let response;
  try {
    response = await ai.models.generateContent({
      model: params.model,
      contents: params.contents,
      config: { ...(params.config ?? {}), abortSignal: controller.signal },
    });
  } finally {
    clearTimeout(timer);
  }
  if (controller.signal.aborted) throw Object.assign(new DOMException('Aborted', 'AbortError'));
  return response.text ?? '';
}

async function generateOpenAI(apiKey: string, params: GenerateParams): Promise<string> {
  const { default: OpenAI } = await import('openai') as typeof import('openai');
  const client = new OpenAI({ apiKey });
  const completion = await client.chat.completions.create({
    model: params.model,
    messages: [{ role: 'user', content: params.contents }],
    ...(typeof params.config?.temperature === 'number' && { temperature: params.config.temperature as number }),
    ...(typeof params.config?.maxOutputTokens === 'number' && { max_completion_tokens: params.config.maxOutputTokens as number }),
  }, { signal: params.abortSignal });
  return completion.choices[0]?.message?.content ?? '';
}

async function generateAnthropic(apiKey: string, params: GenerateParams): Promise<string> {
  const Anthropic = (await import('@anthropic-ai/sdk') as typeof import('@anthropic-ai/sdk')).default;
  const client = new Anthropic({ apiKey });
  const msg = await client.messages.create({
    model: params.model,
    max_tokens: (params.config?.maxOutputTokens as number | undefined) ?? 4096,
    messages: [{ role: 'user', content: params.contents }],
  });
  const block = msg.content[0];
  return block?.type === 'text' ? block.text : '';
}

// ─── Public generate entry point ─────────────────────────────────────────────

export async function providerGenerate(params: GenerateParams): Promise<string> {
  const provider = resolveProvider();
  const defaults = PROVIDER_DEFAULTS[provider];
  const apiKey = process.env[defaults.keyEnv];
  if (!apiKey) throw new Error(`${defaults.keyEnv} is not configured on the server.`);

  switch (provider) {
    case 'gemini':    return generateGemini(apiKey, params);
    case 'openai':    return generateOpenAI(apiKey, params);
    case 'anthropic': return generateAnthropic(apiKey, params);
  }
}
