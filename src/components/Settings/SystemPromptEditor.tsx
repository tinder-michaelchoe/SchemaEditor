/**
 * SystemPromptEditor Component
 * Editor for the system prompt used in AI generation
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { promptService } from '@/services/promptService';
import { Save, RotateCcw, CheckCircle, AlertCircle } from 'lucide-react';

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
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading system prompt...</div>
      </div>
    );
  }

  return (
    <div className="system-prompt-editor flex flex-col h-full">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">System Prompt</h3>
        <p className="text-sm text-gray-600">
          Edit the system prompt that guides the AI in generating CLADS JSON from images.
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={!hasUnsavedChanges || isSaving}
          >
            <Save className="w-4 h-4 mr-1" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            disabled={isSaving}
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Reset to Default
          </Button>
        </div>

        <div className="text-xs text-gray-500">
          {hasUnsavedChanges && <span className="text-orange-600 font-medium mr-2">Unsaved changes</span>}
          {lastSaved && (
            <span>
              Last saved: {lastSaved.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded flex items-center gap-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
      {showSuccess && (
        <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded flex items-center gap-2 text-sm text-green-700">
          <CheckCircle className="w-4 h-4" />
          System prompt saved successfully
        </div>
      )}

      {/* Editor */}
      <div className="flex-1 border border-gray-300 rounded-lg overflow-hidden">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full h-full p-4 font-mono text-sm resize-none focus:outline-none"
          placeholder="Enter system prompt..."
          spellCheck={false}
        />
      </div>

      {/* Stats */}
      <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
        <div>
          {wordCount} words • {charCount} characters
        </div>
        <div>
          Markdown supported
        </div>
      </div>

      {/* Help Text */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
        <div className="font-medium text-blue-900 mb-1">Tips:</div>
        <ul className="text-blue-800 space-y-1 text-xs">
          <li>• Be specific about the CLADS format and required fields</li>
          <li>• Include examples of common UI patterns</li>
          <li>• Specify styling guidelines and constraints</li>
          <li>• The prompt is stored locally in your browser</li>
        </ul>
      </div>
    </div>
  );
}
