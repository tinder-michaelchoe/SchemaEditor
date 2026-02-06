/**
 * DropZoneLine Component
 *
 * Renders a thin line indicator to show valid insert positions between components.
 * Supports both horizontal and vertical orientations.
 */

import React from 'react';

export interface DropZoneLineProps {
  /** Bounding rectangle for positioning */
  bounds: DOMRect;
  /** Line orientation */
  orientation: 'horizontal' | 'vertical';
  /** Whether this zone is currently hovered */
  isHovered?: boolean;
  /** Whether this zone is active (being dropped on) */
  isActive?: boolean;
  /** Optional z-index for layering */
  zIndex?: number;
}

export function DropZoneLine({
  bounds,
  orientation,
  isHovered = false,
  isActive = false,
  zIndex = 1000,
}: DropZoneLineProps) {
  // Calculate line styles based on orientation
  const isHorizontal = orientation === 'horizontal';

  // Base color (blue)
  const baseColor = 'rgb(59, 130, 246)'; // Blue-500
  const hoverColor = 'rgb(37, 99, 235)'; // Blue-600
  const activeColor = 'rgb(29, 78, 216)'; // Blue-700

  const color = isActive ? activeColor : isHovered ? hoverColor : baseColor;

  // Line thickness
  const thickness = isActive ? 3 : isHovered ? 2.5 : 2;

  // Opacity: partial when not hovered, full when hovered
  const opacity = isActive ? 1 : isHovered ? 1 : 0.4;

  const style: React.CSSProperties = {
    position: 'fixed',
    left: `${bounds.left}px`,
    top: `${bounds.top}px`,
    width: isHorizontal ? `${bounds.width}px` : `${thickness}px`,
    height: isHorizontal ? `${thickness}px` : `${bounds.height}px`,
    backgroundColor: color,
    opacity,
    pointerEvents: 'none',
    zIndex,
    transition: 'all 0.15s ease',
    borderRadius: '2px',
    boxShadow: isHovered || isActive ? '0 0 8px rgba(59, 130, 246, 0.5)' : 'none',
  };

  // Add markers at the ends for better visibility
  const markerSize = isHovered || isActive ? 6 : 4;
  const markerStyle: React.CSSProperties = {
    position: 'absolute',
    width: `${markerSize}px`,
    height: `${markerSize}px`,
    backgroundColor: color,
    opacity,
    borderRadius: '50%',
    transition: 'all 0.15s ease',
  };

  return (
    <div style={style}>
      {/* Start marker */}
      <div
        style={{
          ...markerStyle,
          [isHorizontal ? 'left' : 'top']: `-${markerSize / 2}px`,
          [isHorizontal ? 'top' : 'left']: `-${(markerSize - thickness) / 2}px`,
        }}
      />
      {/* End marker */}
      <div
        style={{
          ...markerStyle,
          [isHorizontal ? 'right' : 'bottom']: `-${markerSize / 2}px`,
          [isHorizontal ? 'top' : 'left']: `-${(markerSize - thickness) / 2}px`,
        }}
      />
    </div>
  );
}
