import { useState, useEffect, useCallback, useRef } from 'react';
import { IContextItem, IConversationMessage } from '../types/conversation';
import { ToolSelectionResponse, FormFieldMapping } from '../types/aiProvider';
import { useLanguage } from '../contexts/LanguageContext';

interface PromptApiAvailability {
  status: 'unavailable' | 'downloadable' | 'downloading' | 'available';
  isReady: boolean;
}

interface PromptApiSession {
  session: any;
  isActive: boolean;
}

interface QuotaUsage {
  current: number;
  quota: number;
  percentage: number;
}

interface UsePromptApiReturn {
  availability: PromptApiAvailability;
  session: PromptApiSession;
  isLoading: boolean;
  error: string | null;
  downloadProgress: number;
  
  // Core functions
  initializeSession: (conversationHistory?: IConversationMessage[]) => Promise<void>;
  executePrompt: (query: string, contextItems: IContextItem[]) => Promise<string>;
  executePromptStreaming: (query: string, contextItems: IContextItem[], onChunk: (chunk: string) => void) => Promise<void>;
  executeToolSelection: (query: string, contextItems: IContextItem[], currentConversation?: IConversationMessage[]) => Promise<string>;
  executeToolSelectionStructured: (query: string, contextItems: IContextItem[], currentConversation?: IConversationMessage[]) => Promise<ToolSelectionResponse>;
  executeFormFillingStructured: (query: string, contextItems: IContextItem[], inputElements: Array<{selector: string, html: string, css: string}>) => Promise<FormFieldMapping>;
  calculateQuotaUsage: (contextItems: IContextItem[], query: string, conversationHistory?: IConversationMessage[]) => Promise<QuotaUsage>;
  destroySession: () => void;
  checkAvailability: () => Promise<void>;
  hasCheckedAvailability: boolean;
}

