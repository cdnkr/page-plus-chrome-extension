import { useState, useEffect, useCallback, useRef } from 'react';
import { IContextItem, IConversationMessage } from '../types/conversation';
import { AiProvider, QuotaUsage, ToolSelectionResponse, FormFieldMapping } from '../types/aiProvider';
import { useLanguage } from '../contexts/LanguageContext';
import { API_URL } from '../constants';

export const useGeminiApi = (): AiProvider & { executePromptStreamingInternal: any, hasCheckedAvailability: boolean } => {
  const [availability, setAvailability] = useState<{
    status: 'unavailable' | 'downloadable' | 'downloading' | 'available';
    isReady: boolean;
  }>({
    status: 'unavailable',
    isReady: false
  });
  
  const [session, setSession] = useState({
    session: null as any,
    isActive: false
  });
  
  const { language } = useLanguage();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const apiBaseUrl = useRef<string>('');

  // Initialize Gemini API
  useEffect(() => {
    const initGemini = async () => {
      try {
        // Get API base URL from environment
        const apiUrl = API_URL;
        
        apiBaseUrl.current = apiUrl;
        
        setAvailability({ status: 'available', isReady: true });
        setError(null);
      } catch (err) {
        console.error('Failed to initialize Gemini API:', err);
        setAvailability({ status: 'unavailable', isReady: false });
        setError('Failed to initialize Gemini API');
      }
    };

    initGemini();
  }, []);


  const initializeSession = useCallback(async (_conversationHistory?: IConversationMessage[]) => {
    if (!availability.isReady || !apiBaseUrl.current) {
      throw new Error('Gemini API is not available');
    }

    setIsLoading(true);
    setError(null);

    try {
      // For the proxy API, we just need to mark the session as active
      setSession({ session: { apiUrl: apiBaseUrl.current }, isActive: true });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize Gemini session';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [availability.isReady]);

  const formatContextItems = useCallback((contextItems: IContextItem[]): any[] => {
    return contextItems.map(item => {
      const parts: any[] = [];

      // Build comprehensive context text
      let contextText = `Context Item (${item.type}): ${item.content}`;
      
      // Add URL if available
      if (item.url) {
        contextText += `\nURL: ${item.url}`;
      }

      // Add elements data (HTML, CSS, selector)
      if (item.elements && item.elements.length > 0) {
        contextText += `\n\nElements (${item.elements.length}):`;
        item.elements.forEach((element, index) => {
          contextText += `\n\nElement ${index + 1}:`;
          contextText += `\nSelector: ${element.selector}`;
          contextText += `\nHTML: ${element.html}`;
          contextText += `\nCSS: ${element.css}`;
        });
      }

      // Add colors data
      if (item.colors && item.colors.length > 0) {
        contextText += `\n\nColors (${item.colors.length}): ${item.colors.join(', ')}`;
      }

      // Add code data if available
      if (item.code && item.code.length > 0) {
        contextText += `\n\nCode Elements (${item.code.length}):`;
        item.code.forEach((codeItem, index) => {
          contextText += `\n\nCode ${index + 1} (${codeItem.type}):`;
          contextText += `\nSelector: ${codeItem.selector}`;
          contextText += `\nHTML: ${codeItem.html}`;
          contextText += `\nCSS: ${codeItem.css}`;
        });
      }

      // Add the comprehensive text content
      parts.push({
        text: contextText
      });

      // Add image content
      if (item.type === 'image' && item.content) {
        // For image type items, the content itself is the image data
        const imageData = item.content.split(',')[1]; // Remove data:image/png;base64, prefix
        parts.push({
          inlineData: {
            mimeType: 'image/png',
            data: imageData
          }
        });
      } else if (item.screenshot) {
        // For page type items, add the screenshot
        const imageData = item.screenshot.split(',')[1]; // Remove data:image/png;base64, prefix
        parts.push({
          inlineData: {
            mimeType: 'image/png',
            data: imageData
          }
        });
      }

      return parts;
    });
  }, []);

  const formatConversationHistory = useCallback((history: IConversationMessage[]): string => {
    if (history.length === 0) return '';
    
    let historyText = 'Previous conversation:\n';
    history.forEach(msg => {
      const role = msg.source === 'user' ? 'User' : 'Assistant';
      historyText += `${role}: ${msg.content}\n`;
    });
    historyText += '\n';
    
    return historyText;
  }, []);

  const getLanguageInstruction = useCallback((): string => {
    const languageNames = {
      en: 'English',
      es: 'Spanish (Español)', 
      ja: 'Japanese (日本語)'
    };
    
    return `\n\nIMPORTANT: Please respond in ${languageNames[language]}. All your responses should be in ${languageNames[language]} language.`;
  }, [language]);

  const executePrompt = useCallback(async (query: string, contextItems: IContextItem[], conversationHistory?: IConversationMessage[]): Promise<string> => {
    if (!session.session || !session.isActive || !apiBaseUrl.current) {
        console.log({
            session: session?.session,
            isActive: session?.isActive,
            apiUrl: apiBaseUrl?.current,
            sessionFull: session
        })
      throw new Error('Gemini session not initialized');
    }

    try {
      const contextParts = formatContextItems(contextItems);
      const historyText = formatConversationHistory(conversationHistory || []);
      
      // Build the full conversation with history, context, and current query
      const allParts = [
        ...contextParts.flat(),
        { text: historyText + query + getLanguageInstruction() }
      ];

      const response = await fetch(`${apiBaseUrl.current}/gemini/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gemini-2.0-flash-exp',
          prompt: allParts,
          stream: false
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to execute Gemini prompt');
      }

      const result = await response.json();
      return result.text;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to execute Gemini prompt';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [session.session, session.isActive, formatContextItems, formatConversationHistory, getLanguageInstruction]);

  const executePromptStreamingInternal = useCallback(async (
    query: string, 
    contextItems: IContextItem[], 
    onChunk: (chunk: string) => void,
    conversationHistory?: IConversationMessage[]
  ): Promise<void> => {
    console.log({session})
    if (!session.session || !session.isActive || !apiBaseUrl.current) {
        console.log({
            session: session?.session,
            isActive: session?.isActive,
            apiUrl: apiBaseUrl?.current,
            sessionFull: session
        })
      throw new Error('Gemini session not initialized');
    }

    try {
      const contextParts = formatContextItems(contextItems);
      const historyText = formatConversationHistory(conversationHistory || []);
      
      // Build the full conversation with history, context, and current query
      const allParts = [
        ...contextParts.flat(),
        { text: historyText + query + getLanguageInstruction() }
      ];

      const response = await fetch(`${apiBaseUrl.current}/gemini/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gemini-2.0-flash-exp',
          prompt: allParts,
          stream: true
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to execute streaming Gemini prompt');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              return;
            }
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                onChunk(parsed.text);
              }
            } catch (e) {
              console.warn('Failed to parse SSE data:', data);
            }
          }
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to execute streaming Gemini prompt';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [session.session, session.isActive, formatContextItems, formatConversationHistory, getLanguageInstruction]);

  const executePromptStreaming = useCallback(async (
    query: string, 
    contextItems: IContextItem[], 
    onChunk: (chunk: string) => void
  ): Promise<void> => {
    // This is a wrapper that doesn't include conversation history
    // The actual implementation with history is in executePromptStreamingInternal
    return executePromptStreamingInternal(query, contextItems, onChunk, []);
  }, [executePromptStreamingInternal]);

  const calculateQuotaUsage = useCallback(async (
    contextItems: IContextItem[], 
    query: string,
    conversationHistory?: IConversationMessage[]
  ): Promise<QuotaUsage> => {
    // Gemini API doesn't provide quota information in the same way as Chrome Prompt API
    // We'll estimate based on text length as a fallback
    try {
      const historyText = conversationHistory?.map(msg => msg.content).join(' ') || '';
      const contextText = contextItems.map(item => item.content).join(' ');
      const totalText = `${historyText} ${contextText} ${query}`;
      
      // Rough estimation: 1 token ≈ 4 characters for Gemini
      const estimatedTokens = Math.ceil(totalText.length / 4);
      const quota = 1000000; // Gemini has much higher limits
      const percentage = (estimatedTokens / quota) * 100;
      
      return {
        current: estimatedTokens,
        quota,
        percentage: Math.min(percentage, 100)
      };
    } catch (err) {
      console.warn('Failed to calculate Gemini quota usage:', err);
      return {
        current: 0,
        quota: 1000000,
        percentage: 0
      };
    }
  }, []);

  const executeToolSelection = useCallback(async (
    query: string, 
    contextItems: IContextItem[], 
    currentConversation?: IConversationMessage[]
  ): Promise<string> => {
    if (!session.session || !session.isActive || !apiBaseUrl.current) {
      throw new Error('Gemini session not initialized');
    }

    try {
      const contextParts = formatContextItems(contextItems);
      const historyText = formatConversationHistory(currentConversation || []);
      
      // Build the full conversation with history, context, and current query
      const allParts = [
        ...contextParts.flat(),
        { text: historyText + query + getLanguageInstruction() }
      ];

      const response = await fetch(`${apiBaseUrl.current}/gemini/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gemini-2.0-flash-exp',
          prompt: allParts,
          stream: false
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to execute Gemini tool selection');
      }

      const result = await response.json();
      return result.text;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to execute Gemini tool selection';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [session.session, session.isActive, formatContextItems, formatConversationHistory, getLanguageInstruction]);

  const executeToolSelectionStructured = useCallback(async (
    query: string, 
    contextItems: IContextItem[], 
    _currentConversation?: IConversationMessage[]
  ): Promise<ToolSelectionResponse> => {
    // Gemini doesn't support structured output, fallback to text parsing
    const result = await executeToolSelection(query, contextItems, _currentConversation);
    const toolName = result.trim().toLowerCase();
    
    // Map common variations to correct tool names
    const toolNameMap: { [key: string]: string } = {
      'getpageimages': 'getPageImages',
      'fillform': 'fillForm',
      'getcodefromelementonpage': 'getCodeFromElementOnPage',
      'analyzeimagecolors': 'analyzeImageColors',
      'summarize': 'summarize',
      'query': 'query'
    };
    
    return { toolName: toolNameMap[toolName] || toolName };
  }, [executeToolSelection]);

  const executeFormFillingStructured = useCallback(async (
    query: string, 
    contextItems: IContextItem[], 
    inputElements: Array<{selector: string, html: string, css: string}>
  ): Promise<FormFieldMapping> => {
    // Gemini doesn't support structured output, fallback to text parsing
    const prompt = `Generate realistic form field values for these input elements: ${JSON.stringify(inputElements.map(e => e.selector))}. ${query ? `User request: ${query}` : ''} Return JSON with selector as key and value as string.${getLanguageInstruction()}`;
    const result = await executePrompt(prompt, contextItems);
    
    try {
      return JSON.parse(result);
    } catch {
      console.log('Failed to parse JSON from Gemini response:', result);
      // Fallback to basic mapping
      const mapping: FormFieldMapping = {};
      inputElements.forEach(element => {
        const html = element.html.toLowerCase();
        if (html.includes('type="email"')) mapping[element.selector] = 'user@example.com';
        else if (html.includes('type="text"')) mapping[element.selector] = 'Sample Text';
        else if (html.includes('<textarea')) mapping[element.selector] = 'Sample message';
      });
      return mapping;
    }
  }, [executePrompt, getLanguageInstruction]);

  const destroySession = useCallback(() => {
    setSession({ session: null, isActive: false });
  }, []);

  return {
    availability,
    session,
    isLoading,
    error,
    downloadProgress: 0, // Gemini doesn't need download progress
    initializeSession,
    executePrompt,
    executePromptStreaming,
    executeToolSelection,
    executeToolSelectionStructured,
    executeFormFillingStructured,
    calculateQuotaUsage,
    destroySession,
    checkAvailability: undefined, // Gemini doesn't need availability checking
    // Internal method for use by useAiProvider
    executePromptStreamingInternal,
    hasCheckedAvailability: true
  };
};
