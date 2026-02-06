/**
 * DropZoneHighlight Component
 *
 * Renders a semi-transparent highlight box with dashed border for empty container drop zones.
 */

import React from 'react';

export interface DropZoneHighlightProps {
  /** Bounding rectangle for positioning */
  bounds: DOMRect;
  /** Whether this zone is currently hovered */
  isHovered?: boolean;
  /** Whether this zone is active (being dropped on) */
  isActive?: boolean;
  /** Optional z-index for layering */
  zIndex?: number;
  /** Optional label to show in center */
  label?: string;
}

export function DropZoneHighlight({
  bounds,
  isHovered = false,
  isActive = false,
  zIndex = 1000,
  label,
}: DropZoneHighlightProps) {
  // Base color (blue)
  const baseColor = 'rgb(59, 130, 246)'; // Blue-500
  const hoverColor = 'rgb(37, 99, 235)'; // Blue-600
  const activeColor = 'rgb(29, 78, 216)'; // Blue-700

  const borderColor = isActive ? activeColor : isHovered ? hoverColor : baseColor;

  // Background opacity
  const bgOpacity = isActive ? 0.15 : isHovered ? 0.12 : 0.08;

  const style: React.CSSProperties = {
    position: 'fixed',
    left: `${bounds.left}px`,
    top: `${bounds.top}px`,
    width: `${bounds.width}px`,
    height: `${bounds.height}px`,
    backgroundColor: `rgba(59, 130, 246, ${bgOpacity})`,
    border: `2px dashed ${borderColor}`,
    borderRadius: '6px',
    pointerEvents: 'none',
    zIndex,
    transition: 'all 0.2s ease',
    boxShadow: isHovered || isActive ? '0 0 16px rgba(59, 130, 246, 0.3)' : 'none',
  };

  const labelStyle: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    color: borderColor,
    fontSize: '14px',
    fontWeight: 500,
    opacity: isHovered || isActive ? 1 : 0.7,
    transition: 'opacity 0.2s ease',
    pointerEvents: 'none',
    whiteSpace: 'nowrap',
  };

  // Animated dash effect
  const animatedBorderStyle: React.CSSProperties = {
    ...style,
    backgroundImage: isHovered || isActive
      ? `repeating-linear-gradient(
          90deg,
          transparent,
          transparent 10px,
          ${borderColor}20 10px,
          ${borderColor}20 20px
        )`
      : undefined,
  };

  return (
    <div style={animatedBorderStyle}>
      {label && <div style={labelStyle}>{label}</div>}
    </div>
  );
}
