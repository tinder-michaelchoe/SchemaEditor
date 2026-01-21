import { useCallback, useState, useRef } from 'react';

interface SelectionBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface UseCanvasSelectionOptions {
  selectedPath: string | null;
  onSelect: (path: string | null) => void;
  onMultiSelect?: (paths: string[]) => void;
  zoom: number;
  panX: number;
  panY: number;
}

export function useCanvasSelection(options: UseCanvasSelectionOptions) {
  const { selectedPath, onSelect, onMultiSelect, zoom, panX, panY } = options;

  const [multiSelection, setMultiSelection] = useState<string[]>([]);
  const [isMarqueeSelecting, setIsMarqueeSelecting] = useState(false);
  const [marqueeStart, setMarqueeStart] = useState({ x: 0, y: 0 });
  const [marqueeEnd, setMarqueeEnd] = useState({ x: 0, y: 0 });
  const [editingContainerPath, setEditingContainerPath] = useState<string | null>(null);
  
  const nodeBoundsRef = useRef<Map<string, DOMRect>>(new Map());

  // Register node bounds for hit testing
  const registerNodeBounds = useCallback((path: string, bounds: DOMRect) => {
    nodeBoundsRef.current.set(path, bounds);
  }, []);

  const unregisterNodeBounds = useCallback((path: string) => {
    nodeBoundsRef.current.delete(path);
  }, []);

  // Handle click selection
  const handleNodeClick = useCallback((path: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (e.shiftKey && multiSelection.length > 0) {
      // Add/remove from multi-selection
      const newSelection = multiSelection.includes(path)
        ? multiSelection.filter((p) => p !== path)
        : [...multiSelection, path];
      setMultiSelection(newSelection);
      onMultiSelect?.(newSelection);
    } else if (e.metaKey || e.ctrlKey) {
      // Deep select - click through parent to child
      // This would need parent-child relationship info
      onSelect(path);
      setMultiSelection([]);
    } else {
      // Single selection
      onSelect(path);
      setMultiSelection([]);
    }
  }, [multiSelection, onSelect, onMultiSelect]);

  // Handle double-click for container editing
  const handleNodeDoubleClick = useCallback((path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingContainerPath(path);
  }, []);

  // Exit container editing mode
  const exitContainerEditing = useCallback(() => {
    if (editingContainerPath) {
      // Select the container when exiting
      onSelect(editingContainerPath);
      setEditingContainerPath(null);
    }
  }, [editingContainerPath, onSelect]);

  // Handle escape key
  const handleEscape = useCallback(() => {
    if (editingContainerPath) {
      exitContainerEditing();
    } else if (selectedPath) {
      // Select parent
      const parts = selectedPath.split('.');
      if (parts.length > 1) {
        parts.pop();
        onSelect(parts.join('.'));
      } else {
        onSelect(null);
      }
    }
    setMultiSelection([]);
  }, [editingContainerPath, selectedPath, exitContainerEditing, onSelect]);

  // Marquee selection
  const handleMarqueeStart = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = (e.clientX - rect.left - panX) / zoom;
    const y = (e.clientY - rect.top - panY) / zoom;
    
    setMarqueeStart({ x, y });
    setMarqueeEnd({ x, y });
    setIsMarqueeSelecting(true);
  }, [zoom, panX, panY]);

  const handleMarqueeMove = useCallback((e: React.MouseEvent) => {
    if (!isMarqueeSelecting) return;
    
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = (e.clientX - rect.left - panX) / zoom;
    const y = (e.clientY - rect.top - panY) / zoom;
    
    setMarqueeEnd({ x, y });
  }, [isMarqueeSelecting, zoom, panX, panY]);

  const handleMarqueeEnd = useCallback(() => {
    if (!isMarqueeSelecting) return;
    
    // Calculate marquee bounds
    const bounds = {
      x: Math.min(marqueeStart.x, marqueeEnd.x),
      y: Math.min(marqueeStart.y, marqueeEnd.y),
      width: Math.abs(marqueeEnd.x - marqueeStart.x),
      height: Math.abs(marqueeEnd.y - marqueeStart.y),
    };
    
    // Find nodes within bounds
    const selectedPaths: string[] = [];
    nodeBoundsRef.current.forEach((nodeBounds, path) => {
      if (
        nodeBounds.left >= bounds.x &&
        nodeBounds.right <= bounds.x + bounds.width &&
        nodeBounds.top >= bounds.y &&
        nodeBounds.bottom <= bounds.y + bounds.height
      ) {
        selectedPaths.push(path);
      }
    });
    
    if (selectedPaths.length > 0) {
      setMultiSelection(selectedPaths);
      onMultiSelect?.(selectedPaths);
    }
    
    setIsMarqueeSelecting(false);
  }, [isMarqueeSelecting, marqueeStart, marqueeEnd, onMultiSelect]);

  // Select all in current context
  const selectAll = useCallback(() => {
    const allPaths = Array.from(nodeBoundsRef.current.keys());
    
    if (editingContainerPath) {
      // Select only children of the editing container
      const children = allPaths.filter((p) => p.startsWith(editingContainerPath + '.'));
      setMultiSelection(children);
      onMultiSelect?.(children);
    } else {
      setMultiSelection(allPaths);
      onMultiSelect?.(allPaths);
    }
  }, [editingContainerPath, onMultiSelect]);

  // Get marquee bounds for rendering
  const marqueeBounds: SelectionBounds | null = isMarqueeSelecting
    ? {
        x: Math.min(marqueeStart.x, marqueeEnd.x),
        y: Math.min(marqueeStart.y, marqueeEnd.y),
        width: Math.abs(marqueeEnd.x - marqueeStart.x),
        height: Math.abs(marqueeEnd.y - marqueeStart.y),
      }
    : null;

  return {
    selectedPath,
    multiSelection,
    editingContainerPath,
    isMarqueeSelecting,
    marqueeBounds,
    registerNodeBounds,
    unregisterNodeBounds,
    handleNodeClick,
    handleNodeDoubleClick,
    handleEscape,
    exitContainerEditing,
    selectAll,
    marqueeHandlers: {
      onMouseDown: handleMarqueeStart,
      onMouseMove: handleMarqueeMove,
      onMouseUp: handleMarqueeEnd,
    },
  };
}
