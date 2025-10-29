import { PageSuggestion } from '../types/suggestions';
import { cn } from '../utils/tailwind';
import { SHOW_SUGGESTIONS } from '../constants';
import HorizontalLoader from './HorizontalLoader';
import { useI18n } from '../hooks/useI18n';

function removeTrailingSlash(text: string) {
  return text.replace(/\/$/, '');
}

interface PageSuggestionsProps {
  suggestions: PageSuggestion[];
  isLoading: boolean;
  onSuggestionClick: (suggestion: PageSuggestion) => void;
  currentPageUrl: string;
}

export default function PageSuggestions({ suggestions, isLoading, onSuggestionClick, currentPageUrl }: PageSuggestionsProps) {
  const { t } = useI18n()
  // Don't render anything if the feature is disabled
  if (!SHOW_SUGGESTIONS) {
    return null;
  }
  if (isLoading) {
    return (
      <div className="w-full p-4">
        <HorizontalLoader loaderText={t('pageSuggestions.gettingSuggestionsForThisPage')} />
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="w-full p-4">
      <div className="text-sm text-black/80 mb-3">
        {t('pageSuggestions.suggestionsFor')} <span className="font-medium text-black">{currentPageUrl.length > 22 ? currentPageUrl.slice(0, 22) + '...' : removeTrailingSlash(currentPageUrl)}</span>
      </div>
      <div className="space-y-2">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSuggestionClick(suggestion)}
            className={cn(
              "w-full relative text-left px-3 py-4 rounded-[20px] bg-black/5 cursor-pointer",
              "hover:bg-black/10 transition-colors",
              "focus:outline-none focus:ring-transparent focus:border-transparent"
            )}
          >
            <div className="font-base text-sm text-gray-900 mb-1 max-w-[90%] text-wrap">
              {suggestion.title}
            </div>
            <div className="text-xs text-gray-600">
              {suggestion.description}
            </div>

            <div className='absolute top-2 right-2'>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-move-down-left-icon lucide-move-down-left"><path d="M11 19H5V13"/><path d="M19 5L5 19"/></svg>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
