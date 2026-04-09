import { withRetry, type RetryOptions } from './withRetry';
import { z } from 'zod';

const getErrorMessage = (error: unknown) => {
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message?: unknown }).message ?? '');
  }
  if (typeof error === 'string') return error;
  return '';
};

const getErrorCode = (error: unknown) => {
  if (error && typeof error === 'object') {
    const code = (error as { code?: unknown; status?: unknown }).code ?? (error as { status?: unknown }).status;
    return code;
  }
  return undefined;
};

/**
 * Sanitise an error message before surfacing it to the UI.
 * Strips stack traces and internal paths; keeps only human-readable text
 * (max 200 chars to prevent accidental info disclosure).
 */
const sanitiseErrorMessage = (msg: string): string =>
  msg.replace(/\bat\s+\S+/g, '').trim().slice(0, 200);

export type GenerateContentParams = {
  model: string;
  contents: string;
  config?: Record<string, unknown>;
  signal?: AbortSignal;
};

export const AI_PROVIDER_NAME = 'Google Gemini';
export const AI_MODEL_NAME = 'gemini-2.5-flash';
export const AI_KEY_ENV_VAR = 'GEMINI_API_KEY';

export type GenerateContentResponse = {
  text: string;
};

/** Zod schema validating the /api/generate proxy response shape. */
const GenerateContentResponseSchema = z.object({
  text: z.string(),
});

const proxyGenerateContent = async (params: GenerateContentParams): Promise<GenerateContentResponse> => {
  const { signal, ...body } = params;
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: signal ?? null,
  });
  if (!response.ok) {
    let errMsg = `Server error ${response.status}`;
    try {
      const errBody = await response.json() as { error?: string };
      if (errBody.error) errMsg = errBody.error;
    } catch {
      // ignore JSON parse failure
    }
    const err = new Error(errMsg) as Error & { code?: number };
    err.code = response.status;
    throw err;
  }
  let raw: unknown;
  try {
    raw = await response.json();
  } catch {
    throw new Error('Failed to parse server response as JSON');
  }
  const parsed = GenerateContentResponseSchema.safeParse(raw);
  if (!parsed.success) {
    console.warn('[proxyGenerateContent] Unexpected response shape:', parsed.error);
    throw new Error('Unexpected response shape from /api/generate');
  }
  return parsed.data;
};

export const getAi = () => ({
  models: {
    generateContent: proxyGenerateContent,
  },
});

export const generateContentWithRetry = (
  params: GenerateContentParams,
  retryOptions?: RetryOptions,
) => withRetry(() => getAi().models.generateContent(params), retryOptions);

/**
 * Safe JSON parser with optional Zod validation.
 *
 * When `schema` is omitted the raw value is returned only if it is a
 * non-null object or array — preventing the silent `as T` cast on
 * primitive/unknown payloads.
 */
export const safeJsonParse = <T>(
  text: string,
  fallback: T,
  schema?: z.ZodType<T, z.ZodTypeDef, unknown>,
): T => {
  try {
    const raw: unknown = JSON.parse(text);
    if (schema) {
      const result = schema.safeParse(raw);
      if (!result.success) {
        console.warn('[safeJsonParse] Zod validation failed:', result.error);
        return fallback;
      }
      return result.data;
    }
    // Without a schema: only accept objects/arrays to avoid unsafe primitive casts.
    if (raw === null || (typeof raw !== 'object' && !Array.isArray(raw))) {
      console.warn('[safeJsonParse] Unexpected primitive payload — returning fallback.');
      return fallback;
    }
    return raw as T;
  } catch (e) {
    console.warn('[safeJsonParse] Failed to parse JSON response, using fallback.', e);
    return fallback;
  }
};

export const handleApiError = (error: unknown, defaultMessage: string) => {
  console.error(defaultMessage, error);

  const errorMessage = getErrorMessage(error);
  const errorCode = getErrorCode(error);

  let message: string;
  if (
    errorCode === 429 ||
    errorCode === 'RESOURCE_EXHAUSTED' ||
    errorMessage.includes('429') ||
    errorMessage.includes('quota')
  ) {
    message = `You've exceeded your current ${AI_PROVIDER_NAME} API quota. Please verify your plan/billing and API key in your local environment.`;
  } else if (errorMessage.includes('Requested entity was not found')) {
    message = `API key error. Please check ${AI_KEY_ENV_VAR} in your server environment.`;
  } else {
    // Sanitise before dispatching: strip stack frames, cap length.
    message = sanitiseErrorMessage(errorMessage) || defaultMessage;
  }

  window.dispatchEvent(
    new CustomEvent('vibe:apierror', { detail: { message } })
  );
};
