import React from 'react';

interface EnumEditorProps {
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
  displayMode?: 'select' | 'radio' | 'buttons';
  disabled?: boolean;
}

export function EnumEditor({
  value,
  options,
  onChange,
  displayMode = 'select',
  disabled = false,
}: EnumEditorProps) {
  if (displayMode === 'buttons' && options.length <= 4) {
    return (
      <div className="flex gap-1">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => !disabled && onChange(option.value)}
            disabled={disabled}
            className={`
              flex-1 px-2 py-1.5 text-xs rounded-md
              border transition-colors duration-150
              ${
                value === option.value
                  ? 'bg-[var(--accent-color)] border-[var(--accent-color)] text-white'
                  : 'bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-primary)] hover:border-[var(--accent-color)]'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            {option.label}
          </button>
        ))}
      </div>
    );
  }

  if (displayMode === 'radio') {
    return (
      <div className="space-y-1">
        {options.map((option) => (
          <label
            key={option.value}
            className={`
              flex items-center gap-2 p-2 rounded-md cursor-pointer
              hover:bg-[var(--bg-tertiary)]
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input
              type="radio"
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              disabled={disabled}
              className="accent-[var(--accent-color)]"
            />
            <span className="text-sm text-[var(--text-primary)]">{option.label}</span>
          </label>
        ))}
      </div>
    );
  }

  // Default: select dropdown
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`
        w-full px-2 py-1.5 text-sm rounded-md
        bg-[var(--bg-primary)] border border-[var(--border-color)]
        focus:outline-none focus:border-[var(--accent-color)]
        text-[var(--text-primary)]
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
