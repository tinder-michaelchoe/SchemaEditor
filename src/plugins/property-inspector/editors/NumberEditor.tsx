import React, { useState, useCallback, useEffect } from 'react';

interface NumberEditorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  showSlider?: boolean;
  disabled?: boolean;
}

export function NumberEditor({
  value,
  onChange,
  min,
  max,
  step = 1,
  showSlider = false,
  disabled = false,
}: NumberEditorProps) {
  const [localValue, setLocalValue] = useState(String(value));

  // Sync with external value
  useEffect(() => {
    setLocalValue(String(value));
  }, [value]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setLocalValue(e.target.value);
    },
    []
  );

  const handleBlur = useCallback(() => {
    const numValue = parseFloat(localValue);
    if (!isNaN(numValue)) {
      let finalValue = numValue;
      if (min !== undefined) finalValue = Math.max(min, finalValue);
      if (max !== undefined) finalValue = Math.min(max, finalValue);
      if (finalValue !== value) {
        onChange(finalValue);
      }
      setLocalValue(String(finalValue));
    } else {
      setLocalValue(String(value));
    }
  }, [localValue, value, onChange, min, max]);

  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const numValue = parseFloat(e.target.value);
      setLocalValue(String(numValue));
      onChange(numValue);
    },
    [onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleBlur();
      }
    },
    [handleBlur]
  );

  return (
    <div className="flex items-center gap-2">
      {showSlider && min !== undefined && max !== undefined && (
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={parseFloat(localValue) || 0}
          onChange={handleSliderChange}
          disabled={disabled}
          className="flex-1 h-1 bg-[var(--bg-tertiary)] rounded-lg appearance-none cursor-pointer accent-[var(--accent-color)]"
        />
      )}
      <input
        type="text"
        inputMode="decimal"
        value={localValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={`
          ${showSlider ? 'w-16' : 'w-full'} 
          px-2 py-1.5 text-sm rounded-md text-right
          bg-[var(--bg-primary)] border border-[var(--border-color)]
          focus:outline-none focus:border-[var(--accent-color)]
          text-[var(--text-primary)]
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      />
    </div>
  );
}
