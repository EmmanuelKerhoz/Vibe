import { GoogleGenAI } from '@google/genai';

export const getAi = () => {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  return new GoogleGenAI({ apiKey: apiKey as string });
};

export const apiState = { isErrorDialogOpen: false };

export const handleApiError = (error: any, defaultMessage: string) => {
  console.error(defaultMessage, error);
  if (apiState.isErrorDialogOpen) return;

  const errorMessage = error?.message || (typeof error === 'string' ? error : "");
  const errorCode = error?.code || error?.status;
  
  if (errorCode === 429 || errorCode === 'RESOURCE_EXHAUSTED' || errorMessage.includes('429') || errorMessage.includes('quota')) {
    apiState.isErrorDialogOpen = true;
    const confirmMsg = "You've exceeded your current Gemini API quota. Would you like to select a different API key (e.g., from a paid project) to continue?";
    if (window.confirm(confirmMsg)) {
      if (typeof (window as any).aistudio?.openSelectKey === 'function') {
        (window as any).aistudio.openSelectKey();
      } else {
        alert("API key selection is not available in this environment. Please check your plan and billing details.");
      }
    }
    apiState.isErrorDialogOpen = false;
  } else if (errorMessage.includes("Requested entity was not found")) {
    apiState.isErrorDialogOpen = true;
    alert("API key error. Please select your API key again.");
    if (typeof (window as any).aistudio?.openSelectKey === 'function') {
      (window as any).aistudio.openSelectKey();
    }
    apiState.isErrorDialogOpen = false;
  } else {
    apiState.isErrorDialogOpen = true;
    alert(errorMessage || defaultMessage);
    apiState.isErrorDialogOpen = false;
  }
};
