import React, { useCallback, useState, useRef } from 'react';
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
    <div
      className={`
        relative flex items-stretch
        transition-opacity duration-150
        ${isDragging ? 'opacity-50' : 'opacity-100'}
      `}
    >
      {/* Left margin drag handle */}
      <div
        ref={dragHandleRef}
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onClick={handleDragHandleClick}
        onMouseDown={(e) => e.stopPropagation()}
        className={`
          flex-shrink-0 w-6 flex items-center justify-center
          cursor-grab active:cursor-grabbing
          text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]
          hover:bg-[var(--bg-tertiary)] rounded-l
          transition-colors duration-150
          ${isDragging ? 'cursor-grabbing' : ''}
        `}
        title="Drag to reorder"
      >
        <GripVertical className="w-4 h-4" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
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
