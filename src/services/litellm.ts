/**
 * LiteLLM API integration service
 */

import { promptService } from './promptService';

/**
 * Content item in a message - either text or image
 */
interface MessageContent {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: {
    url: string;
  };
}

/**
 * Message in LiteLLM chat format
 */
interface LiteLLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | MessageContent[];
}

/**
 * Request payload for LiteLLM chat completions API
 */
interface LiteLLMRequest {
  model: string;
  messages: LiteLLMMessage[];
  temperature?: number;
  max_tokens?: number;
}

/**
 * Response from LiteLLM chat completions API
 */
interface LiteLLMResponse {
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
interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  generatedJSON?: unknown;
  validationErrors?: string[];
}

/**
 * Request for generating JSON from image
 */
export interface GenerateFromImageRequest {
  imageBase64: string;
  prompt: string;
  model: string;
  conversationHistory?: ChatMessage[];
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

/**
 * Cached models data
 */
interface CachedModels {
  models: ModelInfo[];
  timestamp: number;
}

// Use proxy in development to avoid CORS issues
const LITELLM_BASE_URL = import.meta.env.DEV ? '/api/litellm' : 'https://litellmtokengateway.ue1.d1.tstaging.tools';
const CHAT_COMPLETIONS_ENDPOINT = '/chat/completions';
const MODELS_ENDPOINT = '/models';
const CACHE_KEY = 'litellm-models-cache';
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Standard vision models that are always available
 */
export const STANDARD_MODELS: ModelInfo[] = [
  { id: 'openai/gpt-4o', name: 'GPT-4o (Recommended)', category: 'standard' },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini (Fast)', category: 'standard' },
  { id: 'openai/gpt-4-vision-preview', name: 'GPT-4 Vision', category: 'standard' },
  { id: 'vertex_ai/gemini-2.5-flash-image', name: 'Gemini 2.5 Flash Image', category: 'standard' },
  { id: 'vertex_ai/gemini-2.0-flash', name: 'Gemini 2.0 Flash', category: 'standard' },
];

/**
 * Gets the API token from environment variables
 */
function getApiToken(): string {
  const token = import.meta.env.VITE_LITELLM_TOKEN;
  if (!token) {
    throw new Error('VITE_LITELLM_TOKEN environment variable is not set');
  }
  return token;
}

/**
 * Extracts JSON from markdown code blocks if present
 */
function extractJSONFromResponse(response: string): string {
  // Try to extract from markdown code block (json, JSON, or no language specified)
  const codeBlockMatch = response.match(/```(?:json|JSON)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }

  // Try to find JSON object by looking for {...}
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return jsonMatch[0].trim();
  }

  // Try to find JSON array by looking for [...]
  const arrayMatch = response.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    return arrayMatch[0].trim();
  }

  // Return as-is if no pattern found
  return response.trim();
}

/**
 * Parses the API response and extracts JSON
 */
function parseResponse(rawResponse: string): unknown {
  console.log('[LiteLLM] Raw response:', rawResponse.substring(0, 200) + '...');

  const extracted = extractJSONFromResponse(rawResponse);
  console.log('[LiteLLM] Extracted JSON:', extracted.substring(0, 200) + '...');

  try {
    return JSON.parse(extracted);
  } catch (error) {
    console.error('[LiteLLM] Failed to parse JSON. Full extracted text:', extracted);
    throw new Error(`Failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown error'}\n\nExtracted text: ${extracted.substring(0, 500)}`);
  }
}

/**
 * Gets the appropriate temperature for a model based on model-specific constraints
 *
 * Known constraints:
 * - GPT-5 models: Only support temperature=1
 * - o1 models: Don't support temperature parameter at all
 * - Most other models: Support temperature range 0-2, default 0.7
 *
 * @param model - The model identifier (e.g., "openai/gpt-5", "openai/o1-preview")
 * @returns The appropriate temperature value for the model
 */
function getModelTemperature(model: string): number | undefined {
  const modelLower = model.toLowerCase();

  // GPT-5 models only support temperature=1
  if (modelLower.includes('gpt-5') || modelLower.includes('gpt5')) {
    return 1;
  }

  // o1 models don't support temperature at all - return undefined to omit it
  if (modelLower.includes('o1-preview') || modelLower.includes('o1-mini') || modelLower.includes('/o1')) {
    return undefined;
  }

  // Default temperature for other models
  return 0.7;
}

/**
 * Converts chat messages to LiteLLM message format
 */
function convertChatMessagesToLiteLLM(
  messages: ChatMessage[],
  imageBase64: string
): LiteLLMMessage[] {
  const result: LiteLLMMessage[] = [];

  for (const msg of messages) {
    if (msg.role === 'user') {
      // User messages may include the image reference
      const isFirstUserMessage = result.filter(m => m.role === 'user').length === 0;

      if (isFirstUserMessage && imageBase64) {
        // First user message includes the image
        result.push({
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: imageBase64 }
            },
            {
              type: 'text',
              text: msg.content
            }
          ]
        });
      } else {
        // Subsequent user messages are text-only
        result.push({
          role: 'user',
          content: msg.content
        });
      }
    } else if (msg.role === 'assistant') {
      result.push({
        role: 'assistant',
        content: msg.content
      });
    }
    // Skip 'system' messages from chat history
  }

  return result;
}

