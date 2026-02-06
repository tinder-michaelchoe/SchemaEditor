import React from 'react';
import styled from 'styled-components';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const ArrayWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ItemRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 0.375rem;
  background: ${p => p.theme.colors.bgTertiary};
  border: 1px solid ${p => p.theme.colors.border};
`;

const GripArea = styled.div`
  display: flex;
  align-items: center;
  color: ${p => p.theme.colors.textTertiary};
  cursor: grab;
`;

const ItemContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const EmptyMessage = styled.p`
  font-size: 0.875rem;
  color: ${p => p.theme.colors.textTertiary};
  text-align: center;
  padding: 0.5rem 0;
`;

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
    <ArrayWrapper>
      {value.map((item, index) => (
        <ItemRow key={index}>
          <GripArea>
            <GripVertical size={16} />
          </GripArea>
          <ItemContent>{renderItem(item, index)}</ItemContent>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemoveItem(index)}
            disabled={disabled}
          >
            <Trash2 size={16} />
          </Button>
        </ItemRow>
      ))}

      {canAdd && (
        <Button
          variant="outline"
          size="sm"
          onClick={onAddItem}
          disabled={disabled}
        >
          <Plus size={16} />
          Add Item
        </Button>
      )}

      {value.length === 0 && (
        <EmptyMessage>
          No items
        </EmptyMessage>
      )}
    </ArrayWrapper>
  );
}
