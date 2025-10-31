import { PageSuggestionsResponse } from '../types/suggestions';
import { AiModel } from '../types/aiProvider';
import { API_URL, DEFAULT_SUMMARY_MODEL, GENERIC_PAGE_SUGGESTIONS, SUPPORTED_MODELS, USE_GENERIC_SUGGESTIONS } from '../constants';
import { LANGUAGE_NAMES } from '../i18n';

/**
 * Main function to generate page suggestions with model switching
 * This function delegates to the appropriate model-specific implementation
 */
export async function generatePageSuggestions(
  currentPageUrl: string,
  screenshot: string,
  language: 'en' | 'es' | 'ja',
  content?: string,
  model: AiModel = DEFAULT_SUMMARY_MODEL,
): Promise<PageSuggestionsResponse> {
  switch (model) {
    case 'gemini-nano':
      return generatePageSuggestionsWithNano(currentPageUrl, screenshot, language, content);
    case 'gemini-2.5-flash-lite':
      return generatePageSuggestionsWithGemini(currentPageUrl, screenshot, language, content);
    default:
      throw new Error(`Unsupported model: ${model}`);
  }
}

/**
 * Generate page suggestions using Gemini Nano (Chrome Prompt API)
 * This function creates its own session and returns structured suggestions
 */
async function generatePageSuggestionsWithNano(
  currentPageUrl: string,
  screenshot: string,
  language: 'en' | 'es' | 'ja',
  content?: string,
): Promise<PageSuggestionsResponse> {
  if (USE_GENERIC_SUGGESTIONS) return getFallbackSuggestions(language);

  try {
    // Check if Chrome Prompt API is available
    if (!('LanguageModel' in window)) {
      throw new Error('Chrome Prompt API is not available');
    }

    // Check availability
    const availability = await (window as any).LanguageModel.availability({
      expectedInputs: [
        { type: "image", languages: ["en", language] }
      ],
      expectedOutputs: [
        { type: "text", languages: [language] }
      ]
    });
    if (availability !== 'available') {
      throw new Error('Gemini Nano is not available');
    }

    // Create a new session for this request with image input support
    const session = await (window as any).LanguageModel.create({
      expectedInputs: [
        { type: "image", languages: ["en", language] }
      ],
      expectedOutputs: [
        { type: "text", languages: [language] }
      ]
    });

    // Define the JSON schema for structured output
    const schema = {
      "type": "object",
      "properties": {
        "suggestions": {
          "type": "array",
          "minItems": 2,
          "maxItems": 3,
          "items": {
            "type": "object",
            "properties": {
              "title": {
                "type": "string",
                "minLength": 5,
                "maxLength": 50
              },
              "description": {
                "type": "string",
                "minLength": 20,
                "maxLength": 150
              },
              "prompt": {
                "type": "string",
                "minLength": 10,
                "maxLength": 200
              }
            },
            "required": ["title", "description", "prompt"],
            "additionalProperties": false
          }
        }
      },
      "required": ["suggestions"],
      "additionalProperties": false
    };

    // Create the prompt with image or content
    let prompt;
    if (content) {
      // First generate a summary of the content
      const summary = await generateContentSummaryWithNano(currentPageUrl, content, language);
      prompt = createPromptWithContent(currentPageUrl, summary, language);
    } else {
      prompt = createPromptWithImage(currentPageUrl, screenshot);
    }

    // Execute the prompt with structured output
    const result = await session.prompt(prompt, {
      responseConstraint: schema
    });

    // Clean up the session
    await session.destroy();

    // Parse the JSON response
    const parsedResult = JSON.parse(result) as PageSuggestionsResponse;
    
    // Validate the response structure
    if (!parsedResult.suggestions || !Array.isArray(parsedResult.suggestions)) {
      throw new Error('Invalid response format from AI');
    }

    return parsedResult;

  } catch (error) {
    console.error('Failed to generate page suggestions with Gemini Nano:', error);
    return getFallbackSuggestions(language);
  }
}

/**
 * Generate page suggestions using Gemini Pro (Google Generative AI)
 * This function uses the cloud-based Gemini API with structured output
 */
