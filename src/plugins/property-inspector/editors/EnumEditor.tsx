import React from 'react';
import styled, { css } from 'styled-components';

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.25rem;
`;

const OptionButton = styled.button<{ $active: boolean; $disabled: boolean }>`
  flex: 1;
  padding: 0.375rem 0.5rem;
  font-size: 0.75rem;
  line-height: 1rem;
  border-radius: 0.375rem;
  border: 1px solid;
  transition: color 150ms, background-color 150ms, border-color 150ms;
  cursor: ${p => (p.$disabled ? 'not-allowed' : 'pointer')};
  opacity: ${p => (p.$disabled ? 0.5 : 1)};

  ${p =>
    p.$active
      ? css`
          background-color: ${p.theme.colors.accent};
          border-color: ${p.theme.colors.accent};
          color: white;
        `
      : css`
          background-color: ${p.theme.colors.bgPrimary};
          border-color: ${p.theme.colors.border};
          color: ${p.theme.colors.textPrimary};

          &:hover {
            border-color: ${p.theme.colors.accent};
          }
        `}
`;

const RadioGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const RadioLabel = styled.label<{ $disabled: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 0.375rem;
  cursor: ${p => (p.$disabled ? 'not-allowed' : 'pointer')};
  opacity: ${p => (p.$disabled ? 0.5 : 1)};

  &:hover {
    background-color: ${p => p.theme.colors.bgTertiary};
  }
`;

const RadioInput = styled.input`
  accent-color: ${p => p.theme.colors.accent};
`;

const RadioText = styled.span`
  font-size: 0.875rem;
  color: ${p => p.theme.colors.textPrimary};
`;

const StyledSelect = styled.select<{ $disabled: boolean }>`
  width: 100%;
  padding: 0.375rem 0.5rem;
  font-size: 0.875rem;
  line-height: 1.25rem;
  border-radius: 0.375rem;
  background: ${p => p.theme.colors.bgPrimary};
  border: 1px solid ${p => p.theme.colors.border};
  color: ${p => p.theme.colors.textPrimary};
  cursor: ${p => (p.$disabled ? 'not-allowed' : 'pointer')};
  opacity: ${p => (p.$disabled ? 0.5 : 1)};

  &:focus {
    outline: none;
    border-color: ${p => p.theme.colors.accent};
  }
`;

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
      <ButtonGroup>
        {options.map((option) => (
          <OptionButton
            key={option.value}
            onClick={() => !disabled && onChange(option.value)}
            disabled={disabled}
            $active={value === option.value}
            $disabled={disabled}
          >
            {option.label}
          </OptionButton>
        ))}
      </ButtonGroup>
    );
  }

  if (displayMode === 'radio') {
    return (
      <RadioGroup>
        {options.map((option) => (
          <RadioLabel key={option.value} $disabled={disabled}>
            <RadioInput
              type="radio"
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              disabled={disabled}
            />
            <RadioText>{option.label}</RadioText>
          </RadioLabel>
        ))}
      </RadioGroup>
    );
  }

  // Default: select dropdown
  return (
    <StyledSelect
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      $disabled={disabled}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </StyledSelect>
  );
}
