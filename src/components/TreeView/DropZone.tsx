import React, { useState, useCallback } from 'react';
import { useDragDropStore } from '@/plugins/drag-drop-service/DragDropManager';
import type { DragSource } from '@/plugins/drag-drop-service/DragDropManager';

export type DropPosition = 'before' | 'after' | 'inside';

interface DropZoneProps {
  path: string;
  position: DropPosition;
  accepts?: ('component' | 'node' | 'template')[];
  onDrop: (source: DragSource, position: DropPosition) => void;
  className?: string;
  children?: React.ReactNode;
  showIndicator?: boolean;
}

export function DropZone({
  path,
  position,
  accepts = ['component', 'node'],
  onDrop,
  className = '',
  children,
  showIndicator = true,
}: DropZoneProps) {
  const [isOver, setIsOver] = useState(false);
  const dragData = useDragDropStore((state) => state.dragData);
  
  const isDragging = dragData !== null;
  const canAccept = isDragging && accepts.includes(dragData.source.type);

  const handleMouseEnter = useCallback(() => {
    if (canAccept) {
      setIsOver(true);
    }
  }, [canAccept]);

  const handleMouseLeave = useCallback(() => {
    setIsOver(false);
  }, []);

  const handleMouseUp = useCallback(() => {
    if (canAccept && dragData) {
      onDrop(dragData.source, position);
      useDragDropStore.setState({ dragData: null });
    }
    setIsOver(false);
  }, [canAccept, dragData, onDrop, position]);

  // Don't render indicator when not dragging
  if (!isDragging && !children) {
    return null;
  }

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseUp={handleMouseUp}
      className={`
        relative transition-all duration-150
        ${className}
      `}
    >
      {children}
      
      {/* Drop indicator */}
      {showIndicator && isDragging && (
        <div
          className={`
            absolute pointer-events-none transition-all duration-150
            ${position === 'before' ? 'top-0 left-0 right-0 h-0.5' : ''}
            ${position === 'after' ? 'bottom-0 left-0 right-0 h-0.5' : ''}
            ${position === 'inside' ? 'inset-0 rounded-md border-2 border-dashed' : ''}
            ${isOver && canAccept
              ? position === 'inside'
                ? 'border-[var(--accent-color)] bg-[var(--accent-color)]/10'
                : 'bg-[var(--accent-color)]'
              : canAccept
                ? position === 'inside'
                  ? 'border-[var(--border-color)]'
                  : 'bg-transparent'
                : ''
            }
          `}
        />
      )}
    </div>
  );
}

/**
 * Wrapper component that adds drop zones before and after its children
 */
interface DroppableWrapperProps {
  path: string;
  accepts?: ('component' | 'node' | 'template')[];
  onDrop: (source: DragSource, position: DropPosition) => void;
  children: React.ReactNode;
  showBeforeAfter?: boolean;
  showInside?: boolean;
  className?: string;
}

export function DroppableWrapper({
  path,
  accepts = ['component', 'node'],
  onDrop,
  children,
  showBeforeAfter = true,
  showInside = false,
  className = '',
}: DroppableWrapperProps) {
  const dragData = useDragDropStore((state) => state.dragData);
  const isDragging = dragData !== null;

  return (
    <div className={`relative ${className}`}>
      {/* Before drop zone */}
      {showBeforeAfter && isDragging && (
        <DropZone
          path={path}
          position="before"
          accepts={accepts}
          onDrop={onDrop}
          className="absolute -top-1 left-0 right-0 h-2 z-10"
        />
      )}

      {/* Content with optional inside drop zone */}
      {showInside ? (
        <DropZone
          path={path}
          position="inside"
          accepts={accepts}
          onDrop={onDrop}
        >
          {children}
        </DropZone>
      ) : (
        children
      )}

      {/* After drop zone */}
      {showBeforeAfter && isDragging && (
        <DropZone
          path={path}
          position="after"
          accepts={accepts}
          onDrop={onDrop}
          className="absolute -bottom-1 left-0 right-0 h-2 z-10"
        />
      )}
    </div>
  );
}
