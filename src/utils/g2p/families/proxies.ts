/**
 * Proxy G2P implementations for 13 approximated language families
 * These families use simplified approximations based on other family mappings
 */

import type { AlgoFamily } from '../../../constants/langFamilyMap';
import { gemG2P } from './gem';

/**
 * Slavic (SLV) family G2P - uses English as rough approximation
 */
export const slvG2P = (text: string): string => {
  return gemG2P(text);
};

/**
 * Sinitic (SIN) family G2P - preserves tones, uses basic vowel mapping
 */
export const sinG2P = (text: string): string => {
  const normalized = text.toLowerCase().normalize('NFD');
  let ipa = '';
  let i = 0;

  const mapping: Record<string, string> = {
    'a': 'a',
    'e': 'ə',
    'i': 'i',
    'o': 'o',
    'u': 'u',
    'b': 'b',
    'c': 'k',
    'd': 'd',
    'f': 'f',
    'g': 'g',
    'h': 'h',
    'j': 'dʒ',
    'k': 'k',
    'l': 'l',
    'm': 'm',
    'n': 'n',
    'p': 'p',
    'q': 'k',
    'r': 'ɹ',
    's': 's',
    't': 't',
    'v': 'v',
    'w': 'w',
    'x': 'ks',
    'y': 'j',
    'z': 'z',
  };

  while (i < normalized.length) {
    let matched = false;

    for (let len = 3; len >= 1; len--) {
      if (i + len <= normalized.length) {
        const substr = normalized.slice(i, i + len);
        if (mapping[substr]) {
          ipa += mapping[substr];
          i += len;
          matched = true;
          break;
        }
      }
    }

    if (!matched) {
      const char = normalized[i]!;
      // Preserve tone diacritics for tonal languages
      if (/[\u0300-\u0304\u030C]/.test(char)) {
        ipa += char;
      } else if (!/[\u0300-\u036f\s]/.test(char)) {
        ipa += char;
      }
      i++;
    }
  }

  return ipa;
};

/**
 * Japanese (JAP) family G2P - uses basic CV mapping
 */
export const japG2P = (text: string): string => {
  const normalized = text.toLowerCase().normalize('NFD');
  let ipa = '';
  let i = 0;

  const mapping: Record<string, string> = {
    'a': 'a',
    'e': 'e',
    'i': 'i',
    'o': 'o',
    'u': 'ɯ',
    'b': 'b',
    'c': 'k',
    'd': 'd',
    'f': 'f',
    'g': 'g',
    'h': 'h',
    'j': 'dʒ',
    'k': 'k',
    'l': 'l',
    'm': 'm',
    'n': 'n',
    'p': 'p',
    'q': 'k',
    'r': 'ɹ',
    's': 's',
    't': 't',
    'v': 'v',
    'w': 'w',
    'x': 'ks',
    'y': 'j',
    'z': 'z',
  };

  while (i < normalized.length) {
    let matched = false;

    for (let len = 3; len >= 1; len--) {
      if (i + len <= normalized.length) {
        const substr = normalized.slice(i, i + len);
        if (mapping[substr]) {
          ipa += mapping[substr];
          i += len;
          matched = true;
          break;
        }
      }
    }

    if (!matched) {
      const char = normalized[i]!;
      if (!/[\u0300-\u036f\s]/.test(char)) {
        ipa += char;
      }
      i++;
    }
  }

  return ipa;
};

/**
 * Korean (KOR) family G2P - uses basic mapping
 */
