import { ToolRegistry, ToolFunction, Tool } from '../types/tools';
import { AiProvider } from '../types/aiProvider';
import { extractInputSelectorsFromHtml } from './formUtils';
import JSZip from 'jszip';

// Available tools configuration
export const AVAILABLE_TOOLS: Tool[] = [
  { name: 'Query', description: 'get an answer to a question about the context', function: 'query' },
  { name: 'Fill Form', description: 'fill out a form with the given data', function: 'fillForm' },
  { name: 'Get Code From Element On Page', description: 'get the code for an element on the page', function: 'getCodeFromElementOnPage' },
  { name: 'Analyze Image Colors', description: 'analyze the colors in the image', function: 'analyzeImageColors' },
  { name: 'Summarize', description: 'summarize the context', function: 'summarize' },
  { name: 'Summarizer (Gemini Nano)', description: 'on-device summarizer (streaming)', function: 'summarizerNano' },
  { name: 'Get Page Images', description: 'extract all images from the current page', function: 'getPageImages' },
];

// Fallback mapping generator for when AI response parsing fails
const generateFallbackMapping = (inputElements: Array<{selector: string, html: string, css: string}>): Record<string, string> => {
  const mapping: Record<string, string> = {};
  
  inputElements.forEach(element => {
    const html = element.html.toLowerCase();
    const selector = element.selector;
    
    // Generate realistic values based on field type and name
    if (html.includes('type="email"') || selector.includes('email') || html.includes('name="email"')) {
      mapping[selector] = 'sarah.johnson@techcorp.com';
    } else if (html.includes('type="text"') && (selector.includes('name') || html.includes('name="name"') || html.includes('placeholder="name"'))) {
      mapping[selector] = 'Sarah Johnson';
    } else if (html.includes('type="tel"') || selector.includes('phone') || html.includes('name="phone"')) {
      mapping[selector] = '+1 (555) 123-4567';
    } else if (html.includes('type="password"') || selector.includes('password')) {
      mapping[selector] = 'SecurePass123!';
    } else if (html.includes('type="date"') || selector.includes('date') || html.includes('name="date"')) {
      mapping[selector] = '1990-05-15';
    } else if (html.includes('type="number"') || selector.includes('age') || html.includes('name="age"')) {
      mapping[selector] = '33';
    } else if (html.includes('<textarea') || selector.includes('message') || selector.includes('comment')) {
      mapping[selector] = 'I am interested in learning more about your services and would like to schedule a consultation.';
    } else if (html.includes('type="text"')) {
      // Generic text field - try to infer from selector or name
      if (selector.includes('address')) {
        mapping[selector] = '123 Main Street, San Francisco, CA 94102';
      } else if (selector.includes('company')) {
        mapping[selector] = 'TechCorp Solutions';
      } else if (selector.includes('city')) {
        mapping[selector] = 'San Francisco';
      } else if (selector.includes('state')) {
        mapping[selector] = 'California';
      } else if (selector.includes('zip')) {
        mapping[selector] = '94102';
      } else {
        mapping[selector] = 'Sample Text';
      }
    }
  });
  
  return mapping;
};

