export interface PageSuggestion {
  title: string;
  description: string;
  prompt: string;
}

export interface PageSuggestionsResponse {
  suggestions: PageSuggestion[];
}