async function generatePageSuggestionsWithGemini(
  currentPageUrl: string,
  screenshot: string,
  language: 'en' | 'es' | 'ja',
  content?: string,
): Promise<PageSuggestionsResponse> {
  if (USE_GENERIC_SUGGESTIONS) return getFallbackSuggestions(language);

  try {
    // Get API base URL from environment
    const apiUrl = API_URL;

    // Create the prompt with image or content for Gemini Pro
    let prompt;
    if (content) {
      prompt = createPromptWithContentForGemini(currentPageUrl, content, language);
    } else {
      prompt = createPromptWithImageForGemini(currentPageUrl, screenshot, language);
    }

    console.log('prompt', prompt);

    // Execute the prompt with structured output
    const response = await fetch(`${apiUrl}/gemini/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: SUPPORTED_MODELS.GEMINI_2_5_FLASH_LITE,
        prompt: prompt,
        stream: false,
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              suggestions: {
                type: "array",
                minItems: 2,
                maxItems: 3,
                items: {
                  type: "object",
                  properties: {
                    title: {
                      type: "string",
                      minLength: 5,
                      maxLength: 50
                    },
                    description: {
                      type: "string",
                      minLength: 20,
                      maxLength: 150
                    },
                    prompt: {
                      type: "string",
                      minLength: 10,
                      maxLength: 200
                    }
                  },
                  required: ["title", "description", "prompt"]
                }
              }
            },
            required: ["suggestions"]
          }
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate page suggestions');
    }

    const result = await response.json();
    let text = result.text;

    if (text.includes('```json')) {
      text = text.replace('```json', '').replace('```', '');
    }
    if (text.includes('```')) {
      text = text.replace('```', '');
    }

    // Parse the JSON response
    const parsedResult = JSON.parse(text) as PageSuggestionsResponse;
    
    // Validate the response structure
    if (!parsedResult.suggestions || !Array.isArray(parsedResult.suggestions)) {
      throw new Error('Invalid response format from AI');
    }

    return parsedResult;

  } catch (error) {
    console.error('Failed to generate page suggestions with Gemini Pro:', error);
    return getFallbackSuggestions(language);
  }
}

/**
 * Create the prompt with image for Gemini Pro API
 */
function createPromptWithImageForGemini(currentPageUrl: string, screenshot: string, language: 'en' | 'es' | 'ja'): any[] {
  // Extract base64 data without the prefix for Gemini Pro API
  const imageData = screenshot.split(',')[1]; // Remove data:image/png;base64, prefix
  
  if (!imageData) {
    throw new Error('Invalid screenshot data format');
  }

  return [
    {
      text: `You are an expert browser assistant. You are assisting a user who is currently on the page ${currentPageUrl}.

Based on the screenshot of this webpage, provide 2-3 suggestions that the user may want to know about the page. Each suggestion should be practical and helpful for understanding or interacting with the page content.

I want the response in the format:

{
    suggestions: [
        {
            title: string,
            description: string,
            prompt: string,
        }
    ]
}

where title and description will be displayed to the user and prompt will be the actual prompt that the system will use along with the page context to execute this suggestion.

Title, description and prompt values must all be in language: ${language}.`
    },
    {
      inlineData: {
        mimeType: 'image/png',
        data: imageData
      }
    }
  ];
}

/**
 * Generate a summary of the page content using Gemini Nano (Chrome Prompt API)
 */
async function generateContentSummaryWithNano(currentPageUrl: string, content: string, language: 'en' | 'es' | 'ja'): Promise<string> {
  try {
    // Check if Chrome Prompt API is available
    if (!('LanguageModel' in window)) {
      throw new Error('Chrome Prompt API is not available');
    }

  // Check availability
  const availability = await (window as any).LanguageModel.availability({
    expectedInputs: [
      { type: "text", languages: language === 'en' ? ['en'] : ['en', language] }
    ],
    expectedOutputs: [
      { type: "text", languages: [language] }
    ],
  });
    if (availability !== 'available') {
      throw new Error('Gemini Nano is not available');
    }

  // Create a new session for summarization
  const session = await (window as any).LanguageModel.create({
    expectedInputs: [
      { type: "text", languages: language === 'en' ? ['en'] : ['en', language] }
    ],
    expectedOutputs: [
      { type: "text", languages: [language] }
    ],
  });

    const summaryPrompt = `Please provide a quick short and concise summary of the following page content from ${currentPageUrl}:

${content}

Focus on the main topics, key information, and purpose of the page. Keep it brief but informative.`;

    const result = await session.prompt(summaryPrompt);
    
    // Clean up the session
    await session.destroy();

    return result;

  } catch (error) {
    console.error('Failed to generate content summary with Gemini Nano:', error);
    return `Summary unavailable for ${currentPageUrl}`;
  }
}

