import { forwardRef, InputHTMLAttributes } from 'react';
import styled from 'styled-components';
import { srOnly } from '@/styles/mixins';

interface ToggleProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

const ToggleLabel = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
`;

const ToggleWrapper = styled.div`
  position: relative;
`;

const HiddenCheckbox = styled.input`
  ${srOnly}
`;

const Track = styled.div<{ $checked?: boolean }>`
  width: 2.75rem;
  height: 1.5rem;
  border-radius: 9999px;
  transition: background-color 0.15s;
  background: ${p => (p.$checked ? p.theme.colors.accent : p.theme.colors.bgTertiary)};

  ${HiddenCheckbox}:focus + & {
    box-shadow: 0 0 0 2px ${p => p.theme.colors.accent};
  }
`;

const Thumb = styled.div<{ $checked?: boolean }>`
  position: absolute;
  top: 0.125rem;
  left: 0.125rem;
  width: 1.25rem;
  height: 1.25rem;
  background: white;
  border-radius: 9999px;
  box-shadow: ${p => p.theme.shadows.sm};
  transition: transform 0.15s;
  transform: translateX(${p => (p.$checked ? '1.25rem' : '0')});
`;

const LabelText = styled.span`
  font-size: 0.875rem;
  color: ${p => p.theme.colors.textPrimary};
`;

export const Toggle = forwardRef<HTMLInputElement, ToggleProps>(
  ({ label, checked, onChange, ...props }, ref) => {
    return (
      <ToggleLabel>
        <ToggleWrapper>
          <HiddenCheckbox
            ref={ref}
            type="checkbox"
            checked={checked}
            onChange={onChange}
            {...props}
          />
          <Track $checked={checked} />
          <Thumb $checked={checked} />
        </ToggleWrapper>
        {label && <LabelText>{label}</LabelText>}
      </ToggleLabel>
    );
  },
);

Toggle.displayName = 'Toggle';
