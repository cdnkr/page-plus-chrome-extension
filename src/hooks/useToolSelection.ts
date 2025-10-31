import { useCallback } from 'react';
import { AiProvider, AiModel } from '../types/aiProvider';
import { IContextItem, IConversationMessage } from '../types/conversation';
import { AVAILABLE_TOOLS } from '../utils/toolRegistry';
import { SUPPORTED_MODELS } from '../constants';

interface WriterAvailability {
  status: 'unavailable' | 'downloadable' | 'downloading' | 'available';
  isReady: boolean;
}

export const useToolSelection = (
  aiProvider: AiProvider,
  writerAvailability?: WriterAvailability | null,
  selectedModel?: AiModel
) => {
  const selectTool = useCallback(async (
    query: string, 
    contextItems: IContextItem[], 
    _currentConversation?: IConversationMessage[]
  ): Promise<string> => {
    // Check if there are any input elements in contextItems
    const hasInputElements = contextItems.some(item => 
      item.elements && item.elements.some(element => {
        // Check if the element is an input or textarea by looking at the HTML
        const html = element.html.toLowerCase();
        return html.includes('<input') || html.includes('<textarea');
      })
    );

    // Check if Writer should be available
    const isWriterAvailable = writerAvailability?.status === 'available' && writerAvailability?.isReady;
    const isNanoSelected = selectedModel === SUPPORTED_MODELS.GEMINI_NANO;
    const shouldShowWriter = isWriterAvailable && isNanoSelected;

    // Filter available tools based on context
    const availableTools = AVAILABLE_TOOLS.filter(tool => {
      if (tool.function === 'fillForm' && !hasInputElements) {
        return false; // Hide fill form tool if no input elements in context
      }
      if (tool.function === 'writerNano' && !shouldShowWriter) {
        return false; // Hide Writer tool if not available or Nano not selected
      }
      return true;
    });

    // Create tool selection prompt
    const toolsJson = JSON.stringify(availableTools, null, 2);
    const availableFunctionNames = availableTools.map(tool => tool.function).join(', ');
    
    const toolSelectionPrompt = `
Available tools:
${toolsJson}

User query: "${query}"

Context items: ${contextItems.length} items available
${hasInputElements ? 'Input elements found in context.' : 'No input elements found in context.'}

Please select the most appropriate tool function name from the available options.
The function names are: ${availableFunctionNames}

IMPORTANT: You must respond with ONLY the tool function name, not the full JSON object. For example, if you want to use the query tool, respond with just "query".`;

    // Use the AI provider to select the tool
    return new Promise((resolve, reject) => {
      console.log('Tool Selection: Sending prompt to AI:', toolSelectionPrompt);
      
      // Try structured output first, fallback to regular output if it fails
      aiProvider.executeToolSelectionStructured(toolSelectionPrompt, contextItems, _currentConversation)
        .then((response) => {
          console.log('Tool Selection: Structured response:', response);
          console.log('Tool Selection: Response type:', typeof response);
          console.log('Tool Selection: Response.toolName:', response.toolName);
          
          // Validate the response structure
          if (!response || typeof response !== 'object') {
            console.error('Tool Selection: Invalid response structure:', response);
            reject(new Error(`Invalid response structure: ${JSON.stringify(response)}`));
            return;
          }
          
          if (!response.toolName || typeof response.toolName !== 'string') {
            console.error('Tool Selection: Missing or invalid toolName:', response.toolName);
            reject(new Error(`Missing or invalid toolName: ${JSON.stringify(response)}`));
            return;
          }
          
          resolve(response.toolName);
        })
        .catch((structuredError) => {
          console.warn('Tool Selection: Structured output failed, trying regular output:', structuredError);
          
          // Fallback to regular tool selection
          aiProvider.executeToolSelection(toolSelectionPrompt, contextItems, _currentConversation)
            .then((textResponse) => {
              console.log('Tool Selection: Regular response:', textResponse);
              
              // Try to parse the response as JSON first
              try {
                const parsed = JSON.parse(textResponse);
                if (parsed.toolName) {
                  console.log('Tool Selection: Extracted toolName from JSON:', parsed.toolName);
                  resolve(parsed.toolName);
                  return;
                }
              } catch (e) {
                // Not JSON, continue with text parsing
              }
              
              // Try to extract tool name from text response
              const toolNameMatch = textResponse.match(/"toolName":\s*"([^"]+)"/);
              if (toolNameMatch) {
                console.log('Tool Selection: Extracted toolName from text:', toolNameMatch[1]);
                resolve(toolNameMatch[1]);
                return;
              }
              
              // Try to match against available tool names
              const cleanResponse = textResponse.toLowerCase().trim();
              const matchedTool = availableTools.find(tool => 
                tool.function.toLowerCase() === cleanResponse ||
                tool.name.toLowerCase() === cleanResponse
              );
              
              if (matchedTool) {
                console.log('Tool Selection: Matched tool from text:', matchedTool.function);
                resolve(matchedTool.function);
                return;
              }
              
              console.warn('Tool Selection: Could not parse tool name, defaulting to query');
              resolve('query');
            })
            .catch((regularError) => {
              console.error('Tool Selection: Both structured and regular failed:', regularError);
              reject(regularError);
            });
        });
    });
  }, [aiProvider, writerAvailability, selectedModel]);

  return { selectTool };
};