/**
 * Generates CLADS JSON from an image and text prompt using LiteLLM API
 *
 * @param request - The generation request containing image, prompt, model, and conversation history
 * @returns Promise resolving to generated JSON and raw response
 * @throws {Error} If API request fails or response cannot be parsed
 *
 * @example
 * ```typescript
 * const result = await litellmService.generateFromImage({
 *   imageBase64: 'data:image/png;base64,...',
 *   prompt: 'Create a login form',
 *   model: 'openai/gpt-4o',
 *   conversationHistory: []
 * });
 * ```
 */
export async function generateFromImage(
  request: GenerateFromImageRequest
): Promise<GenerateFromImageResponse> {
  const token = getApiToken();
  const systemPrompt = await promptService.readSystemPrompt();

  // Build messages array with system prompt, conversation history, and current prompt
  const messages: LiteLLMMessage[] = [
    {
      role: 'system',
      content: systemPrompt
    }
  ];

  // Add conversation history
  if (request.conversationHistory && request.conversationHistory.length > 0) {
    const historyMessages = convertChatMessagesToLiteLLM(
      request.conversationHistory,
      request.imageBase64
    );
    messages.push(...historyMessages);
  }

  // Add current user message
  const isFirstMessage = !request.conversationHistory || request.conversationHistory.length === 0;
  if (isFirstMessage) {
    // First message includes the image
    messages.push({
      role: 'user',
      content: [
        {
          type: 'image_url',
          image_url: { url: request.imageBase64 }
        },
        {
          type: 'text',
          text: request.prompt
        }
      ]
    });
  } else {
    // Follow-up messages are text-only
    messages.push({
      role: 'user',
      content: request.prompt
    });
  }

  // Build request body with conditional parameters based on model support
  const temperature = getModelTemperature(request.model);
  const requestBody: LiteLLMRequest = {
    model: request.model,
    messages,
    max_tokens: 4096,
    ...(temperature !== undefined && { temperature })
  };

  try {
    const url = `${LITELLM_BASE_URL}${CHAT_COMPLETIONS_ENDPOINT}`;
    console.log('[LiteLLM] Request URL:', url);
    console.log('[LiteLLM] Request model:', request.model);
    console.log('[LiteLLM] Temperature:', temperature !== undefined ? temperature : 'omitted (not supported by model)');
    console.log('[LiteLLM] Token present:', !!token);
    console.log('[LiteLLM] Message count:', messages.length);
    console.log('[LiteLLM] Request body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(url, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(requestBody)
    });

    console.log('[LiteLLM] Response status:', response.status);
    console.log('[LiteLLM] Response ok:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[LiteLLM] Error response:', errorText);

      // Check if error is about unsupported temperature parameter
      const isTemperatureError = errorText.includes('temperature') &&
                                  (errorText.includes('not support') || errorText.includes('don\'t support') || errorText.includes('UnsupportedParamsError'));

      // If it's a temperature error and we included temperature, retry without it
      if (isTemperatureError && requestBody.temperature !== undefined) {
        console.warn('[LiteLLM] Temperature not supported by model, retrying without it...');

        // Retry without temperature
        const retryBody = {
          model: request.model,
          messages,
          max_tokens: 4096
        };

        const retryResponse = await fetch(url, {
          method: 'POST',
          mode: 'cors',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(retryBody)
        });

        if (!retryResponse.ok) {
          const retryErrorText = await retryResponse.text();
          throw new Error(`API request failed: ${retryResponse.status} ${retryResponse.statusText} - ${retryErrorText}`);
        }

        // Use the retry response instead
        const retryData: LiteLLMResponse = await retryResponse.json();
        if (!retryData.choices || retryData.choices.length === 0) {
          throw new Error('No response from API');
        }
        const rawResponse = retryData.choices[0].message.content;
        const json = parseResponse(rawResponse);
        return { json, rawResponse };
      }

      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data: LiteLLMResponse = await response.json();

    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response from API');
    }

    const rawResponse = data.choices[0].message.content;
    const json = parseResponse(rawResponse);

    return {
      json,
      rawResponse
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Unknown error occurred during generation');
  }
}

