import { useState, useEffect, useCallback } from 'react';
import { GLOBAL_TRANSLATIONS } from '../constants/data';

// ─── DYNAMIC TRANSLATOR HOOK ──────────────────────────────────────────────
const translationCache = {};
const listeners = new Set();
const notifyListeners = () => listeners.forEach(l => l());

const useTranslation = (language) => {
  const [, forceUpdate] = useState({});

  useEffect(() => {
    listeners.add(forceUpdate);
    return () => listeners.delete(forceUpdate);
  }, []);

  const t = useCallback((enText, hiText) => {
    if (!enText) return '';
    if (language === 'en') return enText;

    const globalKey = Object.keys(GLOBAL_TRANSLATIONS).find(k => GLOBAL_TRANSLATIONS[k].en === enText || k === enText);
    if (globalKey && GLOBAL_TRANSLATIONS[globalKey][language]) {
      return GLOBAL_TRANSLATIONS[globalKey][language];
    }

    if (language === 'hi' && hiText) return hiText;

    const cacheKey = `${language}_${enText}`;

    if (translationCache[cacheKey]) {
      return translationCache[cacheKey];
    }

    if (translationCache[cacheKey] === undefined) {
      translationCache[cacheKey] = hiText || enText;

      fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${language}&dt=t&q=${encodeURIComponent(enText)}`)
        .then(res => res.json())
        .then(json => {
          if (json && json[0]) {
            const translated = json[0].map(item => item[0]).join('');
            translationCache[cacheKey] = translated;
            notifyListeners();
          }
        })
        .catch(err => {
          console.warn("Translation failed for", enText, err);
        });
    }

    return translationCache[cacheKey];
  }, [language]);

  return t;
};

export default useTranslation;
