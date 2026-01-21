/**
 * GenerateFromImageModal Component
 * Main modal for generating CLADS JSON from images using AI
 */

import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ImageDropZone } from './ImageDropZone';
import { ModelSelector } from './ModelSelector';
import { ChatInterface } from './ChatInterface';
import { PreviewCanvas } from './PreviewCanvas';
import { litellmService } from '@/services/litellm';
import { imageUtils } from '@/services/imageUtils';
import { useEditorStore } from '@/store/editorStore';
import type { ChatMessage } from '@/types/litellm';
import { Copy, CheckCircle } from 'lucide-react';

interface GenerateFromImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadJSON: (json: unknown) => void;
}

/**
 * Helper to find line number for a JSON path
 */
function findLineNumberForPath(json: unknown, path: string): number | null {
  try {
    const jsonString = JSON.stringify(json, null, 2);
    const lines = jsonString.split('\n');

    // Convert path like "root.children.0.text" to a search pattern
    const pathParts = path.split('.');
    let searchKey = pathParts[pathParts.length - 1];

    // If last part is a number, it's an array index - use the parent
    if (!isNaN(Number(searchKey)) && pathParts.length > 1) {
      searchKey = pathParts[pathParts.length - 2];
    }

    // Search for the key in the JSON string
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(`"${searchKey}"`)) {
        return i + 1; // Line numbers are 1-indexed
      }
    }
  } catch (error) {
    console.error('Error finding line number:', error);
  }
  return null;
}