/**
 * Fetches available models from LiteLLM API
 *
 * @returns Promise resolving to array of model IDs
 * @throws {Error} If API request fails
 */
export async function fetchAvailableModels(): Promise<ModelInfo[]> {
  try {
    const token = getApiToken();

    const response = await fetch(`${LITELLM_BASE_URL}${MODELS_ENDPOINT}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Extract model IDs from response
    const models: ModelInfo[] = [];
    if (data.data && Array.isArray(data.data)) {
      for (const model of data.data) {
        if (model.id) {
          models.push({
            id: model.id,
            name: model.id,
            category: 'dynamic'
          });
        }
      }
    }

    return models;
  } catch (error) {
    console.error('Failed to fetch models from API:', error);
    // Return empty array on error - caller will use standard models
    return [];
  }
}

/**
 * Gets cached models or fetches if cache is expired
 *
 * @returns Promise resolving to array of all available models (standard + dynamic)
 */
export async function getModels(): Promise<ModelInfo[]> {
  try {
    // Check cache
    const cachedData = localStorage.getItem(CACHE_KEY);
    if (cachedData) {
      const cached: CachedModels = JSON.parse(cachedData);
      const now = Date.now();

      // Return cached models if not expired
      if (now - cached.timestamp < CACHE_DURATION) {
        return [...STANDARD_MODELS, ...cached.models];
      }
    }
  } catch (error) {
    console.error('Error reading cache:', error);
  }

  // Fetch fresh models
  try {
    const dynamicModels = await fetchAvailableModels();

    // Filter out models that are already in standard models
    const standardIds = new Set(STANDARD_MODELS.map(m => m.id));
    const uniqueDynamicModels = dynamicModels.filter(m => !standardIds.has(m.id));

    // Cache the dynamic models
    try {
      const cacheData: CachedModels = {
        models: uniqueDynamicModels,
        timestamp: Date.now()
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error writing cache:', error);
    }

    return [...STANDARD_MODELS, ...uniqueDynamicModels];
  } catch (error) {
    console.error('Error fetching models:', error);
    // Return standard models only on error
    return STANDARD_MODELS;
  }
}

/**
 * LiteLLM service for AI-powered JSON generation
 */
export const litellmService = {
  generateFromImage,
  fetchAvailableModels,
  getModels,
};
