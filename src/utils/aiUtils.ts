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
};

type GenerateContentResponse = {
  text: string;
};

const proxyGenerateContent = async (params: GenerateContentParams): Promise<GenerateContentResponse> => {
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
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
    console.warn('JSON parse failed, attempting to fix truncation...', e);
    let fixedText = text;
    const quotes = (fixedText.match(/"/g) || []).length;
    if (quotes % 2 !== 0) {
      fixedText += '"';
    }

    let openBraces = (fixedText.match(/\{/g) || []).length;
    let closeBraces = (fixedText.match(/\}/g) || []).length;
    let openBrackets = (fixedText.match(/\[/g) || []).length;
    let closeBrackets = (fixedText.match(/\]/g) || []).length;

    for (let i = 0; i < openBraces - closeBraces; i++) fixedText += '}';
    for (let i = 0; i < openBrackets - closeBrackets; i++) fixedText += ']';

    try {
      return JSON.parse(fixedText) as T;
    } catch (e2) {
      console.warn('First fix attempt failed, trying aggressive truncation...', e2);
      fixedText = text.replace(/,[^}]*$/, '');
      openBraces = (fixedText.match(/\{/g) || []).length;
      closeBraces = (fixedText.match(/\}/g) || []).length;
      openBrackets = (fixedText.match(/\[/g) || []).length;
      closeBrackets = (fixedText.match(/\]/g) || []).length;
      for (let i = 0; i < openBraces - closeBraces; i++) fixedText += '}';
      for (let i = 0; i < openBrackets - closeBrackets; i++) fixedText += ']';
      try {
        return JSON.parse(fixedText) as T;
      } catch (e3) {
        console.error('Failed to fix JSON:', e3);
        return fallback;
      }
    }
  }
};

let isErrorDialogOpen = false;
export const handleApiError = (error: unknown, defaultMessage: string) => {
  console.error(defaultMessage, error);
  if (isErrorDialogOpen) return;

  const errorMessage = getErrorMessage(error);
  const errorCode = getErrorCode(error);

  if (errorCode === 429 || errorCode === 'RESOURCE_EXHAUSTED' || errorMessage.includes('429') || errorMessage.includes('quota')) {
    isErrorDialogOpen = true;
    const confirmMsg = "You've exceeded your current Gemini API quota. Please verify your plan/billing and API key in your local environment.";
    alert(confirmMsg);
    isErrorDialogOpen = false;
  } else if (errorMessage.includes('Requested entity was not found')) {
    isErrorDialogOpen = true;
    alert('API key error. Please check GEMINI_API_KEY in your server environment.');
    isErrorDialogOpen = false;
  } else {
    isErrorDialogOpen = true;
    alert(errorMessage || defaultMessage);
    isErrorDialogOpen = false;
  }
};