export const usePromptApi = (): UsePromptApiReturn => {
  const [availability, setAvailability] = useState<PromptApiAvailability>({
    status: 'unavailable',
    isReady: false
  });
  
  const [session, setSession] = useState<PromptApiSession>({
    session: null,
    isActive: false
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [hasCheckedAvailability, setHasCheckedAvailability] = useState(false);
  
  const sessionRef = useRef<any>(null);
  const availabilityRef = useRef<PromptApiAvailability>({ status: 'unavailable', isReady: false });
  const { language } = useLanguage();

  // Check availability on mount
  useEffect(() => {
    checkAvailability();
  }, []);

  const checkAvailability = useCallback(async () => {
    try {
      console.log('Checking Prompt API availability...', {
        window: Boolean(window),
        checking: 'LanguageModel' in window,
      });
      if (!('LanguageModel' in window)) {
        console.log('Prompt API is not available');
        setAvailability({ status: 'unavailable', isReady: false });
        setHasCheckedAvailability(true);
        return;
      }

      const available = await (window as any).LanguageModel.availability();
      setHasCheckedAvailability(true);
      console.log('Prompt API availability:', available);
      const isReady = available === 'available';
      console.log('Prompt API is ready:', isReady);
      
      setAvailability({ status: available, isReady });
    } catch (err) {
      console.error('Error checking Prompt API availability:', err);
      setAvailability({ status: 'unavailable', isReady: false });
      setHasCheckedAvailability(true);
    }
  }, []);

  useEffect(() => {
    if (availabilityRef.current.status !== availability.status) {
      console.log('Availability changed:', availability.status);
      availabilityRef.current = { status: availability.status, isReady: availability.isReady };
    }
  }, [availability.status]);

  const initializeSession = useCallback(async (conversationHistory?: IConversationMessage[]) => {
    if (!availability.isReady && availability.status !== 'downloadable') {
      throw new Error('Prompt API is not available');
    }

    setIsLoading(true);
    setError(null);
    setDownloadProgress(0);

    try {
      // Convert conversation history to the API format
      const initialPrompts = conversationHistory?.map(msg => ({
        role: msg.source === 'user' ? 'user' : 'assistant',
        content: msg.content
      })) || [];

      const newSession = await (window as any).LanguageModel.create({
        initialPrompts, // Load conversation history into the session
        // Configure for multimodal support (text and images)
        expectedInputs: [
          { type: "text", languages: ["en"] },
          { type: "image", languages: ["en"] }
        ],
        expectedOutputs: [
          { type: "text", languages: ["en"] }
        ],
        monitor(m: any) {
          m.addEventListener('downloadprogress', (e: any) => {
            const progress = e.loaded * 100;
            console.log(`Downloaded ${progress}%`);
            setDownloadProgress(progress);
          });
        },
      });

      sessionRef.current = newSession;
      setSession({
        session: newSession,
        isActive: true
      });

      // After successful session creation, re-check availability to update status
      await checkAvailability();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize session';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [availability.isReady, availability.status]);

  const formatContextItems = useCallback((contextItems: IContextItem[]): any[] => {
    return contextItems.map(item => {
      const content: any[] = [];

      // Helper function to convert base64 data URL to Blob
      const convertBase64ToBlob = (dataUrl: string): Blob | null => {
        try {
          const base64Data = dataUrl.split(',')[1]; // Remove data:image/png;base64, prefix
          const binaryString = atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          return new Blob([bytes], { type: 'image/png' });
        } catch (error) {
          console.error('Failed to convert base64 to blob:', error);
          return null;
        }
      };

      // Add text content
      if (item.type === 'text' || item.type === 'page') {
        content.push({
          type: 'text',
          value: `Context Item (${item.type}): ${item.content}`
        });
      }

      // Add image content
      if (item.type === 'image' && item.content) {
        // For image type items, the content itself is the image data
        const blob = convertBase64ToBlob(item.content);
        if (blob) {
          content.push({
            type: 'image',
            value: blob
          });
        }
      } else if (item.screenshot) {
        // For page type items, add the screenshot
        const blob = convertBase64ToBlob(item.screenshot);
        if (blob) {
          content.push({
            type: 'image',
            value: blob
          });
        }
      }

      return {
        role: 'user',
        content
      };
    });
  }, []);

  const getLanguageInstruction = useCallback((): string => {
    const languageNames = {
      en: 'English',
      es: 'Spanish (Español)', 
      ja: 'Japanese (日本語)'
    };
    
    return `\n\nIMPORTANT: Please respond in ${languageNames[language]}. All your responses should be in ${languageNames[language]} language.`;
  }, [language]);

  const executePrompt = useCallback(async (query: string, contextItems: IContextItem[]): Promise<string> => {
    if (!session.session || !session.isActive) {
      throw new Error('Session not initialized');
    }

    try {
      const contextMessages = formatContextItems(contextItems);
      const messages = [
        ...contextMessages,
        {
          role: 'user',
          content: query + getLanguageInstruction()
        }
      ];

      const result = await session.session.prompt(messages);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to execute prompt';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [session.session, session.isActive, formatContextItems, getLanguageInstruction]);

  const executePromptStreaming = useCallback(async (
    query: string, 
    contextItems: IContextItem[], 
    onChunk: (chunk: string) => void
  ): Promise<void> => {
    if (!session.session || !session.isActive) {
      throw new Error('Session not initialized');
    }

    try {
      const contextMessages = formatContextItems(contextItems);
      const messages = [
        ...contextMessages,
        {
          role: 'user',
          content: query + getLanguageInstruction()
        }
      ];

      const stream = session.session.promptStreaming(messages);
      
      for await (const chunk of stream) {
        onChunk(chunk);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to execute streaming prompt';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [session.session, session.isActive, formatContextItems, getLanguageInstruction]);

  const calculateQuotaUsage = useCallback(async (
    contextItems: IContextItem[], 
    query: string,
    conversationHistory?: IConversationMessage[]
  ): Promise<QuotaUsage> => {
    if (!session.session || !session.isActive) {
      throw new Error('Session not initialized');
    }

    try {
      // Check if session is still valid before using it
      if (!session.session.measureInputUsage) {
        throw new Error('Session does not support quota measurement');
      }

      // Build messages array including conversation history
      const historyMessages = conversationHistory?.map(msg => ({
        role: msg.source === 'user' ? 'user' : 'assistant',
        content: msg.content
      })) || [];

      const contextMessages = formatContextItems(contextItems);
      const messages = [
        ...historyMessages, // Include conversation history
        ...contextMessages,
        {
          role: 'user',
          content: query + getLanguageInstruction()
        }
      ];

      const usage = await session.session.measureInputUsage(messages);
      const percentage = (usage / session.session.inputQuota) * 100;
      
      return {
        current: usage,
        quota: session.session.inputQuota,
        percentage: percentage
      };
    } catch (err) {
      // If session is destroyed or invalid, return a fallback calculation
      if (err instanceof Error && err.message.includes('destroyed')) {
        console.warn('Session was destroyed during quota calculation, using fallback');
        
        // Fallback: estimate based on text length (rough approximation)
        const historyMessages = conversationHistory?.map(msg => ({
          role: msg.source === 'user' ? 'user' : 'assistant',
          content: msg.content
        })) || [];

        const contextMessages = formatContextItems(contextItems);
        const messages = [
          ...historyMessages,
          ...contextMessages,
          {
            role: 'user',
            content: query + getLanguageInstruction()
          }
        ];

        const totalText = messages.map(msg => 
          typeof msg.content === 'string' ? msg.content : 
          Array.isArray(msg.content) ? msg.content.map((c: any) => c.value || '').join(' ') : ''
        ).join(' ');
        
        // Rough estimation: 1 token ≈ 4 characters
        const estimatedTokens = Math.ceil(totalText.length / 4);
        const quota = 100000; // Default fallback quota
        const percentage = (estimatedTokens / quota) * 100;
        
        return {
          current: estimatedTokens,
          quota,
          percentage: Math.min(percentage, 100)
        };
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to calculate quota usage';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [session.session, session.isActive, formatContextItems, getLanguageInstruction]);

  const executeToolSelection = useCallback(async (
    query: string, 
    contextItems: IContextItem[], 
    _currentConversation?: IConversationMessage[]
  ): Promise<string> => {
    if (!session.session || !session.isActive) {
      throw new Error('Session not initialized');
    }

    try {
      const contextMessages = formatContextItems(contextItems);
      const messages = [
        ...contextMessages,
        {
          role: 'user',
          content: query + getLanguageInstruction()
        }
      ];

      const result = await session.session.prompt(messages);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to execute tool selection';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [session.session, session.isActive, formatContextItems, getLanguageInstruction]);

  const executeToolSelectionStructured = useCallback(async (
    query: string, 
    contextItems: IContextItem[], 
    _currentConversation?: IConversationMessage[]
  ): Promise<ToolSelectionResponse> => {
    if (!session.session || !session.isActive) {
      throw new Error('Session not initialized');
    }

    try {
      const toolSelectionSession = await (window as any).LanguageModel.create({
        initialPrompts: [],
        expectedInputs: [
          { type: "text", languages: ["en"] }
        ],
        expectedOutputs: [
          { type: "text", languages: ["en"] }
        ]
      });

      const contextMessages = formatContextItems(contextItems);
      const messages = [
        ...contextMessages,
        {
          role: 'user',
          content: query + getLanguageInstruction()
        }
      ];

      // Define the JSON Schema for structured output
      const schema = {
        "type": "object",
        "properties": {
          "toolName": {
            "type": "string",
            "enum": ["query", "fillForm", "getCodeFromElementOnPage", "analyzeImageColors", "summarize", "summarizerNano", "writerNano", "getPageImages"]
          }
        },
        "required": ["toolName"],
        "additionalProperties": false
      };

      const result = await toolSelectionSession.prompt(messages, {
        responseConstraint: schema
      });
      
      console.log('🔧 Prompt API: Raw structured response:', result);
      console.log('🔧 Prompt API: Response type:', typeof result);
      
      // Parse the structured response
      try {
        const parsed = JSON.parse(result);
        console.log('🔧 Prompt API: Parsed response:', parsed);
        return parsed;
      } catch (parseError) {
        console.error('🔧 Prompt API: JSON parse error:', parseError);
        console.error('🔧 Prompt API: Raw result that failed to parse:', result);
        
        // If parsing fails, try to extract the tool name manually
        const toolNameMatch = result.match(/"toolName":\s*"([^"]+)"/);
        if (toolNameMatch) {
          console.log('🔧 Prompt API: Extracted tool name from failed parse:', toolNameMatch[1]);
          return { toolName: toolNameMatch[1] };
        }
        
        throw new Error(`Failed to parse structured response: ${result}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to execute structured tool selection';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [session.session, session.isActive, formatContextItems, getLanguageInstruction]);

  const executeFormFillingStructured = useCallback(async (
    query: string, 
    contextItems: IContextItem[], 
    inputElements: Array<{selector: string, html: string, css: string}>
  ): Promise<FormFieldMapping> => {
    if (!session.session || !session.isActive) {
      throw new Error('Session not initialized');
    }

    try {
      const contextMessages = formatContextItems(contextItems);
      
      // Create the form filling prompt
      const formFillingPrompt = `
You are an intelligent form filling assistant. Generate realistic, professional values for the following input elements based on their field types and context.

Input elements found:
${JSON.stringify(inputElements.map(element => ({
  selector: element.selector,
  html: element.html,
  css: element.css
})), null, 2)}

${query ? `\n\nUser request: ${query}` : ''}

Instructions:
- Analyze each input element's HTML structure, attributes, and surrounding context to understand its purpose
- Look for: name, id, type, placeholder, label text, aria-label, title attributes, and surrounding text
- Consider the form's overall context and the field's role within it
- Generate realistic, appropriate values that match the field's purpose and context
- ALWAYS generate realistic values that match the field's purpose and context
- NEVER use placeholder text, "test", "sample", or obvious dummy values
- NEVER copy exact user input unless it's specifically relevant data (like a name or email they provided)
- Create professional, believable content that would be appropriate for the field type
- Use null only for fields where no reasonable value can be generated
- Field-specific guidance:
  * Email fields: Generate realistic email addresses (e.g., "sarah.johnson@techcorp.com")
  * Name fields: Generate realistic names (e.g., "Sarah Johnson", "Michael Chen")
  * Phone fields: Generate valid phone numbers in appropriate format (e.g., "+1 (555) 123-4567")
  * Address fields: Generate realistic addresses with proper formatting
  * Text areas: Generate meaningful, contextually appropriate content (not just "test" or "sample")
  * Password fields: Generate secure passwords (e.g., "SecurePass123!")
  * Date fields: Generate realistic dates in appropriate format
  * Number fields: Generate realistic numbers within reasonable ranges
- If the user specifically requests certain data to be used, incorporate it intelligently but enhance it

Return a JSON object where:
- Key: the CSS selector of the input element
- Value: the data value to fill in that field (use null if no data available)
`;

      const messages = [
        ...contextMessages,
        {
          role: 'user',
          content: formFillingPrompt
        }
      ];

      // Generate schema based on actual selectors found
      const selectorPatterns = inputElements.map(element => element.selector);
      const schema = {
        "type": "object",
        "properties": Object.fromEntries(
          selectorPatterns.map(selector => [selector, { "type": ["string", "null"] }])
        ),
        "additionalProperties": false
      };

      const result = await session.session.prompt(messages, {
        responseConstraint: schema
      });
      
      // Parse the structured response
      return JSON.parse(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to execute structured form filling';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [session.session, session.isActive, formatContextItems, getLanguageInstruction]);

  const destroySession = useCallback(() => {
    if (sessionRef.current) {
      try {
        sessionRef.current?.destroy();
      } catch (err) {
        console.error('Error destroying session:', err);
      }
      sessionRef.current = null;
    }
    
    setSession({
      session: null,
      isActive: false
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      destroySession();
    };
  }, [destroySession]);

  return {
    availability,
    session,
    isLoading,
    error,
    downloadProgress,
    initializeSession,
    executePrompt,
    executePromptStreaming,
    executeToolSelection,
    executeToolSelectionStructured,
    executeFormFillingStructured,
    calculateQuotaUsage,
    destroySession,
    checkAvailability,
    hasCheckedAvailability
  };
};