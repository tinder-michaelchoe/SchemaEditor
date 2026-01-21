import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Lock, Unlock } from 'lucide-react';

interface SelectionOverlayProps {
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  componentType?: string;
  isMultiSelect?: boolean;
  showResizeHandles?: boolean;
  aspectRatioLocked?: boolean;
  pinnedEdges?: EdgePin[];
  zoom?: number;
  onResizeStart?: (handle: ResizeHandle, e: React.MouseEvent) => void;
  onResize?: (width: number, height: number, handle: ResizeHandle) => void;
  onResizeEnd?: (width: number, height: number) => void;
  onToggleAspectRatioLock?: () => void;
  onToggleEdgePin?: (edge: EdgePin) => void;
}

export type ResizeHandle = 
  | 'top-left' | 'top' | 'top-right'
  | 'left' | 'right'
  | 'bottom-left' | 'bottom' | 'bottom-right';

export type EdgePin = 'top' | 'bottom' | 'left' | 'right';

const HANDLE_SIZE = 8;
const SELECTION_COLOR = '#0D99FF';

export function SelectionOverlay({
  bounds,
  componentType,
  isMultiSelect = false,
  showResizeHandles = true,
  aspectRatioLocked = false,
  pinnedEdges = [],
  zoom = 1,
  onResizeStart,
  onResize,
  onResizeEnd,
  onToggleAspectRatioLock,
  onToggleEdgePin,
}: SelectionOverlayProps) {
  const [activeHandle, setActiveHandle] = useState<ResizeHandle | null>(null);
  const [initialBounds, setInitialBounds] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [currentBounds, setCurrentBounds] = useState({ x: 0, y: 0, width: 0, height: 0 });
  // Use a ref to track the latest size - this avoids stale closure issues
  const currentSizeRef = useRef({ width: 0, height: 0 });

  const handlePositions: { handle: ResizeHandle; style: React.CSSProperties; isEdge: boolean }[] = [
    { handle: 'top-left', style: { top: -HANDLE_SIZE / 2, left: -HANDLE_SIZE / 2, cursor: 'nwse-resize' }, isEdge: false },
    { handle: 'top', style: { top: -HANDLE_SIZE / 2, left: '50%', transform: 'translateX(-50%)', cursor: 'ns-resize' }, isEdge: true },
    { handle: 'top-right', style: { top: -HANDLE_SIZE / 2, right: -HANDLE_SIZE / 2, cursor: 'nesw-resize' }, isEdge: false },
    { handle: 'left', style: { top: '50%', left: -HANDLE_SIZE / 2, transform: 'translateY(-50%)', cursor: 'ew-resize' }, isEdge: true },
    { handle: 'right', style: { top: '50%', right: -HANDLE_SIZE / 2, transform: 'translateY(-50%)', cursor: 'ew-resize' }, isEdge: true },
    { handle: 'bottom-left', style: { bottom: -HANDLE_SIZE / 2, left: -HANDLE_SIZE / 2, cursor: 'nesw-resize' }, isEdge: false },
    { handle: 'bottom', style: { bottom: -HANDLE_SIZE / 2, left: '50%', transform: 'translateX(-50%)', cursor: 'ns-resize' }, isEdge: true },
    { handle: 'bottom-right', style: { bottom: -HANDLE_SIZE / 2, right: -HANDLE_SIZE / 2, cursor: 'nwse-resize' }, isEdge: false },
  ];

  // Handle mouse down on resize handle
  const handleMouseDown = useCallback((e: React.MouseEvent, handle: ResizeHandle) => {
    e.preventDefault();
    e.stopPropagation();
    
    setActiveHandle(handle);
    setInitialBounds({ x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height });
    setCurrentBounds({ x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height });
    currentSizeRef.current = { width: bounds.width, height: bounds.height };
    setDragStart({ x: e.clientX, y: e.clientY });
    onResizeStart?.(handle, e);
  }, [bounds, onResizeStart]);

  // Handle mouse move during resize
  useEffect(() => {
    if (!activeHandle) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = (e.clientX - dragStart.x) / zoom;
      const deltaY = (e.clientY - dragStart.y) / zoom;

      let newWidth = initialBounds.width;
      let newHeight = initialBounds.height;
      let newX = initialBounds.x;
      let newY = initialBounds.y;

      // Calculate new dimensions and position based on which handle is being dragged
      switch (activeHandle) {
        case 'right':
          newWidth = initialBounds.width + deltaX;
          break;
        case 'left':
          // When dragging left, adjust position and width so right edge stays fixed
          newWidth = initialBounds.width - deltaX;
          newX = initialBounds.x + deltaX;
          break;
        case 'bottom':
          newHeight = initialBounds.height + deltaY;
          break;
        case 'top':
          // When dragging top, adjust position and height so bottom edge stays fixed
          newHeight = initialBounds.height - deltaY;
          newY = initialBounds.y + deltaY;
          break;
        case 'bottom-right':
          newWidth = initialBounds.width + deltaX;
          newHeight = initialBounds.height + deltaY;
          break;
        case 'bottom-left':
          newWidth = initialBounds.width - deltaX;
          newX = initialBounds.x + deltaX;
          newHeight = initialBounds.height + deltaY;
          break;
        case 'top-right':
          newWidth = initialBounds.width + deltaX;
          newHeight = initialBounds.height - deltaY;
          newY = initialBounds.y + deltaY;
          break;
        case 'top-left':
          newWidth = initialBounds.width - deltaX;
          newX = initialBounds.x + deltaX;
          newHeight = initialBounds.height - deltaY;
          newY = initialBounds.y + deltaY;
          break;
      }

      // Enforce minimum dimensions and adjust position if needed
      if (newWidth < 20) {
        const diff = 20 - newWidth;
        newWidth = 20;
        // If dragging from left, don't let x go past the right edge minus min width
        if (activeHandle === 'left' || activeHandle === 'top-left' || activeHandle === 'bottom-left') {
          newX = initialBounds.x + initialBounds.width - 20;
        }
      }
      if (newHeight < 20) {
        const diff = 20 - newHeight;
        newHeight = 20;
        // If dragging from top, don't let y go past the bottom edge minus min height
        if (activeHandle === 'top' || activeHandle === 'top-left' || activeHandle === 'top-right') {
          newY = initialBounds.y + initialBounds.height - 20;
        }
      }

      // If aspect ratio is locked, adjust the other dimension
      if (aspectRatioLocked && initialBounds.width > 0 && initialBounds.height > 0) {
        const aspectRatio = initialBounds.width / initialBounds.height;
        
        if (activeHandle === 'left' || activeHandle === 'right') {
          newHeight = newWidth / aspectRatio;
        } else if (activeHandle === 'top' || activeHandle === 'bottom') {
          newWidth = newHeight * aspectRatio;
        } else {
          // Corner handles - use the dimension that changed more
          const widthChange = Math.abs(newWidth - initialBounds.width);
          const heightChange = Math.abs(newHeight - initialBounds.height);
          
          if (widthChange > heightChange) {
            newHeight = newWidth / aspectRatio;
          } else {
            newWidth = newHeight * aspectRatio;
          }
        }
      }

      const finalWidth = Math.round(newWidth);
      const finalHeight = Math.round(newHeight);
      const finalX = Math.round(newX);
      const finalY = Math.round(newY);
      
      // Update both state and ref - ref is used in handleMouseUp to avoid stale closure
      setCurrentBounds({ x: finalX, y: finalY, width: finalWidth, height: finalHeight });
      currentSizeRef.current = { width: finalWidth, height: finalHeight };
      onResize?.(finalWidth, finalHeight, activeHandle);
    };

    const handleMouseUp = () => {
      if (onResizeEnd) {
        // Use ref to get the latest size - avoids stale closure issue
        onResizeEnd(currentSizeRef.current.width, currentSizeRef.current.height);
      }
      setActiveHandle(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [activeHandle, aspectRatioLocked, initialBounds, dragStart, zoom, onResize, onResizeEnd]);

  // Check if an edge is pinned
  const isEdgePinned = (handle: ResizeHandle): boolean => {
    const edgeMap: Record<string, EdgePin> = {
      'top': 'top',
      'bottom': 'bottom',
      'left': 'left',
      'right': 'right',
    };
    const edge = edgeMap[handle];
    return edge ? pinnedEdges.includes(edge) : false;
  };

  // Use currentBounds during active resize, otherwise use props bounds
  const displayBounds = activeHandle ? currentBounds : bounds;

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: displayBounds.x,
        top: displayBounds.y,
        width: displayBounds.width,
        height: displayBounds.height,
      }}
    >
      {/* Selection border */}
      <div
        className="absolute inset-0"
        style={{
          border: `2px solid ${SELECTION_COLOR}`,
          borderRadius: 2,
          boxShadow: isMultiSelect ? `0 0 0 1px ${SELECTION_COLOR}` : undefined,
        }}
      />

      {/* Component type label */}
      {componentType && !isMultiSelect && (
        <div
          className="absolute pointer-events-auto"
          style={{
            top: -24,
            left: 0,
            backgroundColor: SELECTION_COLOR,
            color: 'white',
            fontSize: 10,
            fontWeight: 500,
            padding: '2px 6px',
            borderRadius: 3,
            whiteSpace: 'nowrap',
          }}
        >
          {componentType}
        </div>
      )}

      {/* Dimensions tooltip */}
      {!isMultiSelect && (
        <div
          className="absolute pointer-events-none"
          style={{
            bottom: -20,
            right: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            color: 'white',
            fontSize: 10,
            padding: '2px 6px',
            borderRadius: 3,
            whiteSpace: 'nowrap',
            fontFamily: 'monospace',
          }}
        >
          {Math.round(displayBounds.width)} × {Math.round(displayBounds.height)}
        </div>
      )}

      {/* Resize handles */}
      {showResizeHandles && !isMultiSelect && (
        <>
          {handlePositions.map(({ handle, style, isEdge }) => {
            const isPinned = isEdge && isEdgePinned(handle);
            
            return (
              <div
                key={handle}
                className="absolute pointer-events-auto group"
                style={{
                  width: HANDLE_SIZE,
                  height: HANDLE_SIZE,
                  backgroundColor: isPinned ? SELECTION_COLOR : 'white',
                  border: `1.5px solid ${SELECTION_COLOR}`,
                  borderRadius: isPinned ? '50%' : 1,
                  ...style,
                }}
                onMouseDown={(e) => handleMouseDown(e, handle)}
              >
                {/* Pin button for edge handles */}
                {isEdge && onToggleEdgePin && (
                  <button
                    className={`
                      absolute opacity-0 group-hover:opacity-100 transition-opacity
                      -top-5 left-1/2 -translate-x-1/2
                      w-4 h-4 rounded-full flex items-center justify-center
                      text-[8px] shadow-sm
                      ${isPinned 
                        ? 'bg-[#0D99FF] text-white' 
                        : 'bg-white border border-gray-300 text-gray-500'
                      }
                    `}
                    onClick={(e) => {
                      e.stopPropagation();
                      const edgeMap: Record<string, EdgePin> = {
                        'top': 'top', 'bottom': 'bottom', 
                        'left': 'left', 'right': 'right',
                      };
                      const edge = edgeMap[handle];
                      if (edge) onToggleEdgePin(edge);
                    }}
                    title={isPinned ? `Unpin ${handle} edge` : `Pin to ${handle} edge`}
                  >
                    📌
                  </button>
                )}
              </div>
            );
          })}
        </>
      )}

      {/* Aspect ratio lock button */}
      {showResizeHandles && !isMultiSelect && onToggleAspectRatioLock && (
        <button
          className={`
            absolute pointer-events-auto
            -bottom-8 left-1/2 -translate-x-1/2
            px-2 py-1 rounded text-[10px] font-medium flex items-center gap-1
            transition-colors shadow-sm
            ${aspectRatioLocked
              ? 'bg-[#0D99FF] text-white'
              : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
            }
          `}
          onClick={(e) => {
            e.stopPropagation();
            onToggleAspectRatioLock();
          }}
          title={aspectRatioLocked ? 'Unlock aspect ratio' : 'Lock aspect ratio'}
        >
          {aspectRatioLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
          <span>Ratio</span>
        </button>
      )}
    </div>
  );
}

/**
 * Hover overlay - dashed border shown when hovering over unselected nodes
 */
interface HoverOverlayProps {
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export function HoverOverlay({ bounds }: HoverOverlayProps) {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: bounds.x,
        top: bounds.y,
        width: bounds.width,
        height: bounds.height,
        border: '1px dashed #0D99FF80',
        borderRadius: 2,
      }}
    />
  );
}

/**
 * Multi-selection bounding box
 */
interface MultiSelectOverlayProps {
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export function MultiSelectOverlay({ bounds }: MultiSelectOverlayProps) {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: bounds.x,
        top: bounds.y,
        width: bounds.width,
        height: bounds.height,
        border: `2px solid ${SELECTION_COLOR}`,
        borderRadius: 2,
        backgroundColor: `${SELECTION_COLOR}10`,
      }}
    />
  );
}

/**
 * Marquee selection rectangle
 */
interface MarqueeOverlayProps {
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export function MarqueeOverlay({ bounds }: MarqueeOverlayProps) {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: bounds.x,
        top: bounds.y,
        width: bounds.width,
        height: bounds.height,
        border: `1px solid ${SELECTION_COLOR}`,
        backgroundColor: `${SELECTION_COLOR}10`,
      }}
    />
  );
}
