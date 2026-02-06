import { useCallback, useEffect, useRef, useState } from 'react';

interface CanvasNavigationState {
  zoom: number;
  panX: number;
  panY: number;
}

interface UseCanvasNavigationOptions {
  initialZoom?: number;
  initialPanX?: number;
  initialPanY?: number;
  minZoom?: number;
  maxZoom?: number;
  onZoomChange?: (zoom: number) => void;
  onPanChange?: (x: number, y: number) => void;
}

export function useCanvasNavigation(options: UseCanvasNavigationOptions = {}) {
  const {
    initialZoom = 1,
    initialPanX = 0,
    initialPanY = 0,
    minZoom = 0.1,
    maxZoom = 4,
    onZoomChange,
    onPanChange,
  } = options;

  const [state, setState] = useState<CanvasNavigationState>({
    zoom: initialZoom,
    panX: initialPanX,
    panY: initialPanY,
  });

  const [isPanning, setIsPanning] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Refs for callbacks to avoid triggering effects on callback change
  const onZoomChangeRef = useRef(onZoomChange);
  const onPanChangeRef = useRef(onPanChange);
  const isInitialMount = useRef(true);
  
  useEffect(() => {
    onZoomChangeRef.current = onZoomChange;
    onPanChangeRef.current = onPanChange;
  }, [onZoomChange, onPanChange]);

  // Handle zoom
  const setZoom = useCallback((newZoom: number, centerX?: number, centerY?: number) => {
    const clampedZoom = Math.min(maxZoom, Math.max(minZoom, newZoom));
    
    setState((prev) => {
      // If center point provided, adjust pan to zoom toward that point
      if (centerX !== undefined && centerY !== undefined) {
        const zoomRatio = clampedZoom / prev.zoom;
        const newPanX = centerX - (centerX - prev.panX) * zoomRatio;
        const newPanY = centerY - (centerY - prev.panY) * zoomRatio;
        return { zoom: clampedZoom, panX: newPanX, panY: newPanY };
      }
      return { ...prev, zoom: clampedZoom };
    });
  }, [maxZoom, minZoom]);

  // Handle pan
  const setPan = useCallback((x: number, y: number) => {
    setState((prev) => ({ ...prev, panX: x, panY: y }));
  }, []);
  
  // Sync state changes to external callbacks (after render, skip initial mount)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    onZoomChangeRef.current?.(state.zoom);
  }, [state.zoom]);
  
  useEffect(() => {
    if (isInitialMount.current) {
      return;
    }
    onPanChangeRef.current?.(state.panX, state.panY);
  }, [state.panX, state.panY]);

  // Zoom presets
  const zoomTo = useCallback((level: number) => {
    setZoom(level);
  }, [setZoom]);

  const zoomToFit = useCallback(() => {
    // Would need canvas bounds and content bounds to implement properly
    setZoom(1);
    setPan(0, 0);
  }, [setZoom, setPan]);

  const zoomToSelection = useCallback((bounds: { x: number; y: number; width: number; height: number }) => {
    if (!containerRef.current) return;
    
    const container = containerRef.current.getBoundingClientRect();
    const padding = 50;
    
    const scaleX = (container.width - padding * 2) / bounds.width;
    const scaleY = (container.height - padding * 2) / bounds.height;
    const newZoom = Math.min(scaleX, scaleY, maxZoom);
    
    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;
    
    setZoom(newZoom);
    setPan(
      container.width / 2 - centerX * newZoom,
      container.height / 2 - centerY * newZoom
    );
  }, [maxZoom, setZoom, setPan]);

  // Handle wheel events (zoom with Cmd/Ctrl, pan otherwise)
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    
    const isZoom = e.metaKey || e.ctrlKey;
    
    if (isZoom) {
      // Zoom at cursor position
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const cursorX = e.clientX - rect.left;
      const cursorY = e.clientY - rect.top;
      
      const zoomFactor = e.deltaY > 0 ? 0.97 : 1.03;
      setZoom(state.zoom * zoomFactor, cursorX, cursorY);
    } else {
      // Pan
      const deltaX = e.shiftKey ? e.deltaY : e.deltaX;
      const deltaY = e.shiftKey ? 0 : e.deltaY;
      
      setPan(state.panX - deltaX, state.panY - deltaY);
    }
  }, [state.zoom, state.panX, state.panY, setZoom, setPan]);

  // Handle space key for pan mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        setIsSpacePressed(true);
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
        setIsPanning(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Handle mouse events for panning
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isSpacePressed || e.button === 1) { // Space+click or middle mouse
      setIsPanning(true);
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      e.preventDefault();
    }
  }, [isSpacePressed]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      const deltaX = e.clientX - lastMousePos.current.x;
      const deltaY = e.clientY - lastMousePos.current.y;
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      
      setPan(state.panX + deltaX, state.panY + deltaY);
    }
  }, [isPanning, state.panX, state.panY, setPan]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Attach wheel listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    container.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [handleWheel]);

  return {
    containerRef,
    zoom: state.zoom,
    panX: state.panX,
    panY: state.panY,
    isPanning,
    isSpacePressed,
    setZoom,
    setPan,
    zoomTo,
    zoomToFit,
    zoomToSelection,
    handlers: {
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseUp,
    },
    transform: `translate(${state.panX}px, ${state.panY}px) scale(${state.zoom})`,
    cursorStyle: isSpacePressed ? 'grab' : isPanning ? 'grabbing' : 'default',
  };
}
