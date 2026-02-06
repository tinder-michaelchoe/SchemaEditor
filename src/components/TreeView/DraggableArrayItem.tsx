import React, { useCallback, useState, useRef } from 'react';
import styled, { css } from 'styled-components';
import { GripVertical } from 'lucide-react';

// Data transferred during drag operations
export interface DragItemData {
  sourcePath: string; // Path to the array (e.g., "root.children")
  sourceIndex: number; // Index within the array
  itemType: string; // Type of the item being dragged (for display)
}

interface DraggableArrayItemProps {
  children: React.ReactNode;
  arrayPath: string; // Path to the parent array
  index: number; // Index of this item in the array
  itemType?: string; // Type label for the item
  onDragStart?: (data: DragItemData) => void;
  onDragEnd?: () => void;
}

// Drag data type identifier
export const DRAG_TYPE = 'application/x-children-item';

const Wrapper = styled.div<{ $isDragging: boolean }>`
  position: relative;
  display: flex;
  align-items: stretch;
  transition: opacity 150ms ease;
  opacity: ${p => (p.$isDragging ? 0.5 : 1)};
`;

const DragHandle = styled.div<{ $isDragging: boolean }>`
  flex-shrink: 0;
  width: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  color: ${p => p.theme.colors.textTertiary};
  border-radius: ${p => p.theme.radii.sm} 0 0 ${p => p.theme.radii.sm};
  transition: color 150ms ease, background-color 150ms ease;

  &:hover {
    color: ${p => p.theme.colors.textSecondary};
    background: ${p => p.theme.colors.bgTertiary};
  }

  &:active {
    cursor: grabbing;
  }

  ${p =>
    p.$isDragging &&
    css`
      cursor: grabbing;
    `}
`;

const Content = styled.div`
  flex: 1;
  min-width: 0;
`;

export function DraggableArrayItem({
  children,
  arrayPath,
  index,
  itemType = 'item',
  onDragStart,
  onDragEnd,
}: DraggableArrayItemProps) {
  const [isDragging, setIsDragging] = useState(false);
  const dragHandleRef = useRef<HTMLDivElement>(null);

  const handleDragStart = useCallback((e: React.DragEvent) => {
    e.stopPropagation();

    const dragData: DragItemData = {
      sourcePath: arrayPath,
      sourceIndex: index,
      itemType,
    };

    // Set the drag data
    e.dataTransfer.setData(DRAG_TYPE, JSON.stringify(dragData));
    e.dataTransfer.setData('text/plain', JSON.stringify(dragData)); // Fallback
    e.dataTransfer.effectAllowed = 'move';

    setIsDragging(true);
    onDragStart?.(dragData);
  }, [arrayPath, index, itemType, onDragStart]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    onDragEnd?.();
  }, [onDragEnd]);

  // Prevent drag handle clicks from propagating to selection
  const handleDragHandleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  return (
    <Wrapper $isDragging={isDragging}>
      {/* Left margin drag handle */}
      <DragHandle
        ref={dragHandleRef}
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onClick={handleDragHandleClick}
        onMouseDown={(e) => e.stopPropagation()}
        $isDragging={isDragging}
        title="Drag to reorder"
      >
        <GripVertical size={16} />
      </DragHandle>

      {/* Content */}
      <Content>
        {children}
      </Content>
    </Wrapper>
  );
}

// Helper to check if a drag event contains our drag type
export function isDraggingChildrenItem(e: React.DragEvent): boolean {
  return e.dataTransfer.types.includes(DRAG_TYPE) ||
         e.dataTransfer.types.includes('text/plain');
}

// Helper to get drag data from an event
export function getDragItemData(e: React.DragEvent): DragItemData | null {
  try {
    const jsonData = e.dataTransfer.getData(DRAG_TYPE) ||
                     e.dataTransfer.getData('text/plain');
    if (jsonData) {
      return JSON.parse(jsonData) as DragItemData;
    }
  } catch {
    // Invalid JSON
  }
  return null;
}
