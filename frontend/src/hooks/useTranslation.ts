import { useLanguage } from '@/context/LanguageContext';
import en from '@/config/en.json';
import ru from '@/config/ru.json';

const resources: Record<string, Record<string, string>> = {
  en,
  ru,
};

export function useTranslation() {
  const { language } = useLanguage();
  const t = (key: string, vars?: Record<string, string | number>) => {
    let str = resources[language][key] || key;
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        str = str.replace(`{${k}}`, String(v));
      });
    }
    return str;
  };
  return { t, language };
} 