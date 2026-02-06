import { ReactNode } from 'react';
import styled, { css } from 'styled-components';

interface BadgeProps {
  variant?: 'default' | 'required' | 'type' | 'error' | 'success';
  children: ReactNode;
}

const StyledBadge = styled.span<{ $variant: string }>`
  display: inline-flex;
  align-items: center;
  padding: 0.125rem 0.375rem;
  font-size: 10px;
  font-weight: 500;
  border-radius: 0.25rem;

  ${p =>
    p.$variant === 'default' &&
    css`
      background: ${p.theme.colors.bgTertiary};
      color: ${p.theme.colors.textSecondary};
    `}
  ${p =>
    p.$variant === 'required' &&
    css`
      background: ${p.theme.colors.accent};
      color: white;
    `}
  ${p =>
    p.$variant === 'type' &&
    css`
      background: ${p.theme.colors.bgTertiary};
      color: ${p.theme.colors.textSecondary};
      font-family: ${p.theme.fonts.mono};
    `}
  ${p =>
    p.$variant === 'error' &&
    css`
      background: ${p.theme.colors.error};
      color: white;
    `}
  ${p =>
    p.$variant === 'success' &&
    css`
      background: ${p.theme.colors.success};
      color: white;
    `}
`;

export function Badge({ variant = 'default', children }: BadgeProps) {
  return <StyledBadge $variant={variant}>{children}</StyledBadge>;
}
