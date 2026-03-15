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

type GenerateContentParams = {
  model: string;
  contents: string;
  config?: Record<string, unknown>;
  signal?: AbortSignal; // ♥ transmis au fetch sous-jacent
};

export const AI_PROVIDER_NAME = 'Google Gemini';
export const AI_MODEL_NAME = 'gemini-3-flash-preview';
export const AI_KEY_ENV_VAR = 'GEMINI_API_KEY';

type GenerateContentResponse = {
  text: string;
};

const proxyGenerateContent = async (params: GenerateContentParams): Promise<GenerateContentResponse> => {
  const { signal, ...body } = params;
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal, // ♥ abort réel du fetch
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
  try {
    return await response.json() as GenerateContentResponse;
  } catch {
    throw new Error('Failed to parse server response as JSON');
  }
};

export const getAi = () => ({
  models: {
    generateContent: proxyGenerateContent,
  },
});

export const safeJsonParse = <T>(text: string, fallback: T): T => {
  try {
    return JSON.parse(text) as T;
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
    message = errorMessage || defaultMessage;
  }

  window.dispatchEvent(
    new CustomEvent('vibe:apierror', { detail: { message } })
  );
};