// Create tool registry with AI provider integration
export const createToolRegistry = (aiProvider: AiProvider, t: (path: string, options?: { count?: number }) => string): ToolRegistry => {
  const queryTool: ToolFunction = async (query, contextItems, onChunk, _currentConversation) => {
    console.log('Using Query tool');
    return aiProvider.executePromptStreaming(query, contextItems, onChunk);
  };

  const fillFormTool: ToolFunction = async (query, contextItems, onChunk, _currentConversation) => {
    console.log('FillForm Tool: Starting execution');
    
    try {
      // Simplified, no code block output
      
      // Extract input elements from contextItems using proper selector extraction
      const inputElements: Array<{selector: string, html: string, css: string}> = [];
      contextItems.forEach(item => {
        if (item.elements && item.elements.length > 0) {
          item.elements.forEach(element => {
            const html = element.html.toLowerCase();
            if (html.includes('<input') || html.includes('<textarea')) {
              // Use the utility function to extract proper selectors for input/textarea elements
              const extractedSelectors = extractInputSelectorsFromHtml(element.html);
              
              extractedSelectors.forEach(extracted => {
                inputElements.push({
                  selector: extracted.selector,
                  html: extracted.element,
                  css: element.css
                });
              });
            }
          });
        }
      });

      if (inputElements.length === 0) {
        onChunk(`${t('formTool.noInputElementsFound')}\n`);
        return;
      }

      // Keep analysis silent for simpler UX

      console.log({inputElements});

      // Use AI provider to get field mapping with structured output
      let mapping: Record<string, string> = {};
      try {
        console.log('FillForm Tool: Using structured form filling...');
        mapping = await aiProvider.executeFormFillingStructured(query, contextItems, inputElements);
        console.log('FillForm Tool: Structured AI mapping:', mapping);
        
      } catch (error) {
        console.error('FillForm Tool: Structured AI mapping error:', error);
        onChunk(`${t('formTool.warningCouldNotAnalyze')} ${error instanceof Error ? error.message : t('formTool.unknownError')}\n`);
        
        // Fallback: Generate basic mapping based on field types
        onChunk(`${t('formTool.attemptingFallbackMapping')}\n`);
        mapping = generateFallbackMapping(inputElements);
        console.log('FillForm Tool: Fallback mapping:', mapping);
      }

      // Filter out null values
      const validMapping = Object.fromEntries(
        Object.entries(mapping).filter(([_, value]) => value !== null && value !== '')
      );

      if (Object.keys(validMapping).length === 0) {
        onChunk(`${t('formTool.noSuitableDataFound')}\n`);
        return;
      }

      // Announce total inputs to fill
      const fields = Object.entries(validMapping);
      onChunk(`${fields.length} ${t('formTool.inputFound', { count: fields.length })} ${t('formTool.beenFoundInSelectedArea')}\n\n\n`);
      
      // Stream per-field intent before execution
      // const truncate = (s: string, n = 120) => (s.length > n ? s.slice(0, n - 1) + '…' : s);
      fields.forEach(([_selector, value], idx) => {
        onChunk(`${t('formTool.willBeFilling')} ${fields.length === 1 ? 'the' : ''} ${t('formTool.formField', { count: fields.length })} ${fields.length > 1 ? '#' + (idx + 1) : ''} ${t('formTool.with')} _"${value}"_\n`);
      });

      onChunk(`\n\n`);

      try {
        // Send mapping to content script to fill the form
        const fillResponse = await new Promise<any>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Form filling is taking longer than expected. Please check if the form was filled successfully.'));
          }, 30000); // 30 second timeout
          
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]?.id) {
              chrome.tabs.sendMessage(tabs[0].id, { 
                action: 'fillForm', 
                mapping: validMapping 
              }, (response) => {
                clearTimeout(timeout);
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else if (response && response.error) {
                  reject(new Error(response.error));
                } else {
                  resolve(response);
                }
              });
            } else {
              clearTimeout(timeout);
              reject(new Error('No active tab found'));
            }
          });
        });

        console.log('FillForm Tool: Received fill response:', fillResponse);

        if (fillResponse.success) {
          onChunk(`\n${t('formTool.formFieldsFilledSuccessfully')}\n`);
        } else {
          onChunk(`${t('formTool.errorFillingForm')} ${fillResponse.error || t('formTool.unknownError')}\n`);
        }

      } catch (error) {
        console.error('FillForm Tool: Error:', error);
        onChunk(`${t('formTool.error')} ${error instanceof Error ? error.message : t('formTool.unknownError')}\n`);
      }
    } catch (error) {
      console.error('FillForm Tool: Error:', error);
      onChunk(`Error: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
    }
  };

  const getCodeFromElementOnPageTool: ToolFunction = async (query, contextItems, onChunk) => {
    console.log('Using Get Code From Element On Page tool');
    // For now, just use query tool
    return aiProvider.executePromptStreaming(query, contextItems, onChunk);
  };

  const analyzeImageColorsTool: ToolFunction = async (_query, contextItems, onChunk, _currentConversation) => {
    console.log('AnalyzeImageColors Tool: Starting execution');
    
    try {
      // Helper function to convert RGB to hex
      const rgbToHex = (r: number, g: number, b: number): string => {
        const toHex = (n: number): string => {
          const hex = Math.round(n).toString(16);
          return hex.length === 1 ? '0' + hex : hex;
        };
        return "#" + toHex(r) + toHex(g) + toHex(b);
      };

      // Helper function to analyze image colors
      const analyzeImageColors = async (imageDataUrl: string): Promise<Array<{rgb: string, hex: string}>> => {
        return new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';

          img.onload = () => {
            try {
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');

              if (!ctx) {
                resolve([]);
                return;
              }

              canvas.width = img.width;
              canvas.height = img.height;

              ctx.drawImage(img, 0, 0);

              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const pixels = imageData.data;

              // Sample pixels and count color frequencies
              const colorCounts = new Map();
              const sampleRate = Math.max(1, Math.floor(pixels.length / 4 / 1000)); // Sample every nth pixel

              for (let i = 0; i < pixels.length; i += 4 * sampleRate) {
                const r = pixels[i];
                const g = pixels[i + 1];
                const b = pixels[i + 2];
                const a = pixels[i + 3];

                // Skip transparent pixels
                if (a < 128) continue;

                // Quantize colors to reduce noise
                const quantizedR = Math.min(255, Math.max(0, Math.round(r / 32) * 32));
                const quantizedG = Math.min(255, Math.max(0, Math.round(g / 32) * 32));
                const quantizedB = Math.min(255, Math.max(0, Math.round(b / 32) * 32));

                const colorKey = `${quantizedR},${quantizedG},${quantizedB}`;
                colorCounts.set(colorKey, (colorCounts.get(colorKey) || 0) + 1);
              }

              // Sort by frequency and get top 6 colors
              const sortedColors = Array.from(colorCounts.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 6)
                .map(([colorKey]) => {
                  const [r, g, b] = colorKey.split(',').map(Number);
                  return {
                    rgb: `rgb(${r}, ${g}, ${b})`,
                    hex: rgbToHex(r, g, b)
                  };
                });

              resolve(sortedColors);
            } catch (error) {
              console.error('Error analyzing colors:', error);
              resolve([]);
            }
          };

          img.onerror = () => {
            console.error('Error loading image for color analysis');
            resolve([]);
          };

          img.src = imageDataUrl;
        });
      };

      // First, check for images in contextItems
      const imagesToAnalyze: Array<{name: string, dataUrl: string}> = [];
      
      contextItems.forEach((item, index) => {
        if (item.type === 'image' && item.content) {
          imagesToAnalyze.push({
            name: `Context Image ${index + 1}`,
            dataUrl: item.content
          });
        } else if (item.type === 'page' && item.screenshot) {
          imagesToAnalyze.push({
            name: `Page Screenshot ${index + 1}`,
            dataUrl: item.screenshot
          });
        }
      });

      // If no images in contextItems, get a full page screenshot
      if (imagesToAnalyze.length === 0) {
        onChunk('\nNo images found in context. Taking full page screenshot...\n');
        
        const screenshotResponse = await new Promise<any>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Screenshot capture timeout'));
          }, 15000);
          
          chrome.runtime.sendMessage({ action: 'captureFullPage' }, (response) => {
            clearTimeout(timeout);
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else if (response && response.error) {
              reject(new Error(response.error));
            } else {
              resolve(response);
            }
          });
        });

        if (screenshotResponse.screenshotData) {
          imagesToAnalyze.push({
            name: 'Full Page Screenshot',
            dataUrl: screenshotResponse.screenshotData
          });
        }
      }

      if (imagesToAnalyze.length === 0) {
        onChunk('\nNo images available to analyze.\n');
        return;
      }

      // Analyze colors for each image
      for (let i = 0; i < imagesToAnalyze.length; i++) {
        const imageData = imagesToAnalyze[i];
        
        try {
          const colors = await analyzeImageColors(imageData.dataUrl);
          
          if (colors.length === 0) {
            onChunk('No colors could be analyzed from this image.\n');
          } else {
            onChunk(`\n__PAGEPLUS__TOOL__COLORANALYZER__${colors.map((color) => `${color.hex};${color.rgb}`).join('\n')}`);
          }
        } catch (error) {
          console.error(`Error analyzing ${imageData.name}:`, error);
          onChunk(`Error analyzing ${imageData.name}: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
        }
      }

    } catch (error) {
      console.error('AnalyzeImageColors Tool: Error:', error);
      onChunk(`\n❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}\n\`\`\`\n`);
    }
  };

  const summarizeTool: ToolFunction = async (query, contextItems, onChunk) => {
    console.log('Using Summarize tool');
    // For now, just use query tool
    return aiProvider.executePromptStreaming(query, contextItems, onChunk);
  };

  const summarizerNanoTool: ToolFunction = async (_query, contextItems, onChunk) => {
    console.log('Summarizer (Gemini Nano) Tool: Starting execution');
    try {
      // Gating: require Prompt API (Nano mode) available and Summarizer available
      const nanoAvailable = ('LanguageModel' in window);
      const summarizerApi = (window as any).Summarizer;
      const summarizerAvailable = !!summarizerApi && typeof summarizerApi.availability === 'function' && (await summarizerApi.availability()) === 'available';

      if (!nanoAvailable || !summarizerAvailable) {
        onChunk('Summarizer is not available on this device/browser. Ensure Google Nano mode and Summarizer are enabled.\n');
        return;
      }

      // Collect text from context items
      const activeText = contextItems
        .filter((it: any) => it.isActive !== false)
        .map((it: any) => it.content || '')
        .join('\n\n')
        .trim();

      if (!activeText) {
        onChunk('No text found in context to summarize. Select text or capture the page first.\n');
        return;
      }

      const summarizer = await summarizerApi.create({
        type: 'key-points',
        format: 'markdown',
        length: 'medium',
      });

      const stream = summarizer.summarizeStreaming(activeText);
      for await (const chunk of stream) {
        onChunk(String(chunk));
      }
    } catch (error) {
      console.error('Summarizer (Gemini Nano) Tool: Error:', error);
      onChunk(`\n❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
    }
  };

  const getPageImagesTool: ToolFunction = async (_query, _contextItems, onChunk, _currentConversation) => {
    console.log('GetPageImages Tool: Starting execution');
    
    try {
      // Send message to content script to get images
      console.log('GetPageImages Tool: Sending message to content script');
      const response = await new Promise<any>((resolve, reject) => {
        console.log('GetPageImages Tool: Creating message promise');
        
        // Set a timeout to prevent hanging
        const timeout = setTimeout(() => {
          reject(new Error('Content script response timeout'));
        }, 10000); // 10 second timeout
        
        // Send message to active tab's content script
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]?.id) {
            console.log('GetPageImages Tool: Sending to tab', tabs[0].id);
            chrome.tabs.sendMessage(tabs[0].id, { action: 'getPageImages' }, (response) => {
              clearTimeout(timeout);
              console.log('GetPageImages Tool: Received response from content script:', response);
              if (chrome.runtime.lastError) {
                console.error('GetPageImages Tool: Chrome runtime error:', chrome.runtime.lastError);
                reject(new Error(chrome.runtime.lastError.message));
              } else if (response && response.error) {
                console.error('GetPageImages Tool: Response error:', response.error);
                reject(new Error(response.error));
              } else {
                resolve(response);
              }
            });
          } else {
            clearTimeout(timeout);
            reject(new Error('No active tab found'));
          }
        });
      });

      console.log('GetPageImages Tool: Received response:', response);

      if (!response.success) {
        onChunk(`❌ Error: ${response.error || 'Failed to extract images'}\n\`\`\`\n`);
        return;
      }

      if (response.imageCount === 0) {
        onChunk('No images found on this page.\n\`\`\`\n');
        return;
      }

      // Create zip file
      const zip = new JSZip();
      
      // Add each image to the zip
      for (let i = 0; i < response.images.length; i++) {
        const imageData = response.images[i];
        try {
          // Fetch the blob data
          const blobResponse = await fetch(imageData.blobUrl);
          const blob = await blobResponse.blob();
          
          // Determine file extension from blob type or original URL
          let extension = 'jpg';
          if (blob.type.includes('png')) extension = 'png';
          else if (blob.type.includes('gif')) extension = 'gif';
          else if (blob.type.includes('webp')) extension = 'webp';
          else if (blob.type.includes('svg')) extension = 'svg';
          
          // Create filename
          const filename = `${imageData.alt.replace(/[^a-zA-Z0-9]/g, '_')}_${i + 1}.${extension}`;
          
          // Add to zip
          zip.file(filename, blob);
          
          // Clean up individual blob URL immediately
          URL.revokeObjectURL(imageData.blobUrl);
          
          // onChunk(`Added ${filename} (${imageData.width}x${imageData.height})\n`);
        } catch (error) {
          console.warn(`Failed to add image ${i + 1} to zip:`, error);
          onChunk(`⚠️ Failed to add image ${i + 1}\n`);
        }
      }

      // Generate zip file
      // onChunk('Generating zip file...\n');
      const zipBlob = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });

      // Create download URL
      const zipUrl = URL.createObjectURL(zipBlob);
      
      console.log({zipUrl});
      
      // Calculate file size
      const fileSizeKB = Math.round(zipBlob.size / 1024);
      
      onChunk(`\n__PAGEPLUS__TOOL__IMAGEZIPDOWNLOAD__\n${zipUrl}\nExpires:${new Date(Date.now() + 300000).toISOString()}\nimageCount:${response.imageCount}\nfileSizeKB:${fileSizeKB}`);

      // onChunk(`\nDownload executed.\n`);
      
      // Schedule cleanup of zip URL after 5 minutes
      setTimeout(() => {
        URL.revokeObjectURL(zipUrl);
        console.log('Cleaned up zip URL after 5 minutes');
      }, 300000);

    } catch (error) {
      console.error('GetPageImages Tool: Error:', error);
      onChunk(`\n❌ Error extracting images: ${error instanceof Error ? error.message : 'Unknown error'}\n\`\`\`\n`);
    }
  };

  return {
    query: queryTool,
    fillForm: fillFormTool,
    getCodeFromElementOnPage: getCodeFromElementOnPageTool,
    analyzeImageColors: analyzeImageColorsTool,
    summarize: summarizeTool,
    summarizerNano: summarizerNanoTool,
    getPageImages: getPageImagesTool,
  };
};
