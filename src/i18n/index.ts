// Sistema de internacionalización para el plugin Notelert
// Exporta todas las funciones y constantes necesarias

export { Language } from './types';
export { SUPPORTED_LANGUAGES } from './languages';
export { TRANSLATIONS } from './translations';

import { Language } from './types';
import { SUPPORTED_LANGUAGES } from './languages';
import { TRANSLATIONS } from './translations';

type TranslationValue = string | TranslationTree;
interface TranslationTree {
  [key: string]: TranslationValue;
}

export function getTranslation(language: string, key: string, params?: Record<string, string | number>): string {
  const lang = language as keyof typeof TRANSLATIONS;
  const translation = (TRANSLATIONS[lang] || TRANSLATIONS.en) as TranslationTree;
  const fallbackTranslation = TRANSLATIONS.en as TranslationTree;

  const keys = key.split('.');

  // Helper para obtener un valor anidado de un objeto de traducciones
  const getValue = (obj: TranslationTree, keyPath: string[]): TranslationValue | undefined => {
    let val: TranslationValue = obj;
    for (const k of keyPath) {
      if (typeof val === 'object' && k in val) {
        val = val[k];
      } else {
        return undefined;
      }
    }
    return val;
  };

  let value = getValue(translation, keys);

  // If not found in selected language, try fallback (English)
  if (typeof value !== 'string' && translation !== fallbackTranslation) {
    value = getValue(fallbackTranslation, keys);
  }

  if (typeof value !== 'string') {
    return key; // Fallback to key if translation not found
  }

  // Replace parameters
  if (params) {
    for (const [param, val] of Object.entries(params)) {
      value = value.replace(`{${param}}`, String(val));
    }
  }

  return value;
}

export function getLanguageByCode(code: string): Language | undefined {
  return SUPPORTED_LANGUAGES.find(lang => lang.code === code);
}

export function getDefaultLanguage(): Language {
  return SUPPORTED_LANGUAGES[0]; // Spanish as default
}
