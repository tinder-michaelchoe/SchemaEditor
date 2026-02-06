import { useCallback, useEffect, useState, useRef } from 'react';
import { useDragData, createDragDropManager } from './DragDropManager';
import type { DragSource, DropTarget, DragData } from './DragDropManager';

// Create a singleton manager instance
const dragDropManager = createDragDropManager();

// Drag thresholds to prevent accidental drags
const DRAG_TIME_THRESHOLD = 150; // ms - hold time before drag starts
const DRAG_DISTANCE_THRESHOLD = 5; // px - distance to move before drag starts

/**
 * Hook for components that can initiate drag operations
 */
export function useDragSource(source: Omit<DragSource, 'sourcePluginId'>) {
  const [isDragging, setIsDragging] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const mouseDownPos = useRef<{ x: number; y: number } | null>(null);
  const mouseDownTime = useRef<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();

    const position = {
      x: e.clientX,
      y: e.clientY,
    };

    mouseDownPos.current = position;
    mouseDownTime.current = Date.now();
    setIsPending(true);

    // Set timeout for time threshold
    timeoutRef.current = setTimeout(() => {
      if (isPending) {
        // Time threshold met - start drag
        dragDropManager.startDrag(source as DragSource, position);
        setIsDragging(true);
        setIsPending(false);
      }
    }, DRAG_TIME_THRESHOLD);
  }, [source, isPending]);

  const handlePendingMouseMove = useCallback((e: MouseEvent) => {
    if (!mouseDownPos.current) return;

    const deltaX = Math.abs(e.clientX - mouseDownPos.current.x);
    const deltaY = Math.abs(e.clientY - mouseDownPos.current.y);
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Distance threshold met - start drag
    if (distance >= DRAG_DISTANCE_THRESHOLD) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      dragDropManager.startDrag(source as DragSource, mouseDownPos.current);
      setIsDragging(true);
      setIsPending(false);
    }
  }, [source]);

  const handlePendingMouseUp = useCallback(() => {
    // Mouse released before thresholds met - cancel drag
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsPending(false);
    mouseDownPos.current = null;
    mouseDownTime.current = null;
  }, []);

  // Handle pending state (waiting for threshold)
  useEffect(() => {
    if (!isPending) return;

    document.addEventListener('mousemove', handlePendingMouseMove);
    document.addEventListener('mouseup', handlePendingMouseUp);

    return () => {
      document.removeEventListener('mousemove', handlePendingMouseMove);
      document.removeEventListener('mouseup', handlePendingMouseUp);
    };
  }, [isPending, handlePendingMouseMove, handlePendingMouseUp]);

  // Handle active drag (threshold met, dragging)
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      dragDropManager.updatePosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => {
      console.log('[useDragSource] mouseup detected, ending drag');
      setIsDragging(false);
      mouseDownPos.current = null;
      mouseDownTime.current = null;
      // Use the manager's endDrag which calls onDragEnd callback
      dragDropManager.endDrag();
      console.log('[useDragSource] endDrag called');
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return {
    isDragging,
    dragProps: {
      onMouseDown: handleMouseDown,
      draggable: false, // We handle drag manually
      style: { cursor: 'grab' },
    },
  };
}

/**
 * Hook for components that can receive drops
 */
export function useDropTarget(
  target: DropTarget,
  onDrop?: (source: DragSource) => void
) {
  const [isOver, setIsOver] = useState(false);
  const [canDrop, setCanDrop] = useState(false);
  
  const dragData = useDragData();

  useEffect(() => {
    if (!dragData) {
      setIsOver(false);
      setCanDrop(false);
      return;
    }

    // Check if we can accept this drag
    if (target.accepts && !target.accepts.includes(dragData.source.type)) {
      setCanDrop(false);
    } else {
      setCanDrop(true);
    }
  }, [dragData, target.accepts]);

  const handleDragOver = useCallback((e: React.DragEvent | React.MouseEvent) => {
    e.preventDefault();
    if (canDrop) {
      setIsOver(true);
    }
  }, [canDrop]);

  const handleDragLeave = useCallback(() => {
    setIsOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent | React.MouseEvent) => {
    e.preventDefault();
    setIsOver(false);

    const currentDragData = dragDropManager.getDragData();
    if (!currentDragData || !canDrop) return;

    if (onDrop) {
      onDrop(currentDragData.source);
    }

    // Use the manager's handleDrop which calls onDragEnd(true)
    dragDropManager.handleDrop(target);
  }, [canDrop, onDrop, target]);
  
  return {
    isOver,
    canDrop,
    dropProps: {
      onMouseOver: handleDragOver,
      onMouseLeave: handleDragLeave,
      onMouseUp: handleDrop,
    },
  };
}

/**
 * Hook to access current drag state
 */
export function useDragState() {
  const dragData = useDragData();
  
  return {
    isDragging: dragData !== null,
    dragData,
    sourceType: dragData?.source.type ?? null,
    position: dragData?.currentPosition ?? null,
  };
}