/**
 * Generate a summary of the page content using Gemini Pro API
 */
// async function generateContentSummaryWithGemini(currentPageUrl: string, content: string): Promise<string> {
//   try {
//     // Import GoogleGenerativeAI dynamically
//     const { GoogleGenerativeAI } = await import('@google/generative-ai');
    
//     // Get API key from environment
//     const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
//     if (!apiKey) {
//       throw new Error('Gemini API key not found. Please set VITE_GEMINI_API_KEY in your .env file.');
//     }

//     // Initialize Gemini API
//     const genAI = new GoogleGenerativeAI(apiKey);
//     const model = genAI.getGenerativeModel({ 
//       model: "gemini-2.0-flash-lite"
//     });

//     const summaryPrompt = `Please provide a concise summary of the following page content from ${currentPageUrl}:

// ${content}

// Focus on the main topics, key information, and purpose of the page. Keep it brief but informative.`;

//     const result = await model.generateContent(summaryPrompt);
//     const response = await result.response;
//     const text = response.text();

//     return text;

//   } catch (error) {
//     console.error('Failed to generate content summary with Gemini Pro:', error);
//     return `Summary unavailable for ${currentPageUrl}`;
//   }
// }

/**
 * Create the prompt with content for Chrome Prompt API (Gemini Nano)
 */
function createPromptWithContent(currentPageUrl: string, content: string, language: 'en' | 'es' | 'ja'): any[] {
  return [
    {
      role: 'user',
      content: [
        {
          type: 'text',
          value: `You are an expert browser assistant. You are assisting a user who is currently on the page ${currentPageUrl}.

Page Summary: ${content}

Based on this page content and summary, provide 2-3 suggestions that the user may want to know about the page. Each suggestion should be practical and helpful for understanding or interacting with the page content.

I want the response in the format:

{
    suggestions: [
        {
            title: string,
            description: string,
            prompt: string,
        }
    ]
}

title, description and prompt string values must all be in the language: ${LANGUAGE_NAMES[language as keyof typeof LANGUAGE_NAMES]} (${language?.toUpperCase()}).

where title and description will be displayed to the user and prompt will be the actual prompt that the system will use along with the page context to execute this suggestion.`
        }
      ]
    }
  ];
}

/**
 * Create the prompt with content for Gemini Pro API
 */
function createPromptWithContentForGemini(currentPageUrl: string, content: string, language: 'en' | 'es' | 'ja'): any[] {
  return [
    {
      text: `You are an expert browser assistant. You are assisting a user who is currently on the page ${currentPageUrl}.

Page Content: ${content}

Based on this page content, provide 2-3 suggestions that the user may want to know about the page. Each suggestion should be practical and helpful for understanding the page content.

I want the response in the format:

{
    suggestions: [
        {
            title: string,
            description: string,
            prompt: string,
        }
    ]
}

title, description and prompt string values must all be in the language: ${LANGUAGE_NAMES[language]} (${language?.toUpperCase()}).

where title and description will be displayed to the user and prompt will be the actual prompt that the system will use along with the page context to execute this suggestion.`
    }
  ];
}

/**
 * Create the prompt with image for Chrome Prompt API (Gemini Nano)
 */
function createPromptWithImage(currentPageUrl: string, screenshot: string): any[] {
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

  const imageBlob = convertBase64ToBlob(screenshot);
  
  if (!imageBlob) {
    throw new Error('Failed to convert screenshot to blob format');
  }

  return [
    {
      role: 'user',
      content: [
        {
          type: 'text',
          value: `You are an expert browser assistant. You are assisting a user who is currently on the page ${currentPageUrl}.

Based on the screenshot of this webpage, provide 2-3 suggestions that the user may want to know about the page. Each suggestion should be practical and helpful for understanding or interacting with the page content.

I want the response in the format:

{
    suggestions: [
        {
            title: string,
            description: string,
            prompt: string,
        }
    ]
}

where title and description will be displayed to the user and prompt will be the actual prompt that the system will use along with the page context to execute this suggestion.`
        },
        {
          type: 'image',
          value: imageBlob
        }
      ]
    }
  ];
}

/**
 * Get fallback suggestions when AI generation fails
 */
export function getFallbackSuggestions(language: 'en' | 'es' | 'ja'): PageSuggestionsResponse {
  return {
    suggestions: GENERIC_PAGE_SUGGESTIONS[language]
  };
}
