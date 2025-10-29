import { AiModel } from "./types/aiProvider"

export const SUPPORTED_MODELS: { [key: string]: AiModel } = {
  GEMINI_2_5_PRO: 'gemini-2.5-pro',
  GEMINI_2_5_FLASH_LITE: 'gemini-2.5-flash-lite',
  GOOGLE_NANO: 'google-nano'
}

export const CONTEXT_CHAR_DISPLAY_LIMIT = 80
export const SHOW_SUGGESTIONS = true
export const USE_GENERIC_SUGGESTIONS = false
export const DEFAULT_SUMMARY_MODEL: AiModel = SUPPORTED_MODELS.GEMINI_2_5_FLASH_LITE
export const TEXTAREA_PER_ROW = 45
export const CONVERSATION_COMPONENT_PREFIX = '__PAGEPLUS__'
export const API_URL = 'https://api-holy-frog-5486.fly.dev'
