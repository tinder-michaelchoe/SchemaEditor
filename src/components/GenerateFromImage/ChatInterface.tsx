/**
 * ChatInterface Component
 * Renders chat message history and input field
 */

import React, { useEffect, useRef, useState } from 'react';
import { Send, Loader2, Copy, CheckCircle } from 'lucide-react';
import styled, { css } from 'styled-components';
import { spin } from '@/styles/mixins';
import type { ChatMessage } from '../../types/litellm';

/* ------------------------------------------------------------------ */
/*  Styled Components                                                  */
/* ------------------------------------------------------------------ */

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const MessagesList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const EmptyState = styled.div`
  text-align: center;
  color: ${p => p.theme.colors.textTertiary};
  padding: 32px 0;
`;

const EmptyText = styled.p`
  font-size: ${p => p.theme.fontSizes.sm};
`;

const MessageRow = styled.div<{ $role: string }>`
  display: flex;
  ${p =>
    p.$role === 'user'
      ? css`justify-content: flex-end;`
      : p.$role === 'system'
      ? css`justify-content: center;`
      : css`justify-content: flex-start;`}
`;

const MessageBubble = styled.div<{ $role: string; $isError?: boolean }>`
  max-width: 80%;
  border-radius: 8px;
  padding: 8px 16px;

  ${p =>
    p.$role === 'user'
      ? css`
          background: #3b82f6;
          color: #ffffff;
        `
      : p.$role === 'system'
      ? p.$isError
        ? css`
            background: #fee2e2;
            color: #7f1d1d;
            font-size: ${p.theme.fontSizes.sm};
          `
        : css`
            background: #fef9c3;
            color: #713f12;
            font-size: ${p.theme.fontSizes.sm};
          `
      : css`
          background: ${p.theme.colors.bgTertiary};
          color: ${p.theme.colors.textPrimary};
        `}
`;

const MessageContent = styled.div`
  white-space: pre-wrap;
  word-wrap: break-word;
`;

const ErrorDetailsSection = styled.div`
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #fca5a5;
`;

const ErrorDetailsHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
`;

const ErrorDetailsLabel = styled.div`
  font-size: ${p => p.theme.fontSizes.xs};
  font-weight: 600;
`;

const CopyErrorButton = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: #fecaca;
  border-radius: 4px;
  font-size: ${p => p.theme.fontSizes.xs};
  transition: background-color 0.15s;
  border: none;
  cursor: pointer;

  &:hover {
    background: #fca5a5;
  }
`;

const ErrorDetailsBlock = styled.div`
  font-size: ${p => p.theme.fontSizes.xs};
  font-family: ${p => p.theme.fonts.mono};
  background: #fef2f2;
  padding: 8px;
  border-radius: 4px;
  overflow: auto;
  max-height: 128px;
`;

const ValidationSection = styled.div`
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid ${p => p.theme.colors.border};
`;

const ValidationTitle = styled.div`
  font-size: ${p => p.theme.fontSizes.xs};
  font-weight: 600;
  color: #ef4444;
  margin-bottom: 4px;
`;

const ValidationList = styled.ul`
  font-size: ${p => p.theme.fontSizes.xs};
  display: flex;
  flex-direction: column;
  gap: 4px;
  list-style: none;
  padding: 0;
  margin: 0;
`;

const ValidationItem = styled.li`
  color: #ef4444;
`;

const Timestamp = styled.div<{ $role: string }>`
  font-size: ${p => p.theme.fontSizes.xs};
  margin-top: 4px;
  opacity: 0.7;
  text-align: ${p => (p.$role === 'user' ? 'right' : 'left')};
`;

const GeneratingRow = styled.div`
  display: flex;
  justify-content: flex-start;
`;

const GeneratingBubble = styled.div`
  background: ${p => p.theme.colors.bgTertiary};
  color: ${p => p.theme.colors.textPrimary};
  border-radius: 8px;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SpinningLoader = styled(Loader2)`
  animation: ${spin} 1s linear infinite;
`;

const GeneratingText = styled.span`
  font-size: ${p => p.theme.fontSizes.sm};
`;

const InputArea = styled.div`
  border-top: 1px solid ${p => p.theme.colors.border};
  padding: 16px;
