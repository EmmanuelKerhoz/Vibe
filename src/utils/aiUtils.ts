import { GoogleGenAI } from '@google/genai';

const env = import.meta.env;

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

export const getAi = () => {
  const apiKey = env.VITE_API_KEY || env.VITE_GEMINI_API_KEY || env.API_KEY || env.GEMINI_API_KEY;
  return new GoogleGenAI({ apiKey });
};

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
    alert('API key error. Please check VITE_GEMINI_API_KEY/VITE_API_KEY in your environment.');
    isErrorDialogOpen = false;
  } else {
    isErrorDialogOpen = true;
    alert(errorMessage || defaultMessage);
    isErrorDialogOpen = false;
  }
};
