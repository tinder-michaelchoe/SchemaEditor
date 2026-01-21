import { Select } from '../ui/Select';

interface EnumNodeProps {
  value: unknown;
  onChange: (value: unknown) => void;
  options: unknown[];
  error?: boolean;
  disabled?: boolean;
}

export function EnumNode({ value, onChange, options, error, disabled }: EnumNodeProps) {
  const selectOptions = options.map((opt) => ({
    value: JSON.stringify(opt),
    label: opt === null ? 'null' : String(opt),
  }));

  return (
    <Select
      value={JSON.stringify(value)}
      onChange={(e) => {
        try {
          onChange(JSON.parse(e.target.value));
        } catch {
          onChange(e.target.value);
        }
      }}
      options={selectOptions}
      error={error}
      disabled={disabled}
    />
  );
}
