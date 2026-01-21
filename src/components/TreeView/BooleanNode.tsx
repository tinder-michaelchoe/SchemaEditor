import { Toggle } from '../ui/Toggle';

interface BooleanNodeProps {
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

export function BooleanNode({ value, onChange, disabled }: BooleanNodeProps) {
  return (
    <Toggle
      checked={value ?? false}
      onChange={(e) => onChange(e.target.checked)}
      disabled={disabled}
      label={value ? 'true' : 'false'}
    />
  );
}
