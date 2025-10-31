import { IContextItem, IConversationMessage } from './conversation';

export type AiModel = 'gemini-nano' | 'gemini-2.5-pro' | 'gemini-2.5-flash-lite';

export interface QuotaUsage {
  current: number;
  quota: number;
  percentage: number;
}

export interface ToolSelectionResponse {
  toolName: string;
}

export interface FormFieldMapping {
  [selector: string]: string;
}

export interface AiProvider {
  availability: {
    status: 'unavailable' | 'downloadable' | 'downloading' | 'available';
    isReady: boolean;
  };
  session: {
    session: any;
    isActive: boolean;
  };
  isLoading: boolean;
  error: string | null;
  downloadProgress?: number;
  
  initializeSession: (conversationHistory?: IConversationMessage[]) => Promise<void>;
  executePrompt: (query: string, contextItems: IContextItem[]) => Promise<string>;
  executePromptStreaming: (query: string, contextItems: IContextItem[], onChunk: (chunk: string) => void) => Promise<void>;
  executeToolSelection: (query: string, contextItems: IContextItem[], currentConversation?: IConversationMessage[]) => Promise<string>;
  executeToolSelectionStructured: (query: string, contextItems: IContextItem[], currentConversation?: IConversationMessage[]) => Promise<ToolSelectionResponse>;
  executeFormFillingStructured: (query: string, contextItems: IContextItem[], inputElements: Array<{selector: string, html: string, css: string}>) => Promise<FormFieldMapping>;
  calculateQuotaUsage: (contextItems: IContextItem[], query: string, conversationHistory?: IConversationMessage[]) => Promise<QuotaUsage>;
  destroySession: () => void;
  checkAvailability?: () => Promise<void>;
  hasCheckedAvailability?: boolean;
}
