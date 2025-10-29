import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useI18n } from '../hooks/useI18n';
import { cn } from '../utils/tailwind';

type SupportedLanguage = 'en' | 'es' | 'ja';

const languageOptions: { value: SupportedLanguage; label: string; flag: string }[] = [
  { value: 'en', label: 'English', flag: '🇺🇸' },
  { value: 'es', label: 'Español', flag: '🇪🇸' },
  { value: 'ja', label: '日本語', flag: '🇯🇵' },
];

export const LanguageSelector: React.FC = () => {
  const { language, updateLanguage, isLoading } = useLanguage();
  const { t } = useI18n();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">{t('languageSelector.label')}: Loading...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2 w-full">
      {/* <span className="text-sm text-gray-600">{t('languageSelector.label')}:</span> */}
      <div className="relative w-full bg-black/0 rounded-[14px] p-0 flex">
        {languageOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => updateLanguage(option.value)}
            className={cn(
              'relative w-full px-3 py-1.5 rounded-[12px] text-sm font-medium',
              'flex items-center justify-center gap-1',
              language === option.value
                ? 'bg-white text-black shadow-sm border border-gray-400'
                : 'text-black/60 hover:text-black/80 cursor-pointer'
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};
