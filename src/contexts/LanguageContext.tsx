import React, { createContext, useContext } from 'react';
import { useLanguageStorage } from '../hooks/useLanguageStorage';

type SupportedLanguage = 'en' | 'es' | 'ja';

type LanguageContextType = {
  language: SupportedLanguage;
  updateLanguage: (lang: SupportedLanguage) => Promise<void>;
  isLoading: boolean;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const languageStorage = useLanguageStorage();
  
  return (
    <LanguageContext.Provider value={languageStorage}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
