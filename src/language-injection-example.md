// Example of how language injection works in AI prompts

// When user selects Spanish (es), the AI will receive:
const spanishPrompt = `User query: "What is this page about?"

IMPORTANT: Please respond in Spanish (Español). All your responses should be in Spanish (Español) language.`;

// When user selects Japanese (ja), the AI will receive:
const japanesePrompt = `User query: "What is this page about?"

IMPORTANT: Please respond in Japanese (日本語). All your responses should be in Japanese (日本語) language.`;

// When user selects English (en), the AI will receive:
const englishPrompt = `User query: "What is this page about?"

IMPORTANT: Please respond in English. All your responses should be in English language.`;

// This ensures that:
// 1. All AI responses are in the user's selected language
// 2. Both Gemini API and Chrome Prompt API respect the language setting
// 3. The language instruction is automatically appended to every prompt
// 4. Users get a consistent experience regardless of which AI model they use
