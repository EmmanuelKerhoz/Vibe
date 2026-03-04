export const cleanSectionName = (name: string) => {
  if (!name) return '';
  return name.replace(/[\\[\\]\\*]/g, '').trim();
};

export const countSyllables = (text: string) => {
  if (!text) return 0;
  const word = text.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 3) return 1;
  const syllables = word
    .replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '')
    .replace(/^y/, '')
    .match(/[aeiouy]{1,2}/g);
  return syllables ? syllables.length : 1;
};

export const safeJsonParse = (text: string, fallback: any) => {
  try {
    return JSON.parse(text);
  } catch (e) {
    console.warn('JSON parse failed, attempting to fix truncation...', e);
    let fixedText = text;
    const quotes = (fixedText.match(/\"/g) || []).length;
    if (quotes % 2 !== 0) {
      fixedText += '\"';
    }
    
    let openBraces = (fixedText.match(/\\{/g) || []).length;
    let closeBraces = (fixedText.match(/\\}/g) || []).length;
    let openBrackets = (fixedText.match(/\\[/g) || []).length;
    let closeBrackets = (fixedText.match(/\\]/g) || []).length;
    
    for (let i = 0; i < openBraces - closeBraces; i++) fixedText += '}';
    for (let i = 0; i < openBrackets - closeBrackets; i++) fixedText += ']';
    
    try {
      return JSON.parse(fixedText);
    } catch (e2) {
      console.warn('First fix attempt failed, trying aggressive truncation...', e2);
      fixedText = text.replace(/,[^}]*$/, '');
      openBraces = (fixedText.match(/\\{/g) || []).length;
      closeBraces = (fixedText.match(/\\}/g) || []).length;
      openBrackets = (fixedText.match(/\\[/g) || []).length;
      closeBrackets = (fixedText.match(/\\]/g) || []).length;
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
