import React, { useState, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import { Input } from '@/components/ui/Input';

const StyledTextArea = styled.textarea`
  width: 100%;
  padding: 0.375rem 0.5rem;
  font-size: 0.875rem;
  line-height: 1.25rem;
  border-radius: 0.375rem;
  background: ${p => p.theme.colors.bgPrimary};
  border: 1px solid ${p => p.theme.colors.border};
  color: ${p => p.theme.colors.textPrimary};
  resize: vertical;
  min-height: 60px;

  &::placeholder {
    color: ${p => p.theme.colors.textTertiary};
  }

  &:focus {
    outline: none;
    border-color: ${p => p.theme.colors.accent};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

interface TextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  disabled?: boolean;
}

export function TextEditor({
  value,
  onChange,
  placeholder,
  multiline = false,
  disabled = false,
}: TextEditorProps) {
  const [localValue, setLocalValue] = useState(value);

  // Sync with external value
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      setLocalValue(newValue);
      // Update immediately for real-time feedback
      onChange(newValue);
    },
    [onChange]
  );

  const handleBlur = useCallback(() => {
    // No longer needed since we update on change, but keep for consistency
    if (localValue !== value) {
      onChange(localValue);
    }
  }, [localValue, value, onChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !multiline) {
        e.preventDefault();
        // Already updated on change, just blur the input
        e.currentTarget.blur();
      }
    },
    [multiline]
  );

  if (multiline) {
    return (
      <StyledTextArea
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
      />
    );
  }

  return (
    <Input
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      disabled={disabled}
    />
  );
}
