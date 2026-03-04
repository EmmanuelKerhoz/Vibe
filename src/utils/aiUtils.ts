import { GoogleGenAI } from '@google/genai';

export const getAi = () => {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  return new GoogleGenAI({ apiKey });
};

export const safeJsonParse = (text: string, fallback: any) => {
  try {
    return JSON.parse(text);
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
      return JSON.parse(fixedText);
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
        return JSON.parse(fixedText);
      } catch (e3) {
        console.error('Failed to fix JSON:', e3);
        return fallback;
      }
    }
  }
};

export let isErrorDialogOpen = false;
export const handleApiError = (error: any, defaultMessage: string) => {
  console.error(defaultMessage, error);
  if (isErrorDialogOpen) return;

  const errorMessage = error?.message || (typeof error === 'string' ? error : "");
  const errorCode = error?.code || error?.status;
  
  if (errorCode === 429 || errorCode === 'RESOURCE_EXHAUSTED' || errorMessage.includes('429') || errorMessage.includes('quota')) {
    isErrorDialogOpen = true;
    const confirmMsg = "You've exceeded your current Gemini API quota. Would you like to select a different API key (e.g., from a paid project) to continue?";
    if (window.confirm(confirmMsg)) {
      if (typeof (window as any).aistudio?.openSelectKey === 'function') {
        (window as any).aistudio.openSelectKey();
      } else {
        alert("API key selection is not available in this environment. Please check your plan and billing details.");
      }
    }
    isErrorDialogOpen = false;
  } else if (errorMessage.includes("Requested entity was not found")) {
    isErrorDialogOpen = true;
    alert("API key error. Please select your API key again.");
    if (typeof (window as any).aistudio?.openSelectKey === 'function') {
      (window as any).aistudio.openSelectKey();
    }
    isErrorDialogOpen = false;
  } else {
    isErrorDialogOpen = true;
    alert(errorMessage || defaultMessage);
    isErrorDialogOpen = false;
  }
};