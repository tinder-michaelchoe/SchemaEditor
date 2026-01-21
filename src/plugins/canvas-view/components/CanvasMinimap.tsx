import React, { useCallback } from 'react';

interface CanvasMinimapProps {
  // Canvas state
  zoom: number;
  panX: number;
  panY: number;
  
  // Canvas dimensions
  canvasWidth: number;
  canvasHeight: number;
  
  // Content bounds
  contentBounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  
  // Viewport dimensions
  viewportWidth: number;
  viewportHeight: number;
  
  // Callbacks
  onPanTo: (x: number, y: number) => void;
  
  // Size
  width?: number;
  height?: number;
}

export function CanvasMinimap({
  zoom,
  panX,
  panY,
  canvasWidth,
  canvasHeight,
  contentBounds,
  viewportWidth,
  viewportHeight,
  onPanTo,
  width = 150,
  height = 100,
}: CanvasMinimapProps) {
  // Calculate scale to fit content in minimap
  const padding = 10;
  const availableWidth = width - padding * 2;
  const availableHeight = height - padding * 2;
  
  const scaleX = availableWidth / (contentBounds.width || canvasWidth);
  const scaleY = availableHeight / (contentBounds.height || canvasHeight);
  const scale = Math.min(scaleX, scaleY, 1);

  // Calculate viewport rectangle in minimap coordinates
  const viewportRect = {
    x: padding + (-panX / zoom) * scale,
    y: padding + (-panY / zoom) * scale,
    width: (viewportWidth / zoom) * scale,
    height: (viewportHeight / zoom) * scale,
  };

  // Handle click to pan
  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left - padding;
    const clickY = e.clientY - rect.top - padding;
    
    // Convert minimap coordinates to canvas coordinates
    const canvasX = clickX / scale;
    const canvasY = clickY / scale;
    
    // Center viewport on clicked point
    const newPanX = -(canvasX - viewportWidth / (2 * zoom)) * zoom;
    const newPanY = -(canvasY - viewportHeight / (2 * zoom)) * zoom;
    
    onPanTo(newPanX, newPanY);
  }, [scale, zoom, viewportWidth, viewportHeight, onPanTo]);

  return (
    <div
      className="
        absolute bottom-4 right-4
        bg-[var(--bg-secondary)] border border-[var(--border-color)]
        rounded-lg shadow-lg overflow-hidden
        cursor-pointer
      "
      style={{ width, height }}
      onClick={handleClick}
    >
      {/* Content preview (simplified) */}
      <div
        className="absolute bg-[var(--bg-tertiary)]"
        style={{
          left: padding + contentBounds.x * scale,
          top: padding + contentBounds.y * scale,
          width: contentBounds.width * scale,
          height: contentBounds.height * scale,
          borderRadius: 2,
        }}
      />

      {/* Viewport indicator */}
      <div
        className="absolute border-2 border-[var(--accent-color)] bg-[var(--accent-color)]/10"
        style={{
          left: viewportRect.x,
          top: viewportRect.y,
          width: Math.max(viewportRect.width, 10),
          height: Math.max(viewportRect.height, 10),
          borderRadius: 2,
        }}
      />

      {/* Zoom level indicator */}
      <div className="absolute bottom-1 right-1 text-[10px] text-[var(--text-tertiary)]">
        {Math.round(zoom * 100)}%
      </div>
    </div>
  );
}
