import { useMemo } from 'react';
import { SUPPORTED_MODELS } from '../constants';
import { AiModel, AiProvider } from '../types/aiProvider';
import { IConversationMessage } from '../types/conversation';
import { useGeminiApi } from './useGeminiApi';
import { usePromptApi } from './usePromptApi';

export const useAiProvider = (
  selectedModel: AiModel,
  currentConversation?: IConversationMessage[]
): AiProvider => {
  const promptApi = usePromptApi();
  const geminiApi = useGeminiApi();

  const currentProvider = useMemo((): AiProvider => {
    switch (selectedModel) {
      case SUPPORTED_MODELS.GOOGLE_NANO:
        return promptApi;
      case SUPPORTED_MODELS.GEMINI_2_5_PRO:
        // Create a wrapper for Gemini that includes conversation history
        return {
          ...geminiApi,
          executePromptStreaming: async (query: string, contextItems: any[], onChunk: (chunk: string) => void) => {
            // Call the internal Gemini method with conversation history
            return (geminiApi as any).executePromptStreamingInternal(query, contextItems, onChunk, currentConversation);
          },
          executeToolSelection: async (query: string, contextItems: any[], currentConversation?: IConversationMessage[]) => {
            // Use the conversation history for tool selection
            return geminiApi.executeToolSelection(query, contextItems, currentConversation || []);
          }
        };
      default:
        return promptApi;
    }
  }, [selectedModel, promptApi, geminiApi, currentConversation]);

  return currentProvider;
};
