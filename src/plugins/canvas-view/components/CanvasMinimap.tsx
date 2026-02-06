import React, { useCallback } from 'react';
import styled from 'styled-components';

const MinimapWrapper = styled.div`
  position: absolute;
  bottom: 16px;
  right: 16px;
  background: ${p => p.theme.colors.bgSecondary};
  border: 1px solid ${p => p.theme.colors.border};
  border-radius: ${p => p.theme.radii.lg};
  box-shadow: ${p => p.theme.shadows.lg};
  overflow: hidden;
  cursor: pointer;
  transition: all 200ms;
`;

const ContentPreview = styled.div`
  position: absolute;
  background: ${p => p.theme.colors.bgTertiary};
`;

const ViewportIndicator = styled.div`
  position: absolute;
  border: 2px solid ${p => p.theme.colors.accent};
  background: ${p => p.theme.colors.accent}1a;
`;

const ZoomLabel = styled.div`
  position: absolute;
  bottom: 4px;
  right: 4px;
  font-size: 10px;
  color: ${p => p.theme.colors.textTertiary};
`;

const CollapseButton = styled.button`
  position: absolute;
  top: 4px;
  right: 4px;
  padding: 2px;
  border-radius: ${p => p.theme.radii.sm};
  border: none;
  background: ${p => p.theme.colors.bgSecondary}cc;
  color: ${p => p.theme.colors.textTertiary};
  cursor: pointer;
  transition: color 150ms, background 150ms;

  &:hover {
    background: ${p => p.theme.colors.bgPrimary};
    color: ${p => p.theme.colors.textPrimary};
  }
`;

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
    <MinimapWrapper
      style={{ width: actualWidth, height: actualHeight }}
      onClick={handleClick}
      title={isExpanded ? "Click to pan" : "Click to expand"}
    >
      {/* Content preview (simplified) */}
      <ContentPreview
        style={{
          left: padding + contentBounds.x * scale,
          top: padding + contentBounds.y * scale,
          width: contentBounds.width * scale,
          height: contentBounds.height * scale,
          borderRadius: isExpanded ? 2 : 1,
        }}
      />

      {/* Viewport indicator */}
      <ViewportIndicator
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
          <ZoomLabel>
            {Math.round(zoom * 100)}%
          </ZoomLabel>

          {/* Collapse button */}
          <CollapseButton
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand();
            }}
            title="Collapse minimap"
          >
            <svg width={12} height={12} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </CollapseButton>
        </>
      )}
    </MinimapWrapper>
  );
}
