import { ButtonHTMLAttributes, forwardRef } from 'react';
import styled, { css } from 'styled-components';
import { focusRing, disabledStyles } from '@/styles/mixins';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

const StyledButton = styled.button<{
  $variant: 'primary' | 'secondary' | 'ghost' | 'danger';
  $size: 'sm' | 'md' | 'lg';
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  border-radius: ${p => p.theme.radii.lg};
  border: none;
  transition: background-color 0.15s, color 0.15s, border-color 0.15s;
  ${focusRing}
  ${disabledStyles}

  ${p =>
    p.$variant === 'primary' &&
    css`
      background: ${p.theme.colors.accent};
      color: white;
      &:hover { opacity: 0.9; }
    `}
  ${p =>
    p.$variant === 'secondary' &&
    css`
      background: ${p.theme.colors.bgTertiary};
      color: ${p.theme.colors.textPrimary};
      &:hover { background: ${p.theme.colors.border}; }
    `}
  ${p =>
    p.$variant === 'ghost' &&
    css`
      background: transparent;
      color: ${p.theme.colors.textSecondary};
      &:hover { background: ${p.theme.colors.bgTertiary}; }
    `}
  ${p =>
    p.$variant === 'danger' &&
    css`
      background: ${p.theme.colors.error};
      color: white;
      &:hover { opacity: 0.9; }
    `}

  ${p =>
    p.$size === 'sm' &&
    css`
      padding: 0.25rem 0.5rem;
      font-size: 0.75rem;
      gap: 0.25rem;
    `}
  ${p =>
    p.$size === 'md' &&
    css`
      padding: 0.375rem 0.75rem;
      font-size: 0.875rem;
      gap: 0.375rem;
    `}
  ${p =>
    p.$size === 'lg' &&
    css`
      padding: 0.5rem 1rem;
      font-size: 1rem;
      gap: 0.5rem;
    `}
`;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'secondary', size = 'md', children, ...props }, ref) => (
    <StyledButton ref={ref} $variant={variant} $size={size} {...props}>
      {children}
    </StyledButton>
  ),
);

Button.displayName = 'Button';
