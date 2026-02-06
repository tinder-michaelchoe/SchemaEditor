import { css, keyframes } from 'styled-components';

// Layout
export const flexCenter = css`
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const flexColumn = css`
  display: flex;
  flex-direction: column;
`;

// Text
export const truncateText = css`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

// Interactive states
export const focusRing = css`
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${p => p.theme.colors.accent};
  }
`;

export const focusVisible = css`
  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px ${p => p.theme.colors.accent};
  }
`;

export const disabledStyles = css`
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// Accessibility
export const srOnly = css`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
`;

// Animations
export const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;
