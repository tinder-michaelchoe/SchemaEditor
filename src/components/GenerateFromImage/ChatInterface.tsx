/**
 * ChatInterface Component
 * Renders chat message history and input field
 */

import React, { useEffect, useRef, useState } from 'react';
import { Send, Loader2, Copy, CheckCircle } from 'lucide-react';
import type { ChatMessage } from '../../types/litellm';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  currentPrompt: string;
  onPromptChange: (prompt: string) => void;
  onSend: () => void;
  isGenerating: boolean;
}

export function ChatInterface({
  messages,
  currentPrompt,
  onPromptChange,
  onSend,
  isGenerating,
}: ChatInterfaceProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [currentPrompt]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (currentPrompt.trim() && !isGenerating) {
        onSend();
      }
    }
  };

  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleCopyError = (errorDetails: string, index: number) => {
    navigator.clipboard.writeText(errorDetails);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="chat-interface flex flex-col h-full">
      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <p className="text-sm">Start by describing the UI you want to create</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`
                flex
                ${message.role === 'user' ? 'justify-end' : message.role === 'system' ? 'justify-center' : 'justify-start'}
              `}
            >
              <div
                className={`
                  max-w-[80%] rounded-lg px-4 py-2
                  ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : message.role === 'system'
                      ? message.isError
                        ? 'bg-red-100 text-red-900 text-sm'
                        : 'bg-yellow-100 text-yellow-900 text-sm'
                      : 'bg-gray-200 text-gray-900'
                  }
                `}
              >
                <div className="whitespace-pre-wrap break-words">
                  {message.content}
                </div>
                {message.isError && message.errorDetails && (
                  <div className="mt-2 pt-2 border-t border-red-300">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-semibold">Full Error Details:</div>
                      <button
                        onClick={() => handleCopyError(message.errorDetails!, index)}
                        className="flex items-center gap-1 px-2 py-1 bg-red-200 hover:bg-red-300 rounded text-xs transition-colors"
                        title="Copy error details"
                      >
                        {copiedIndex === index ? (
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
                    <div className="text-xs font-mono bg-red-50 p-2 rounded overflow-auto max-h-32">
                      {message.errorDetails}
                    </div>
                  </div>
                )}
                {message.validationErrors && message.validationErrors.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-300">
                    <div className="text-xs font-semibold text-red-600 mb-1">
                      Validation Errors ({message.validationErrors.length}):
                    </div>
                    <ul className="text-xs space-y-1">
                      {message.validationErrors.slice(0, 3).map((error, i) => (
                        <li key={i} className="text-red-600">• {error}</li>
                      ))}
                      {message.validationErrors.length > 3 && (
                        <li className="text-red-600">
                          ... and {message.validationErrors.length - 3} more
                        </li>
                      )}
                    </ul>
                  </div>
                )}
                <div
                  className={`
                    text-xs mt-1 opacity-70
                    ${message.role === 'user' ? 'text-right' : 'text-left'}
                  `}
                  title={formatTimestamp(message.timestamp)}
                >
                  {formatTimestamp(message.timestamp)}
                </div>
              </div>
            </div>
          ))
        )}
        {isGenerating && (
          <div className="flex justify-start">
            <div className="bg-gray-200 text-gray-900 rounded-lg px-4 py-2 flex items-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Generating...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-end space-x-2">
          <textarea
            ref={textareaRef}
            value={currentPrompt}
            onChange={(e) => onPromptChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe the UI you want to create..."
            disabled={isGenerating}
            className="
              flex-1 px-3 py-2 border border-gray-300 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500
              resize-none min-h-[40px] max-h-[120px]
              disabled:bg-gray-100 disabled:cursor-not-allowed
            "
            rows={1}
          />
          <button
            onClick={onSend}
            disabled={!currentPrompt.trim() || isGenerating}
            className="
              px-4 py-2 bg-blue-500 text-white rounded-lg
              hover:bg-blue-600 transition-colors
              disabled:bg-gray-300 disabled:cursor-not-allowed
              flex items-center space-x-2
            "
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
        <div className="mt-1 text-xs text-gray-500">
          Press Enter to send, Shift+Enter for new line
          {currentPrompt.length > 0 && ` • ${currentPrompt.length} characters`}
        </div>
      </div>
    </div>
  );
}
