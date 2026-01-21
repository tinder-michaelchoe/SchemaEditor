import React from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ArrayEditorProps {
  value: unknown[];
  onChange: (value: unknown[]) => void;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  renderItem: (item: unknown, index: number) => React.ReactNode;
  disabled?: boolean;
  maxItems?: number;
}

export function ArrayEditor({
  value,
  onChange,
  onAddItem,
  onRemoveItem,
  renderItem,
  disabled = false,
  maxItems,
}: ArrayEditorProps) {
  const canAdd = !maxItems || value.length < maxItems;

  return (
    <div className="space-y-2">
      {value.map((item, index) => (
        <div
          key={index}
          className="
            flex items-start gap-2 p-2 rounded-md
            bg-[var(--bg-tertiary)] border border-[var(--border-color)]
          "
        >
          <div className="flex items-center text-[var(--text-tertiary)] cursor-grab">
            <GripVertical className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">{renderItem(item, index)}</div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemoveItem(index)}
            disabled={disabled}
            className="text-[var(--error-color)] hover:bg-[var(--error-color)]/10"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ))}

      {canAdd && (
        <Button
          variant="outline"
          size="sm"
          onClick={onAddItem}
          disabled={disabled}
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Item
        </Button>
      )}

      {value.length === 0 && (
        <p className="text-sm text-[var(--text-tertiary)] text-center py-2">
          No items
        </p>
      )}
    </div>
  );
}
