import React from 'react';

interface BooleanEditorProps {
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

export function BooleanEditor({ value, onChange, disabled = false }: BooleanEditorProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => !disabled && onChange(!value)}
      disabled={disabled}
      className={`
        relative inline-flex h-6 w-11 items-center rounded-full
        transition-colors duration-200 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] focus:ring-offset-2
        ${value ? 'bg-[var(--accent-color)]' : 'bg-[var(--bg-tertiary)]'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <span
        className={`
          inline-block h-4 w-4 transform rounded-full bg-white shadow
          transition-transform duration-200 ease-in-out
          ${value ? 'translate-x-6' : 'translate-x-1'}
        `}
      />
    </button>
  );
}
