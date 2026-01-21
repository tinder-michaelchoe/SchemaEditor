import { Badge } from '../ui/Badge';

interface ConstNodeProps {
  value: unknown;
}

export function ConstNode({ value }: ConstNodeProps) {
  const displayValue = typeof value === 'string' 
    ? `"${value}"` 
    : JSON.stringify(value);

  return (
    <div className="flex items-center gap-2 py-1">
      <code className="text-sm font-mono text-[var(--text-primary)] bg-[var(--bg-tertiary)] px-2 py-0.5 rounded">
        {displayValue}
      </code>
      <Badge variant="type">const</Badge>
    </div>
  );
}