export function GenerateFromImageModal({
  isOpen,
  onClose,
  onLoadJSON,
}: GenerateFromImageModalProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageBase64, setImageBase64] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState('openai/gpt-4o');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentJSON, setCurrentJSON] = useState<unknown>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [errorsCopied, setErrorsCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'json'>('preview');
  const lastValidatedJSON = useRef<unknown>(null);
  const lastErrorSentJSON = useRef<unknown>(null);

  const { setData, errors, isValid } = useEditorStore();

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setImageFile(null);
      setImageBase64('');
      setMessages([]);
      setCurrentPrompt('');
      setCurrentJSON(null);
      setValidationErrors([]);
      setCopied(false);
    }
  }, [isOpen]);

  // Convert image file to base64 when selected
  useEffect(() => {
    if (imageFile) {
      imageUtils.fileToBase64(imageFile).then(setImageBase64).catch((error) => {
        console.error('Failed to convert image to base64:', error);
        addSystemMessage('Failed to process image. Please try again.');
      });
    } else {
      setImageBase64('');
    }
  }, [imageFile]);

  // Validate current JSON whenever it changes
  useEffect(() => {
    if (!currentJSON) {
      setValidationErrors([]);
      lastValidatedJSON.current = null;
      lastErrorSentJSON.current = null;
      return;
    }

    // Validate by setting data in the store (this triggers validation)
    // Only do this if we haven't validated this exact object yet
    if (lastValidatedJSON.current !== currentJSON) {
      console.log('[GenerateFromImageModal] New JSON detected, triggering validation');
      setData(currentJSON);
      lastValidatedJSON.current = currentJSON;
    }

    // Log validation state for debugging
    console.log('[GenerateFromImageModal] Validation state:', {
      isValid,
      errorCount: errors.size,
      errorPaths: Array.from(errors.keys()),
    });

    // Collect all validation errors with detailed path information
    // Filter out cascade errors from oneOf/anyOf schema branching
    const allErrors: string[] = [];
    errors.forEach((errorList, path) => {
      errorList.forEach((error) => {
        // Skip cascade errors from schema branching - these are noise
        // Only show the actual validation failures (additionalProperties, enum, type, etc.)
        if (error.keyword === 'oneOf' || error.keyword === 'anyOf' || error.keyword === 'not' || error.keyword === 'const') {
          return; // Skip these - they're just saying "didn't match this branch"
        }

        // Find approximate line number in JSON
        const lineNum = path ? findLineNumberForPath(currentJSON, path) : null;
        const lineInfo = lineNum ? ` (line ~${lineNum})` : '';

        // Format error with path and line number for better debugging
        const errorMsg = path
          ? `[${path}]${lineInfo} ${error.message} (${error.keyword})`
          : `${error.message} (${error.keyword})`;
        allErrors.push(errorMsg);
      });
    });

    setValidationErrors(allErrors);

    // Pre-fill input with validation errors if there are any
    // Only do this once per JSON object that we haven't sent errors for yet
    if (allErrors.length > 0 && !isGenerating && currentJSON !== lastErrorSentJSON.current) {
      console.log('[GenerateFromImageModal] Pre-filling input with validation errors');

      const errorSummary = allErrors.slice(0, 10).join('\n');
      const more = allErrors.length > 10 ? `\n... and ${allErrors.length - 10} more errors` : '';

      // Pre-fill the input field with the validation error message
      const errorPrompt = `The JSON you generated has ${allErrors.length} validation error${allErrors.length > 1 ? 's' : ''}:

${errorSummary}${more}

Please analyze these errors and generate a corrected version of the JSON that passes validation.`;

      setCurrentPrompt(errorPrompt);

      // Mark this JSON as having errors sent
      lastErrorSentJSON.current = currentJSON;
    } else if (allErrors.length === 0 && lastErrorSentJSON.current === currentJSON) {
      // Clear error marker if errors are now fixed
      lastErrorSentJSON.current = null;
    }
  }, [currentJSON, errors, setData, isGenerating]);

  const addSystemMessage = (content: string) => {
    const message: ChatMessage = {
      role: 'system',
      content,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, message]);
  };

  const handleImageSelect = (file: File) => {
    setImageFile(file);
    addSystemMessage(`Image uploaded: ${file.name}`);
  };

  const handleImageRemove = () => {
    setImageFile(null);
    addSystemMessage('Image removed');
  };

  const handleSend = async () => {
    if (!imageBase64) {
      addSystemMessage('Please upload an image first');
      return;
    }

    if (!currentPrompt.trim()) {
      addSystemMessage('Please enter a description');
      return;
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: currentPrompt.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setCurrentPrompt('');
    setIsGenerating(true);

    try {
      const response = await litellmService.generateFromImage({
        imageBase64,
        prompt: userMessage.content,
        model: selectedModel,
        conversationHistory: messages.filter((m) => m.role !== 'system'),
      });

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: 'JSON generated successfully',
        timestamp: Date.now(),
        generatedJSON: response.json,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setCurrentJSON(response.json);
    } catch (error) {
      console.error('Generation failed:', error);

      // Capture full error details
      let errorMessage = 'Unknown error';
      let errorDetails = '';

      if (error instanceof Error) {
        errorMessage = error.message;
        errorDetails = `Error: ${error.message}\n\nStack:\n${error.stack || 'No stack trace available'}`;

        // If it's a fetch error, add more context
        if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
          errorDetails += `\n\nThis is likely a network or CORS issue. Check:\n`;
          errorDetails += `- Is the LiteLLM server running?\n`;
          errorDetails += `- Is the API URL correct: https://litellmtokengateway.ue1.d1.tstaging.tools\n`;
          errorDetails += `- Is your token valid: ${import.meta.env.VITE_LITELLM_TOKEN ? 'Token is set' : 'Token is missing'}\n`;
          errorDetails += `- Browser console for CORS errors\n`;
        }
      } else if (typeof error === 'object' && error !== null) {
        errorMessage = 'API Error';
        errorDetails = JSON.stringify(error, null, 2);
      } else {
        errorDetails = String(error);
      }

      const errorMessageObj: ChatMessage = {
        role: 'system',
        content: `Generation failed: ${errorMessage}`,
        timestamp: Date.now(),
        isError: true,
        errorDetails,
      };

      setMessages((prev) => [...prev, errorMessageObj]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLoadIntoEditor = () => {
    if (currentJSON && validationErrors.length === 0) {
      onLoadJSON(currentJSON);
      onClose();
    }
  };

  const handleCopyJSON = () => {
    if (currentJSON) {
      navigator.clipboard.writeText(JSON.stringify(currentJSON, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyErrors = () => {
    if (validationErrors.length > 0) {
      const errorText = `Validation Errors (${validationErrors.length}):\n\n${validationErrors.join('\n')}\n\nJSON:\n${JSON.stringify(currentJSON, null, 2)}`;
      navigator.clipboard.writeText(errorText);
      setErrorsCopied(true);
      setTimeout(() => setErrorsCopied(false), 2000);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Generate from Image"
      size="fullscreen"
    >
      <div className="flex h-[calc(90vh-120px)] gap-4">
        {/* Left Panel - Full Height Image Drop Zone */}
        <div className="w-[30%]">
          <ImageDropZone
            imageFile={imageFile}
            onImageSelect={handleImageSelect}
            onImageRemove={handleImageRemove}
            disabled={isGenerating}
          />
        </div>

        {/* Middle Panel - Model Selector + Chat */}
        <div className="w-[35%] flex flex-col gap-3">
          {/* Model Selector */}
          <div className="flex-shrink-0">
            <ModelSelector
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
              disabled={isGenerating}
            />
          </div>

          {/* Chat Interface */}
          <div className="flex-1 border border-gray-300 rounded-lg overflow-hidden">
            <ChatInterface
              messages={messages}
              currentPrompt={currentPrompt}
              onPromptChange={setCurrentPrompt}
              onSend={handleSend}
              isGenerating={isGenerating}
            />
          </div>
        </div>

        {/* Right Panel - Tabbed Preview/JSON View */}
        <div className="w-[35%] flex flex-col gap-2">
          {/* Tab Header */}
          <div className="flex items-center border-b border-gray-300">
            <button
              onClick={() => setActiveTab('preview')}
              className={`
                flex-1 px-4 py-2 text-sm font-medium transition-colors
                ${activeTab === 'preview'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'}
              `}
            >
              Preview
            </button>
            <button
              onClick={() => setActiveTab('json')}
              className={`
                flex-1 px-4 py-2 text-sm font-medium transition-colors
                ${activeTab === 'json'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'}
              `}
            >
              JSON
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 border border-gray-300 rounded-lg overflow-hidden relative">
            {activeTab === 'preview' ? (
              <PreviewCanvas json={currentJSON} />
            ) : (
              currentJSON ? (
                <>
                  {/* Copy button in upper right of JSON view */}
                  <div className="absolute top-2 right-2 z-10">
                    <button
                      onClick={handleCopyJSON}
                      className="flex items-center gap-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs transition-colors shadow-sm"
                      title="Copy JSON"
                    >
                      {copied ? (
                        <>
                          <CheckCircle className="w-3 h-3" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-4 text-xs font-mono h-full overflow-auto">
                    {JSON.stringify(currentJSON, null, 2)}
                  </pre>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                  No JSON generated yet
                </div>
              )
            )}
          </div>

          {/* Validation Status */}
          {currentJSON && (
            <div className="flex-shrink-0 p-3 rounded-lg border">
              {validationErrors.length === 0 ? (
                <div className="text-green-600 text-sm font-medium">
                  ✓ Valid JSON
                </div>
              ) : (
                <div className="text-red-600">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium">
                      ✗ Validation Errors ({validationErrors.length})
                    </div>
                    <button
                      onClick={handleCopyErrors}
                      className="flex items-center gap-1 px-2 py-1 bg-red-100 hover:bg-red-200 rounded text-xs transition-colors"
                      title="Copy all errors with JSON"
                    >
                      {errorsCopied ? (
                        <>
                          <CheckCircle className="w-3 h-3" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy All</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="text-xs max-h-32 overflow-auto space-y-1 font-mono">
                    {validationErrors.slice(0, 5).map((error, i) => (
                      <div key={i} className="whitespace-pre-wrap">• {error}</div>
                    ))}
                    {validationErrors.length > 5 && (
                      <div>... and {validationErrors.length - 5} more</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Load Button */}
          <Button
            variant="primary"
            onClick={handleLoadIntoEditor}
            disabled={!currentJSON || validationErrors.length > 0}
            className="w-full"
          >
            Load into Editor
          </Button>
        </div>
      </div>
    </Modal>
  );
}
