import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from 'react';
import styled, { css } from 'styled-components';
import { disabledStyles } from '@/styles/mixins';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const baseInputStyles = css<{ $error?: boolean }>`
  width: 100%;
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
  background: ${p => p.theme.colors.bgPrimary};
  color: ${p => p.theme.colors.textPrimary};
  border: 1px solid ${p => (p.$error ? p.theme.colors.error : p.theme.colors.border)};
  border-radius: ${p => p.theme.radii.lg};

  &::placeholder {
    color: ${p => p.theme.colors.textTertiary};
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${p => (p.$error ? p.theme.colors.error : p.theme.colors.accent)};
    border-color: transparent;
  }

  ${disabledStyles}
`;

const StyledInput = styled.input<{ $error?: boolean }>`
  ${baseInputStyles}
`;

const StyledTextArea = styled.textarea<{ $error?: boolean }>`
  ${baseInputStyles}
  padding: 0.5rem 0.75rem;
  resize: none;
`;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, ...props }, ref) => (
    <StyledInput ref={ref} $error={error} {...props} />
  ),
);

Input.displayName = 'Input';

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ error, ...props }, ref) => (
    <StyledTextArea ref={ref} $error={error} {...props} />
  ),
);

TextArea.displayName = 'TextArea';
