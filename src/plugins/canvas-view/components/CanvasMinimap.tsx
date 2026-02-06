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
  onToggleExpand: () => void;

  // State
  isExpanded: boolean;

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
  onToggleExpand,
  isExpanded,
  width = 150,
  height = 100,
}: CanvasMinimapProps) {
  // Calculate actual size based on expanded state
  const actualWidth = isExpanded ? width : width / 2.5;
  const actualHeight = isExpanded ? height : height / 2.5;

  // Calculate scale to fit content in minimap
  const padding = isExpanded ? 10 : 2;
  const availableWidth = actualWidth - padding * 2;
  const availableHeight = actualHeight - padding * 2;

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

  // Handle click to pan or toggle
  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();

    if (!isExpanded) {
      // If collapsed, expand it
      onToggleExpand();
    } else {
      // If expanded, pan on click
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
    }
  }, [scale, zoom, viewportWidth, viewportHeight, onPanTo, isExpanded, onToggleExpand, padding]);

  return (
    <div
      className="
        absolute bottom-4 right-4
        bg-[var(--bg-secondary)] border border-[var(--border-color)]
        rounded-lg shadow-lg overflow-hidden
        cursor-pointer
        transition-all duration-200
      "
      style={{ width: actualWidth, height: actualHeight }}
      onClick={handleClick}
      title={isExpanded ? "Click to pan" : "Click to expand"}
    >
      {/* Content preview (simplified) */}
      <div
        className="absolute bg-[var(--bg-tertiary)]"
        style={{
          left: padding + contentBounds.x * scale,
          top: padding + contentBounds.y * scale,
          width: contentBounds.width * scale,
          height: contentBounds.height * scale,
          borderRadius: isExpanded ? 2 : 1,
        }}
      />

      {/* Viewport indicator */}
      <div
        className="absolute border-2 border-[var(--accent-color)] bg-[var(--accent-color)]/10"
        style={{
          left: viewportRect.x,
          top: viewportRect.y,
          width: Math.max(viewportRect.width, isExpanded ? 10 : 2),
          height: Math.max(viewportRect.height, isExpanded ? 10 : 2),
          borderRadius: isExpanded ? 2 : 1,
        }}
      />

      {/* Zoom level indicator - only show when expanded */}
      {isExpanded && (
        <>
          <div className="absolute bottom-1 right-1 text-[10px] text-[var(--text-tertiary)]">
            {Math.round(zoom * 100)}%
          </div>

          {/* Collapse button */}
          <button
            className="absolute top-1 right-1 p-0.5 rounded bg-[var(--bg-secondary)]/80 hover:bg-[var(--bg-primary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand();
            }}
            title="Collapse minimap"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
}
