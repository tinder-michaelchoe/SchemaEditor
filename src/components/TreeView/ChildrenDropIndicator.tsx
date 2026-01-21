import React, { useState, useCallback } from 'react';
import { isDraggingChildrenItem, getDragItemData } from './DraggableArrayItem';
import type { DragItemData } from './DraggableArrayItem';

interface ChildrenDropIndicatorProps {
  targetArrayPath: string; // Path to the target array
  targetIndex: number; // Index where the item would be inserted
  onDrop: (sourceData: DragItemData, targetIndex: number) => void;
  isValidDrop?: (sourceData: DragItemData) => boolean;
}

export function ChildrenDropIndicator({
  targetArrayPath,
  targetIndex,
  onDrop,
  isValidDrop,
}: ChildrenDropIndicatorProps) {
  const [isOver, setIsOver] = useState(false);
  const [isValid, setIsValid] = useState(true);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    // Check if this is a valid drag type
    if (!isDraggingChildrenItem(e)) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setIsOver(true);
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    if (!isDraggingChildrenItem(e)) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    setIsOver(true);
    // Note: We can't read drag data during dragenter (browser security)
    // Validation will happen on drop
    setIsValid(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOver(false);

    const data = getDragItemData(e);
    if (!data) {
      console.warn('No drag data found');
      return;
    }

    // Validate the drop
    if (isValidDrop && !isValidDrop(data)) {
      console.warn('Invalid drop target');
      return;
    }

    onDrop(data, targetIndex);
  }, [targetIndex, onDrop, isValidDrop]);

  return (
    <div
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="relative h-2"
    >
      {/* Drop indicator line - only visible when dragging over */}
      {isOver && (
        <>
          <div
            className={`
              absolute left-6 right-0 top-1/2 -translate-y-1/2
              h-0.5 rounded-full
              ${isValid
                ? 'bg-[var(--accent-color)] shadow-[0_0_8px_var(--accent-color)]'
                : 'bg-[var(--error-color)] opacity-50'
              }
            `}
          />
          {/* Drop zone circle indicator */}
          {isValid && (
            <div
              className="
                absolute left-3 top-1/2 -translate-y-1/2
                w-2 h-2 rounded-full
                bg-[var(--accent-color)]
                shadow-[0_0_8px_var(--accent-color)]
              "
            />
          )}
        </>
      )}
    </div>
  );
}
