import { Input, TextArea } from '../ui/Input';
import { StyleIdInput } from './StyleIdInput';
import { ColorInput, isColorProperty } from './ColorInput';

interface StringNodeProps {
  value: string;
  onChange: (value: string) => void;
  schema: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    format?: string;
    description?: string;
  };
  propertyName?: string;
  error?: boolean;
  disabled?: boolean;
}

export function StringNode({ value, onChange, schema, propertyName, error, disabled }: StringNodeProps) {
  // Use StyleIdInput for styleId properties
  if (propertyName === 'styleId') {
    return (
      <StyleIdInput
        value={value ?? ''}
        onChange={onChange}
        error={error}
        disabled={disabled}
      />
    );
  }

  // Use ColorInput for color properties
  if (propertyName && isColorProperty(propertyName, schema)) {
    return (
      <ColorInput
        value={value ?? ''}
        onChange={onChange}
        placeholder={schema.description?.includes('hex') ? '#RRGGBB' : 'Enter color...'}
      />
    );
  }

  // Use textarea for long text or specific formats
  const useTextarea = 
    schema.format === 'text' || 
    schema.format === 'textarea' ||
    (schema.maxLength && schema.maxLength > 100) ||
    (value && value.length > 50);

  if (useTextarea) {
    return (
      <TextArea
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        error={error}
        disabled={disabled}
        rows={3}
        minLength={schema.minLength}
        maxLength={schema.maxLength}
        placeholder={schema.format ? `Enter ${schema.format}...` : 'Enter text...'}
      />
    );
  }

  // Determine input type based on format
  let inputType: 'text' | 'email' | 'url' | 'date' | 'time' | 'datetime-local' = 'text';
  if (schema.format === 'email') inputType = 'email';
  else if (schema.format === 'uri' || schema.format === 'url') inputType = 'url';
  else if (schema.format === 'date') inputType = 'date';
  else if (schema.format === 'time') inputType = 'time';
  else if (schema.format === 'date-time') inputType = 'datetime-local';

  return (
    <Input
      type={inputType}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      error={error}
      disabled={disabled}
      minLength={schema.minLength}
      maxLength={schema.maxLength}
      pattern={schema.pattern}
      placeholder={schema.format ? `Enter ${schema.format}...` : 'Enter text...'}
    />
  );
}