`;

const InputRow = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 8px;
`;

const StyledTextarea = styled.textarea`
  flex: 1;
  padding: 8px 12px;
  border: 1px solid ${p => p.theme.colors.border};
  border-radius: 8px;
  resize: none;
  min-height: 40px;
  max-height: 120px;
  background: ${p => p.theme.colors.bgPrimary};
  color: ${p => p.theme.colors.textPrimary};
  font-family: inherit;

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${p => p.theme.colors.accent};
  }

  &:disabled {
    background: ${p => p.theme.colors.bgSecondary};
    cursor: not-allowed;
  }
`;

const SendButton = styled.button`
  padding: 8px 16px;
  background: #3b82f6;
  color: #ffffff;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background-color 0.15s;

  &:hover {
    background: #2563eb;
  }

  &:disabled {
    background: ${p => p.theme.colors.bgTertiary};
    cursor: not-allowed;
  }
`;

const HintText = styled.div`
  margin-top: 4px;
  font-size: ${p => p.theme.fontSizes.xs};
  color: ${p => p.theme.colors.textSecondary};
`;

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

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
    <Container>
      {/* Messages List */}
      <MessagesList>
        {messages.length === 0 ? (
          <EmptyState>
            <EmptyText>Start by describing the UI you want to create</EmptyText>
          </EmptyState>
        ) : (
          messages.map((message, index) => (
            <MessageRow key={index} $role={message.role}>
              <MessageBubble $role={message.role} $isError={message.isError}>
                <MessageContent>
                  {message.content}
                </MessageContent>
                {message.isError && message.errorDetails && (
                  <ErrorDetailsSection>
                    <ErrorDetailsHeader>
                      <ErrorDetailsLabel>Full Error Details:</ErrorDetailsLabel>
                      <CopyErrorButton
                        onClick={() => handleCopyError(message.errorDetails!, index)}
                        title="Copy error details"
                      >
                        {copiedIndex === index ? (
                          <>
                            <CheckCircle size={12} />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy size={12} />
                            <span>Copy</span>
                          </>
                        )}
                      </CopyErrorButton>
                    </ErrorDetailsHeader>
                    <ErrorDetailsBlock>
                      {message.errorDetails}
                    </ErrorDetailsBlock>
                  </ErrorDetailsSection>
                )}
                {message.validationErrors && message.validationErrors.length > 0 && (
                  <ValidationSection>
                    <ValidationTitle>
                      Validation Errors ({message.validationErrors.length}):
                    </ValidationTitle>
                    <ValidationList>
                      {message.validationErrors.slice(0, 3).map((error, i) => (
                        <ValidationItem key={i}>&bull; {error}</ValidationItem>
                      ))}
                      {message.validationErrors.length > 3 && (
                        <ValidationItem>
                          ... and {message.validationErrors.length - 3} more
                        </ValidationItem>
                      )}
                    </ValidationList>
                  </ValidationSection>
                )}
                <Timestamp $role={message.role} title={formatTimestamp(message.timestamp)}>
                  {formatTimestamp(message.timestamp)}
                </Timestamp>
              </MessageBubble>
            </MessageRow>
          ))
        )}
        {isGenerating && (
          <GeneratingRow>
            <GeneratingBubble>
              <SpinningLoader size={16} />
              <GeneratingText>Generating...</GeneratingText>
            </GeneratingBubble>
          </GeneratingRow>
        )}
        <div ref={messagesEndRef} />
      </MessagesList>

      {/* Input Area */}
      <InputArea>
        <InputRow>
          <StyledTextarea
            ref={textareaRef}
            value={currentPrompt}
            onChange={(e) => onPromptChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe the UI you want to create..."
            disabled={isGenerating}
            rows={1}
          />
          <SendButton
            onClick={onSend}
            disabled={!currentPrompt.trim() || isGenerating}
          >
            {isGenerating ? (
              <SpinningLoader size={16} />
            ) : (
              <Send size={16} />
            )}
          </SendButton>
        </InputRow>
        <HintText>
          Press Enter to send, Shift+Enter for new line
          {currentPrompt.length > 0 && ` \u2022 ${currentPrompt.length} characters`}
        </HintText>
      </InputArea>
    </Container>
  );
}
