import { useMemo, useState, useEffect } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { Input } from '../ui/Input';

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
    <div className="flex items-center gap-2">
      <select
        value={selectValue}
        onChange={handleSelectChange}
        disabled={disabled}
        className={`
          px-2 py-1.5 text-sm min-w-[120px]
          bg-[var(--bg-primary)] text-[var(--text-primary)]
          border rounded-lg
          focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent
          disabled:opacity-50 disabled:cursor-not-allowed
          appearance-none cursor-pointer
          bg-[url('data:image/svg+xml;charset=US-ASCII,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="%2386868b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>')] 
          bg-no-repeat bg-[right_8px_center]
          pr-8
          ${error 
            ? 'border-[var(--error-color)] focus:ring-[var(--error-color)]' 
            : 'border-[var(--border-color)]'
          }
        `}
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
      </select>
      
      {(isCustomMode || selectValue === CUSTOM_OPTION) && (
        <Input
          type="text"
          value={value || ''}
          onChange={handleInputChange}
          placeholder="@design.style or customStyle"
          error={error}
          disabled={disabled}
          className="flex-1"
        />
      )}
      
      {!isCustomMode && selectValue !== CUSTOM_OPTION && value && (
        <span className="text-xs text-[var(--text-tertiary)] px-2">
          {value.startsWith('@') ? '(design system)' : '(local style)'}
        </span>
      )}
    </div>
  );
}
