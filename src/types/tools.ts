import { IContextItem, IConversationMessage } from './conversation';

export interface Tool {
  name: string;
  description: string;
  function: string;
}

export interface ToolFunction {
  (query: string, contextItems: IContextItem[], onChunk: (chunk: string) => void, currentConversation?: IConversationMessage[]): Promise<void>;
}

export interface ToolRegistry {
  [functionName: string]: ToolFunction;
}

export interface FormElement {
  tag: string;
  type: string;
  name: string;
  id: string;
  placeholder: string;
  label: string;
  selector: string;
  required: boolean;
}

export interface FormElementsResponse {
  success: boolean;
  elementCount: number;
  elements: FormElement[];
  error?: string;
}

export interface FormFillResponse {
  success: boolean;
  filledCount: number;
  message: string;
  error?: string;
}
