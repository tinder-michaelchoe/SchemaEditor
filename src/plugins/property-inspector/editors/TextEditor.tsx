import React, { useState, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/Input';

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
      <textarea
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        className="
          w-full px-2 py-1.5 text-sm rounded-md
          bg-[var(--bg-primary)] border border-[var(--border-color)]
          focus:outline-none focus:border-[var(--accent-color)]
          text-[var(--text-primary)]
          placeholder-[var(--text-tertiary)]
          disabled:opacity-50 disabled:cursor-not-allowed
          resize-y min-h-[60px]
        "
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
      className="w-full"
    />
  );
}
