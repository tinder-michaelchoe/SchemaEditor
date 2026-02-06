import React, { useState, useCallback, useEffect } from 'react';
import styled from 'styled-components';

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const RangeSlider = styled.input`
  flex: 1;
  height: 0.25rem;
  background: ${p => p.theme.colors.bgTertiary};
  border-radius: 0.5rem;
  appearance: none;
  cursor: pointer;
  accent-color: ${p => p.theme.colors.accent};
`;

const NumberInput = styled.input<{ $showSlider?: boolean }>`
  width: ${p => (p.$showSlider ? '4rem' : '100%')};
  padding: 0.375rem 0.5rem;
  font-size: 0.875rem;
  line-height: 1.25rem;
  border-radius: 0.375rem;
  text-align: right;
  background: ${p => p.theme.colors.bgPrimary};
  border: 1px solid ${p => p.theme.colors.border};
  color: ${p => p.theme.colors.textPrimary};

  &:focus {
    outline: none;
    border-color: ${p => p.theme.colors.accent};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

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
    <Row>
      {showSlider && min !== undefined && max !== undefined && (
        <RangeSlider
          type="range"
          min={min}
          max={max}
          step={step}
          value={parseFloat(localValue) || 0}
          onChange={handleSliderChange}
          disabled={disabled}
        />
      )}
      <NumberInput
        type="text"
        inputMode="decimal"
        value={localValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        $showSlider={showSlider}
      />
    </Row>
  );
}