export const korG2P = (text: string): string => {
  const normalized = text.toLowerCase().normalize('NFD');
  let ipa = '';
  let i = 0;

  const mapping: Record<string, string> = {
    'a': 'a',
    'e': 'e',
    'i': 'i',
    'o': 'o',
    'u': 'u',
    'b': 'b',
    'c': 'k',
    'd': 'd',
    'f': 'f',
    'g': 'g',
    'h': 'h',
    'j': 'dʒ',
    'k': 'k',
    'l': 'l',
    'm': 'm',
    'n': 'n',
    'p': 'p',
    'q': 'k',
    'r': 'ɹ',
    's': 's',
    't': 't',
    'v': 'v',
    'w': 'w',
    'x': 'ks',
    'y': 'j',
    'z': 'z',
  };

  while (i < normalized.length) {
    let matched = false;

    for (let len = 3; len >= 1; len--) {
      if (i + len <= normalized.length) {
        const substr = normalized.slice(i, i + len);
        if (mapping[substr]) {
          ipa += mapping[substr];
          i += len;
          matched = true;
          break;
        }
      }
    }

    if (!matched) {
      const char = normalized[i]!;
      if (!/[\u0300-\u036f\s]/.test(char)) {
        ipa += char;
      }
      i++;
    }
  }

  return ipa;
};

/**
 * Bantu (BNT) family G2P - similar to KWA but with different inventory
 */
export const bntG2P = (text: string): string => {
  // Import KWA mapping since it's similar
  const normalized = text.toLowerCase().normalize('NFD');
  let ipa = '';
  let i = 0;

  const mapping: Record<string, string> = {
    'a': 'a',
    'e': 'e',
    'ɛ': 'ɛ',
    'i': 'i',
    'o': 'o',
    'ɔ': 'ɔ',
    'u': 'u',
    'b': 'b',
    'c': 'k',
    'd': 'd',
    'f': 'f',
    'g': 'g',
    'h': 'h',
    'j': 'dʒ',
    'k': 'k',
    'l': 'l',
    'm': 'm',
    'n': 'n',
    'ɲ': 'ɲ',
    'ŋ': 'ŋ',
    'p': 'p',
    'r': 'r',
    's': 's',
    't': 't',
    'v': 'v',
    'w': 'w',
    'y': 'j',
    'z': 'z',
  };

  while (i < normalized.length) {
    let matched = false;

    for (let len = 3; len >= 1; len--) {
      if (i + len <= normalized.length) {
        const substr = normalized.slice(i, i + len);
        if (mapping[substr]) {
          ipa += mapping[substr];
          i += len;
          matched = true;
          break;
        }
      }
    }

    if (!matched) {
      const char = normalized[i]!;
      // Preserve tone diacritics for tonal Bantu languages
      if (/[\u0300-\u0304\u030C]/.test(char)) {
        ipa += char;
      } else if (!/[\u0300-\u036f\s]/.test(char)) {
        ipa += char;
      }
      i++;
    }
  }

  return ipa;
};

/**
 * Indo-Iranian (IIR) family G2P - uses English as approximation
 */
export const iirG2P = (text: string): string => {
  return gemG2P(text);
};

/**
 * Dravidian (DRV) family G2P - uses English as approximation
 */
export const drvG2P = (text: string): string => {
  return gemG2P(text);
};

/**
 * Turkic (TRK) family G2P - uses English as approximation
 */
export const trkG2P = (text: string): string => {
  return gemG2P(text);
};

/**
 * Uralic/Finnish (FIN) family G2P - uses English as approximation
 */
export const finG2P = (text: string): string => {
  return gemG2P(text);
};

/**
 * Tai-Kadai (TAI) family G2P - tonal, uses basic mapping similar to Sinitic
 */
