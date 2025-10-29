import { useMemo } from 'react';
import { i18n } from '../i18n';
import { useLanguage } from '../contexts/LanguageContext';

export const useI18n = () => {
  const { language } = useLanguage();

  const translations = useMemo(() => {
    return i18n[language] || i18n.en;
  }, [language]);

  const t = useMemo(() => {
    return (path: string, options?: { count?: number }): string => {
      const keys = path.split('.');
      let value: any = translations;
      
      for (const key of keys) {
        if (value && typeof value === 'object' && key in value) {
          value = value[key];
        } else {
          console.warn(`Translation key "${path}" not found for language "${language}"`);
          return path; // Return the path as fallback
        }
      }
      
      // Handle pluralization
      if (options?.count !== undefined && typeof value === 'object') {
        const count = options.count;
        
        // English pluralization rules
        if (language === 'en') {
          if (count === 1) {
            value = value.one || value.singular || value;
          } else {
            value = value.other || value.plural || value;
          }
        }
        // Spanish pluralization rules
        else if (language === 'es') {
          if (count === 1) {
            value = value.one || value.singular || value;
          } else {
            value = value.other || value.plural || value;
          }
        }
        // Japanese doesn't typically use pluralization
        else if (language === 'ja') {
          value = value.one || value.singular || value;
        }
      }
      
      return typeof value === 'string' ? value : path;
    };
  }, [translations, language]);

  return { t, language };
};
