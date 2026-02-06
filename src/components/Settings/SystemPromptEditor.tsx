/**
 * SystemPromptEditor Component
 * Editor for the system prompt used in AI generation
 */

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Button } from '@/components/ui/Button';
import { promptService } from '@/services/promptService';
import { Save, RotateCcw, CheckCircle, AlertCircle } from 'lucide-react';

/* ── Styled Components ── */

const LoadingWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 16rem;
`;

const LoadingText = styled.div`
  color: ${p => p.theme.colors.textSecondary};
`;

const EditorContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const Header = styled.div`
  margin-bottom: 1rem;
`;

const Title = styled.h3`
  font-size: ${p => p.theme.fontSizes.lg};
  font-weight: 600;
  margin: 0 0 0.5rem;
  color: ${p => p.theme.colors.textPrimary};
`;

const Description = styled.p`
  font-size: ${p => p.theme.fontSizes.sm};
  color: ${p => p.theme.colors.textSecondary};
  margin: 0;
`;

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
`;

const ToolbarActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const StatusInfo = styled.div`
  font-size: ${p => p.theme.fontSizes.xs};
  color: ${p => p.theme.colors.textSecondary};
`;

const UnsavedLabel = styled.span`
  color: ${p => p.theme.colors.warning};
  font-weight: 500;
  margin-right: 0.5rem;
`;

const StatusMessage = styled.div<{ $variant: 'error' | 'success' }>`
  margin-bottom: 0.5rem;
  padding: 0.5rem;
  border-radius: ${p => p.theme.radii.md};
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: ${p => p.theme.fontSizes.sm};

  background: ${p => p.$variant === 'error' ? `${p.theme.colors.error}1a` : `${p.theme.colors.success}1a`};
  border: 1px solid ${p => p.$variant === 'error' ? `${p.theme.colors.error}40` : `${p.theme.colors.success}40`};
  color: ${p => p.$variant === 'error' ? p.theme.colors.error : p.theme.colors.success};
`;

const EditorBorder = styled.div`
  flex: 1;
  border: 1px solid ${p => p.theme.colors.border};
  border-radius: ${p => p.theme.radii.lg};
  overflow: hidden;
`;

const TextArea = styled.textarea`
  width: 100%;
  height: 100%;
  padding: 1rem;
  font-family: ${p => p.theme.fonts.mono};
  font-size: ${p => p.theme.fontSizes.sm};
  resize: none;
  border: none;
  outline: none;
  background: ${p => p.theme.colors.bgPrimary};
  color: ${p => p.theme.colors.textPrimary};
`;

const Stats = styled.div`
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: ${p => p.theme.fontSizes.xs};
  color: ${p => p.theme.colors.textSecondary};
`;

const HelpBox = styled.div`
  margin-top: 1rem;
  padding: 0.75rem;
  background: ${p => p.theme.colors.accent}0d;
  border: 1px solid ${p => p.theme.colors.accent}33;
  border-radius: ${p => p.theme.radii.md};
  font-size: ${p => p.theme.fontSizes.sm};
`;

const HelpTitle = styled.div`
  font-weight: 500;
  color: ${p => p.theme.colors.accent};
  margin-bottom: 0.25rem;
`;

const HelpList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: ${p => p.theme.fontSizes.xs};
  color: ${p => p.theme.colors.textSecondary};
`;

/* ── Component ── */

export function SystemPromptEditor() {
  const [content, setContent] = useState('');
  const [savedContent, setSavedContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Load prompt on mount
  useEffect(() => {
    loadPrompt();
  }, []);

  const loadPrompt = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const prompt = await promptService.readSystemPrompt();
      setContent(prompt);
      setSavedContent(prompt);
    } catch (err) {
      setError('Failed to load system prompt');
      console.error('Failed to load prompt:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setShowSuccess(false);
    try {
      await promptService.writeSystemPrompt(content);
      setSavedContent(content);
      setLastSaved(new Date());
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      setError('Failed to save system prompt');
      console.error('Failed to save prompt:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (confirm('Are you sure you want to reset to the default system prompt? This cannot be undone.')) {
      const defaultPrompt = promptService.getDefaultSystemPrompt();
      setContent(defaultPrompt);
      try {
        await promptService.writeSystemPrompt(defaultPrompt);
        setSavedContent(defaultPrompt);
        setLastSaved(new Date());
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } catch (err) {
        setError('Failed to reset system prompt');
        console.error('Failed to reset prompt:', err);
      }
    }
  };

  const hasUnsavedChanges = content !== savedContent;
  const wordCount = content.trim().split(/\s+/).length;
  const charCount = content.length;

  if (isLoading) {
    return (
      <LoadingWrapper>
        <LoadingText>Loading system prompt...</LoadingText>
      </LoadingWrapper>
    );
  }

  return (
    <EditorContainer>
      {/* Header */}
      <Header>
        <Title>System Prompt</Title>
        <Description>
          Edit the system prompt that guides the AI in generating CLADS JSON from images.
        </Description>
      </Header>

      {/* Toolbar */}
      <Toolbar>
        <ToolbarActions>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={!hasUnsavedChanges || isSaving}
          >
            <Save size={16} />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            disabled={isSaving}
          >
            <RotateCcw size={16} />
            Reset to Default
          </Button>
        </ToolbarActions>

        <StatusInfo>
          {hasUnsavedChanges && <UnsavedLabel>Unsaved changes</UnsavedLabel>}
          {lastSaved && (
            <span>
              Last saved: {lastSaved.toLocaleTimeString()}
            </span>
          )}
        </StatusInfo>
      </Toolbar>

      {/* Status Messages */}
      {error && (
        <StatusMessage $variant="error">
          <AlertCircle size={16} />
          {error}
        </StatusMessage>
      )}
      {showSuccess && (
        <StatusMessage $variant="success">
          <CheckCircle size={16} />
          System prompt saved successfully
        </StatusMessage>
      )}

      {/* Editor */}
      <EditorBorder>
        <TextArea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Enter system prompt..."
          spellCheck={false}
        />
      </EditorBorder>

      {/* Stats */}
      <Stats>
        <div>
          {wordCount} words &bull; {charCount} characters
        </div>
        <div>
          Markdown supported
        </div>
      </Stats>

      {/* Help Text */}
      <HelpBox>
        <HelpTitle>Tips:</HelpTitle>
        <HelpList>
          <li>&#8226; Be specific about the CLADS format and required fields</li>
          <li>&#8226; Include examples of common UI patterns</li>
          <li>&#8226; Specify styling guidelines and constraints</li>
          <li>&#8226; The prompt is stored locally in your browser</li>
        </HelpList>
      </HelpBox>
    </EditorContainer>
  );
}
