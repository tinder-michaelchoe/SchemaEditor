/**
 * TypeScript type definitions for LiteLLM API integration
 */

/**
 * Content item in a message - either text or image
 */
export interface MessageContent {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: {
    url: string;
  };
}

/**
 * Message in LiteLLM chat format
 */
export interface LiteLLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | MessageContent[];
}

/**
 * Request payload for LiteLLM chat completions API
 */
export interface LiteLLMRequest {
  model: string;
  messages: LiteLLMMessage[];
  temperature?: number;
  max_tokens?: number;
}

/**
 * Response from LiteLLM chat completions API
 */
export interface LiteLLMResponse {
  id?: string;
  object?: string;
  created?: number;
  model?: string;
  choices: Array<{
    index?: number;
    message: {
      role?: string;
      content: string;
    };
    finish_reason?: string;
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

/**
 * Chat message in the UI
 */
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  generatedJSON?: unknown;
  validationErrors?: string[];
  isError?: boolean;
  errorDetails?: string;
}

/**
 * Request for generating JSON from image
 */
export interface GenerateFromImageRequest {
  imageBase64: string;
  prompt: string;
  model: string;
  conversationHistory?: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number;
    generatedJSON?: unknown;
    validationErrors?: string[];
  }>;
}

/**
 * Response from generate from image
 */
export interface GenerateFromImageResponse {
  json: unknown;
  rawResponse: string;
}

/**
 * Model information
 */
export interface ModelInfo {
  id: string;
  name: string;
  category: 'standard' | 'dynamic';
}
