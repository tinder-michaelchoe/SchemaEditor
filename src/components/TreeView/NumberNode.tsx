import { Input } from '../ui/Input';

interface NumberNodeProps {
  value: number | null;
  onChange: (value: number | null) => void;
  schema: {
    type?: 'number' | 'integer';
    minimum?: number;
    maximum?: number;
    exclusiveMinimum?: number;
    exclusiveMaximum?: number;
    multipleOf?: number;
  };
  error?: boolean;
  disabled?: boolean;
}

export function NumberNode({ value, onChange, schema, error, disabled }: NumberNodeProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    
    if (raw === '' || raw === '-') {
      onChange(null);
      return;
    }

    const num = schema.type === 'integer' 
      ? parseInt(raw, 10) 
      : parseFloat(raw);
    
    if (!isNaN(num)) {
      onChange(num);
    }
  };

  // Calculate step based on schema
  let step: string | number = 'any';
  if (schema.type === 'integer') {
    step = schema.multipleOf || 1;
  } else if (schema.multipleOf) {
    step = schema.multipleOf;
  }

  return (
    <Input
      type="number"
      value={value ?? ''}
      onChange={handleChange}
      error={error}
      disabled={disabled}
      min={schema.minimum ?? schema.exclusiveMinimum}
      max={schema.maximum ?? schema.exclusiveMaximum}
      step={step}
      placeholder="Enter number..."
    />
  );
}
