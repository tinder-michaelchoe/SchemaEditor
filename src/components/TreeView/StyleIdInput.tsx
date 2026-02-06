import { useMemo, useState, useEffect } from 'react';
import styled from 'styled-components';
import { useEditorStore } from '../../store/editorStore';
import { Input } from '../ui/Input';
import { disabledStyles } from '@/styles/mixins';

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const dropdownArrow = `url('data:image/svg+xml;charset=US-ASCII,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="%2386868b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>')`;

const StyledSelect = styled.select<{ $error?: boolean }>`
  padding: 0.375rem 0.5rem;
  padding-right: 2rem;
  font-size: 0.875rem;
  min-width: 120px;
  background-color: ${p => p.theme.colors.bgPrimary};
  color: ${p => p.theme.colors.textPrimary};
  border: 1px solid ${p => (p.$error ? p.theme.colors.error : p.theme.colors.border)};
  border-radius: ${p => p.theme.radii.lg};
  appearance: none;
  cursor: pointer;
  background-image: ${dropdownArrow};
  background-repeat: no-repeat;
  background-position: right 8px center;

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${p => (p.$error ? p.theme.colors.error : p.theme.colors.accent)};
    border-color: transparent;
  }

  ${disabledStyles}
`;

const FlexInput = styled(Input)`
  flex: 1;
`;

const StyleHint = styled.span`
  font-size: 0.75rem;
  color: ${p => p.theme.colors.textTertiary};
  padding: 0 0.5rem;
`;

interface StyleIdInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  disabled?: boolean;
}

const CUSTOM_OPTION = '__custom__';

export function StyleIdInput({ value, onChange, error, disabled }: StyleIdInputProps) {
  const { data } = useEditorStore();

  // Get defined styles from the document
  const definedStyles = useMemo(() => {
    if (!data || typeof data !== 'object') return [];
    const doc = data as Record<string, unknown>;
    const styles = doc.styles;
    if (!styles || typeof styles !== 'object') return [];
    return Object.keys(styles as Record<string, unknown>);
  }, [data]);

  // Determine if current value matches a defined style
  const isDefinedStyle = useMemo(() => {
    return definedStyles.includes(value || '');
  }, [value, definedStyles]);

  // Track whether we're in custom mode
  const [isCustomMode, setIsCustomMode] = useState(!isDefinedStyle && !!value);

  // Update custom mode when value changes externally
  useEffect(() => {
    if (value && !definedStyles.includes(value)) {
      setIsCustomMode(true);
    }
  }, [value, definedStyles]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;

    if (selected === CUSTOM_OPTION) {
      setIsCustomMode(true);
      // Keep current value or clear it
    } else if (selected === '') {
      setIsCustomMode(false);
      onChange('');
    } else {
      setIsCustomMode(false);
      onChange(selected);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    // If user types a defined style name, switch out of custom mode
    if (definedStyles.includes(newValue)) {
      setIsCustomMode(false);
    }
  };

  // Determine what to show in the dropdown
  const selectValue = useMemo(() => {
    if (isCustomMode || (value && !definedStyles.includes(value))) {
      return CUSTOM_OPTION;
    }
    return value || '';
  }, [value, isCustomMode, definedStyles]);

  return (
    <Wrapper>
      <StyledSelect
        value={selectValue}
        onChange={handleSelectChange}
        disabled={disabled}
        $error={error}
      >
        <option value="">-- None --</option>
        {definedStyles.length > 0 && (
          <optgroup label="Defined Styles">
            {definedStyles.map((style) => (
              <option key={style} value={style}>
                {style}
              </option>
            ))}
          </optgroup>
        )}
        <option value={CUSTOM_OPTION}>Custom...</option>
      </StyledSelect>

      {(isCustomMode || selectValue === CUSTOM_OPTION) && (
        <FlexInput
          type="text"
          value={value || ''}
          onChange={handleInputChange}
          placeholder="@design.style or customStyle"
          error={error}
          disabled={disabled}
        />
      )}

      {!isCustomMode && selectValue !== CUSTOM_OPTION && value && (
        <StyleHint>
          {value.startsWith('@') ? '(design system)' : '(local style)'}
        </StyleHint>
      )}
    </Wrapper>
  );
}