export const taiG2P = (text: string): string => {
  const normalized = text.toLowerCase().normalize('NFD');
  let ipa = '';
  let i = 0;

  const mapping: Record<string, string> = {
    'a': 'a',
    'e': 'e',
    'i': 'i',
    'o': 'o',
    'u': 'u',
    'b': 'b',
    'c': 'k',
    'd': 'd',
    'f': 'f',
    'g': 'g',
    'h': 'h',
    'j': 'dʒ',
    'k': 'k',
    'l': 'l',
    'm': 'm',
    'n': 'n',
    'p': 'p',
    'q': 'k',
    'r': 'ɹ',
    's': 's',
    't': 't',
    'v': 'v',
    'w': 'w',
    'x': 'ks',
    'y': 'j',
    'z': 'z',
  };

  while (i < normalized.length) {
    let matched = false;

    for (let len = 3; len >= 1; len--) {
      if (i + len <= normalized.length) {
        const substr = normalized.slice(i, i + len);
        if (mapping[substr]) {
          ipa += mapping[substr];
          i += len;
          matched = true;
          break;
        }
      }
    }

    if (!matched) {
      const char = normalized[i]!;
      // Preserve tone diacritics for tonal languages
      if (/[\u0300-\u0304\u030C]/.test(char)) {
        ipa += char;
      } else if (!/[\u0300-\u036f\s]/.test(char)) {
        ipa += char;
      }
      i++;
    }
  }

  return ipa;
};

/**
 * Austroasiatic/Vietnamese (VIET) family G2P - tonal, uses basic mapping
 */
export const vietG2P = (text: string): string => {
  const normalized = text.toLowerCase().normalize('NFD');
  let ipa = '';
  let i = 0;

  const mapping: Record<string, string> = {
    'a': 'a',
    'e': 'e',
    'i': 'i',
    'o': 'o',
    'u': 'u',
    'b': 'b',
    'c': 'k',
    'd': 'd',
    'f': 'f',
    'g': 'g',
    'h': 'h',
    'j': 'dʒ',
    'k': 'k',
    'l': 'l',
    'm': 'm',
    'n': 'n',
    'p': 'p',
    'q': 'k',
    'r': 'ɹ',
    's': 's',
    't': 't',
    'v': 'v',
    'w': 'w',
    'x': 'ks',
    'y': 'j',
    'z': 'z',
  };

  while (i < normalized.length) {
    let matched = false;

    for (let len = 3; len >= 1; len--) {
      if (i + len <= normalized.length) {
        const substr = normalized.slice(i, i + len);
        if (mapping[substr]) {
          ipa += mapping[substr];
          i += len;
          matched = true;
          break;
        }
      }
    }

    if (!matched) {
      const char = normalized[i]!;
      // Preserve tone diacritics for tonal languages
      if (/[\u0300-\u0304\u030C]/.test(char)) {
        ipa += char;
      } else if (!/[\u0300-\u036f\s]/.test(char)) {
        ipa += char;
      }
      i++;
    }
  }

  return ipa;
};

/**
 * Austronesian (AUS) family G2P - uses basic mapping
 */
export const ausG2P = (text: string): string => {
  const normalized = text.toLowerCase().normalize('NFD');
  let ipa = '';
  let i = 0;

  const mapping: Record<string, string> = {
    'a': 'a',
    'e': 'e',
    'i': 'i',
    'o': 'o',
    'u': 'u',
    'b': 'b',
    'c': 'k',
    'd': 'd',
    'f': 'f',
    'g': 'g',
    'h': 'h',
    'j': 'dʒ',
    'k': 'k',
    'l': 'l',
    'm': 'm',
    'n': 'n',
    'p': 'p',
    'q': 'k',
    'r': 'ɹ',
    's': 's',
    't': 't',
    'v': 'v',
    'w': 'w',
    'x': 'ks',
    'y': 'j',
    'z': 'z',
  };

  while (i < normalized.length) {
    let matched = false;

    for (let len = 3; len >= 1; len--) {
      if (i + len <= normalized.length) {
        const substr = normalized.slice(i, i + len);
        if (mapping[substr]) {
          ipa += mapping[substr];
          i += len;
          matched = true;
          break;
        }
      }
    }

    if (!matched) {
      const char = normalized[i]!;
      if (!/[\u0300-\u036f\s]/.test(char)) {
        ipa += char;
      }
      i++;
    }
  }

  return ipa;
};
