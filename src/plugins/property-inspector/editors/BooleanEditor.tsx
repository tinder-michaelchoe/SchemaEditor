import React from 'react';
import styled, { css } from 'styled-components';

const ToggleButton = styled.button<{ $checked: boolean; $disabled: boolean }>`
  position: relative;
  display: inline-flex;
  height: 1.5rem;
  width: 2.75rem;
  align-items: center;
  border-radius: 9999px;
  border: none;
  transition: background-color 200ms ease-in-out;
  background-color: ${p => (p.$checked ? p.theme.colors.accent : p.theme.colors.bgTertiary)};
  cursor: ${p => (p.$disabled ? 'not-allowed' : 'pointer')};
  opacity: ${p => (p.$disabled ? 0.5 : 1)};

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${p => p.theme.colors.accent}, 0 0 0 4px ${p => p.theme.colors.bgPrimary};
  }
`;

const ToggleThumb = styled.span<{ $checked: boolean }>`
  display: inline-block;
  height: 1rem;
  width: 1rem;
  border-radius: 9999px;
  background-color: white;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1);
  transition: transform 200ms ease-in-out;
  transform: ${p => (p.$checked ? 'translateX(1.5rem)' : 'translateX(0.25rem)')};
`;

interface BooleanEditorProps {
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

export function BooleanEditor({ value, onChange, disabled = false }: BooleanEditorProps) {
  return (
    <ToggleButton
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => !disabled && onChange(!value)}
      disabled={disabled}
      $checked={value}
      $disabled={disabled}
    >
      <ToggleThumb $checked={value} />
    </ToggleButton>
  );
}
