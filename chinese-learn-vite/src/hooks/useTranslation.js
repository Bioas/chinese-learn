import en from '../lang/en';
import th from '../lang/th';
import { useApp } from '../context/AppContext';

const translations = { en, th };

export default function useTranslation() {
  const { state } = useApp();
  const lang = state.language || 'en';
  const dict = translations[lang] || en;

  const t = (key, params = {}) => {
    let text = dict[key];
    if (text === undefined) {
      text = en[key] || key;
    }
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replace(`{${k}}`, v);
      }
    }
    return text;
  };

  const meaning = (word, fallback = true) => {
    if (!word) return '';
    if (lang === 'th') return word.meaningThai || (fallback ? word.meaning : '');
    return word.meaning || '';
  };

  return { t, meaning, lang };
}
