import { Badge } from '../ui/Badge';

interface NullNodeProps {
  onChange?: (value: null) => void;
}

export function NullNode({ onChange }: NullNodeProps) {
  return (
    <div className="flex items-center gap-2 py-1">
      <Badge variant="type">null</Badge>
      {onChange && (
        <span className="text-xs text-[var(--text-tertiary)]">
          (value is null)
        </span>
      )}
    </div>
  );
}
