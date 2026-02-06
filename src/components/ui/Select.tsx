import { SelectHTMLAttributes, forwardRef } from 'react';
import styled from 'styled-components';
import { disabledStyles } from '@/styles/mixins';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  options: { value: string; label: string }[];
  placeholder?: string;
}

const StyledSelect = styled.select<{ $error?: boolean }>`
  width: 100%;
  padding: 0.375rem 2rem 0.375rem 0.75rem;
  font-size: 0.875rem;
  background-color: ${p => p.theme.colors.bgPrimary};
  color: ${p => p.theme.colors.textPrimary};
  border: 1px solid ${p => (p.$error ? p.theme.colors.error : p.theme.colors.border)};
  border-radius: ${p => p.theme.radii.lg};
  appearance: none;
  cursor: pointer;
  background-image: url("data:image/svg+xml;charset=US-ASCII,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2386868b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='m6 9 6 6 6-6'/></svg>");
  background-repeat: no-repeat;
  background-position: right 8px center;

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${p => (p.$error ? p.theme.colors.error : p.theme.colors.accent)};
    border-color: transparent;
  }

  ${disabledStyles}
`;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ error, options, placeholder, ...props }, ref) => {
    return (
      <StyledSelect ref={ref} $error={error} {...props}>
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </StyledSelect>
    );
  },
);

Select.displayName = 'Select';
