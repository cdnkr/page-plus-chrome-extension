import { useCallback } from 'react';
import { IContextItem, IConversationMessage } from '../types/conversation';
import { createToolRegistry } from '../utils/toolRegistry';
import { useToolSelection } from './useToolSelection';
import { AiProvider } from '../types/aiProvider';
import { useI18n } from './useI18n';

export const useToolsExecution = (aiProvider: AiProvider) => {
  const { selectTool } = useToolSelection(aiProvider);
  const { t } = useI18n();

  const executeWithTools = useCallback(async (
    query: string,
    contextItems: IContextItem[],
    onChunk: (chunk: string) => void,
    currentConversation?: IConversationMessage[]
  ): Promise<void> => {
    try {
      // Step 1: Select the appropriate tool
      console.log('Tools Execution: Starting tool selection for query:', query);
      const selectedToolName = await selectTool(query, contextItems, currentConversation);
      console.log('Tools Execution: Selected tool:', selectedToolName);

      // Step 2: Create tool registry with AI provider
      console.log('Tools Execution: Creating tool registry...');
      const toolRegistry = createToolRegistry(aiProvider, t);
      console.log('Tools Execution: Available tools:', Object.keys(toolRegistry));
      
      // Step 3: Get the tool function
      const toolFunction = toolRegistry[selectedToolName];
      if (!toolFunction) {
        console.warn(`Tools Execution: Tool ${selectedToolName} not found, falling back to query tool`);
        console.warn(`Tools Execution: Available tools are:`, Object.keys(toolRegistry));
        console.warn(`Tools Execution: Looking for:`, selectedToolName);
        return toolRegistry.query(query, contextItems, onChunk, currentConversation);
      }

      // Step 4: Execute the selected tool
      console.log(`Tools Execution: Executing tool: ${selectedToolName}`);
      return toolFunction(query, contextItems, onChunk, currentConversation);

    } catch (error) {
      console.error('Tools Execution: Error in tools execution:', error);
      // Fallback to query tool
      const toolRegistry = createToolRegistry(aiProvider, t);
      return toolRegistry.query(query, contextItems, onChunk, currentConversation);
    }
  }, [selectTool, aiProvider]);

  return { executeWithTools };
};
