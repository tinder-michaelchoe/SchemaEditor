import { useCallback, useEffect, useState } from 'react';
import { useDragDropStore } from './DragDropManager';
import type { DragSource, DropTarget, DragData } from './DragDropManager';

/**
 * Hook for components that can initiate drag operations
 */
export function useDragSource(source: Omit<DragSource, 'sourcePluginId'>) {
  const [isDragging, setIsDragging] = useState(false);
  
  const handleDragStart = useCallback((e: React.DragEvent | React.MouseEvent) => {
    e.preventDefault();
    
    const position = {
      x: 'clientX' in e ? e.clientX : 0,
      y: 'clientY' in e ? e.clientY : 0,
    };
    
    const dragData: DragData = {
      source,
      startPosition: position,
      currentPosition: position,
    };
    
    useDragDropStore.setState({ dragData });
    setIsDragging(true);
  }, [source]);
  
  // Handle mouse move and up globally when dragging
  useEffect(() => {
    if (!isDragging) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      const { dragData } = useDragDropStore.getState();
      if (!dragData) return;
      
      useDragDropStore.setState({
        dragData: {
          ...dragData,
          currentPosition: { x: e.clientX, y: e.clientY },
        },
      });
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      useDragDropStore.setState({ dragData: null });
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
      onMouseDown: handleDragStart,
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
  
  const dragData = useDragDropStore((state) => state.dragData);
  
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
    
    const { dragData } = useDragDropStore.getState();
    if (!dragData || !canDrop) return;
    
    if (onDrop) {
      onDrop(dragData.source);
    }
    
    useDragDropStore.setState({ dragData: null });
  }, [canDrop, onDrop]);
  
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
  const dragData = useDragDropStore((state) => state.dragData);
  
  return {
    isDragging: dragData !== null,
    dragData,
    sourceType: dragData?.source.type ?? null,
    position: dragData?.currentPosition ?? null,
  };
}
