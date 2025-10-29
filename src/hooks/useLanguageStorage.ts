import { useState, useEffect } from 'react';

type SupportedLanguage = 'en' | 'es' | 'ja';

export const useLanguageStorage = () => {
  const [language, setLanguage] = useState<SupportedLanguage>('en');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load from Chrome storage
    chrome?.storage?.local?.get(['language'], (result) => {
      if (result.language && ['en', 'es', 'ja'].includes(result.language)) {
        setLanguage(result.language);
      }
      setIsLoading(false);
    });
  }, []);

  const updateLanguage = async (newLanguage: SupportedLanguage) => {
    setLanguage(newLanguage);
    await chrome?.storage?.local?.set({ language: newLanguage });
  };

  return { language, updateLanguage, isLoading };
};
